import type { Env, ToolResult, DrugApproval } from '../types.js';
import { fetchDataset, DATASETS } from '../client.js';

function formatDrugApproval(d: DrugApproval): string {
  return [
    `許可證字號: ${d.許可證字號 ?? '未知'}`,
    `中文品名: ${d.中文品名 ?? '未知'}`,
    `英文品名: ${d.英文品名 ?? '未知'}`,
    `適應症: ${d.適應症 ?? '未知'}`,
    `申請商: ${d.申請商名稱 ?? '未知'}`,
    `製造商: ${d.製造商名稱 ?? '未知'}`,
    `有效日期: ${d.有效日期 ?? '未知'}`,
  ].join('\n');
}

export async function searchDrugApproval(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const limit = (args.limit as number) ?? 20;

    const records = await fetchDataset<DrugApproval>(
      DATASETS.DRUG_APPROVAL,
      limit
    );

    let filtered = records;
    if (keyword) {
      filtered = filtered.filter(
        (r) =>
          (r.中文品名 ?? '').includes(keyword) ||
          (r.英文品名 ?? '').toLowerCase().includes(keyword.toLowerCase())
      );
    }

    if (filtered.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: keyword
              ? `找不到與「${keyword}」相關的藥品許可證資料`
              : '目前無藥品許可證資料',
          },
        ],
      };
    }

    const header = keyword
      ? `藥品許可證資料（關鍵字: ${keyword}）— 共 ${filtered.length} 筆`
      : `藥品許可證資料 — 共 ${filtered.length} 筆`;

    const lines = filtered.map(formatDrugApproval);
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢藥品許可證資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
