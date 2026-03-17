import { fetchRates } from '../client.js';
import type { Env, ToolResult, ExchangeRate } from '../types.js';

function formatRatesTable(rates: readonly ExchangeRate[]): string {
  const header = '幣別 | 代碼 | 現金買入 | 現金賣出 | 即期買入 | 即期賣出';
  const separator = '--- | --- | --- | --- | --- | ---';
  const rows = rates.map(
    (r) =>
      `${r.currency} | ${r.currencyCode} | ${r.cashBuying} | ${r.cashSelling} | ${r.spotBuying} | ${r.spotSelling}`
  );
  return [header, separator, ...rows].join('\n');
}

export async function getCurrentRates(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const rates = await fetchRates();

    if (rates.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無匯率資料' }],
      };
    }

    const text = `今日臺灣銀行匯率（共 ${rates.length} 種幣別）\n\n${formatRatesTable(rates)}`;
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得匯率失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
