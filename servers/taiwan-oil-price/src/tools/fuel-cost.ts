import { fetchCurrentPrices, isValidFuelType, FUEL_TYPES } from '../client.js';
import type { Env, ToolResult, FuelTypeCode } from '../types.js';

export async function calculateFuelCost(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const fuelType = args.fuelType as string | undefined;
    const liters = args.liters as number | undefined;
    const amount = args.amount as number | undefined;

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

    if (liters === undefined && amount === undefined) {
      return {
        content: [
          {
            type: 'text',
            text: '請提供加油公升數（liters）或金額（amount）其中之一',
          },
        ],
        isError: true,
      };
    }

    if (liters !== undefined && amount !== undefined) {
      return {
        content: [
          {
            type: 'text',
            text: '請只提供 liters 或 amount 其中之一，不可同時提供',
          },
        ],
        isError: true,
      };
    }

    if (liters !== undefined && (typeof liters !== 'number' || liters <= 0)) {
      return {
        content: [{ type: 'text', text: '公升數必須為大於 0 的數字' }],
        isError: true,
      };
    }

    if (amount !== undefined && (typeof amount !== 'number' || amount <= 0)) {
      return {
        content: [{ type: 'text', text: '金額必須為大於 0 的數字' }],
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
        ? '\n\n※ 使用離線備份價格計算'
        : '\n\n※ 使用中油即時牌價計算';

    if (liters !== undefined) {
      const totalCost = Math.round(liters * target.price * 10) / 10;
      const lines = [
        '油費計算結果',
        '',
        `燃料: ${target.fuelName}`,
        `單價: ${target.price.toFixed(1)} 元/公升`,
        `加油量: ${liters} 公升`,
        `總費用: ${totalCost.toFixed(1)} 元`,
        sourceNote,
      ];
      return {
        content: [{ type: 'text', text: lines.join('\n') }],
      };
    }

    // amount is defined
    const calculatedLiters = Math.round((amount! / target.price) * 100) / 100;
    const lines = [
      '油費計算結果',
      '',
      `燃料: ${target.fuelName}`,
      `單價: ${target.price.toFixed(1)} 元/公升`,
      `預算金額: ${amount!} 元`,
      `可加油量: ${calculatedLiters.toFixed(2)} 公升`,
      sourceNote,
    ];
    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `油費計算失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
