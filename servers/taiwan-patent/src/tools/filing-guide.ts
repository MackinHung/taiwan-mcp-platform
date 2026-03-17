import type { Env, ToolResult } from '../types.js';

interface FilingInfo {
  title: string;
  overview: string;
  types: string;
  fees: string;
  process: string;
  timeline: string;
  documents: string;
}

const PATENT_GUIDE: FilingInfo = {
  title: '台灣專利申請指南',
  overview: [
    '台灣專利由經濟部智慧財產局（TIPO）受理。',
    '專利分為三種類型：發明專利、新型專利、設計專利。',
    '外國人可透過巴黎公約優先權或 PCT 國際申請進入台灣。',
  ].join('\n'),
  types: [
    '1. 發明專利：保護期限 20 年（自申請日起算）',
    '   - 需經實體審查',
    '   - 適用於技術方案、方法、製程',
    '',
    '2. 新型專利：保護期限 10 年（自申請日起算）',
    '   - 僅進行形式審查（不做實體審查）',
    '   - 適用於物品之形狀、構造或組合',
    '',
    '3. 設計專利：保護期限 15 年（自申請日起算）',
    '   - 需經實體審查',
    '   - 適用於物品外觀之形狀、花紋、色彩',
  ].join('\n'),
  fees: [
    '申請費用（新台幣）：',
    '- 發明專利申請：$3,500',
    '- 發明實體審查：$7,000',
    '- 新型專利申請：$3,000',
    '- 設計專利申請：$3,000',
    '- 年費：第 1-3 年 $2,500/年，逐年遞增',
    '',
    '注意：費用可能調整，請以 TIPO 官方公告為準。',
  ].join('\n'),
  process: [
    '申請流程：',
    '1. 準備申請文件（說明書、申請專利範圍、摘要、圖式）',
    '2. 向 TIPO 提出申請',
    '3. 形式審查（所有類型）',
    '4. 公開（發明專利申請後 18 個月）',
    '5. 實體審查（發明/設計專利需另外申請）',
    '6. 審查意見通知（OA）與答辯',
    '7. 核准公告',
    '8. 繳納證書費與第一年年費',
  ].join('\n'),
  timeline: [
    '預估時程：',
    '- 發明專利：申請至核准約 2-4 年',
    '- 新型專利：申請至核准約 2-6 個月',
    '- 設計專利：申請至核准約 1-2 年',
    '- 加速審查（AEP）可縮短至 6-9 個月（發明）',
  ].join('\n'),
  documents: [
    '必備文件：',
    '- 申請書',
    '- 說明書（中文或英文，英文需補中文譯本）',
    '- 申請專利範圍',
    '- 摘要',
    '- 圖式（設計專利必要）',
    '- 委任書（委託代理人時）',
    '- 優先權證明文件（主張優先權時）',
  ].join('\n'),
};

const TRADEMARK_GUIDE: FilingInfo = {
  title: '台灣商標申請指南',
  overview: [
    '台灣商標由經濟部智慧財產局（TIPO）受理。',
    '商標保護期限為 10 年（自註冊日起算），可無限次延展。',
    '採用尼斯國際分類（Nice Classification），共 45 類。',
  ].join('\n'),
  types: [
    '商標類型：',
    '1. 一般商標：文字、圖形、記號、顏色、立體形狀、動態、全像圖',
    '2. 聲音商標',
    '3. 團體商標',
    '4. 團體標章',
    '5. 證明標章',
  ].join('\n'),
  fees: [
    '申請費用（新台幣）：',
    '- 商標註冊申請（每類）：$3,000',
    '- 指定使用之商品/服務超過 20 項，每項加收 $200',
    '- 延展註冊（每類）：$4,000',
    '- 異議/評定申請：$4,000',
    '',
    '注意：費用可能調整，請以 TIPO 官方公告為準。',
  ].join('\n'),
  process: [
    '申請流程：',
    '1. 商標檢索（建議先查是否有近似商標）',
    '2. 準備申請文件',
    '3. 向 TIPO 提出申請',
    '4. 形式審查',
    '5. 實體審查（審查是否具識別性、是否近似等）',
    '6. 核准審定公告（公告期 30 日）',
    '7. 繳納註冊費',
    '8. 核發商標註冊證',
  ].join('\n'),
  timeline: [
    '預估時程：',
    '- 一般案件：申請至核准約 6-8 個月',
    '- 有駁回或補正：可能延長至 12-18 個月',
    '- 加速審查方案可縮短時程',
  ].join('\n'),
  documents: [
    '必備文件：',
    '- 商標註冊申請書',
    '- 商標圖樣（清晰、5x5 公分以內）',
    '- 指定使用之商品/服務名稱及類別',
    '- 申請人資料',
    '- 委任書（委託代理人時）',
    '- 優先權證明文件（主張優先權時）',
  ].join('\n'),
};

function formatGuide(guide: FilingInfo): string {
  return [
    `=== ${guide.title} ===`,
    '',
    guide.overview,
    '',
    guide.types,
    '',
    guide.fees,
    '',
    guide.process,
    '',
    guide.timeline,
    '',
    guide.documents,
  ].join('\n');
}

export async function getFilingGuide(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const type = (args.type as string | undefined) ?? 'patent';

    if (type !== 'patent' && type !== 'trademark') {
      return {
        content: [
          {
            type: 'text',
            text: '無效的類型，請指定 "patent"（專利）或 "trademark"（商標）',
          },
        ],
        isError: true,
      };
    }

    const guide = type === 'trademark' ? TRADEMARK_GUIDE : PATENT_GUIDE;
    return { content: [{ type: 'text', text: formatGuide(guide) }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得申請指南失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
