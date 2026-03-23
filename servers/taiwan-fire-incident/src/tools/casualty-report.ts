import { fetchFireData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getCasualtyReport(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;

    const { records, total } = await fetchFireData({
      county: county?.trim() || undefined,
      limit: 1000,
    });

    if (records.length === 0) {
      const scope = county ? `${county}` : '全台';
      return {
        content: [{ type: 'text', text: `${scope}目前無火災傷亡資料` }],
      };
    }

    const totalDeaths = records.reduce((sum, r) => sum + r.deathCount, 0);
    const totalInjuries = records.reduce((sum, r) => sum + r.injuryCount, 0);

    const withCasualties = records.filter(
      (r) => r.deathCount > 0 || r.injuryCount > 0
    );

    const casualtyLines = withCasualties.map((r) =>
      [
        `日期: ${r.occurDate} ${r.occurTime}`,
        `  地點: ${r.county} ${r.district}`,
        `  類型: ${r.fireType}`,
        `  起火原因: ${r.cause}`,
        `  死亡: ${r.deathCount} 人 / 受傷: ${r.injuryCount} 人`,
      ].join('\n')
    );

    const scope = county ? `${county}` : '全台';
    const header = [
      `=== ${scope}火災傷亡報告 ===`,
      `資料筆數: ${total}`,
      `總死亡人數: ${totalDeaths}`,
      `總受傷人數: ${totalInjuries}`,
      `有傷亡案件數: ${withCasualties.length}`,
    ].join('\n');

    if (withCasualties.length === 0) {
      return {
        content: [{ type: 'text', text: `${header}\n\n目前無傷亡案件` }],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: `${header}\n\n--- 傷亡案件明細 ---\n\n${casualtyLines.join('\n\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得傷亡報告失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
