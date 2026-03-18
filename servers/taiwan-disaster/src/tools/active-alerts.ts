import { fetchAllAlerts } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getActiveAlerts(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 50;

    const { alerts, total } = await fetchAllAlerts(env);

    if (!alerts || alerts.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無生效中的警報' }],
      };
    }

    const sliced = alerts.slice(0, limit);

    const lines = sliced.map((a) => {
      return [
        `類型: ${a.alertTypeName || a.alertType || '未知'}`,
        `  嚴重程度: ${a.severity || '未知'}`,
        `  影響區域: ${a.area || '未知'}`,
        `  說明: ${a.description || '未知'}`,
        `  生效時間: ${a.effective || '未知'}`,
        `  到期時間: ${a.expires || '未知'}`,
        `  發布單位: ${a.sender || '未知'}`,
      ].join('\n');
    });

    const header = `生效中警報（共 ${total} 則，顯示 ${sliced.length} 則）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得警報資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
