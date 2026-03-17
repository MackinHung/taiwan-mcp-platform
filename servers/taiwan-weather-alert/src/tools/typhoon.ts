import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult, TyphoonRecords } from '../types.js';

function formatTyphoon(tc: NonNullable<NonNullable<TyphoonRecords['tropicalCyclones']>['tropicalCyclone']>[number]): string {
  const parts = [
    `颱風名稱: ${tc.typhoonName} (${tc.cwaTyphoonName})`,
  ];

  if (tc.analysisData) {
    const ad = tc.analysisData;
    parts.push(`  時間: ${ad.fixedDateTime}`);
    parts.push(`  位置: ${ad.coordinate}`);
    if (ad.maxWindSpeed) {
      parts.push(`  最大風速: ${ad.maxWindSpeed.value} ${ad.maxWindSpeed.unit}`);
    }
    if (ad.gustSpeed) {
      parts.push(`  陣風: ${ad.gustSpeed.value} ${ad.gustSpeed.unit}`);
    }
    if (ad.pressure) {
      parts.push(`  氣壓: ${ad.pressure.value} ${ad.pressure.unit}`);
    }
    if (ad.movingSpeed) {
      parts.push(`  移動速度: ${ad.movingSpeed.value} ${ad.movingSpeed.unit}`);
    }
    if (ad.movingDirection) {
      parts.push(`  移動方向: ${ad.movingDirection}`);
    }
  }

  if (tc.forecastData && tc.forecastData.length > 0) {
    parts.push('  預測路徑:');
    for (const fc of tc.forecastData) {
      parts.push(
        `    ${fc.fixedTime} → (${fc.coordinateLat}, ${fc.coordinateLon}) 最大風速 ${fc.maxWindSpeed} m/s`
      );
    }
  }

  return parts.join('\n');
}

export async function getTyphoonAlerts(
  env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const records = await fetchDataset<TyphoonRecords>(
      env.CWA_API_KEY,
      DATASETS.TYPHOON
    );

    const cyclones = records.tropicalCyclones?.tropicalCyclone ?? [];
    if (cyclones.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無颱風警報' }],
      };
    }

    const lines = cyclones.map(formatTyphoon);

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得颱風警報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
