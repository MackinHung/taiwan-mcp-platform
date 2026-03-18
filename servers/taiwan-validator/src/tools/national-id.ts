import type { Env, ToolResult } from '../types.js';

/**
 * Letter-to-number mapping for Taiwan National ID first character.
 * A=10, B=11, ..., Z=35. Mapped to their respective city/county codes.
 */
const LETTER_MAP: Record<string, number> = {
  A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, G: 16, H: 17,
  I: 34, J: 18, K: 19, L: 20, M: 21, N: 22, O: 35, P: 23,
  Q: 24, R: 25, S: 26, T: 27, U: 28, V: 29, W: 32, X: 30,
  Y: 31, Z: 33,
};

const CITY_MAP: Record<string, string> = {
  A: '台北市', B: '台中市', C: '基隆市', D: '台南市', E: '高雄市',
  F: '新北市', G: '宜蘭縣', H: '桃園市', I: '嘉義市', J: '新竹縣',
  K: '苗栗縣', L: '台中縣', M: '南投縣', N: '彰化縣', O: '新竹市',
  P: '雲林縣', Q: '嘉義縣', R: '台南縣', S: '高雄縣', T: '屏東縣',
  U: '花蓮縣', V: '台東縣', W: '金門縣', X: '澎湖縣', Y: '陽明山',
  Z: '連江縣',
};

export async function validateNationalId(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const id = args.id as string | undefined;

    if (!id || id.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供身分證字號' }],
        isError: true,
      };
    }

    const trimmed = id.trim().toUpperCase();

    // Check format: 1 letter + 9 digits
    if (!/^[A-Z]\d{9}$/.test(trimmed)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            input: trimmed,
            message: '格式錯誤：身分證字號應為 1 個英文字母 + 9 位數字',
          }),
        }],
      };
    }

    const letter = trimmed[0];
    const letterValue = LETTER_MAP[letter];

    if (letterValue === undefined) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            input: trimmed,
            message: '無效的英文字母',
          }),
        }],
      };
    }

    // Gender check: second digit must be 1 (male) or 2 (female)
    const genderDigit = parseInt(trimmed[1], 10);
    const gender = genderDigit === 1 ? '男' : genderDigit === 2 ? '女' : '未知';

    // Checksum algorithm:
    // Convert letter to 2-digit number, then use weights [1,9,8,7,6,5,4,3,2,1]
    // The first digit of letterValue * 1, second digit of letterValue * 9
    const d0 = Math.floor(letterValue / 10); // tens digit of letter value
    const d1 = letterValue % 10; // ones digit of letter value

    const digits = [d0, d1];
    for (let i = 1; i < 10; i++) {
      digits.push(parseInt(trimmed[i], 10));
    }

    const weights = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1];
    let sum = 0;
    for (let i = 0; i < 11; i++) {
      sum += digits[i] * weights[i];
    }

    const valid = sum % 10 === 0;
    const city = CITY_MAP[letter] ?? '未知';

    const result = {
      valid,
      input: trimmed,
      breakdown: {
        letter,
        letterValue,
        city,
        gender,
        checksum: sum,
        checksumMod10: sum % 10,
      },
      message: valid
        ? `身分證字號 ${trimmed} 驗證通過（${city}，${gender}）`
        : `身分證字號 ${trimmed} 驗證失敗（檢查碼不正確）`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `驗證身分證字號失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
