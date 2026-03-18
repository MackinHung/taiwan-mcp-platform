import { fetchProducts } from '../client.js';
import type { Env, ToolResult, AgriProduct } from '../types.js';

export async function getMarketSummary(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const market = args.market as string | undefined;
    if (!market || market.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供市場名稱' }],
        isError: true,
      };
    }

    const trimmedMarket = market.trim();
    const products = await fetchProducts(env, { top: 500 });

    const filtered = products.filter(
      (p) => (p['市場名稱'] ?? '').includes(trimmedMarket)
    );

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `查無市場「${trimmedMarket}」的交易資料`,
          },
        ],
      };
    }

    const totalVolume = filtered.reduce((sum, p) => {
      const vol = parseFloat(p['交易量'] ?? '0');
      return sum + (isNaN(vol) ? 0 : vol);
    }, 0);

    const avgPrices = filtered.reduce(
      (acc, p) => {
        const avg = parseFloat(p['平均價'] ?? '0');
        if (!isNaN(avg) && avg > 0) {
          acc.sum += avg;
          acc.count += 1;
        }
        return acc;
      },
      { sum: 0, count: 0 }
    );

    const topProducts = getTopProducts(filtered, 10);

    const marketName = filtered[0]['市場名稱'] ?? trimmedMarket;
    const date = filtered[0]['交易日期'] ?? '未知';

    const lines = [
      `市場: ${marketName}`,
      `交易日期: ${date}`,
      `交易品項數: ${filtered.length}`,
      `總交易量: ${totalVolume.toLocaleString()} 公斤`,
      `平均價格: ${avgPrices.count > 0 ? (avgPrices.sum / avgPrices.count).toFixed(1) : '-'} 元/公斤`,
      '',
      '交易量前 10 品項:',
      ...topProducts.map(
        (p, i) =>
          `  ${i + 1}. ${p['作物名稱'] ?? '未知'} — 交易量: ${p['交易量'] ?? '-'} 公斤, 平均價: ${p['平均價'] ?? '-'} 元/公斤`
      ),
    ];

    const header = `${marketName} 當日交易概況`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得市場概況失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}

function getTopProducts(products: AgriProduct[], count: number): AgriProduct[] {
  return [...products]
    .sort((a, b) => {
      const volA = parseFloat(a['交易量'] ?? '0');
      const volB = parseFloat(b['交易量'] ?? '0');
      return (isNaN(volB) ? 0 : volB) - (isNaN(volA) ? 0 : volA);
    })
    .slice(0, count);
}
