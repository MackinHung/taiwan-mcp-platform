import { fetchTransactions, DATASETS, safeParseNumber, parseRocDateToPeriod } from '../client.js';
import type { Env, ToolResult, TransactionRecord, TrendDataPoint } from '../types.js';

/**
 * get_price_trend: 分析房價趨勢（月/季）
 */
export async function getPriceTrend(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const district = args.district as string | undefined;
    const period = (args.period as string) ?? 'monthly';
    const monthsBack = Math.min(Math.max((args.months_back as number) ?? 12, 1), 36);

    const params: Record<string, string> = {
      page: '0',
      size: '1000',
    };

    const records = await fetchTransactions(DATASETS.NTPC_REALESTATE, params);

    if (!records || records.length === 0) {
      return {
        content: [{ type: 'text', text: '查無不動產成交資料' }],
      };
    }

    const filtered = district
      ? records.filter((r) => r.district?.includes(district))
      : records;

    if (filtered.length === 0) {
      const location = district ? `新北市${district}` : '新北市';
      return {
        content: [{ type: 'text', text: `${location}查無成交資料，無法分析趨勢` }],
      };
    }

    const trendData = calculateTrend(filtered, period, monthsBack);

    if (trendData.length === 0) {
      return {
        content: [{ type: 'text', text: '資料不足，無法計算趨勢' }],
      };
    }

    const location = district ? `新北市${district}` : '新北市';
    const periodLabel = period === 'quarterly' ? '季' : '月';
    const header = `${location}房價趨勢（${periodLabel}度統計，近 ${monthsBack} 個月）`;

    const lines = trendData.map((d) => {
      const change = d.changePercent !== null
        ? `${d.changePercent > 0 ? '+' : ''}${d.changePercent.toFixed(1)}%`
        : '—';
      return [
        `${d.period}`,
        `  平均單價: ${formatUnitPrice(d.avgUnitPrice)}/m²`,
        `  成交筆數: ${d.transactionCount} 筆`,
        `  漲跌幅: ${change}`,
      ].join('\n');
    });

    const firstPrice = trendData[0].avgUnitPrice;
    const lastPrice = trendData[trendData.length - 1].avgUnitPrice;
    const overallChange = firstPrice > 0
      ? ((lastPrice - firstPrice) / firstPrice * 100).toFixed(1)
      : '0';

    const summary = `\n整體變化: ${parseFloat(overallChange) > 0 ? '+' : ''}${overallChange}%（${trendData[0].period} → ${trendData[trendData.length - 1].period}）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}${summary}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `分析房價趨勢失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function calculateTrend(
  records: TransactionRecord[],
  period: string,
  _monthsBack: number
): TrendDataPoint[] {
  // Group records by period
  const groups = new Map<string, number[]>();

  for (const r of records) {
    const unitPrice = safeParseNumber(r.unit_price);
    if (unitPrice <= 0) continue;

    const yyyymm = parseRocDateToPeriod(r.transaction_date);
    if (!yyyymm) continue;

    const key = period === 'quarterly'
      ? toQuarterKey(yyyymm)
      : yyyymm;

    const existing = groups.get(key);
    if (existing) {
      existing.push(unitPrice);
    } else {
      groups.set(key, [unitPrice]);
    }
  }

  // Sort periods chronologically
  const sortedPeriods = [...groups.keys()].sort();

  // Build trend data with change percentages
  const result: TrendDataPoint[] = [];
  let prevAvg: number | null = null;

  for (const periodKey of sortedPeriods) {
    const prices = groups.get(periodKey)!;
    const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

    const changePercent = prevAvg !== null && prevAvg > 0
      ? Math.round((avg - prevAvg) / prevAvg * 10000) / 100
      : null;

    result.push({
      period: formatPeriodLabel(periodKey, period),
      avgUnitPrice: avg,
      transactionCount: prices.length,
      changePercent,
    });

    prevAvg = avg;
  }

  return result;
}

function toQuarterKey(yyyymm: string): string {
  const year = yyyymm.substring(0, 4);
  const month = parseInt(yyyymm.substring(4, 6), 10);
  const quarter = Math.ceil(month / 3);
  return `${year}Q${quarter}`;
}

function formatPeriodLabel(key: string, period: string): string {
  if (period === 'quarterly') {
    return key; // e.g. "2025Q1"
  }
  // Monthly: "202501" -> "2025/01"
  if (key.length === 6) {
    return `${key.substring(0, 4)}/${key.substring(4, 6)}`;
  }
  return key;
}

function formatUnitPrice(price: number): string {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1)} 萬元`;
  }
  return `${Math.round(price).toLocaleString()} 元`;
}
