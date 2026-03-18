/**
 * Lunar calendar data table (1900-2100).
 *
 * Each entry encodes one lunar year:
 * - Bits 0-3 (hex digit): leap month number (0 = no leap month)
 * - Bits 4-15: 12 bits for months 1-12 (1=30 days, 0=29 days), bit 4=month 1
 * - Bit 16: leap month size (1=30 days, 0=29 days)
 *
 * Encoding: 0xLMMMMD where
 *   L = leap month length (0 or 1, at bit 16)
 *   MMMM = month lengths for months 1-12 (bits 4-15)
 *   D = leap month number (bits 0-3)
 */
export const LUNAR_DATA: number[] = [
  0x04bd8, // 1900
  0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, // 1901-1905
  0x16554, 0x056a0, 0x09ad0, 0x055d2, 0x04ae0, // 1906-1910
  0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, // 1911-1915
  0x0d6a0, 0x0ada2, 0x095b0, 0x14977, 0x04970, // 1916-1920
  0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, // 1921-1925
  0x02b60, 0x09570, 0x052f2, 0x04970, 0x06566, // 1926-1930
  0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, // 1931-1935
  0x186e3, 0x092e0, 0x1c8d7, 0x0c950, 0x0d4a0, // 1936-1940
  0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, // 1941-1945
  0x092d0, 0x0d2b2, 0x0a950, 0x0b557, 0x06ca0, // 1946-1950
  0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, // 1951-1955
  0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, 0x0aea6, // 1956-1960
  0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, // 1961-1965
  0x0f263, 0x0d950, 0x05b57, 0x056a0, 0x096d0, // 1966-1970
  0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, // 1971-1975
  0x0d558, 0x0b540, 0x0b6a0, 0x195a6, 0x095b0, // 1976-1980
  0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, // 1981-1985
  0x06d40, 0x0af46, 0x0ab60, 0x09570, 0x04af5, // 1986-1990
  0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, // 1991-1995
  0x05ac0, 0x0ab60, 0x096d5, 0x092e0, 0x0c960, // 1996-2000
  0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, // 2001-2005
  0x0abb7, 0x025d0, 0x092d0, 0x0cab5, 0x0a950, // 2006-2010
  0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, // 2011-2015
  0x0a5b0, 0x15176, 0x052b0, 0x0a930, 0x07954, // 2016-2020
  0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, // 2021-2025
  0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, 0x05aa0, // 2026-2030
  0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, // 2031-2035
  0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, 0x0b5a0, // 2036-2040
  0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, // 2041-2045
  0x0aa50, 0x1b255, 0x06d20, 0x0ada0, 0x14b63, // 2046-2050
  0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, // 2051-2055
  0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, 0x092e0, // 2056-2060
  0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, // 2061-2065
  0x05d55, 0x056a0, 0x0a6d0, 0x055d4, 0x052d0, // 2066-2070
  0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, // 2071-2075
  0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, 0x0b273, // 2076-2080
  0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, // 2081-2085
  0x04b60, 0x0a570, 0x054e4, 0x0d160, 0x0e968, // 2086-2090
  0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, // 2091-2095
  0x0a9d4, 0x0a4d0, 0x0d150, 0x0f252, 0x0d520, // 2096-2100
];

/** Base date: January 31, 1900 is lunar New Year 1900 */
export const LUNAR_BASE_YEAR = 1900;
export const LUNAR_BASE_DATE = new Date(1900, 0, 31); // Jan 31, 1900

const HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
const ZODIAC_ANIMALS = ['鼠', '牛', '虎', '兔', '龍', '蛇', '馬', '羊', '猴', '雞', '狗', '豬'];
const LUNAR_MONTH_NAMES = ['正月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '冬月', '臘月'];
const LUNAR_DAY_NAMES = [
  '', '初一', '初二', '初三', '初四', '初五', '初六', '初七', '初八', '初九', '初十',
  '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八', '十九', '二十',
  '廿一', '廿二', '廿三', '廿四', '廿五', '廿六', '廿七', '廿八', '廿九', '三十',
];

/**
 * Get the leap month number for a given lunar year (0 = no leap).
 */
export function getLeapMonth(year: number): number {
  return LUNAR_DATA[year - LUNAR_BASE_YEAR] & 0xf;
}

/**
 * Get the number of days in the leap month for a given year.
 * Returns 0 if no leap month.
 */
export function getLeapMonthDays(year: number): number {
  if (getLeapMonth(year) === 0) return 0;
  return (LUNAR_DATA[year - LUNAR_BASE_YEAR] & 0x10000) ? 30 : 29;
}

/**
 * Get the number of days in a given lunar month (1-12) of a given year.
 */
export function getLunarMonthDays(year: number, month: number): number {
  return (LUNAR_DATA[year - LUNAR_BASE_YEAR] & (0x10000 >> month)) ? 30 : 29;
}

/**
 * Get the total number of days in a lunar year.
 */
export function getLunarYearDays(year: number): number {
  let total = 0;
  for (let m = 1; m <= 12; m++) {
    total += getLunarMonthDays(year, m);
  }
  total += getLeapMonthDays(year);
  return total;
}

/**
 * Convert a solar (Gregorian) date to lunar date.
 */
export function solarToLunar(solarYear: number, solarMonth: number, solarDay: number): {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  isLeapMonth: boolean;
  zodiac: string;
  heavenlyStem: string;
  earthlyBranch: string;
  ganzhiYear: string;
  monthName: string;
  dayName: string;
} {
  const solar = new Date(solarYear, solarMonth - 1, solarDay);
  let offset = Math.floor((solar.getTime() - LUNAR_BASE_DATE.getTime()) / 86400000);

  // Find the lunar year
  let lunarYear = LUNAR_BASE_YEAR;
  let yearDays: number;
  for (let i = LUNAR_BASE_YEAR; i < LUNAR_BASE_YEAR + LUNAR_DATA.length; i++) {
    yearDays = getLunarYearDays(i);
    if (offset < yearDays) {
      lunarYear = i;
      break;
    }
    offset -= yearDays;
  }

  // Find the lunar month
  const leapMonth = getLeapMonth(lunarYear);
  let lunarMonth = 1;
  let isLeapMonth = false;
  let monthDays: number;

  for (let m = 1; m <= 12; m++) {
    // Normal month
    monthDays = getLunarMonthDays(lunarYear, m);
    if (offset < monthDays) {
      lunarMonth = m;
      break;
    }
    offset -= monthDays;

    // Check leap month after this month
    if (leapMonth === m) {
      monthDays = getLeapMonthDays(lunarYear);
      if (offset < monthDays) {
        lunarMonth = m;
        isLeapMonth = true;
        break;
      }
      offset -= monthDays;
    }

    if (m === 12) {
      lunarMonth = 12;
    }
  }

  const lunarDay = offset + 1;

  const stemIdx = (lunarYear - 4) % 10;
  const branchIdx = (lunarYear - 4) % 12;
  const heavenlyStem = HEAVENLY_STEMS[stemIdx];
  const earthlyBranch = EARTHLY_BRANCHES[branchIdx];
  const zodiac = ZODIAC_ANIMALS[branchIdx];
  const ganzhiYear = `${heavenlyStem}${earthlyBranch}`;
  const monthName = isLeapMonth ? `閏${LUNAR_MONTH_NAMES[lunarMonth - 1]}` : LUNAR_MONTH_NAMES[lunarMonth - 1];
  const dayName = LUNAR_DAY_NAMES[lunarDay] ?? `第${lunarDay}日`;

  return {
    lunarYear,
    lunarMonth,
    lunarDay,
    isLeapMonth,
    zodiac,
    heavenlyStem,
    earthlyBranch,
    ganzhiYear,
    monthName,
    dayName,
  };
}

/**
 * Convert a lunar date to solar (Gregorian) date.
 */
export function lunarToSolar(
  lunarYear: number,
  lunarMonth: number,
  lunarDay: number,
  isLeapMonth: boolean = false
): { solarYear: number; solarMonth: number; solarDay: number } {
  // Calculate offset from base date
  let offset = 0;

  // Add up full years from base year
  for (let y = LUNAR_BASE_YEAR; y < lunarYear; y++) {
    offset += getLunarYearDays(y);
  }

  // Add up months in the target year
  const leapMonth = getLeapMonth(lunarYear);
  for (let m = 1; m < lunarMonth; m++) {
    offset += getLunarMonthDays(lunarYear, m);
    if (leapMonth === m) {
      offset += getLeapMonthDays(lunarYear);
    }
  }

  // If we want the leap month itself (not the regular month)
  if (isLeapMonth && leapMonth === lunarMonth) {
    offset += getLunarMonthDays(lunarYear, lunarMonth);
  }

  // Add days within the month
  offset += lunarDay - 1;

  const result = new Date(LUNAR_BASE_DATE.getTime() + offset * 86400000);
  return {
    solarYear: result.getFullYear(),
    solarMonth: result.getMonth() + 1,
    solarDay: result.getDate(),
  };
}

export { LUNAR_MONTH_NAMES, LUNAR_DAY_NAMES, HEAVENLY_STEMS, EARTHLY_BRANCHES, ZODIAC_ANIMALS };
