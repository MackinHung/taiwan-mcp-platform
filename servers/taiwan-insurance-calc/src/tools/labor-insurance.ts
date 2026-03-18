import type { Env, ToolResult } from '../types.js';
import {
  findSalaryGrade,
  LABOR_INSURANCE_RATE,
  LABOR_INSURANCE_EMPLOYEE_RATIO,
  LABOR_INSURANCE_EMPLOYER_RATIO,
  LABOR_INSURANCE_GOVERNMENT_RATIO,
} from '../constants.js';

export async function calculateLaborInsurance(
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
    const totalPremium = Math.round(grade * LABOR_INSURANCE_RATE);
    const employeeShare = Math.round(totalPremium * LABOR_INSURANCE_EMPLOYEE_RATIO);
    const employerShare = Math.round(totalPremium * LABOR_INSURANCE_EMPLOYER_RATIO);
    const governmentShare = Math.round(totalPremium * LABOR_INSURANCE_GOVERNMENT_RATIO);

    const lines = [
      '勞保費試算結果',
      '',
      `月薪: ${salary.toLocaleString()} 元`,
      `投保薪資級距: ${grade.toLocaleString()} 元`,
      `勞保費率: ${(LABOR_INSURANCE_RATE * 100).toFixed(1)}%`,
      `總保費: ${totalPremium.toLocaleString()} 元`,
      '',
      '負擔分配:',
      `  勞工負擔 (20%): ${employeeShare.toLocaleString()} 元/月`,
      `  雇主負擔 (70%): ${employerShare.toLocaleString()} 元/月`,
      `  政府負擔 (10%): ${governmentShare.toLocaleString()} 元/月`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `勞保費試算失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
