import type { Env, ToolResult } from '../types.js';

/**
 * Validate Taiwan license plate format.
 * Common patterns:
 * - 自用小客車 (new): AAA-0000 (3 letters + 4 digits)
 * - 自用小客車 (old): 0000-AA or AA-0000 (4 digits + 2 letters or 2 letters + 4 digits)
 * - 機車 (new): AAA-0000 (3 letters + 4 digits)
 * - 機車 (old): 000-AAA (3 digits + 3 letters)
 * - 營業用: AA-0000 (2 letters + 4 digits)
 * - 大型車: AA-000 or 00-AA (various)
 */
interface PlatePattern {
  name: string;
  regex: RegExp;
  type: string;
}

const PLATE_PATTERNS: PlatePattern[] = [
  { name: '新式自用小客車/機車', regex: /^[A-Z]{3}-\d{4}$/, type: '自用車/機車' },
  { name: '舊式機車', regex: /^\d{3}-[A-Z]{3}$/, type: '機車' },
  { name: '營業用小客車', regex: /^[A-Z]{2}-\d{4}$/, type: '營業用' },
  { name: '舊式自用小客車', regex: /^\d{4}-[A-Z]{2}$/, type: '自用車' },
  { name: '大型車', regex: /^[A-Z]{2}-\d{3}$/, type: '大型車' },
  { name: '大型車', regex: /^\d{2}-[A-Z]{2}$/, type: '大型車' },
  { name: '特種車', regex: /^[A-Z]\d-\d{4}$/, type: '特種車' },
  { name: '電動車/新式', regex: /^[A-Z]{3}-\d{3}$/, type: '電動車' },
];

export async function validateLicensePlate(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const plate = args.plate as string | undefined;

    if (!plate || plate.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供車牌號碼' }],
        isError: true,
      };
    }

    const trimmed = plate.trim().toUpperCase();
    // Normalize: add dash if missing in common positions
    const normalized = trimmed.includes('-') ? trimmed : normalizePlate(trimmed);

    let matchedPattern: PlatePattern | undefined;
    for (const pattern of PLATE_PATTERNS) {
      if (pattern.regex.test(normalized)) {
        matchedPattern = pattern;
        break;
      }
    }

    if (!matchedPattern) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            input: trimmed,
            normalized,
            message: '車牌號碼格式不符合任何已知台灣車牌格式',
            knownFormats: [
              'AAA-0000（新式自用小客車/機車）',
              '000-AAA（舊式機車）',
              'AA-0000（營業用小客車）',
              '0000-AA（舊式自用小客車）',
            ],
          }),
        }],
      };
    }

    const result = {
      valid: true,
      input: trimmed,
      normalized,
      breakdown: {
        patternName: matchedPattern.name,
        vehicleType: matchedPattern.type,
      },
      message: `車牌 ${normalized} 格式正確（${matchedPattern.name}，${matchedPattern.type}）`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `驗證車牌號碼失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

function normalizePlate(input: string): string {
  // Try to insert dash at common positions
  // AAA0000 → AAA-0000
  if (/^[A-Z]{3}\d{4}$/.test(input)) return `${input.slice(0, 3)}-${input.slice(3)}`;
  // 000AAA → 000-AAA
  if (/^\d{3}[A-Z]{3}$/.test(input)) return `${input.slice(0, 3)}-${input.slice(3)}`;
  // AA0000 → AA-0000
  if (/^[A-Z]{2}\d{4}$/.test(input)) return `${input.slice(0, 2)}-${input.slice(2)}`;
  // 0000AA → 0000-AA
  if (/^\d{4}[A-Z]{2}$/.test(input)) return `${input.slice(0, 4)}-${input.slice(4)}`;
  // AA000 → AA-000
  if (/^[A-Z]{2}\d{3}$/.test(input)) return `${input.slice(0, 2)}-${input.slice(2)}`;
  // 00AA → 00-AA
  if (/^\d{2}[A-Z]{2}$/.test(input)) return `${input.slice(0, 2)}-${input.slice(2)}`;
  // AAA000 → AAA-000
  if (/^[A-Z]{3}\d{3}$/.test(input)) return `${input.slice(0, 3)}-${input.slice(3)}`;
  return input;
}
