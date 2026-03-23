import { fetchDraftRegulations } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function listDraftRegulationsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const page = (args.page as number) ?? 1;
    const pageSize = (args.page_size as number) ?? 10;

    const { drafts, total } = await fetchDraftRegulations(page, pageSize);

    if (drafts.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無草案預告資料' }],
      };
    }

    const lines = drafts.map((d) => {
      const parts = [`[${d.MetaId}] ${d.Title}`];
      if (d.PubGovName) parts.push(`  發布機關: ${d.PubGovName}`);
      if (d.Date_Published) parts.push(`  發布日期: ${d.Date_Published}`);
      if (d.Comment_Deadline) parts.push(`  預告截止: ${d.Comment_Deadline}`);
      return parts.join('\n');
    });

    const header = `草案預告（共 ${total} 筆，第 ${page} 頁，顯示 ${drafts.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得草案預告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
