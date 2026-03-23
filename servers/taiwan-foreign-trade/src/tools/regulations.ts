import { fetchImportRegulations, fetchAllImportRegulations } from '../client.js';
import type { Env, ToolResult, ImportRegulation } from '../types.js';

const CATEGORY_LABELS: Record<string, string> = {
  industrial: '工業',
  agricultural: '農業',
  other: '其他',
};

export async function lookupImportRegulationsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = (args.keyword as string | undefined)?.trim();
    if (!keyword || keyword.length === 0) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字' }],
        isError: true,
      };
    }

    const category = args.category as string | undefined;
    const limit = Math.min((args.limit as number) ?? 50, 200);

    let regulations: ImportRegulation[];

    if (category && ['industrial', 'agricultural', 'other'].includes(category)) {
      regulations = await fetchImportRegulations(
        category as 'industrial' | 'agricultural' | 'other'
      );
    } else {
      regulations = await fetchAllImportRegulations();
    }

    const matched = regulations.filter(
      (r) =>
        r.subject.includes(keyword) ||
        r.description.includes(keyword) ||
        r.basis.includes(keyword) ||
        r.number.includes(keyword)
    );

    const page = matched.slice(0, limit);

    if (page.length === 0) {
      const catLabel = category ? CATEGORY_LABELS[category] ?? category : '全部';
      return {
        content: [
          {
            type: 'text',
            text: `搜尋「${keyword}」在${catLabel}類別中查無相關進口規定`,
          },
        ],
      };
    }

    const lines = page.map((r) => {
      return [
        `[${r.number}] ${r.subject}`,
        `  類別: ${CATEGORY_LABELS[r.category] ?? r.category}`,
        `  依據: ${r.basis}`,
        `  說明: ${r.description.slice(0, 100)}${r.description.length > 100 ? '...' : ''}`,
      ].join('\n');
    });

    const catLabel = category ? CATEGORY_LABELS[category] ?? category : '全部類別';
    const header = `搜尋「${keyword}」（${catLabel}）共找到 ${matched.length} 筆進口規定（顯示 ${page.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢進口規定失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
