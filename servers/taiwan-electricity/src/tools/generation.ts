import type { Env, ToolResult, GenerationUnit } from '../types.js';
import { fetchGenerationData } from '../client.js';

const SOURCE_TYPES = ['燃氣', '燃煤', '核能', '再生能源', '燃油', '水力', '汽電共生', '其他'] as const;

function parseNumber(s: string): number {
  const n = parseFloat(s.replace(/,/g, ''));
  return isNaN(n) ? 0 : n;
}

function formatUnit(u: GenerationUnit): string {
  const remark = u['備註']?.trim();
  const remarkStr = remark && remark !== ' ' ? ` (${remark})` : '';
  return `  ${u['機組名稱']}: ${u['淨發電量(MW)']} MW / ${u['裝置容量(MW)']} MW ${u['淨發電量/裝置容量比(%)']}${remarkStr}`;
}

export async function getGenerationUnits(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const sourceType = args.source_type as string | undefined;
    const { dateTime, units } = await fetchGenerationData();

    let filtered = units;
    if (sourceType) {
      filtered = units.filter((u) => u['機組類型'] === sourceType);
    }

    if (filtered.length === 0) {
      const label = sourceType ?? '全部';
      return {
        content: [{ type: 'text', text: `找不到 ${label} 的發電機組資料` }],
      };
    }

    const lines = filtered.map(formatUnit);
    const header = sourceType
      ? `${sourceType} 發電機組（${filtered.length} 組）`
      : `全部發電機組（${filtered.length} 組）`;

    return {
      content: [
        {
          type: 'text',
          text: `${header}\n資料時間: ${dateTime}\n\n${lines.join('\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得發電機組資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getGenerationBySource(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const { dateTime, units } = await fetchGenerationData();

    const bySource = new Map<string, { capacity: number; generation: number; count: number }>();

    for (const u of units) {
      const type = u['機組類型'] || '其他';
      const existing = bySource.get(type) ?? { capacity: 0, generation: 0, count: 0 };
      existing.capacity += parseNumber(u['裝置容量(MW)']);
      existing.generation += parseNumber(u['淨發電量(MW)']);
      existing.count += 1;
      bySource.set(type, existing);
    }

    const totalGeneration = [...bySource.values()].reduce((sum, v) => sum + v.generation, 0);

    const sorted = [...bySource.entries()].sort((a, b) => b[1].generation - a[1].generation);

    const lines = sorted.map(([type, data]) => {
      const pct = totalGeneration > 0
        ? ((data.generation / totalGeneration) * 100).toFixed(1)
        : '0.0';
      return `${type}（${data.count} 組）: ${data.generation.toLocaleString()} MW / ${data.capacity.toLocaleString()} MW（佔比 ${pct}%）`;
    });

    return {
      content: [
        {
          type: 'text',
          text: [
            `各能源類型發電彙總`,
            `資料時間: ${dateTime}`,
            `總發電量: ${totalGeneration.toLocaleString()} MW`,
            '',
            ...lines,
          ].join('\n'),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得能源彙總資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getRenewableEnergy(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const { dateTime, units } = await fetchGenerationData();

    const renewableTypes = ['再生能源', '水力'];
    const renewable = units.filter((u) =>
      renewableTypes.includes(u['機組類型'])
    );

    if (renewable.length === 0) {
      return {
        content: [{ type: 'text', text: '找不到再生能源資料' }],
      };
    }

    const totalRenewable = renewable.reduce(
      (sum, u) => sum + parseNumber(u['淨發電量(MW)']),
      0
    );
    const totalCapacity = renewable.reduce(
      (sum, u) => sum + parseNumber(u['裝置容量(MW)']),
      0
    );

    const allTotal = units.reduce(
      (sum, u) => sum + parseNumber(u['淨發電量(MW)']),
      0
    );

    const pct = allTotal > 0 ? ((totalRenewable / allTotal) * 100).toFixed(1) : '0.0';

    const lines = renewable.map(formatUnit);

    return {
      content: [
        {
          type: 'text',
          text: [
            `再生能源即時狀態`,
            `資料時間: ${dateTime}`,
            `再生能源發電: ${totalRenewable.toLocaleString()} MW / ${totalCapacity.toLocaleString()} MW`,
            `佔總發電比例: ${pct}%`,
            '',
            ...lines,
          ].join('\n'),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得再生能源資料失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

export async function getPowerPlantStatus(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const plant = args.plant as string;
    if (!plant) {
      return {
        content: [{ type: 'text', text: '請提供電廠名稱（plant 參數），例如「大潭」「台中」「核二」' }],
        isError: true,
      };
    }

    const { dateTime, units } = await fetchGenerationData();

    const matched = units.filter((u) => u['機組名稱'].includes(plant));

    if (matched.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到包含「${plant}」的電廠或機組` }],
      };
    }

    const totalGen = matched.reduce(
      (sum, u) => sum + parseNumber(u['淨發電量(MW)']),
      0
    );
    const totalCap = matched.reduce(
      (sum, u) => sum + parseNumber(u['裝置容量(MW)']),
      0
    );

    const lines = matched.map(formatUnit);

    return {
      content: [
        {
          type: 'text',
          text: [
            `「${plant}」電廠狀態（${matched.length} 組機組）`,
            `資料時間: ${dateTime}`,
            `總發電量: ${totalGen.toLocaleString()} MW / ${totalCap.toLocaleString()} MW`,
            '',
            ...lines,
          ].join('\n'),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得電廠狀態失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
