import { fetchAccidents } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getDangerousIntersections(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const county = args.county as string | undefined;
    const limit = args.limit as number | undefined;

    if (county !== undefined && (typeof county !== 'string' || county.trim() === '')) {
      return {
        content: [{ type: 'text', text: '縣市名稱格式不正確' }],
        isError: true,
      };
    }

    if (limit !== undefined && (typeof limit !== 'number' || limit < 1 || limit > 50)) {
      return {
        content: [{ type: 'text', text: '筆數須為 1-50 的整數' }],
        isError: true,
      };
    }

    const fetchParams: { county?: string; limit: number } = { limit: 100 };
    if (county) {
      fetchParams.county = county.trim();
    }

    const { records } = await fetchAccidents(fetchParams);

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: '查無事故資料，無法分析危險路口' }],
      };
    }

    // Group by address and rank by frequency
    const byAddress: Record<string, { count: number; deaths: number; injuries: number; county: string; district: string }> = {};
    for (const r of records) {
      const key = `${r.county}${r.district}${r.address}`;
      if (!byAddress[key]) {
        byAddress[key] = { count: 0, deaths: 0, injuries: 0, county: r.county, district: r.district };
      }
      byAddress[key].count += 1;
      byAddress[key].deaths += r.deathCount;
      byAddress[key].injuries += r.injuryCount;
    }

    const effectiveLimit = limit ?? 10;
    const ranked = Object.entries(byAddress)
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, effectiveLimit);

    if (ranked.length === 0) {
      return {
        content: [{ type: 'text', text: '無法分析危險路口（資料不足）' }],
      };
    }

    const locationStr = county ? `${county}` : '全國';
    const lines = [`${locationStr}事故熱點路口 (Top ${ranked.length})`, ''];

    for (let i = 0; i < ranked.length; i++) {
      const [address, stats] = ranked[i];
      lines.push(
        `${i + 1}. ${address} — ${stats.count} 件事故（死亡 ${stats.deaths}、受傷 ${stats.injuries}）`
      );
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得危險路口資料失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
