import type { Env, ToolResult } from '../types.js';

/**
 * Validate Taiwan Unified Business Number (統一編號, 8 digits).
 * Algorithm: weights [1,2,1,2,1,2,4,1], multiply each digit,
 * sum tens and ones of each product, total mod 5 === 0.
 * Special rule: if 7th digit is 7, allow mod 5 === 0 OR total+1 mod 5 === 0.
 */
const WEIGHTS = [1, 2, 1, 2, 1, 2, 4, 1];

function sumDigits(n: number): number {
  return Math.floor(n / 10) + (n % 10);
}

export async function validateTaxId(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const taxId = args.taxId as string | undefined;

    if (!taxId || taxId.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供統一編號' }],
        isError: true,
      };
    }

    const trimmed = taxId.trim();

    if (!/^\d{8}$/.test(trimmed)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            input: trimmed,
            message: '格式錯誤：統一編號應為 8 位數字',
          }),
        }],
      };
    }

    const digits = trimmed.split('').map(Number);
    let sum = 0;
    const products: number[] = [];

    for (let i = 0; i < 8; i++) {
      const product = digits[i] * WEIGHTS[i];
      products.push(product);
      sum += sumDigits(product);
    }

    const isSeventhDigitSeven = digits[6] === 7;
    const valid = sum % 5 === 0 || (isSeventhDigitSeven && (sum + 1) % 5 === 0);

    const result = {
      valid,
      input: trimmed,
      breakdown: {
        digits,
        weights: WEIGHTS,
        products,
        sumOfDigits: sum,
        mod5: sum % 5,
        seventhDigitIs7: isSeventhDigitSeven,
      },
      message: valid
        ? `統一編號 ${trimmed} 驗證通過`
        : `統一編號 ${trimmed} 驗證失敗（檢查碼不正確）`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `驗證統一編號失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
