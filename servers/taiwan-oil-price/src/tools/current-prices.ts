import { fetchCurrentPrices } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getCurrentPrices(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const { prices, source } = await fetchCurrentPrices();

    if (!prices || prices.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無法取得油價資料' }],
      };
    }

    const lines = prices.map(
      (p) => `${p.fuelName}: ${p.price.toFixed(1)} ${p.unit}`
    );

    const header = `中油現行牌價（生效日: ${prices[0].effectiveDate}）`;
    const sourceNote =
      source === 'fallback'
        ? '\n\n※ 資料來源: 離線備份資料（CPC API 暫時無法連線）'
        : '\n\n※ 資料來源: 中油 OpenData API';

    return {
      content: [
        {
          type: 'text',
          text: `${header}\n\n${lines.join('\n')}${sourceNote}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得油價資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
