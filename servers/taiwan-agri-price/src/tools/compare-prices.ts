import { fetchProducts } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function comparePrices(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const product = args.product as string | undefined;
    if (!product || product.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供農產品名稱' }],
        isError: true,
      };
    }

    const marketsParam = args.markets as string | undefined;
    const trimmedProduct = product.trim();

    const products = await fetchProducts(env, { top: 500 });

    let filtered = products.filter(
      (p) => (p['作物名稱'] ?? '').includes(trimmedProduct)
    );

    if (marketsParam) {
      const marketList = marketsParam.split(',').map((m) => m.trim());
      filtered = filtered.filter((p) =>
        marketList.some((m) => (p['市場名稱'] ?? '').includes(m))
      );
    }

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: marketsParam
              ? `查無「${trimmedProduct}」在指定市場的價格資料`
              : `查無「${trimmedProduct}」的跨市場價格資料`,
          },
        ],
      };
    }

    // Group by market
    const byMarket = new Map<string, typeof filtered>();
    for (const p of filtered) {
      const marketName = p['市場名稱'] ?? '未知';
      const existing = byMarket.get(marketName) ?? [];
      byMarket.set(marketName, [...existing, p]);
    }

    const lines: string[] = [];
    for (const [marketName, items] of byMarket) {
      const avgPrices = items.map((p) => parseFloat(p['平均價'] ?? '0'));
      const validPrices = avgPrices.filter((p) => !isNaN(p) && p > 0);
      const marketAvg =
        validPrices.length > 0
          ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
          : 0;
      const totalVol = items.reduce((sum, p) => {
        const vol = parseFloat(p['交易量'] ?? '0');
        return sum + (isNaN(vol) ? 0 : vol);
      }, 0);

      lines.push(
        [
          `市場: ${marketName}`,
          `  品項數: ${items.length}`,
          `  平均價: ${marketAvg > 0 ? marketAvg.toFixed(1) : '-'} 元/公斤`,
          `  總交易量: ${totalVol.toLocaleString()} 公斤`,
          ...items.map(
            (p) =>
              `    ${p['作物名稱'] ?? '未知'} — 平均價: ${p['平均價'] ?? '-'}, 交易量: ${p['交易量'] ?? '-'}`
          ),
        ].join('\n')
      );
    }

    const header = `「${trimmedProduct}」跨市場價格比較（${byMarket.size} 個市場）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `比較價格失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
