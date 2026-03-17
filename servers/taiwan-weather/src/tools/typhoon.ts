import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

interface TyphoonRecords {
  tropicalCyclones?: {
    tropicalCyclone?: Array<{
      typhoonName: string;
      cwaTyphoonName: string;
      analysisData?: {
        fixedDateTime: string;
        coordinate: string;
        maxWindSpeed?: { value: number; unit: string };
        movingSpeed?: { value: number; unit: string };
        pressure?: { value: number; unit: string };
      };
    }>;
  };
}

export async function getTyphoonActive(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const records = await fetchDataset<TyphoonRecords>(
      env.CWA_API_KEY,
      DATASETS.TYPHOON
    );

    const cyclones = records.tropicalCyclones?.tropicalCyclone ?? [];
    if (cyclones.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無活躍颱風' }],
      };
    }

    const lines = cyclones.map((tc) => {
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
        if (ad.movingSpeed) {
          parts.push(`  移動速度: ${ad.movingSpeed.value} ${ad.movingSpeed.unit}`);
        }
        if (ad.pressure) {
          parts.push(`  氣壓: ${ad.pressure.value} ${ad.pressure.unit}`);
        }
      }
      return parts.join('\n');
    });

    return { content: [{ type: 'text', text: lines.join('\n\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得颱風資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
