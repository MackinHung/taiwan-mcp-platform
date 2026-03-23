import { fetchGazetteDetail } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getGazetteDetailTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const metaId = args.meta_id as string | undefined;
    if (!metaId || metaId.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供公報 MetaId' }],
        isError: true,
      };
    }

    const detail = await fetchGazetteDetail(metaId.trim());

    const lines = [
      `=== 公報詳細內容 ===`,
      `MetaId: ${detail.MetaId}`,
      `標題: ${detail.Title}`,
      `發布機關: ${detail.PubGovName}`,
      `發布日期: ${detail.Date_Published}`,
      `字號: ${detail.GazetteId}`,
      `類型: ${detail.Doc_Style_LName}`,
      `篇別: ${detail.Chapter}`,
      ``,
      `--- 內容 ---`,
      detail.Content || '（無內容）',
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得公報詳細資料失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
