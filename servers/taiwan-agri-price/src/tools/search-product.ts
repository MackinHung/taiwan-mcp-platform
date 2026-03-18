import { fetchProducts } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchProductPrice(
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

    const limit = (args.limit as number) ?? 30;
    const trimmedProduct = product.trim();

    const products = await fetchProducts(env, { top: 300 });

    const filtered = products.filter(
      (p) => (p['作物名稱'] ?? '').includes(trimmedProduct)
    );

    const sliced = filtered.slice(0, limit);

    if (sliced.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `查無「${trimmedProduct}」的價格資料`,
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
        `  交易日期: ${p['交易日期'] ?? '未知'}`,
      ].join('\n');
    });

    const header = `搜尋「${trimmedProduct}」（共 ${filtered.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋農產品失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
