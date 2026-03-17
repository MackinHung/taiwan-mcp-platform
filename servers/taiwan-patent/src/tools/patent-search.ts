import { fetchTipoCsv, TIPO_PATHS } from '../client.js';
import type { Env, ToolResult, PatentRecord } from '../types.js';

const TYPE_MAP: Record<string, string> = {
  invention: '發明',
  utility: '新型',
  design: '設計',
};

export async function searchPatents(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字（keyword）' }],
        isError: true,
      };
    }

    const type = args.type as string | undefined;
    const limit = Math.min(Math.max((args.limit as number) || 20, 1), 100);

    const rows = await fetchTipoCsv(TIPO_PATHS.PATENT);

    let filtered = rows.filter((row) => {
      const name = row['專利名稱'] ?? '';
      const applicant = row['申請人'] ?? '';
      return name.includes(keyword) || applicant.includes(keyword);
    });

    if (type && TYPE_MAP[type]) {
      const typeName = TYPE_MAP[type];
      filtered = filtered.filter((row) => (row['專利類型'] ?? '').includes(typeName));
    }

    const results = filtered.slice(0, limit) as PatentRecord[];

    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到與「${keyword}」相關的專利資料` }],
      };
    }

    const lines = results.map((r) =>
      [
        `專利號: ${r.公告號 || r.申請號 || '無'}`,
        `名稱: ${r.專利名稱 || '無'}`,
        `申請人: ${r.申請人 || '無'}`,
        `發明人: ${r.發明人 || '無'}`,
        `類型: ${r.專利類型 || '無'}`,
        `申請日: ${r.申請日 || '無'}`,
        `公告日: ${r.公告日 || '無'}`,
        `IPC: ${r.IPC分類 || '無'}`,
      ].join('\n')
    );

    const header = `搜尋「${keyword}」共 ${results.length} 筆專利資料：\n`;
    return { content: [{ type: 'text', text: header + '\n' + lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋專利失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
