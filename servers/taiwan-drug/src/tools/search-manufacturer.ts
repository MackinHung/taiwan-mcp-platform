import { fetchDrugData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchByManufacturer(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const manufacturer = args.manufacturer as string | undefined;
    if (!manufacturer || manufacturer.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供藥廠名稱關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = manufacturer.trim();

    const data = await fetchDrugData(1000);
    const matched = data.filter(
      (r) =>
        (r['製造商名稱'] && r['製造商名稱'].includes(trimmed)) ||
        (r['申請商名稱'] && r['申請商名稱'].includes(trimmed))
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無藥廠「${trimmed}」的藥品` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `許可證字號: ${r['許可證字號'] ?? '未知'}`,
        `  中文品名: ${r['中文品名'] ?? '未知'}`,
        `  製造商: ${r['製造商名稱'] ?? '未知'}`,
        `  申請商: ${r['申請商名稱'] ?? '未知'}`,
        `  適應症: ${r['適應症'] ?? '未知'}`,
      ].join('\n')
    );

    const header = `藥廠搜尋「${trimmed}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋藥廠失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
