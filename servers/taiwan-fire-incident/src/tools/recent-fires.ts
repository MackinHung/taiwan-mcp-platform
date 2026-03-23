import { fetchFireData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getRecentFires(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const { records, total } = await fetchFireData({
      county: county?.trim() || undefined,
      limit: Math.min(limit, 100),
    });

    if (records.length === 0) {
      const scope = county ? `${county}` : '全台';
      return {
        content: [{ type: 'text', text: `${scope}目前無火災案件資料` }],
      };
    }

    const lines = records.slice(0, limit).map((r) =>
      [
        `日期: ${r.occurDate} ${r.occurTime}`,
        `  地點: ${r.county} ${r.district}`,
        `  類型: ${r.fireType}`,
        `  起火原因: ${r.cause}`,
        `  傷亡: 死亡 ${r.deathCount} 人 / 受傷 ${r.injuryCount} 人`,
        `  燒損面積: ${r.burnArea} 平方公尺`,
        `  財損: ${r.propertyLoss.toLocaleString()} 元`,
      ].join('\n')
    );

    const scope = county ? `${county}` : '全台';
    const header = `${scope}近期火災案件（共 ${total} 筆，顯示 ${Math.min(limit, records.length)} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得近期火災資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
