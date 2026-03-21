import type { Env, ToolResult, TaxBracket } from '../types.js';

const INCOME_BRACKETS: TaxBracket[] = [
  { min: 0, max: 590000, rate: 0.05, deduction: 0 },
  { min: 590001, max: 1330000, rate: 0.12, deduction: 41300 },
  { min: 1330001, max: 2660000, rate: 0.20, deduction: 147700 },
  { min: 2660001, max: 4980000, rate: 0.30, deduction: 413700 },
  { min: 4980001, max: null, rate: 0.40, deduction: 911700 },
];

const BUSINESS_TAX_THRESHOLD = 120000;
const BUSINESS_TAX_RATE = 0.20;

function formatBracketRange(bracket: TaxBracket): string {
  const minStr = bracket.min.toLocaleString();
  if (bracket.max === null) {
    return `${minStr} 以上`;
  }
  return `${minStr} ~ ${bracket.max.toLocaleString()}`;
}

function buildIncomeBracketsTable(): string {
  const lines = [
    '綜合所得稅稅率級距表（2025年度）',
    '',
    '級距範圍（元）          稅率    累進差額（元）',
    '─────────────────────────────────────',
  ];

  for (const bracket of INCOME_BRACKETS) {
    const range = formatBracketRange(bracket).padEnd(22);
    const rate = `${(bracket.rate * 100).toFixed(0)}%`.padEnd(8);
    const deduction = bracket.deduction.toLocaleString();
    lines.push(`${range}${rate}${deduction}`);
  }

  lines.push(
    '',
    '計算方式: 應納稅額 = 綜合所得淨額 × 稅率 - 累進差額'
  );

  return lines.join('\n');
}

function buildBusinessBracketsTable(): string {
  const lines = [
    '營利事業所得稅稅率（2025年度）',
    '',
    `課稅所得額 ≤ ${BUSINESS_TAX_THRESHOLD.toLocaleString()} 元: 免稅`,
    `課稅所得額 > ${BUSINESS_TAX_THRESHOLD.toLocaleString()} 元: 稅率 ${(BUSINESS_TAX_RATE * 100).toFixed(0)}%`,
    '',
    '注意:',
    `- 課稅所得額超過 ${BUSINESS_TAX_THRESHOLD.toLocaleString()} 元但不超過半數稅額時，`,
    '  按半數稅額繳納',
    '- 適用於依法登記之營利事業',
  ];

  return lines.join('\n');
}

export async function getTaxBrackets(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const type = (args.type as string) ?? 'income';

    if (type !== 'income' && type !== 'business') {
      return {
        content: [{ type: 'text', text: '類型參數僅支援 "income"（綜合所得稅）或 "business"（營利事業所得稅）' }],
        isError: true,
      };
    }

    const text = type === 'income'
      ? buildIncomeBracketsTable()
      : buildBusinessBracketsTable();

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得稅率級距失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
