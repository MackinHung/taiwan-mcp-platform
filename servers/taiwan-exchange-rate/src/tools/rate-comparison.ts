import { fetchRates } from '../client.js';
import type { Env, ToolResult, ExchangeRate } from '../types.js';

function formatComparisonTable(rates: readonly ExchangeRate[]): string {
  const header = '幣別 | 代碼 | 現金買入 | 現金賣出 | 即期買入 | 即期賣出';
  const separator = '--- | --- | --- | --- | --- | ---';
  const rows = rates.map(
    (r) =>
      `${r.currency} | ${r.currencyCode} | ${r.cashBuying} | ${r.cashSelling} | ${r.spotBuying} | ${r.spotSelling}`
  );
  return [header, separator, ...rows].join('\n');
}

export async function compareRates(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const currenciesInput = args.currencies as string | undefined;

    if (!currenciesInput) {
      return {
        content: [
          {
            type: 'text',
            text: '請提供要比較的幣別代碼（逗號分隔，如 USD,JPY,EUR）',
          },
        ],
        isError: true,
      };
    }

    const codes = currenciesInput
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter((c) => c.length > 0);

    if (codes.length === 0) {
      return {
        content: [
          { type: 'text', text: '請提供至少一個幣別代碼' },
        ],
        isError: true,
      };
    }

    const rates = await fetchRates();
    const filtered = rates.filter((r) =>
      codes.includes(r.currencyCode.toUpperCase())
    );

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `找不到以下幣別的匯率資料: ${codes.join(', ')}`,
          },
        ],
      };
    }

    const found = filtered.map((r) => r.currencyCode);
    const notFound = codes.filter((c) => !found.includes(c));

    let text = `匯率比較（${filtered.length} 種幣別）\n\n${formatComparisonTable(filtered)}`;

    if (notFound.length > 0) {
      text += `\n\n找不到以下幣別: ${notFound.join(', ')}`;
    }

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `比較匯率失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
