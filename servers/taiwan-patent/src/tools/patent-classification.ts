import type { Env, ToolResult } from '../types.js';

interface IpcSection {
  code: string;
  name: string;
  subclasses: Record<string, string>;
}

const IPC_SECTIONS: IpcSection[] = [
  {
    code: 'A',
    name: '人類生活需要',
    subclasses: {
      'A01': '農業；林業；畜牧業；狩獵；誘捕；捕魚',
      'A01B': '整地；一般農業或林業之零組件',
      'A21': '烘烤；食用麵團',
      'A23': '其他類不包含之食品或食料',
      'A41': '服飾',
      'A47': '家具；家庭用物品或設備',
      'A61': '醫學或獸醫學；衛生學',
      'A63': '運動；遊戲；娛樂',
    },
  },
  {
    code: 'B',
    name: '作業/運輸',
    subclasses: {
      'B01': '物理或化學之方法或裝置一般',
      'B21': '金屬之機械加工；金屬之衝壓',
      'B23': '工具機；非他處分類之金屬加工',
      'B25': '手工具；便攜式動力工具',
      'B29': '塑膠之加工；一般處於塑性狀態物質之加工',
      'B60': '一般車輛',
      'B65': '輸送；包裝；貯存；搬運薄材或絲狀材料',
    },
  },
  {
    code: 'C',
    name: '化學/冶金',
    subclasses: {
      'C01': '無機化學',
      'C07': '有機化學',
      'C08': '有機高分子化合物',
      'C09': '染料；塗料；拋光劑；天然樹脂',
      'C12': '生物化學；啤酒；酒精；葡萄酒；醋',
      'C22': '冶金；黑色或有色合金',
      'C23': '金屬材料之鍍覆；化學表面處理',
    },
  },
  {
    code: 'D',
    name: '紡織/造紙',
    subclasses: {
      'D01': '天然或人造線或纖維；紡紗',
      'D03': '織造',
      'D04': '編織；花邊製造；針織',
      'D06': '織物之處理；洗滌',
      'D21': '造紙；紙漿之生產',
    },
  },
  {
    code: 'E',
    name: '固定建築物',
    subclasses: {
      'E01': '道路、鐵路或橋梁之建設',
      'E02': '水利工程；基礎；疏浚',
      'E03': '給水；排水',
      'E04': '建築物',
      'E05': '鎖；鑰匙；窗或門之配件',
      'E06': '門、窗、百葉窗或捲簾一般',
      'E21': '鑿井；採礦',
    },
  },
  {
    code: 'F',
    name: '機械工程/照明/加熱/武器',
    subclasses: {
      'F01': '一般機器或發動機',
      'F02': '燃燒發動機',
      'F03': '液力機械或動力設備',
      'F04': '液體用正位移機械；液體泵或彈性流體泵',
      'F15': '流體壓力致動器；液壓學或氣體動力學',
      'F16': '工程元件或部件一般',
      'F21': '照明',
      'F24': '加熱；爐灶；通風',
      'F25': '冷凍或冷卻',
      'F28': '熱交換一般',
    },
  },
  {
    code: 'G',
    name: '物理',
    subclasses: {
      'G01': '測量；測試',
      'G02': '光學',
      'G03': '攝影術；電影術',
      'G05': '控制；調節',
      'G06': '計算；推算；計數',
      'G06F': '電氣數位資料處理',
      'G06Q': '專門適用於行政、商業、金融、管理、監督或預測之資料處理系統',
      'G08': '信號裝置',
      'G09': '教育；密碼術；顯示；廣告；印鑑',
      'G10': '樂器；聲學',
      'G11': '資訊儲存',
      'G16': '資訊與通信技術',
    },
  },
  {
    code: 'H',
    name: '電學',
    subclasses: {
      'H01': '基本電氣元件',
      'H01L': '半導體裝置；其他類目中不包括之電固態裝置',
      'H02': '電力之發電、變電或配電',
      'H03': '基本電子電路',
      'H04': '電通信技術',
      'H04L': '數位資訊之傳輸',
      'H04N': '圖像通信',
      'H04W': '無線通信網路',
      'H05': '其他類目不包括之電技術',
      'H10': '半導體裝置；其他類目中不包括之電固態裝置',
    },
  },
];

export async function getPatentClassification(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const code = args.code as string | undefined;
    if (!code || code.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供 IPC 分類號（code），例如 A01B、H04L' }],
        isError: true,
      };
    }

    const normalizedCode = code.trim().toUpperCase();

    // Try exact match on subclass first
    for (const section of IPC_SECTIONS) {
      const subDesc = section.subclasses[normalizedCode];
      if (subDesc) {
        const text = [
          `IPC 分類號: ${normalizedCode}`,
          `大分類: ${section.code} - ${section.name}`,
          `說明: ${subDesc}`,
        ].join('\n');
        return { content: [{ type: 'text', text }] };
      }
    }

    // Try prefix match (e.g., "A01B3" matches "A01B")
    for (const section of IPC_SECTIONS) {
      for (const [subCode, subDesc] of Object.entries(section.subclasses)) {
        if (normalizedCode.startsWith(subCode)) {
          const text = [
            `IPC 分類號: ${normalizedCode}`,
            `最近匹配: ${subCode}`,
            `大分類: ${section.code} - ${section.name}`,
            `說明: ${subDesc}`,
          ].join('\n');
          return { content: [{ type: 'text', text }] };
        }
      }
    }

    // Try section-level match (e.g., "A" matches section A)
    const sectionChar = normalizedCode.charAt(0);
    const matchedSection = IPC_SECTIONS.find((s) => s.code === sectionChar);
    if (matchedSection) {
      const subList = Object.entries(matchedSection.subclasses)
        .map(([k, v]) => `  ${k}: ${v}`)
        .join('\n');
      const text = [
        `IPC 大分類: ${matchedSection.code} - ${matchedSection.name}`,
        '',
        '常見子分類:',
        subList,
      ].join('\n');
      return { content: [{ type: 'text', text }] };
    }

    return {
      content: [{ type: 'text', text: `找不到 IPC 分類號「${code}」的相關資料` }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢 IPC 分類失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
