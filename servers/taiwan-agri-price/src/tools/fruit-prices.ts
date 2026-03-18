import { fetchProducts, isFruit } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getFruitPrices(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const market = args.market as string | undefined;
    const limit = (args.limit as number) ?? 30;

    const products = await fetchProducts(env, { top: 200 });

    let filtered = products.filter(isFruit);

    if (market) {
      filtered = filtered.filter(
        (p) => (p['市場名稱'] ?? '').includes(market)
      );
    }

    const sliced = filtered.slice(0, limit);

    if (sliced.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: market
              ? `查無市場「${market}」的水果行情資料`
              : '查無水果行情資料',
          },
        ],
      };
    }

    const lines = sliced.map((p) => {
      return [
        `品名: ${p['作物名稱'] ?? '未知'}`,
        `  市場: ${p['市場名稱'] ?? '未知'}`,
        `  上價: ${p['上價'] ?? '-'} 元/公斤`,
        `  中價: ${p['中價'] ?? '-'} 元/公斤`,
        `  下價: ${p['下價'] ?? '-'} 元/公斤`,
        `  平均價: ${p['平均價'] ?? '-'} 元/公斤`,
        `  交易量: ${p['交易量'] ?? '-'} 公斤`,
      ].join('\n');
    });

    const header = `水果批發行情（共 ${filtered.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得水果行情失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
