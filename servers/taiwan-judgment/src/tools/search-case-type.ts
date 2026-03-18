import { searchByCaseType, CASE_TYPE_MAP } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchCaseTypeTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const caseType = args.caseType as string | undefined;
    if (!caseType || caseType.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供案件類型（civil、criminal、administrative）' }],
        isError: true,
      };
    }

    const trimmedType = caseType.trim().toLowerCase();
    const validTypes = ['civil', 'criminal', 'administrative'];
    if (!validTypes.includes(trimmedType)) {
      return {
        content: [
          {
            type: 'text',
            text: `無效的案件類型「${caseType}」，請使用: civil（民事）、criminal（刑事）、administrative（行政）`,
          },
        ],
        isError: true,
      };
    }

    const keyword = args.keyword as string | undefined;
    const limit = (args.limit as number) ?? 20;
    const chineseType = CASE_TYPE_MAP[trimmedType] ?? trimmedType;

    const { judgments, total } = await searchByCaseType(
      chineseType,
      keyword?.trim(),
      limit
    );

    if (!judgments || judgments.length === 0) {
      const filterDesc = keyword
        ? `${chineseType}案件中搜尋「${keyword}」`
        : `${chineseType}案件`;
      return {
        content: [
          { type: 'text', text: `查無${filterDesc}的裁判書` },
        ],
      };
    }

    const lines = judgments.map((j) => {
      return [
        `案號: ${j.caseNo ?? j.id ?? '未知'}`,
        `  法院: ${j.court ?? '未知'}`,
        `  案件類型: ${j.caseType ?? chineseType}`,
        `  日期: ${j.date ?? '未知'}`,
        `  標題: ${j.title ?? '未知'}`,
      ].join('\n');
    });

    const keywordDesc = keyword ? `（關鍵字: ${keyword}）` : '';
    const header = `${chineseType}案件${keywordDesc}共找到 ${total} 筆裁判書（顯示 ${judgments.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `依案件類型搜尋裁判書失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
