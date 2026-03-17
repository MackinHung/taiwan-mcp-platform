import type { Env, ToolResult, TaxBracket } from '../types.js';

export const INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 590000, rate: 0.05, deduction: 0 },
  { min: 590001, max: 1330000, rate: 0.12, deduction: 41300 },
  { min: 1330001, max: 2660000, rate: 0.20, deduction: 147700 },
  { min: 2660001, max: 4980000, rate: 0.30, deduction: 413700 },
  { min: 4980001, max: null, rate: 0.40, deduction: 911700 },
];

function findBracket(taxableIncome: number): TaxBracket {
  for (const bracket of INCOME_TAX_BRACKETS) {
    if (bracket.max === null || taxableIncome <= bracket.max) {
      return bracket;
    }
  }
  return INCOME_TAX_BRACKETS[INCOME_TAX_BRACKETS.length - 1];
}

function formatCurrency(amount: number): string {
  return Math.round(amount).toLocaleString();
}

export async function calculateIncomeTax(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const annualIncome = args.annualIncome as number | undefined;
    if (annualIncome === undefined || annualIncome === null) {
      return {
        content: [{ type: 'text', text: '請提供全年綜合所得總額（annualIncome 參數）' }],
        isError: true,
      };
    }

    if (typeof annualIncome !== 'number' || annualIncome < 0) {
      return {
        content: [{ type: 'text', text: '全年綜合所得總額必須為非負數值' }],
        isError: true,
      };
    }

    const deductions = (args.deductions as number) ?? 0;
    const taxableIncome = Math.max(annualIncome - deductions, 0);

    if (taxableIncome === 0) {
      return {
        content: [{
          type: 'text',
          text: [
            '綜合所得稅試算結果',
            '',
            `全年綜合所得總額: ${formatCurrency(annualIncome)} 元`,
            `扣除額: ${formatCurrency(deductions)} 元`,
            `綜合所得淨額: 0 元`,
            `應納稅額: 0 元`,
            `有效稅率: 0%`,
          ].join('\n'),
        }],
      };
    }

    const bracket = findBracket(taxableIncome);
    const taxAmount = Math.max(taxableIncome * bracket.rate - bracket.deduction, 0);
    const effectiveRate = ((taxAmount / taxableIncome) * 100).toFixed(2);

    const ratePercent = (bracket.rate * 100).toFixed(0);
    const bracketLabel = bracket.max === null
      ? `${formatCurrency(bracket.min)} 以上`
      : `${formatCurrency(bracket.min)} ~ ${formatCurrency(bracket.max)}`;

    const lines = [
      '綜合所得稅試算結果',
      '',
      `全年綜合所得總額: ${formatCurrency(annualIncome)} 元`,
      `扣除額: ${formatCurrency(deductions)} 元`,
      `綜合所得淨額: ${formatCurrency(taxableIncome)} 元`,
      '',
      `適用級距: ${bracketLabel}`,
      `適用稅率: ${ratePercent}%`,
      `累進差額: ${formatCurrency(bracket.deduction)} 元`,
      '',
      `應納稅額: ${formatCurrency(taxAmount)} 元`,
      `有效稅率: ${effectiveRate}%`,
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `計算所得稅失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
