import type { Env, ToolResult } from '../types.js';
import { fetchAqiData } from '../client.js';

export async function getPm25Ranking(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = Math.min(Math.max((args.limit as number) ?? 10, 1), 100);

    const records = await fetchAqiData(env.MOENV_API_KEY);

    const withPm25 = records
      .filter((r) => r['pm2.5'] && r['pm2.5'] !== '' && r['pm2.5'] !== '-')
      .map((r) => ({ ...r, pm25Num: parseFloat(r['pm2.5']) }))
      .filter((r) => !isNaN(r.pm25Num))
      .sort((a, b) => b.pm25Num - a.pm25Num);

    if (withPm25.length === 0) {
      return {
        content: [{ type: 'text', text: '無可用 PM2.5 資料' }],
      };
    }

    const top = withPm25.slice(0, limit);
    const lines = top.map(
      (r, i) =>
        `${i + 1}. ${r.sitename}（${r.county}）— PM2.5: ${r['pm2.5']} μg/m³ | AQI: ${r.aqi}`
    );

    return {
      content: [
        {
          type: 'text',
          text: `PM2.5 濃度排名（前 ${top.length} 名）\n\n${lines.join('\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得 PM2.5 排名失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
