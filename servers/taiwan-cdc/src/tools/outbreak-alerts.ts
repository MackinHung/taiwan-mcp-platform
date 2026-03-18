import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getOutbreakAlerts(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = (args.limit as number) ?? 20;

    const { records, total } = await fetchDataset(DATASETS.OUTBREAK_ALERTS, {
      limit,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          { type: 'text', text: '目前無疫情通報/警示資料' },
        ],
      };
    }

    const lines = records.map((r) =>
      [
        `日期: ${r['通報日期'] ?? r['report_date'] ?? '未知'}`,
        `  疾病: ${r['疾病名稱'] ?? r['disease_name'] ?? '未知'}`,
        `  地區: ${r['通報地區'] ?? r['region'] ?? '未知'}`,
        `  病例數: ${r['病例數'] ?? r['case_count'] ?? '未知'}`,
        `  警示等級: ${r['警示等級'] ?? r['alert_level'] ?? '未知'}`,
        `  說明: ${r['說明'] ?? r['description'] ?? '未知'}`,
      ].join('\n')
    );

    const header = `疫情通報/警示（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得疫情通報失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
