import { fetchWaterQualityData } from '../client.js';
import type { Env, ToolResult, WaterQualityRecord } from '../types.js';

const VALID_PARAMS: Record<string, { key: keyof WaterQualityRecord; unit: string; label: string }> = {
  'ph': { key: 'ph', unit: '', label: 'pH' },
  'pH': { key: 'ph', unit: '', label: 'pH' },
  'do': { key: 'dissolvedOxygen', unit: 'mg/L', label: '溶氧量' },
  '溶氧量': { key: 'dissolvedOxygen', unit: 'mg/L', label: '溶氧量' },
  'bod': { key: 'bod', unit: 'mg/L', label: '生化需氧量' },
  '生化需氧量': { key: 'bod', unit: 'mg/L', label: '生化需氧量' },
  'ss': { key: 'suspendedSolids', unit: 'mg/L', label: '懸浮固體' },
  '懸浮固體': { key: 'suspendedSolids', unit: 'mg/L', label: '懸浮固體' },
  'nh3n': { key: 'ammonia', unit: 'mg/L', label: '氨氮' },
  '氨氮': { key: 'ammonia', unit: 'mg/L', label: '氨氮' },
  'temp': { key: 'waterTemp', unit: '°C', label: '水溫' },
  '水溫': { key: 'waterTemp', unit: '°C', label: '水溫' },
};

export async function searchByParameter(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const parameter = args.parameter as string | undefined;
    if (!parameter || parameter.trim().length === 0) {
      return {
        content: [{
          type: 'text',
          text: '請提供有效的水質參數。可用參數: pH, 溶氧量, 生化需氧量, 氨氮, 懸浮固體, 水溫',
        }],
        isError: true,
      };
    }

    const paramKey = parameter.trim();
    const paramInfo = VALID_PARAMS[paramKey];
    if (!paramInfo) {
      return {
        content: [{
          type: 'text',
          text: '請提供有效的水質參數。可用參數: pH, 溶氧量, 生化需氧量, 氨氮, 懸浮固體, 水溫',
        }],
        isError: true,
      };
    }

    const minValue = args.minValue as number | undefined;
    const maxValue = args.maxValue as number | undefined;
    const limit = (args.limit as number) ?? 20;

    if (minValue === undefined && maxValue === undefined) {
      return {
        content: [{
          type: 'text',
          text: '請提供 minValue 或 maxValue 至少一個篩選條件',
        }],
        isError: true,
      };
    }

    const { records } = await fetchWaterQualityData({ limit: 1000 });

    let filtered = records;
    if (minValue !== undefined) {
      filtered = filtered.filter((r) => (r[paramInfo.key] as number) >= minValue);
    }
    if (maxValue !== undefined) {
      filtered = filtered.filter((r) => (r[paramInfo.key] as number) <= maxValue);
    }

    if (filtered.length === 0) {
      const rangeDesc = [
        minValue !== undefined ? `>= ${minValue}` : '',
        maxValue !== undefined ? `<= ${maxValue}` : '',
      ].filter(Boolean).join(' 且 ');
      return {
        content: [{
          type: 'text',
          text: `查無${paramInfo.label}${rangeDesc ? ` ${rangeDesc}` : ''}的水質資料`,
        }],
      };
    }

    const sorted = [...filtered].sort(
      (a, b) => (b[paramInfo.key] as number) - (a[paramInfo.key] as number)
    );
    const sliced = sorted.slice(0, limit);

    const unitSuffix = paramInfo.unit ? ` ${paramInfo.unit}` : '';
    const lines = sliced.map((r) =>
      `${r.stationName} (${r.county}/${r.riverName}): ${paramInfo.label} = ${r[paramInfo.key]}${unitSuffix}  RPI: ${r.rpiIndex}`
    );

    const rangeDesc = [
      minValue !== undefined ? `>= ${minValue}` : '',
      maxValue !== undefined ? `<= ${maxValue}` : '',
    ].filter(Boolean).join(' 且 ');

    const header = `${paramInfo.label}搜尋${rangeDesc ? ` (${rangeDesc})` : ''}（共 ${filtered.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋水質參數失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
