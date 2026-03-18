import { fetchAllAlerts } from '../client.js';
import type { Env, ToolResult } from '../types.js';
import { ALERT_TYPE_MAPPING, ALERT_TYPE_NAMES } from '../types.js';

export async function getAlertHistory(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const alertType = args.alertType as string | undefined;
    const days = (args.days as number) ?? 7;
    const limit = (args.limit as number) ?? 50;

    const { alerts } = await fetchAllAlerts(env);

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let filtered = alerts.filter((a) => {
      const dateStr = a.effective || a.updateTime || '';
      if (!dateStr) return true; // include if no date (can't filter)
      const alertDate = new Date(dateStr);
      return !isNaN(alertDate.getTime()) && alertDate >= cutoffDate;
    });

    if (alertType && alertType.trim().length > 0) {
      const trimmedType = alertType.trim();
      const keywords = ALERT_TYPE_MAPPING[trimmedType];
      if (keywords) {
        filtered = filtered.filter((a) => {
          const typeName =
            (a.alertTypeName ?? '') + (a.alertType ?? '') + (a.description ?? '');
          return keywords.some((kw) => typeName.includes(kw));
        });
      } else {
        // Try direct text match if not a mapped type
        filtered = filtered.filter((a) => {
          const typeName =
            (a.alertTypeName ?? '') + (a.alertType ?? '') + (a.description ?? '');
          return typeName.includes(trimmedType);
        });
      }
    }

    if (filtered.length === 0) {
      const typeDesc = alertType
        ? `「${ALERT_TYPE_NAMES[alertType] ?? alertType}」`
        : '';
      return {
        content: [
          {
            type: 'text',
            text: `近 ${days} 天無${typeDesc}歷史警報記錄`,
          },
        ],
      };
    }

    const sliced = filtered.slice(0, limit);

    const lines = sliced.map((a) => {
      return [
        `類型: ${a.alertTypeName || a.alertType || '未知'}`,
        `  嚴重程度: ${a.severity || '未知'}`,
        `  影響區域: ${a.area || '未知'}`,
        `  說明: ${a.description || '未知'}`,
        `  時間: ${a.effective || a.updateTime || '未知'}`,
      ].join('\n');
    });

    const typeDesc = alertType
      ? `「${ALERT_TYPE_NAMES[alertType] ?? alertType}」`
      : '';
    const header = `近 ${days} 天${typeDesc}歷史警報（共 ${filtered.length} 則，顯示 ${sliced.length} 則）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢歷史警報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
