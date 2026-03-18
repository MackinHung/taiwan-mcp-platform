import type { Env, ToolResult } from '../types.js';

/**
 * Validate Taiwan bank account format.
 * Bank code: 3 digits. Account number: varies by bank (typically 10-16 digits).
 */
const BANK_NAMES: Record<string, string> = {
  '004': '台灣銀行',
  '005': '土地銀行',
  '006': '合作金庫',
  '007': '第一銀行',
  '008': '華南銀行',
  '009': '彰化銀行',
  '011': '上海商銀',
  '012': '台北富邦',
  '013': '國泰世華',
  '017': '兆豐銀行',
  '021': '花旗銀行',
  '048': '王道銀行',
  '050': '台灣企銀',
  '052': '渣打銀行',
  '053': '台中商銀',
  '054': '京城銀行',
  '081': '匯豐銀行',
  '101': '瑞興銀行',
  '102': '華泰銀行',
  '103': '臺灣新光',
  '108': '陽信銀行',
  '118': '板信銀行',
  '147': '三信商銀',
  '803': '聯邦銀行',
  '805': '遠東銀行',
  '806': '元大銀行',
  '807': '永豐銀行',
  '808': '玉山銀行',
  '809': '凱基銀行',
  '810': '星展銀行',
  '812': '台新銀行',
  '816': '安泰銀行',
  '822': '中國信託',
  '823': '將來銀行',
  '824': '連線銀行',
  '826': '樂天銀行',
};

export async function validateBankAccount(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const bankCode = args.bankCode as string | undefined;
    const accountNumber = args.accountNumber as string | undefined;

    if (!bankCode || bankCode.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供銀行代碼' }],
        isError: true,
      };
    }

    if (!accountNumber || accountNumber.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供帳號' }],
        isError: true,
      };
    }

    const trimmedCode = bankCode.trim();
    const trimmedAccount = accountNumber.trim().replace(/[-\s]/g, '');

    if (!/^\d{3}$/.test(trimmedCode)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            bankCode: trimmedCode,
            accountNumber: trimmedAccount,
            message: '銀行代碼格式錯誤：應為 3 位數字',
          }),
        }],
      };
    }

    if (!/^\d+$/.test(trimmedAccount)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            bankCode: trimmedCode,
            accountNumber: trimmedAccount,
            message: '帳號格式錯誤：應為純數字',
          }),
        }],
      };
    }

    const bankName = BANK_NAMES[trimmedCode] ?? '未知銀行';
    const isKnownBank = BANK_NAMES[trimmedCode] !== undefined;
    const accountLength = trimmedAccount.length;
    const lengthValid = accountLength >= 10 && accountLength <= 16;

    const result = {
      valid: isKnownBank && lengthValid,
      bankCode: trimmedCode,
      accountNumber: trimmedAccount,
      breakdown: {
        bankName,
        isKnownBank,
        accountLength,
        accountLengthValid: lengthValid,
      },
      message: !isKnownBank
        ? `銀行代碼 ${trimmedCode} 非常見銀行代碼`
        : !lengthValid
          ? `帳號長度 ${accountLength} 位不在常見範圍（10-16 位）`
          : `銀行帳號格式驗證通過（${bankName}，帳號 ${accountLength} 位）`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `驗證銀行帳號失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
