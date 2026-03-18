import { fetchAllAlerts } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getEarthquakeReports(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const minMagnitude = args.minMagnitude as number | undefined;
    const limit = (args.limit as number) ?? 10;

    const { alerts } = await fetchAllAlerts(env);

    let earthquakes = alerts.filter((a) => {
      const typeName = (a.alertTypeName ?? '') + (a.alertType ?? '') + (a.description ?? '');
      return typeName.includes('地震');
    });

    if (minMagnitude !== undefined && minMagnitude !== null) {
      earthquakes = earthquakes.filter((a) => {
        const mag = parseFloat(a.magnitude ?? '');
        return !isNaN(mag) && mag >= minMagnitude;
      });
    }

    if (earthquakes.length === 0) {
      const filterDesc = minMagnitude
        ? `規模 ${minMagnitude} 以上的`
        : '';
      return {
        content: [
          { type: 'text', text: `目前無${filterDesc}地震報告` },
        ],
      };
    }

    const sliced = earthquakes.slice(0, limit);

    const lines = sliced.map((a) => {
      return [
        `地震報告`,
        `  規模: ${a.magnitude || '未知'}`,
        `  深度: ${a.depth || '未知'} km`,
        `  震央: ${a.epicenter || '未知'}`,
        `  影響區域: ${a.area || '未知'}`,
        `  說明: ${a.description || '未知'}`,
        `  時間: ${a.effective || a.updateTime || '未知'}`,
      ].join('\n');
    });

    const header = `地震報告（共 ${earthquakes.length} 則，顯示 ${sliced.length} 則）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得地震報告失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
