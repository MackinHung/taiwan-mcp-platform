import type { Env, ToolResult, TradeStatRecord } from '../types.js';
import { fetchTradeStats } from '../client.js';

type TradeType = 'import' | 'export' | 'total';

interface PartnerAggregate {
  country: string;
  importValue: number;
  exportValue: number;
  totalValue: number;
}

export async function getTopTradePartners(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const year = args.year as string | undefined;
    const tradeType = (args.type as TradeType) ?? 'total';
    const limit = Math.min(Math.max((args.limit as number) ?? 10, 1), 50);

    const params: Record<string, string> = {};
    if (year) {
      params['filters'] = JSON.stringify({ 年月: year });
    }

    const records = await fetchTradeStats(params);

    if (records.length === 0) {
      return {
        content: [{ type: 'text', text: '無可用貿易統計資料' }],
      };
    }

    const aggregated = aggregateByCountry(records);
    const sorted = sortByTradeType(aggregated, tradeType);
    const top = sorted.slice(0, limit);
    const grandTotal = computeGrandTotal(sorted, tradeType);
    const lines = formatPartners(top, tradeType, grandTotal);

    const typeLabel = getTypeLabel(tradeType);
    const yearLabel = year ? `（${year}年）` : '';
    const header = `台灣主要貿易夥伴排名 — ${typeLabel}${yearLabel}`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得貿易夥伴排名失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function aggregateByCountry(records: TradeStatRecord[]): PartnerAggregate[] {
  const map = new Map<string, PartnerAggregate>();

  for (const r of records) {
    const country = r.國家 ?? '未知';
    const existing = map.get(country) ?? {
      country,
      importValue: 0,
      exportValue: 0,
      totalValue: 0,
    };

    const imp = parseFloat(r.進口值 ?? '0') || 0;
    const exp = parseFloat(r.出口值 ?? '0') || 0;

    map.set(country, {
      country,
      importValue: existing.importValue + imp,
      exportValue: existing.exportValue + exp,
      totalValue: existing.totalValue + imp + exp,
    });
  }

  return Array.from(map.values());
}

function sortByTradeType(
  aggregated: PartnerAggregate[],
  tradeType: TradeType
): PartnerAggregate[] {
  return [...aggregated].sort((a, b) => {
    const valA = getValueByType(a, tradeType);
    const valB = getValueByType(b, tradeType);
    return valB - valA;
  });
}

function getValueByType(agg: PartnerAggregate, tradeType: TradeType): number {
  switch (tradeType) {
    case 'import': return agg.importValue;
    case 'export': return agg.exportValue;
    case 'total': return agg.totalValue;
  }
}

function computeGrandTotal(sorted: PartnerAggregate[], tradeType: TradeType): number {
  return sorted.reduce((sum, p) => sum + getValueByType(p, tradeType), 0);
}

function formatPartners(
  partners: PartnerAggregate[],
  tradeType: TradeType,
  grandTotal: number
): string[] {
  return partners.map((p, idx) => {
    const rank = idx + 1;
    const value = getValueByType(p, tradeType);
    const share = grandTotal > 0 ? ((value / grandTotal) * 100).toFixed(1) : '0.0';
    const imp = p.importValue.toLocaleString();
    const exp = p.exportValue.toLocaleString();
    return `${rank}. ${p.country} — 進口: ${imp} | 出口: ${exp} | 佔比: ${share}%`;
  });
}

function getTypeLabel(tradeType: TradeType): string {
  switch (tradeType) {
    case 'import': return '進口';
    case 'export': return '出口';
    case 'total': return '進出口合計';
  }
}
