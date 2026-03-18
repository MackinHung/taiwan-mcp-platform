import { fetchDataset, DATASETS } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function searchDiseaseInfo(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    if (!keyword || keyword.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字' }],
        isError: true,
      };
    }

    const limit = (args.limit as number) ?? 20;
    const trimmed = keyword.trim();

    const { records, total } = await fetchDataset(DATASETS.DISEASE_INFO, {
      limit,
      q: trimmed,
    });

    if (!records || records.length === 0) {
      return {
        content: [
          { type: 'text', text: `搜尋「${trimmed}」無符合的傳染病資訊` },
        ],
      };
    }

    const lines = records.map((r) => {
      const parts = [];
      // Flexible field names — CKAN field IDs may vary
      const name = r['疾病名稱'] ?? r['disease_name'] ?? r['名稱'] ?? '未知';
      parts.push(`疾病: ${name}`);

      const desc = r['疾病介紹'] ?? r['description'] ?? r['說明'] ?? '';
      if (desc) parts.push(`  介紹: ${desc}`);

      const prevention = r['預防方法'] ?? r['prevention'] ?? '';
      if (prevention) parts.push(`  預防: ${prevention}`);

      const symptoms = r['症狀'] ?? r['symptoms'] ?? '';
      if (symptoms) parts.push(`  症狀: ${symptoms}`);

      const transmission = r['傳染途徑'] ?? r['transmission'] ?? '';
      if (transmission) parts.push(`  傳染途徑: ${transmission}`);

      return parts.join('\n');
    });

    const header = `傳染病資訊搜尋「${trimmed}」（共 ${total} 筆，顯示 ${records.length} 筆）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `搜尋傳染病資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
