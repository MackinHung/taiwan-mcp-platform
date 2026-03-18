import type { Env, ToolResult } from '../types.js';
import {
  findSalaryGrade,
  LABOR_INSURANCE_RATE,
  LABOR_INSURANCE_EMPLOYER_RATIO,
  HEALTH_INSURANCE_RATE,
  HEALTH_INSURANCE_EMPLOYER_RATIO,
  PENSION_EMPLOYER_RATE,
  EMPLOYMENT_INSURANCE_RATE,
  OCCUPATIONAL_ACCIDENT_RATE,
} from '../constants.js';

export async function calculateEmployerCost(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const salary = args.salary as number | undefined;

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

    const grade = findSalaryGrade(salary);

    const laborInsurance = Math.round(
      grade * LABOR_INSURANCE_RATE * LABOR_INSURANCE_EMPLOYER_RATIO
    );
    const healthInsurance = Math.round(
      grade * HEALTH_INSURANCE_RATE * HEALTH_INSURANCE_EMPLOYER_RATIO
    );
    const pension = Math.round(salary * PENSION_EMPLOYER_RATE);
    const employmentInsurance = Math.round(grade * EMPLOYMENT_INSURANCE_RATE);
    const occupationalAccident = Math.round(grade * OCCUPATIONAL_ACCIDENT_RATE);

    const totalCost =
      laborInsurance +
      healthInsurance +
      pension +
      employmentInsurance +
      occupationalAccident;
    const totalWithSalary = salary + totalCost;

    const lines = [
      '雇主總人事成本試算',
      '',
      `員工月薪: ${salary.toLocaleString()} 元`,
      `投保薪資級距: ${grade.toLocaleString()} 元`,
      '',
      '雇主額外負擔:',
      `  勞保 (雇主 70%): ${laborInsurance.toLocaleString()} 元`,
      `  健保 (雇主 60%): ${healthInsurance.toLocaleString()} 元`,
      `  勞退 (6%): ${pension.toLocaleString()} 元`,
      `  就業保險 (1%): ${employmentInsurance.toLocaleString()} 元`,
      `  職災保險 (~0.21%): ${occupationalAccident.toLocaleString()} 元`,
      '',
      `雇主額外成本小計: ${totalCost.toLocaleString()} 元/月`,
      `雇主總人事成本 (含薪資): ${totalWithSalary.toLocaleString()} 元/月`,
      `額外成本佔薪資比例: ${((totalCost / salary) * 100).toFixed(1)}%`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `雇主成本試算失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
