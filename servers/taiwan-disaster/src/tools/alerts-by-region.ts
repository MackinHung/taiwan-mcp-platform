import { fetchAllAlerts } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getAlertsByRegion(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const region = args.region as string | undefined;
    if (!region || region.trim().length === 0) {
      return {
        content: [
          { type: 'text', text: '請提供縣市或地區名稱，如「臺北市」、「新北市」' },
        ],
        isError: true,
      };
    }

    const trimmedRegion = region.trim();
    const limit = (args.limit as number) ?? 50;
    const { alerts } = await fetchAllAlerts(env);

    const matched = alerts.filter((a) => {
      const areaText = (a.area ?? '') + (a.description ?? '');
      return areaText.includes(trimmedRegion);
    });

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `「${trimmedRegion}」目前無相關警報` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);

    const lines = sliced.map((a) => {
      return [
        `類型: ${a.alertTypeName || a.alertType || '未知'}`,
        `  嚴重程度: ${a.severity || '未知'}`,
        `  影響區域: ${a.area || '未知'}`,
        `  說明: ${a.description || '未知'}`,
        `  生效時間: ${a.effective || '未知'}`,
        `  到期時間: ${a.expires || '未知'}`,
      ].join('\n');
    });

    const header = `「${trimmedRegion}」相關警報（共 ${matched.length} 則，顯示 ${sliced.length} 則）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢地區警報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
