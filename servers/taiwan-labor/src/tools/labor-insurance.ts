import type { Env, ToolResult, LaborInsuranceRate } from '../types.js';

const INSURANCE_RATES: readonly LaborInsuranceRate[] = [
  {
    category: '普通事故保險（含就業保險）',
    rate: 12.0,
    employerShare: 70,
    employeeShare: 20,
    governmentShare: 10,
  },
  {
    category: '就業保險（含於上列）',
    rate: 1.0,
    employerShare: 70,
    employeeShare: 20,
    governmentShare: 10,
  },
] as const;

const OCCUPATIONAL_ACCIDENT_RATE = 0.21;

function formatRateTable(): string {
  const lines: string[] = ['=== 2025 年勞保費率 ===', ''];

  for (const rate of INSURANCE_RATES) {
    lines.push(`【${rate.category}】`);
    lines.push(`  費率: ${rate.rate}%`);
    lines.push(
      `  分攤: 雇主 ${rate.employerShare}% / 勞工 ${rate.employeeShare}% / 政府 ${rate.governmentShare}%`
    );
    lines.push('');
  }

  lines.push(`【職業災害保險】`);
  lines.push(`  平均費率: ${OCCUPATIONAL_ACCIDENT_RATE}%（依行業別不同）`);
  lines.push(`  分攤: 雇主 100%`);

  return lines.join('\n');
}

function calculatePremium(salary: number): string {
  const ordinaryRate = INSURANCE_RATES[0];
  const totalPremium = Math.round(salary * (ordinaryRate.rate / 100));
  const employerPremium = Math.round(
    totalPremium * (ordinaryRate.employerShare / 100)
  );
  const employeePremium = Math.round(
    totalPremium * (ordinaryRate.employeeShare / 100)
  );
  const governmentPremium = Math.round(
    totalPremium * (ordinaryRate.governmentShare / 100)
  );
  const accidentPremium = Math.round(
    salary * (OCCUPATIONAL_ACCIDENT_RATE / 100)
  );

  return [
    '',
    `=== 月投保薪資 ${salary.toLocaleString()} 元之保費試算 ===`,
    '',
    `普通事故保險費（月）: ${totalPremium.toLocaleString()} 元`,
    `  雇主負擔: ${employerPremium.toLocaleString()} 元`,
    `  勞工負擔: ${employeePremium.toLocaleString()} 元`,
    `  政府負擔: ${governmentPremium.toLocaleString()} 元`,
    '',
    `職災保險費（月，雇主全額）: ${accidentPremium.toLocaleString()} 元`,
    '',
    '※ 實際費用依投保薪資級距調整',
  ].join('\n');
}

export async function getLaborInsuranceInfo(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const salary = args.salary as number | undefined;

    let text = formatRateTable();

    if (salary !== undefined && salary > 0) {
      text += '\n' + calculatePremium(salary);
    }

    text += '\n\n資料來源: 勞動部勞工保險局';

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢勞保費率失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
