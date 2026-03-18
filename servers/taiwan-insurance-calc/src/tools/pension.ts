import type { Env, ToolResult } from '../types.js';
import {
  PENSION_EMPLOYER_RATE,
  PENSION_VOLUNTARY_MIN_RATE,
  PENSION_VOLUNTARY_MAX_RATE,
} from '../constants.js';

export async function calculatePension(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const salary = args.salary as number | undefined;
    const voluntaryRate = (args.voluntaryRate as number) ?? 0;

    if (salary === undefined || salary === null || typeof salary !== 'number') {
      return {
        content: [{ type: 'text', text: '請提供月薪（salary 為必填數字參數）' }],
        isError: true,
      };
    }

    if (salary <= 0) {
      return {
        content: [{ type: 'text', text: '月薪必須大於 0' }],
        isError: true,
      };
    }

    if (
      voluntaryRate < PENSION_VOLUNTARY_MIN_RATE ||
      voluntaryRate > PENSION_VOLUNTARY_MAX_RATE
    ) {
      return {
        content: [
          {
            type: 'text',
            text: `自願提繳比例必須在 ${PENSION_VOLUNTARY_MIN_RATE}% ~ ${PENSION_VOLUNTARY_MAX_RATE}% 之間`,
          },
        ],
        isError: true,
      };
    }

    const employerContribution = Math.round(salary * PENSION_EMPLOYER_RATE);
    const voluntaryContribution = Math.round(salary * (voluntaryRate / 100));
    const totalContribution = employerContribution + voluntaryContribution;

    const lines = [
      '勞退提繳試算結果',
      '',
      `月薪: ${salary.toLocaleString()} 元`,
      `雇主提繳比例: ${(PENSION_EMPLOYER_RATE * 100).toFixed(0)}%`,
      `雇主提繳金額: ${employerContribution.toLocaleString()} 元/月`,
      '',
      `勞工自願提繳比例: ${voluntaryRate}%`,
      `勞工自願提繳金額: ${voluntaryContribution.toLocaleString()} 元/月`,
      '',
      `合計提繳: ${totalContribution.toLocaleString()} 元/月`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `勞退提繳試算失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
