import { getLawById } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getLawTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const pcode = args.pcode as string | undefined;
    if (!pcode || pcode.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供法規代碼（PCode）' }],
        isError: true,
      };
    }

    const law = await getLawById(pcode.trim());

    if (!law || !law.LawName) {
      return {
        content: [
          { type: 'text', text: `查無法規代碼「${pcode}」的法規資料` },
        ],
      };
    }

    const lines = [
      `法規名稱: ${law.LawName}`,
      `法規代碼: ${law.PCode}`,
      `法規位階: ${law.LawLevel ?? '未知'}`,
      `最後修正日期: ${law.LawModifiedDate ?? '未知'}`,
      `生效日期: ${law.LawEffectiveDate ?? '未知'}`,
    ];

    if (law.LawArticles && law.LawArticles.length > 0) {
      lines.push(`\n條文數: ${law.LawArticles.length}`);
      const previewArticles = law.LawArticles.slice(0, 5);
      for (const article of previewArticles) {
        lines.push(`\n${article.ArticleNo}`);
        lines.push(article.ArticleContent);
      }
      if (law.LawArticles.length > 5) {
        lines.push(`\n... 尚有 ${law.LawArticles.length - 5} 條`);
      }
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得法規失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
