import { fetchPriceHistory, isValidFuelType, FUEL_TYPES } from '../client.js';
import type { Env, ToolResult, FuelTypeCode } from '../types.js';

export async function getPriceHistory(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const fuelType = args.fuelType as string | undefined;
    const limit = (args.limit as number) ?? 10;

    if (fuelType && !isValidFuelType(fuelType)) {
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

    const validFuelType = fuelType && isValidFuelType(fuelType)
      ? fuelType as FuelTypeCode
      : undefined;

    const { records, source } = await fetchPriceHistory(validFuelType, limit);

    if (!records || records.length === 0) {
      const typeDesc = validFuelType ? FUEL_TYPES[validFuelType] : '所有燃料';
      return {
        content: [
          { type: 'text', text: `查無${typeDesc}的歷史油價資料` },
        ],
      };
    }

    const lines = records.map(
      (r) => `${r.effectiveDate} | ${r.fuelName}: ${r.price.toFixed(1)} 元/公升`
    );

    const typeDesc = validFuelType ? FUEL_TYPES[validFuelType] : '所有燃料';
    const header = `${typeDesc}歷史油價（顯示 ${records.length} 筆）`;
    const sourceNote =
      source === 'fallback'
        ? '\n\n※ 資料來源: 離線備份資料'
        : '\n\n※ 資料來源: 中油 OpenData API';

    return {
      content: [
        { type: 'text', text: `${header}\n\n${lines.join('\n')}${sourceNote}` },
      ],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得歷史油價失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
