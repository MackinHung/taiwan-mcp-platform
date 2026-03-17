import type { Env, ToolResult, MinimumWageInfo } from '../types.js';

const WAGE_HISTORY: readonly MinimumWageInfo[] = [
  {
    year: 2025,
    monthlyWage: 28590,
    hourlyWage: 190,
    effectiveDate: '2025-01-01',
  },
  {
    year: 2024,
    monthlyWage: 27470,
    hourlyWage: 183,
    effectiveDate: '2024-01-01',
  },
  {
    year: 2023,
    monthlyWage: 26400,
    hourlyWage: 176,
    effectiveDate: '2023-01-01',
  },
] as const;

function formatWageInfo(wage: MinimumWageInfo): string {
  return [
    `  月薪: ${wage.monthlyWage.toLocaleString()} 元`,
    `  時薪: ${wage.hourlyWage} 元`,
    `  生效日期: ${wage.effectiveDate}`,
  ].join('\n');
}

export async function getMinimumWage(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const current = WAGE_HISTORY[0];
    const history = WAGE_HISTORY.slice(1);

    const lines: string[] = [
      '=== 現行基本工資 ===',
      `${current.year} 年度:`,
      formatWageInfo(current),
      '',
      '=== 近年基本工資歷史 ===',
    ];

    for (const wage of history) {
      lines.push(`${wage.year} 年度:`);
      lines.push(formatWageInfo(wage));
      lines.push('');
    }

    lines.push('資料來源: 勞動部基本工資審議委員會');

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得基本工資資訊失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
