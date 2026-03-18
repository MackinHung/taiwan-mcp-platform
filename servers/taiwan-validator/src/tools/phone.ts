import type { Env, ToolResult } from '../types.js';

/**
 * Validate Taiwan mobile phone number and identify carrier.
 * Pattern: 09xxxxxxxx (10 digits starting with 09)
 */
const CARRIER_PREFIXES: Array<{ prefixes: string[]; carrier: string }> = [
  { prefixes: ['0900', '0901', '0902', '0903', '0904', '0905', '0906', '0907', '0908', '0909', '0910', '0911', '0912', '0913', '0914', '0915', '0916', '0917', '0918', '0919'], carrier: '中華電信' },
  { prefixes: ['0920', '0921', '0922', '0923', '0924', '0925', '0926', '0927', '0928', '0929', '0930', '0931', '0932', '0933', '0934', '0935', '0936', '0937', '0938', '0939'], carrier: '遠傳電信' },
  { prefixes: ['0970', '0971', '0972', '0973', '0974', '0975', '0976', '0977', '0978', '0979', '0980', '0981', '0982', '0983', '0984', '0985', '0986', '0987', '0988', '0989', '0990', '0991', '0992', '0993', '0994', '0995', '0996', '0997', '0998', '0999'], carrier: '台灣大哥大' },
];

function identifyCarrier(phone: string): string {
  const prefix4 = phone.substring(0, 4);
  for (const entry of CARRIER_PREFIXES) {
    if (entry.prefixes.includes(prefix4)) {
      return entry.carrier;
    }
  }
  return '其他/未知業者';
}

export async function validatePhone(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const phone = args.phone as string | undefined;

    if (!phone || phone.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供手機號碼' }],
        isError: true,
      };
    }

    const trimmed = phone.trim().replace(/[\s-]/g, '');

    if (!/^09\d{8}$/.test(trimmed)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            input: trimmed,
            message: '格式錯誤：手機號碼應為 09 開頭的 10 位數字',
          }),
        }],
      };
    }

    const carrier = identifyCarrier(trimmed);

    const result = {
      valid: true,
      input: trimmed,
      breakdown: {
        prefix: trimmed.substring(0, 4),
        carrier,
        formatted: `${trimmed.substring(0, 4)}-${trimmed.substring(4, 7)}-${trimmed.substring(7)}`,
      },
      message: `手機號碼 ${trimmed} 格式正確（推測電信業者：${carrier}）`,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `驗證手機號碼失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
