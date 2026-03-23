import { fetchFireData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchByCause(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const cause = args.cause as string | undefined;
    if (!cause || cause.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供起火原因關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = cause.trim();

    const { records } = await fetchFireData({ limit: 1000 });

    const matched = records.filter((r) =>
      r.cause.includes(trimmed)
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無起火原因含「${trimmed}」的火災案件` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const lines = sliced.map((r) =>
      [
        `日期: ${r.occurDate} ${r.occurTime}`,
        `  地點: ${r.county} ${r.district}`,
        `  類型: ${r.fireType}`,
        `  起火原因: ${r.cause}`,
        `  傷亡: 死亡 ${r.deathCount} 人 / 受傷 ${r.injuryCount} 人`,
        `  財損: ${r.propertyLoss.toLocaleString()} 元`,
      ].join('\n')
    );

    const header = `起火原因搜尋「${trimmed}」（共 ${matched.length} 筆，顯示 ${sliced.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋起火原因失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
