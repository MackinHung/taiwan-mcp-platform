import { fetchAllAlerts } from '../client.js';
import type { Env, ToolResult } from '../types.js';
import { ALERT_TYPE_MAPPING, ALERT_TYPE_NAMES } from '../types.js';

const VALID_TYPES = Object.keys(ALERT_TYPE_MAPPING);

export async function getAlertsByType(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const alertType = args.alertType as string | undefined;
    if (!alertType || alertType.trim().length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `請提供警報類型，可選: ${VALID_TYPES.join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    const trimmedType = alertType.trim();
    const keywords = ALERT_TYPE_MAPPING[trimmedType];

    if (!keywords) {
      return {
        content: [
          {
            type: 'text',
            text: `無效的警報類型「${trimmedType}」，可選: ${VALID_TYPES.join(', ')}`,
          },
        ],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 50;
    const { alerts } = await fetchAllAlerts(env);

    const matched = alerts.filter((a) => {
      const typeName = (a.alertTypeName ?? '') + (a.alertType ?? '') + (a.description ?? '');
      return keywords.some((kw) => typeName.includes(kw));
    });

    if (matched.length === 0) {
      const displayName = ALERT_TYPE_NAMES[trimmedType] ?? trimmedType;
      return {
        content: [
          { type: 'text', text: `目前無「${displayName}」相關警報` },
        ],
      };
    }

    const sliced = matched.slice(0, limit);
    const displayName = ALERT_TYPE_NAMES[trimmedType] ?? trimmedType;

    const lines = sliced.map((a) => {
      return [
        `類型: ${a.alertTypeName || a.alertType || '未知'}`,
        `  嚴重程度: ${a.severity || '未知'}`,
        `  影響區域: ${a.area || '未知'}`,
        `  說明: ${a.description || '未知'}`,
        `  生效時間: ${a.effective || '未知'}`,
      ].join('\n');
    });

    const header = `「${displayName}」警報（共 ${matched.length} 則，顯示 ${sliced.length} 則）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢警報失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
