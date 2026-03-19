// 2026 台灣勞健保費率常數

/** 勞保普通事故費率 */
export const LABOR_INSURANCE_RATE = 0.115;

/** 勞保被保險人負擔比例 */
export const LABOR_INSURANCE_EMPLOYEE_RATIO = 0.2;

/** 勞保雇主負擔比例 */
export const LABOR_INSURANCE_EMPLOYER_RATIO = 0.7;

/** 勞保政府負擔比例 */
export const LABOR_INSURANCE_GOVERNMENT_RATIO = 0.1;

/** 健保費率 */
export const HEALTH_INSURANCE_RATE = 0.0517;

/** 健保被保險人負擔比例 */
export const HEALTH_INSURANCE_EMPLOYEE_RATIO = 0.3;

/** 健保雇主負擔比例 */
export const HEALTH_INSURANCE_EMPLOYER_RATIO = 0.6;

/** 健保政府負擔比例 */
export const HEALTH_INSURANCE_GOVERNMENT_RATIO = 0.1;

/** 健保眷屬最多計算人數 */
export const HEALTH_INSURANCE_MAX_DEPENDENTS = 3;

/** 勞退雇主提繳比例 */
export const PENSION_EMPLOYER_RATE = 0.06;

/** 勞退勞工自願提繳最低比例 */
export const PENSION_VOLUNTARY_MIN_RATE = 0;

/** 勞退勞工自願提繳最高比例 */
export const PENSION_VOLUNTARY_MAX_RATE = 6;

/** 就業保險費率 */
export const EMPLOYMENT_INSURANCE_RATE = 0.01;

/** 職災保險費率 (平均) */
export const OCCUPATIONAL_ACCIDENT_RATE = 0.0021;

/**
 * 投保薪資級距表 (2026 簡化版)
 * 對應實際月薪，找到第一個 >= salary 的級距
 */
export const SALARY_GRADES: readonly number[] = [
  27470, 28800, 30300, 31800, 33300, 34800, 36300, 38200,
  40100, 42000, 43900, 45800, 48200, 50600, 53000, 55400,
  57800, 60800, 63800, 66800, 69800, 72800, 76500, 80200,
  83900, 87600, 92100, 96600, 101100, 105600, 110100, 115500,
  120900, 126300, 131700, 137100, 142500, 147900, 150000,
] as const;

/**
 * 根據月薪找到對應的投保薪資級距
 * 邏輯：第一個 >= salary 的級距，若超過最高級距則用最高
 */
export function findSalaryGrade(salary: number): number {
  for (const grade of SALARY_GRADES) {
    if (grade >= salary) {
      return grade;
    }
  }
  return SALARY_GRADES[SALARY_GRADES.length - 1];
}
