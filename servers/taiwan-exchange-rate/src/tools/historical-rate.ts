import { fetchRates } from '../client.js';
import type { Env, ToolResult, ExchangeRate } from '../types.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function formatRatesTable(rates: readonly ExchangeRate[]): string {
  const header = '幣別 | 代碼 | 現金買入 | 現金賣出 | 即期買入 | 即期賣出';
  const separator = '--- | --- | --- | --- | --- | ---';
  const rows = rates.map(
    (r) =>
      `${r.currency} | ${r.currencyCode} | ${r.cashBuying} | ${r.cashSelling} | ${r.spotBuying} | ${r.spotSelling}`
  );
  return [header, separator, ...rows].join('\n');
}

export async function getHistoricalRate(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const date = args.date as string | undefined;
    const currency = (args.currency as string | undefined)?.toUpperCase();

    if (!date) {
      return {
        content: [
          { type: 'text', text: '請提供日期（格式: YYYY-MM-DD）' },
        ],
        isError: true,
      };
    }

    if (!DATE_PATTERN.test(date)) {
      return {
        content: [
          { type: 'text', text: `日期格式錯誤: ${date}，請使用 YYYY-MM-DD` },
        ],
        isError: true,
      };
    }

    const rates = await fetchRates(date);

    if (rates.length === 0) {
      return {
        content: [
          { type: 'text', text: `${date} 無匯率資料（可能為非營業日）` },
        ],
      };
    }

    const filtered = currency
      ? rates.filter((r) => r.currencyCode.toUpperCase() === currency)
      : rates;

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `${date} 找不到幣別 ${currency} 的匯率資料`,
          },
        ],
      };
    }

    const text = `${date} 臺灣銀行匯率\n\n${formatRatesTable(filtered)}`;
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢歷史匯率失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
