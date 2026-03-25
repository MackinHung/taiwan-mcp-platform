import { fetchSensorThings } from '../client.js';
import type { Env, ToolResult, SensorThingsDatastream } from '../types.js';

export async function getFloodWarnings(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;

    // Query flood sensor datastreams with recent observations
    const path = "Datastreams?$filter=properties/type eq 'flood_sensor'&$expand=Thing,Observations($top=1;$orderby=phenomenonTime desc)&$top=50";

    const datastreams = await fetchSensorThings<SensorThingsDatastream>(path);

    if (datastreams.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無淹水警報資料' }],
      };
    }

    let filtered = datastreams;
    if (county) {
      filtered = filtered.filter((ds) => {
        const thingName = ds.Thing?.name ?? '';
        const thingDesc = ds.Thing?.description ?? '';
        return thingName.includes(county) || thingDesc.includes(county);
      });
    }

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: county ? `${county} 目前無淹水警報` : '目前無淹水警報資料' }],
      };
    }

    // Filter to only stations with elevated water levels (> 0.1m)
    const warnings = filtered.filter((ds) => {
      const obs = ds.Observations?.[0];
      if (!obs) return false;
      const level = typeof obs.result === 'number' ? obs.result : parseFloat(String(obs.result));
      return !isNaN(level) && level > 0.1;
    });

    if (warnings.length === 0) {
      return {
        content: [{ type: 'text', text: county ? `${county} 目前無淹水警報` : '目前各地無淹水警報' }],
      };
    }

    const lines = warnings.slice(0, 20).map((ds) => {
      const obs = ds.Observations[0];
      const level = typeof obs.result === 'number' ? obs.result : parseFloat(String(obs.result));
      const severity = level >= 0.5 ? '嚴重' : level >= 0.3 ? '警戒' : '注意';
      return [
        `${ds.Thing?.name ?? ds.name}`,
        `  淹水深度: ${level.toFixed(2)} m`,
        `  警報等級: ${severity}`,
        `  觀測時間: ${obs.phenomenonTime}`,
      ].join('\n');
    });

    const header = `淹水警報（共 ${warnings.length} 處，顯示前 ${Math.min(warnings.length, 20)} 處）`;
    return { content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得淹水警報資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
