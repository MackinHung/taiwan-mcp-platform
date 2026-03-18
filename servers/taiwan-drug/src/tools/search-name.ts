import { fetchDrugData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchDrugByName(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供藥品名稱關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = keyword.trim();

    const data = await fetchDrugData(1000);
    const matched = data.filter(
      (r) =>
        (r['中文品名'] && r['中文品名'].includes(trimmed)) ||
        (r['英文品名'] && r['英文品名'].toLowerCase().includes(trimmed.toLowerCase()))
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無名稱含「${trimmed}」的藥品` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `許可證字號: ${r['許可證字號'] ?? '未知'}`,
        `  中文品名: ${r['中文品名'] ?? '未知'}`,
        `  英文品名: ${r['英文品名'] ?? '未知'}`,
        `  適應症: ${r['適應症'] ?? '未知'}`,
        `  藥品類別: ${r['藥品類別'] ?? '未知'}`,
      ].join('\n')
    );

    const header = `藥品名稱搜尋「${trimmed}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋藥品名稱失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
