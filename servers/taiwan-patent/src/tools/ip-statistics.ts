import { fetchOpenData, OPENDATA_RESOURCES } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getIpStatistics(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const year = args.year as string | undefined;
    const category = args.category as string | undefined;
    const limit = Math.min(Math.max((args.limit as number) || 20, 1), 100);

    const params: Record<string, string> = {};
    if (limit) {
      params.limit = String(limit);
    }

    const records = await fetchOpenData(OPENDATA_RESOURCES.IP_STATISTICS, params);

    let filtered = records;

    if (year) {
      filtered = filtered.filter((r) => String(r.year ?? '') === year);
    }

    if (category) {
      filtered = filtered.filter((r) =>
        String(r.category ?? '').includes(category)
      );
    }

    const results = filtered.slice(0, limit);

    if (results.length === 0) {
      const detail = year ? ` (${year}年)` : '';
      const catDetail = category ? ` [${category}]` : '';
      return {
        content: [
          { type: 'text', text: `找不到智慧財產統計資料${detail}${catDetail}` },
        ],
      };
    }

    const lines = results.map((r) =>
      [
        `年度: ${r.year ?? '無'}`,
        `類別: ${r.category ?? '無'}`,
        `申請數: ${r.applications ?? '無'}`,
        `核准數: ${r.grants ?? '無'}`,
      ].join('\n')
    );

    const header = `智慧財產統計資料（共 ${results.length} 筆）：\n`;
    return { content: [{ type: 'text', text: header + '\n' + lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢統計資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
