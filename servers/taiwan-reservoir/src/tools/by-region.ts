import { fetchReservoirData } from '../client.js';
import type { Env, ToolResult, REGION_MAPPING } from '../types.js';
import { REGION_MAPPING as regionMap } from '../types.js';

const VALID_REGIONS = Object.keys(regionMap);

export async function getReservoirByRegion(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const region = args.region as string | undefined;
    if (!region || region.trim().length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: `請提供區域名稱，可選: ${VALID_REGIONS.join('、')}`,
          },
        ],
        isError: true,
      };
    }

    const trimmedRegion = region.trim();
    const reservoirNames = regionMap[trimmedRegion];

    if (!reservoirNames) {
      return {
        content: [
          {
            type: 'text',
            text: `無效的區域「${trimmedRegion}」，可選: ${VALID_REGIONS.join('、')}`,
          },
        ],
        isError: true,
      };
    }

    const { records } = await fetchReservoirData({ limit: 200 });

    const matched = records.filter(
      (r) =>
        r.ReservoirName &&
        reservoirNames.some((name) => r.ReservoirName!.includes(name))
    );

    if (matched.length === 0) {
      return {
        content: [
          { type: 'text', text: `${trimmedRegion}部地區目前無水庫水情資料` },
        ],
      };
    }

    const lines = matched.map((r) => {
      return [
        `水庫: ${r.ReservoirName || '未知'}`,
        `  蓄水量: ${r.CurrentCapacity || '未知'} 萬立方公尺`,
        `  蓄水百分比: ${r.CurrentCapacityPercent || '未知'}%`,
        `  有效容量: ${r.EffectiveCapacity || '未知'} 萬立方公尺`,
        `  更新時間: ${r.UpdateTime || '未知'}`,
      ].join('\n');
    });

    const header = `${trimmedRegion}部地區水庫水情（共 ${matched.length} 座）`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `查詢區域水庫失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
