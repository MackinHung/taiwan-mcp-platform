import type { Env, ToolResult } from '../types.js';
import {
  findSalaryGrade,
  HEALTH_INSURANCE_RATE,
  HEALTH_INSURANCE_EMPLOYEE_RATIO,
  HEALTH_INSURANCE_EMPLOYER_RATIO,
  HEALTH_INSURANCE_GOVERNMENT_RATIO,
  HEALTH_INSURANCE_MAX_DEPENDENTS,
} from '../constants.js';

export async function calculateHealthInsurance(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const salary = args.salary as number | undefined;
    const rawDependents = args.dependents as number | undefined;

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

    const dependents = rawDependents ?? 0;

    if (dependents < 0 || !Number.isInteger(dependents)) {
      return {
        content: [{ type: 'text', text: '眷屬人數必須為非負整數' }],
        isError: true,
      };
    }

    // 健保眷屬最多計 3 人
    const effectiveDependents = Math.min(dependents, HEALTH_INSURANCE_MAX_DEPENDENTS);

    const grade = findSalaryGrade(salary);
    const basePremium = Math.round(grade * HEALTH_INSURANCE_RATE);
    const employeeShare = Math.round(
      basePremium * HEALTH_INSURANCE_EMPLOYEE_RATIO * (1 + effectiveDependents)
    );
    const employerShare = Math.round(
      basePremium * HEALTH_INSURANCE_EMPLOYER_RATIO * (1 + effectiveDependents)
    );
    const governmentShare = Math.round(
      basePremium * HEALTH_INSURANCE_GOVERNMENT_RATIO * (1 + effectiveDependents)
    );
    const totalPremium = employeeShare + employerShare + governmentShare;

    const lines = [
      '健保費試算結果',
      '',
      `月薪: ${salary.toLocaleString()} 元`,
      `投保薪資級距: ${grade.toLocaleString()} 元`,
      `健保費率: ${(HEALTH_INSURANCE_RATE * 100).toFixed(2)}%`,
      `眷屬人數: ${dependents} 人${dependents > HEALTH_INSURANCE_MAX_DEPENDENTS ? `（最多計 ${HEALTH_INSURANCE_MAX_DEPENDENTS} 人）` : ''}`,
      `有效計算眷屬: ${effectiveDependents} 人`,
      '',
      '負擔分配:',
      `  勞工負擔 (30%): ${employeeShare.toLocaleString()} 元/月`,
      `  雇主負擔 (60%): ${employerShare.toLocaleString()} 元/月`,
      `  政府負擔 (10%): ${governmentShare.toLocaleString()} 元/月`,
      `  合計保費: ${totalPremium.toLocaleString()} 元/月`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `健保費試算失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
