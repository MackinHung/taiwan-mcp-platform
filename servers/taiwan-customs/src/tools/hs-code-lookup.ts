import type { Env, ToolResult } from '../types.js';

interface HsChapter {
  range: string;
  description: string;
  commonItems: string;
}

const HS_CHAPTERS: HsChapter[] = [
  { range: '01-05', description: '動物產品', commonItems: '活動物、肉類、魚類、乳製品、蛋類' },
  { range: '06-14', description: '植物產品', commonItems: '花卉、蔬菜、水果、穀物、咖啡、茶葉' },
  { range: '15', description: '動植物油脂', commonItems: '動物油脂、植物油、加工油脂' },
  { range: '16-24', description: '食品、飲料、菸酒', commonItems: '肉類製品、糖果、可可、飲料、菸草' },
  { range: '25-27', description: '礦物產品', commonItems: '鹽、硫磺、石材、礦砂、礦物燃料、石油' },
  { range: '28-38', description: '化學產品', commonItems: '無機化學品、有機化學品、醫藥品、肥料、塑膠原料' },
  { range: '39-40', description: '塑膠及橡膠製品', commonItems: '塑膠板、管、膜、橡膠輪胎、橡膠管' },
  { range: '41-43', description: '皮革及毛皮', commonItems: '生皮、皮革、皮包、手套、毛皮' },
  { range: '44-49', description: '木材及紙製品', commonItems: '原木、木板、軟木、編結材料、紙漿、紙張、書籍' },
  { range: '50-63', description: '紡織品', commonItems: '絲、棉、人造纖維、織物、成衣、紡織製品' },
  { range: '64-67', description: '鞋帽及配件', commonItems: '鞋類、帽類、雨傘、人造花' },
  { range: '68-71', description: '石材、玻璃及珠寶', commonItems: '石材、陶瓷、玻璃、珍珠、寶石、貴金屬' },
  { range: '72-83', description: '基本金屬及製品', commonItems: '鋼鐵、銅、鋁、鋅、錫、金屬工具、刀叉' },
  { range: '84-85', description: '機械及電機設備', commonItems: '機械、鍋爐、電機、電子零件、半導體、電腦' },
  { range: '86-89', description: '運輸設備', commonItems: '鐵路車輛、汽車、航空器、船舶' },
  { range: '90-92', description: '光學及精密儀器', commonItems: '光學儀器、醫療器材、鐘錶、樂器' },
  { range: '93', description: '武器及彈藥', commonItems: '軍用武器、獵槍、彈藥' },
  { range: '94-96', description: '雜項製品', commonItems: '家具、燈具、玩具、運動器材、文具' },
  { range: '97', description: '藝術品及收藏品', commonItems: '繪畫、雕塑、古董、郵票' },
];

export async function lookupHsCode(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const code = args.code as string;
    if (!code) {
      return {
        content: [{ type: 'text', text: '請提供 HS 代碼（code 參數），例如 "8471" 代表電腦類' }],
        isError: true,
      };
    }

    const chapterNum = extractChapterNumber(code);
    const matched = findMatchingChapters(chapterNum, code);

    if (matched.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到 HS 代碼「${code}」對應的分類資訊` }],
      };
    }

    const lines = formatChapters(matched, code);
    const header = `HS 國際商品分類查詢 — 代碼: ${code}`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢 HS 代碼失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function extractChapterNumber(code: string): number {
  const prefix = code.substring(0, 2);
  return parseInt(prefix, 10);
}

function findMatchingChapters(chapterNum: number, code: string): HsChapter[] {
  if (isNaN(chapterNum)) {
    // Try matching description
    return HS_CHAPTERS.filter((ch) =>
      ch.description.includes(code) || ch.commonItems.includes(code)
    );
  }

  return HS_CHAPTERS.filter((ch) => {
    const parts = ch.range.split('-');
    const start = parseInt(parts[0], 10);
    const end = parseInt(parts[parts.length - 1], 10);
    return chapterNum >= start && chapterNum <= end;
  });
}

function formatChapters(chapters: HsChapter[], code: string): string[] {
  return chapters.map((ch) => {
    return [
      `HS 章節: 第 ${ch.range} 章`,
      `分類: ${ch.description}`,
      `常見品項: ${ch.commonItems}`,
      `查詢代碼: ${code}`,
    ].join('\n');
  });
}
