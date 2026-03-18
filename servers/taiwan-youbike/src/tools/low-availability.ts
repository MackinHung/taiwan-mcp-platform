import { fetchStations, VALID_CITIES } from '../client.js';
import type { CityCode, Env, ToolResult } from '../types.js';

const DEFAULT_THRESHOLD = 3;
const MAX_THRESHOLD = 100;

export async function getLowAvailabilityAlerts(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const city = args.city as CityCode | undefined;
    const threshold = (args.threshold as number | undefined) ?? DEFAULT_THRESHOLD;

    if (!city || !VALID_CITIES.includes(city)) {
      return {
        content: [{ type: 'text', text: `請提供有效的城市代碼: ${VALID_CITIES.join(', ')}` }],
        isError: true,
      };
    }

    if (typeof threshold !== 'number' || threshold < 0 || threshold > MAX_THRESHOLD) {
      return {
        content: [{ type: 'text', text: `門檻值須在 0 ~ ${MAX_THRESHOLD} 之間` }],
        isError: true,
      };
    }

    const stations = await fetchStations(city);
    const activeStations = stations.filter((s) => s.act === 1);
    const lowStations = activeStations.filter((s) => s.sbi < threshold);

    if (lowStations.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `${city} 目前沒有可借車輛低於 ${threshold} 的營運中站點`,
        }],
      };
    }

    // Sort by available bikes ascending
    const sorted = [...lowStations].sort((a, b) => a.sbi - b.sbi);

    const lines = sorted.map((s) => {
      const urgency = s.sbi === 0 ? '🚨 無車' : `⚠️ ${s.sbi} 輛`;
      return `  ${s.sna} (${s.sarea}) | ${urgency} | 空位: ${s.bemp} | 總: ${s.tot}`;
    });

    const header = [
      `${city} 低車輛警示（門檻: ${threshold} 輛）`,
      `共 ${lowStations.length} / ${activeStations.length} 個營運中站點車輛不足`,
    ].join('\n');

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `錯誤: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
