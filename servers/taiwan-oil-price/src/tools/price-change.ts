import { fetchPriceChanges } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getPriceChange(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const { changes, source } = await fetchPriceChanges();

    if (!changes || changes.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無法取得調價資料' }],
      };
    }

    const lines = changes.map((c) => {
      const arrow = c.change > 0 ? '↑' : c.change < 0 ? '↓' : '→';
      const sign = c.change > 0 ? '+' : '';
      return [
        `${c.fuelName}:`,
        `  上週: ${c.previousPrice.toFixed(1)} 元/公升`,
        `  本週: ${c.currentPrice.toFixed(1)} 元/公升`,
        `  調幅: ${sign}${c.change.toFixed(1)} 元 ${arrow}`,
      ].join('\n');
    });

    const header = `本週油價調整幅度（生效日: ${changes[0].effectiveDate}）`;
    const sourceNote =
      source === 'fallback'
        ? '\n\n※ 資料來源: 離線備份資料'
        : '\n\n※ 資料來源: 中油 OpenData API';

    return {
      content: [
        { type: 'text', text: `${header}\n\n${lines.join('\n\n')}${sourceNote}` },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得調價資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
