import { fetchRadiationData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

const ALERT_THRESHOLD = 0.2; // μSv/h

export async function getRadiationAlerts(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const { records } = await fetchRadiationData({ limit: 1000 });

    const alerts = records.filter(
      (r) => r.status !== '正常' || r.value > ALERT_THRESHOLD
    );

    if (alerts.length === 0) {
      return {
        content: [
          { type: 'text', text: '目前全台輻射監測值皆正常，無異常警戒' },
        ],
      };
    }

    const lines = alerts.map((r) =>
      [
        `監測站: ${r.stationName}`,
        `  監測值: ${r.value} μSv/h`,
        `  狀態: ${r.status}`,
        `  測量時間: ${r.measureTime}`,
        `  所在縣市: ${r.county} ${r.district}`,
        `  地址: ${r.address}`,
      ].join('\n')
    );

    const header = `輻射異常警戒（共 ${alerts.length} 站超過閾值 ${ALERT_THRESHOLD} μSv/h 或狀態非正常）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得輻射警戒資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
