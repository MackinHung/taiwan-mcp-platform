import type { Env, ToolResult } from '../types.js';

const EMPLOYER_MIN_CONTRIBUTION_RATE = 6;
const EMPLOYEE_MAX_CONTRIBUTION_RATE = 6;

function formatPensionOverview(): string {
  return [
    '=== 勞工退休金制度（新制） ===',
    '',
    '【雇主提繳】',
    `  法定最低: 每月工資 ${EMPLOYER_MIN_CONTRIBUTION_RATE}%（不得低於此比例）`,
    '  可自願提高提繳比例',
    '',
    '【勞工自提】',
    `  自願提繳: 0% ~ ${EMPLOYEE_MAX_CONTRIBUTION_RATE}%（免計入當年度綜合所得稅）`,
    '',
    '【帳戶特性】',
    '  個人退休金專戶，可攜式',
    '  年滿 60 歲可請領',
    '  年資滿 15 年: 月退休金',
    '  年資未滿 15 年: 一次退休金',
    '',
    '【投保薪資級距】',
    '  最低: 27,470 元（基本工資連動）',
    '  最高: 150,000 元',
  ].join('\n');
}

function calculateContribution(salary: number): string {
  const employerContribution = Math.round(
    salary * (EMPLOYER_MIN_CONTRIBUTION_RATE / 100)
  );
  const employeeSelfMax = Math.round(
    salary * (EMPLOYEE_MAX_CONTRIBUTION_RATE / 100)
  );

  return [
    '',
    `=== 月薪 ${salary.toLocaleString()} 元之退休金試算 ===`,
    '',
    `雇主每月提繳（${EMPLOYER_MIN_CONTRIBUTION_RATE}%）: ${employerContribution.toLocaleString()} 元`,
    `勞工自提上限（${EMPLOYEE_MAX_CONTRIBUTION_RATE}%）: ${employeeSelfMax.toLocaleString()} 元`,
    `合計最高: ${(employerContribution + employeeSelfMax).toLocaleString()} 元/月`,
  ].join('\n');
}

function estimateAccumulation(salary: number, years: number): string {
  const monthlyEmployer = Math.round(
    salary * (EMPLOYER_MIN_CONTRIBUTION_RATE / 100)
  );
  const totalMonths = years * 12;
  const totalEmployer = monthlyEmployer * totalMonths;

  return [
    '',
    `=== ${years} 年累積試算（僅雇主提繳，不含投資收益） ===`,
    '',
    `年資: ${years} 年`,
    `每月雇主提繳: ${monthlyEmployer.toLocaleString()} 元`,
    `累積總額（不含收益）: ${totalEmployer.toLocaleString()} 元`,
    '',
    '※ 實際金額含勞退基金投資收益，依勞動基金運用局公告為準',
  ].join('\n');
}

export async function getPensionInfo(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const salary = args.salary as number | undefined;
    const years = args.years as number | undefined;

    let text = formatPensionOverview();

    if (salary !== undefined && salary > 0) {
      text += '\n' + calculateContribution(salary);
    }

    if (
      salary !== undefined &&
      salary > 0 &&
      years !== undefined &&
      years > 0
    ) {
      text += '\n' + estimateAccumulation(salary, years);
    }

    text += '\n\n資料來源: 勞動部勞工保險局勞工退休金條例';

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢退休金資訊失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
