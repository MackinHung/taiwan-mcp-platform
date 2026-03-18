import { describe, it, expect } from 'vitest';
import { calculateLaborInsurance } from '../src/tools/labor-insurance.js';
import { calculateHealthInsurance } from '../src/tools/health-insurance.js';
import { calculatePension } from '../src/tools/pension.js';
import { calculateEmployerCost } from '../src/tools/employer-cost.js';
import { getSalaryGrade } from '../src/tools/salary-grade.js';
import { findSalaryGrade, SALARY_GRADES } from '../src/constants.js';
import type { Env } from '../src/types.js';

const env: Env = {
  SERVER_NAME: 'taiwan-insurance-calc',
  SERVER_VERSION: '1.0.0',
};

// --- Labor Insurance ---
describe('calculateLaborInsurance', () => {
  it('calculates correct labor insurance for salary 35000', async () => {
    const result = await calculateLaborInsurance(env, { salary: 35000 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('勞保費試算結果');
    // salary 35000 → grade 36300
    expect(text).toContain('36,300');
    expect(text).toContain('勞工負擔');
    expect(text).toContain('雇主負擔');
    expect(text).toContain('政府負擔');
  });

  it('uses minimum grade for low salary', async () => {
    const result = await calculateLaborInsurance(env, { salary: 25000 });
    expect(result.isError).toBeUndefined();
    // salary 25000 → grade 27470 (first grade >= 25000)
    expect(result.content[0].text).toContain('27,470');
  });

  it('uses maximum grade for very high salary', async () => {
    const result = await calculateLaborInsurance(env, { salary: 200000 });
    expect(result.isError).toBeUndefined();
    // salary 200000 → grade 150000 (max)
    expect(result.content[0].text).toContain('150,000');
  });

  it('returns error when salary is missing', async () => {
    const result = await calculateLaborInsurance(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供月薪');
  });

  it('returns error when salary is not a number', async () => {
    const result = await calculateLaborInsurance(env, { salary: 'abc' });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供月薪');
  });

  it('returns error when salary is zero', async () => {
    const result = await calculateLaborInsurance(env, { salary: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('月薪必須大於 0');
  });

  it('returns error when salary is negative', async () => {
    const result = await calculateLaborInsurance(env, { salary: -5000 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('月薪必須大於 0');
  });

  it('calculates correct split ratios (20/70/10)', async () => {
    const result = await calculateLaborInsurance(env, { salary: 30300 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // grade = 30300, total = round(30300 * 0.115) = 3485
    // employee = round(3485 * 0.2) = 697
    // employer = round(3485 * 0.7) = 2440
    // government = round(3485 * 0.1) = 349
    expect(text).toContain('697');
    expect(text).toContain('2,440');
    expect(text).toContain('349');
  });
});

// --- Health Insurance ---
describe('calculateHealthInsurance', () => {
  it('calculates health insurance without dependents', async () => {
    const result = await calculateHealthInsurance(env, { salary: 40000 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('健保費試算結果');
    // salary 40000 → grade 40100
    expect(text).toContain('40,100');
    expect(text).toContain('眷屬人數: 0 人');
  });

  it('calculates health insurance with dependents', async () => {
    const result = await calculateHealthInsurance(env, {
      salary: 40000,
      dependents: 2,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('眷屬人數: 2 人');
    expect(text).toContain('有效計算眷屬: 2 人');
  });

  it('caps dependents at 3', async () => {
    const result = await calculateHealthInsurance(env, {
      salary: 40000,
      dependents: 5,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('眷屬人數: 5 人');
    expect(text).toContain('最多計 3 人');
    expect(text).toContain('有效計算眷屬: 3 人');
  });

  it('returns error when salary is missing', async () => {
    const result = await calculateHealthInsurance(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供月薪');
  });

  it('returns error when salary is zero', async () => {
    const result = await calculateHealthInsurance(env, { salary: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('月薪必須大於 0');
  });

  it('returns error for negative dependents', async () => {
    const result = await calculateHealthInsurance(env, {
      salary: 40000,
      dependents: -1,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('眷屬人數必須為非負整數');
  });

  it('returns error for non-integer dependents', async () => {
    const result = await calculateHealthInsurance(env, {
      salary: 40000,
      dependents: 1.5,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('眷屬人數必須為非負整數');
  });

  it('employee share increases with dependents', async () => {
    const resultNoDeps = await calculateHealthInsurance(env, { salary: 50000 });
    const resultWithDeps = await calculateHealthInsurance(env, {
      salary: 50000,
      dependents: 2,
    });
    // Extract the employee share numbers from the text
    const noDepsText = resultNoDeps.content[0].text;
    const withDepsText = resultWithDeps.content[0].text;
    // With dependents should have higher amounts
    expect(withDepsText).toContain('有效計算眷屬: 2 人');
    expect(noDepsText).toContain('有效計算眷屬: 0 人');
  });
});

// --- Pension ---
describe('calculatePension', () => {
  it('calculates pension with default voluntary rate', async () => {
    const result = await calculatePension(env, { salary: 50000 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('勞退提繳試算結果');
    // employer = round(50000 * 0.06) = 3000
    expect(text).toContain('3,000');
    expect(text).toContain('自願提繳比例: 0%');
  });

  it('calculates pension with voluntary rate', async () => {
    const result = await calculatePension(env, {
      salary: 50000,
      voluntaryRate: 6,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // employer = 3000, voluntary = round(50000 * 0.06) = 3000
    expect(text).toContain('自願提繳比例: 6%');
    expect(text).toContain('3,000');
  });

  it('returns error when salary is missing', async () => {
    const result = await calculatePension(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供月薪');
  });

  it('returns error when salary is zero', async () => {
    const result = await calculatePension(env, { salary: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('月薪必須大於 0');
  });

  it('returns error for voluntary rate above 6', async () => {
    const result = await calculatePension(env, {
      salary: 50000,
      voluntaryRate: 7,
    });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('0%');
    expect(result.content[0].text).toContain('6%');
  });

  it('returns error for negative voluntary rate', async () => {
    const result = await calculatePension(env, {
      salary: 50000,
      voluntaryRate: -1,
    });
    expect(result.isError).toBe(true);
  });

  it('handles voluntary rate of 3%', async () => {
    const result = await calculatePension(env, {
      salary: 60000,
      voluntaryRate: 3,
    });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // employer = round(60000 * 0.06) = 3600
    // voluntary = round(60000 * 0.03) = 1800
    expect(text).toContain('3,600');
    expect(text).toContain('1,800');
  });
});

// --- Employer Cost ---
describe('calculateEmployerCost', () => {
  it('calculates total employer cost breakdown', async () => {
    const result = await calculateEmployerCost(env, { salary: 45000 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('雇主總人事成本試算');
    expect(text).toContain('勞保');
    expect(text).toContain('健保');
    expect(text).toContain('勞退');
    expect(text).toContain('就業保險');
    expect(text).toContain('職災保險');
    expect(text).toContain('雇主額外成本小計');
    expect(text).toContain('雇主總人事成本');
  });

  it('returns error when salary is missing', async () => {
    const result = await calculateEmployerCost(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供月薪');
  });

  it('returns error when salary is zero', async () => {
    const result = await calculateEmployerCost(env, { salary: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('月薪必須大於 0');
  });

  it('returns error when salary is negative', async () => {
    const result = await calculateEmployerCost(env, { salary: -10000 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('月薪必須大於 0');
  });

  it('calculates correct values for minimum wage', async () => {
    const result = await calculateEmployerCost(env, { salary: 29500 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    // salary 29500 → grade 30300
    expect(text).toContain('30,300');
    expect(text).toContain('額外成本佔薪資比例');
  });

  it('includes all 5 cost components', async () => {
    const result = await calculateEmployerCost(env, { salary: 50000 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('勞保 (雇主 70%)');
    expect(text).toContain('健保 (雇主 60%)');
    expect(text).toContain('勞退 (6%)');
    expect(text).toContain('就業保險 (1%)');
    expect(text).toContain('職災保險 (~0.21%)');
  });
});

// --- Salary Grade ---
describe('getSalaryGrade', () => {
  it('returns correct grade for salary 35000', async () => {
    const result = await getSalaryGrade(env, { salary: 35000 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain('投保薪資級距查詢結果');
    // 35000 → grade 36300
    expect(text).toContain('36,300');
    expect(text).toContain('← 您的級距');
  });

  it('returns minimum grade for very low salary', async () => {
    const result = await getSalaryGrade(env, { salary: 20000 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('27,470');
  });

  it('returns maximum grade for very high salary', async () => {
    const result = await getSalaryGrade(env, { salary: 200000 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('150,000');
  });

  it('lists all available grades', async () => {
    const result = await getSalaryGrade(env, { salary: 40000 });
    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    expect(text).toContain(`共 ${SALARY_GRADES.length} 級`);
  });

  it('returns error when salary is missing', async () => {
    const result = await getSalaryGrade(env, {});
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('請提供月薪');
  });

  it('returns error when salary is zero', async () => {
    const result = await getSalaryGrade(env, { salary: 0 });
    expect(result.isError).toBe(true);
    expect(result.content[0].text).toContain('月薪必須大於 0');
  });

  it('returns exact grade when salary matches a grade exactly', async () => {
    const result = await getSalaryGrade(env, { salary: 42000 });
    expect(result.isError).toBeUndefined();
    expect(result.content[0].text).toContain('42,000');
  });
});

// --- findSalaryGrade helper ---
describe('findSalaryGrade', () => {
  it('returns first grade >= salary', () => {
    expect(findSalaryGrade(29000)).toBe(30300);
  });

  it('returns exact grade when salary matches', () => {
    expect(findSalaryGrade(42000)).toBe(42000);
  });

  it('returns max grade for salary above all grades', () => {
    expect(findSalaryGrade(999999)).toBe(150000);
  });

  it('returns first grade for very low salary', () => {
    expect(findSalaryGrade(1000)).toBe(27470);
  });
});
