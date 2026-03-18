import { fetchCurrentPrices, isValidFuelType, FUEL_TYPES } from '../client.js';
import type { Env, ToolResult, FuelTypeCode } from '../types.js';

export async function getPriceByType(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const fuelType = args.fuelType as string | undefined;

    if (!fuelType || typeof fuelType !== 'string') {
      return {
        content: [
          {
            type: 'text',
            text: '請提供燃料類型（fuelType 為必填，可選: "92", "95", "98", "diesel"）',
          },
        ],
        isError: true,
      };
    }

    if (!isValidFuelType(fuelType)) {
      const validTypes = Object.entries(FUEL_TYPES)
        .map(([code, name]) => `"${code}" (${name})`)
        .join(', ');
      return {
        content: [
          {
            type: 'text',
            text: `無效的燃料類型「${fuelType}」。可選類型: ${validTypes}`,
          },
        ],
        isError: true,
      };
    }

    const { prices, source } = await fetchCurrentPrices();
    const target = prices.find((p) => p.fuelType === fuelType);

    if (!target) {
      return {
        content: [
          {
            type: 'text',
            text: `查無 ${FUEL_TYPES[fuelType as FuelTypeCode]} 的價格資料`,
          },
        ],
      };
    }

    const sourceNote =
      source === 'fallback'
        ? '\n\n※ 資料來源: 離線備份資料'
        : '\n\n※ 資料來源: 中油 OpenData API';

    const lines = [
      `${target.fuelName} 現行牌價`,
      '',
      `價格: ${target.price.toFixed(1)} ${target.unit}`,
      `生效日期: ${target.effectiveDate}`,
      sourceNote,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢油價失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
