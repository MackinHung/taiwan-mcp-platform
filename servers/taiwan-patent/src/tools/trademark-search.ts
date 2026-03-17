import { fetchTipoCsv, TIPO_PATHS } from '../client.js';
import type { Env, ToolResult, TrademarkRecord } from '../types.js';

export async function searchTrademarks(
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

    const classNum = args.classNum as string | undefined;
    const limit = Math.min(Math.max((args.limit as number) || 20, 1), 100);

    const rows = await fetchTipoCsv(TIPO_PATHS.TRADEMARK);

    let filtered = rows.filter((row) => {
      const name = row['商標名稱'] ?? '';
      const applicant = row['申請人'] ?? '';
      return name.includes(keyword) || applicant.includes(keyword);
    });

    if (classNum) {
      filtered = filtered.filter((row) => (row['類別'] ?? '') === classNum);
    }

    const results = filtered.slice(0, limit) as TrademarkRecord[];

    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到與「${keyword}」相關的商標資料` }],
      };
    }

    const lines = results.map((r) =>
      [
        `商標號: ${r.註冊號 || r.申請號 || '無'}`,
        `名稱: ${r.商標名稱 || '無'}`,
        `申請人: ${r.申請人 || '無'}`,
        `類別: ${r.類別 || '無'}`,
        `商品服務: ${r.商品服務 || '無'}`,
        `申請日: ${r.申請日 || '無'}`,
        `註冊日: ${r.註冊日 || '無'}`,
      ].join('\n')
    );

    const header = `搜尋「${keyword}」共 ${results.length} 筆商標資料：\n`;
    return { content: [{ type: 'text', text: header + '\n' + lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋商標失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
