import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function matchesKeyword(record: Record<string, string>, keyword: string): boolean {
  return Object.values(record).some(
    (val) => typeof val === 'string' && val.includes(keyword)
  );
}

function formatRecord(source: string, record: Record<string, string>): string {
  const year = record['年度'] ?? '';
  const agency = record['機關名稱'] ?? '';
  const category =
    record['科目名稱'] ?? record['歲出科目名稱'] ?? record['歲入科目名稱'] ?? '';
  const budget = record['預算數'] ?? '';
  const actual = record['決算數'] ?? '';

  const parts = [`[${source}]`];
  if (year) parts.push(`年度: ${year}`);
  if (agency) parts.push(`機關: ${agency}`);
  if (category) parts.push(`科目: ${category}`);
  if (budget) parts.push(`預算數: ${budget}`);
  if (actual) parts.push(`決算數: ${actual}`);

  return parts.join(' | ');
}

export async function searchBudget(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmedKeyword = keyword.trim();

    const results = await Promise.allSettled([
      fetchDataset(DATASETS.EXPENDITURE, { limit: 100 }),
      fetchDataset(DATASETS.REVENUE, { limit: 100 }),
    ]);

    const matched: string[] = [];

    const expenditureResult = results[0];
    if (expenditureResult.status === 'fulfilled') {
      const filtered = expenditureResult.value.records.filter((r) =>
        matchesKeyword(r, trimmedKeyword)
      );
      for (const r of filtered) {
        matched.push(formatRecord('歲出', r));
      }
    }

    const revenueResult = results[1];
    if (revenueResult.status === 'fulfilled') {
      const filtered = revenueResult.value.records.filter((r) =>
        matchesKeyword(r, trimmedKeyword)
      );
      for (const r of filtered) {
        matched.push(formatRecord('歲入', r));
      }
    }

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `搜尋「${trimmedKeyword}」無符合結果` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const header = `搜尋「${trimmedKeyword}」共找到 ${matched.length} 筆（顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${sliced.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `搜尋預算資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
