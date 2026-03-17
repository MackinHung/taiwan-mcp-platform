import type { Env, ToolResult } from '../types.js';

interface LawProvision {
  topic: string;
  keywords: readonly string[];
  title: string;
  provisions: readonly string[];
}

const LAW_PROVISIONS: readonly LawProvision[] = [
  {
    topic: 'working_hours',
    keywords: ['工時', '工作時間', '上班'],
    title: '工時規定（勞基法第 30、32 條）',
    provisions: [
      '每日正常工時: 8 小時',
      '每週正常工時: 40 小時',
      '每 7 日應有 2 日休息（1 例假 + 1 休息日）',
      '加班上限: 每月 46 小時',
      '經勞資會議同意: 每月最高 54 小時（每 3 個月不超過 138 小時）',
    ],
  },
  {
    topic: 'annual_leave',
    keywords: ['特休', '年假', '休假', '特別休假'],
    title: '特別休假（勞基法第 38 條）',
    provisions: [
      '6 個月以上未滿 1 年: 3 天',
      '1 年以上未滿 2 年: 7 天',
      '2 年以上未滿 3 年: 10 天',
      '3 年以上未滿 5 年: 14 天',
      '5 年以上未滿 10 年: 15 天',
      '10 年以上: 每滿 1 年加 1 天（最多 30 天）',
      '未休完之特休: 雇主應折算工資',
    ],
  },
  {
    topic: 'overtime',
    keywords: ['加班', '加班費', '延長工時'],
    title: '加班費計算（勞基法第 24 條）',
    provisions: [
      '平日加班前 2 小時: 時薪 x 1.34（加給 1/3）',
      '平日加班後 2 小時: 時薪 x 1.67（加給 2/3）',
      '休息日前 2 小時: 時薪 x 1.34（加給 1/3）',
      '休息日後 6 小時: 時薪 x 1.67（加給 2/3）',
      '國定假日出勤: 加倍發給工資',
      '時薪計算: 月薪 / 30 / 8',
    ],
  },
  {
    topic: 'severance',
    keywords: ['資遣', '資遣費', '遣散', '離職'],
    title: '資遣費（勞基法第 17 條、勞退條例第 12 條）',
    provisions: [
      '新制（2005/7/1 後適用勞退新制者）:',
      '  每滿 1 年 = 0.5 個月平均工資',
      '  未滿 1 年按比例計算',
      '  最高發給 6 個月平均工資',
      '',
      '舊制（2005/7/1 前年資）:',
      '  每滿 1 年 = 1 個月平均工資',
      '  未滿 1 年按比例計算',
      '',
      '預告期間: 3個月~1年→10天, 1~3年→20天, 3年以上→30天',
    ],
  },
  {
    topic: 'maternity',
    keywords: ['產假', '育嬰', '陪產', '產檢'],
    title: '產假與育嬰（勞基法第 50 條、性平法）',
    provisions: [
      '產假: 8 週（任職滿 6 個月全薪，未滿 6 個月半薪）',
      '陪產檢及陪產假: 7 天（薪資照給）',
      '流產假: 妊娠 3 個月以上→4 週，2~3 個月→1 週，未滿 2 個月→5 天',
      '育嬰留職停薪: 子女滿 3 歲前，最長 2 年',
      '育嬰留停津貼: 投保薪資 80%（最長 6 個月）',
      '哺乳時間: 子女未滿 2 歲，每日 2 次各 30 分鐘',
    ],
  },
] as const;

function findProvisions(topic: string): readonly LawProvision[] {
  if (topic === 'overview' || topic === '') {
    return LAW_PROVISIONS;
  }

  const matched = LAW_PROVISIONS.filter(
    (p) =>
      p.topic === topic ||
      p.keywords.some((kw) => topic.includes(kw))
  );

  return matched.length > 0 ? matched : LAW_PROVISIONS;
}

function formatProvision(provision: LawProvision): string {
  const lines: string[] = [
    `【${provision.title}】`,
    '',
  ];
  for (const item of provision.provisions) {
    lines.push(item.startsWith('  ') ? item : `  ${item}`);
  }
  return lines.join('\n');
}

export async function getLaborLawInfo(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const topic = (args.topic as string | undefined) ?? 'overview';
    const provisions = findProvisions(topic);
    const isOverview = provisions.length === LAW_PROVISIONS.length;

    const header = isOverview
      ? '=== 勞動法規重要規定摘要 ==='
      : `=== 勞動法規：${topic} 相關規定 ===`;

    const lines: string[] = [header, ''];

    for (const provision of provisions) {
      lines.push(formatProvision(provision));
      lines.push('');
    }

    lines.push('資料來源: 勞動基準法、勞工退休金條例、性別平等工作法');

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢勞動法規失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
