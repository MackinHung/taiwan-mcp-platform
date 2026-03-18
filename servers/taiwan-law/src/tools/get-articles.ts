import { getLawArticles } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getArticlesTool(
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

    const articles = await getLawArticles(pcode.trim());

    if (!articles || articles.length === 0) {
      return {
        content: [
          { type: 'text', text: `查無法規代碼「${pcode}」的條文資料` },
        ],
      };
    }

    const lines = articles.map((article) => {
      return `${article.ArticleNo}\n${article.ArticleContent}`;
    });

    const header = `法規條文（共 ${articles.length} 條）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得法規條文失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
