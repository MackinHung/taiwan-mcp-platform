import { fetchRates } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getRateByCurrency(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const currency = (args.currency as string | undefined)?.toUpperCase();

    if (!currency) {
      return {
        content: [{ type: 'text', text: '請提供幣別代碼（如 USD、JPY、EUR）' }],
        isError: true,
      };
    }

    const rates = await fetchRates();
    const found = rates.find(
      (r) => r.currencyCode.toUpperCase() === currency
    );

    if (!found) {
      return {
        content: [
          { type: 'text', text: `找不到幣別 ${currency} 的匯率資料` },
        ],
      };
    }

    const text = [
      `${found.currency} (${found.currencyCode}) 匯率`,
      '',
      `現金買入: ${found.cashBuying}`,
      `現金賣出: ${found.cashSelling}`,
      `即期買入: ${found.spotBuying}`,
      `即期賣出: ${found.spotSelling}`,
    ].join('\n');

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢匯率失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
