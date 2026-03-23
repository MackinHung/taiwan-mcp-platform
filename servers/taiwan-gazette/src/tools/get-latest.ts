import { fetchGazetteRecords } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getLatestGazetteTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = Math.min((args.limit as number) ?? 20, 100);
    const offset = (args.offset as number) ?? 0;

    const all = await fetchGazetteRecords();

    const sorted = [...all].sort((a, b) =>
      b.Date_Published.localeCompare(a.Date_Published)
    );
    const page = sorted.slice(offset, offset + limit);

    if (page.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無公報資料' }],
      };
    }

    const lines = page.map((r) => {
      return [
        `[${r.MetaId}] ${r.Title}`,
        `  類型: ${r.Doc_Style_LName}`,
        `  發布機關: ${r.PubGovName}`,
        `  篇別: ${r.Chapter}`,
        `  發布日期: ${r.Date_Published}`,
      ].join('\n');
    });

    const header = `行政院公報（共 ${all.length} 筆，顯示第 ${offset + 1}-${offset + page.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得公報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
