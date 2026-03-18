import type { Env, ToolResult } from '../types.js';
import { findSalaryGrade, SALARY_GRADES } from '../constants.js';

export async function getSalaryGrade(
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
    const gradeIndex = SALARY_GRADES.indexOf(grade);

    const lines = [
      '投保薪資級距查詢結果',
      '',
      `月薪: ${salary.toLocaleString()} 元`,
      `對應級距: 第 ${gradeIndex + 1} 級 — ${grade.toLocaleString()} 元`,
      '',
      `全部級距 (共 ${SALARY_GRADES.length} 級):`,
      ...SALARY_GRADES.map(
        (g, i) =>
          `  ${i + 1}. ${g.toLocaleString()} 元${g === grade ? ' ← 您的級距' : ''}`
      ),
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢投保薪資級距失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
