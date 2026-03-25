import type { Env, ToolResult, LandslideAlert } from '../types.js';
import { fetchLandslideAlerts } from '../client.js';

/**
 * Get current landslide alerts from ARDSWC.
 * Supports filtering by county and alert level.
 */
export async function getLandslideAlerts(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const alertLevel = args.alert_level as string | undefined;

    const alerts = await fetchLandslideAlerts();

    if (!Array.isArray(alerts) || alerts.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無大規模崩塌警戒' }],
      };
    }

    const filtered = filterAlerts(alerts, county, alertLevel);

    if (filtered.length === 0) {
      const filterDesc = buildFilterDescription(county, alertLevel);
      return {
        content: [{
          type: 'text',
          text: `目前無符合條件的大規模崩塌警戒${filterDesc}`,
        }],
      };
    }

    const lines = [
      `⚠️ 大規模崩塌警戒 (共 ${filtered.length} 筆)`,
      '',
      ...filtered.map((alert, i) => [
        `${i + 1}. ${alert.County}${alert.Town}${alert.Village ?? ''}`,
        `   警戒等級: ${alert.AlertType}`,
        `   崩塌編號: ${alert.LandslideID}`,
        `   更新時間: ${alert.LastUpdateDate}`,
      ].join('\n')),
      '',
      '※ 資料來源：農業部水土保持署',
      '※ 紅色警戒區域應進行疏散避難',
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得大規模崩塌警戒失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

function filterAlerts(
  alerts: LandslideAlert[],
  county?: string,
  alertLevel?: string
): LandslideAlert[] {
  let result = [...alerts];

  if (county) {
    result = result.filter((a) =>
      a.County?.includes(county) || county.includes(a.County ?? '')
    );
  }

  if (alertLevel && alertLevel !== 'all') {
    const levelMap: Record<string, string[]> = {
      red: ['紅色警戒', 'red', 'Red'],
      yellow: ['黃色警戒', 'yellow', 'Yellow'],
    };
    const matchValues = levelMap[alertLevel.toLowerCase()] ?? [alertLevel];
    result = result.filter((a) =>
      matchValues.some((v) =>
        a.AlertType?.includes(v) || a.AlertLevel?.toLowerCase() === alertLevel.toLowerCase()
      )
    );
  }

  return result;
}

function buildFilterDescription(county?: string, alertLevel?: string): string {
  const parts: string[] = [];
  if (county) parts.push(`縣市: ${county}`);
  if (alertLevel && alertLevel !== 'all') parts.push(`等級: ${alertLevel}`);
  return parts.length > 0 ? `（篩選條件: ${parts.join(', ')}）` : '';
}
