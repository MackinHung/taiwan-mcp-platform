import { fetchTransactions, DATASETS, safeParseNumber, sqmToPing } from '../client.js';
import type { Env, ToolResult, TransactionRecord, PriceStatistics } from '../types.js';

/**
 * get_area_price_statistics: 取得區域房價統計（均價/中位/最高/最低）
 */
export async function getAreaPriceStatistics(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const district = args.district as string | undefined;
    const propertyType = args.property_type as string | undefined;

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

    const filtered = records.filter((r) => {
      if (district && !r.district?.includes(district)) return false;
      if (propertyType && !r.main_use?.includes(propertyType)) return false;
      const price = safeParseNumber(r.unit_price);
      return price > 0;
    });

    if (filtered.length === 0) {
      const location = district ? `新北市${district}` : '新北市';
      return {
        content: [{
          type: 'text',
          text: `${location}查無有效的成交價格資料`,
        }],
      };
    }

    const stats = calculateStatistics(filtered);
    const location = district ? `新北市${district}` : '新北市';
    const typeLabel = propertyType ? `（${propertyType}）` : '';

    const text = [
      `${location}${typeLabel}房價統計`,
      `─────────────────────`,
      `交易筆數: ${stats.totalTransactions} 筆`,
      `平均單價: ${formatUnitPrice(stats.avgUnitPrice)}/m²（約 ${formatUnitPrice(stats.avgUnitPrice * 3.30579)}/坪）`,
      `中位數單價: ${formatUnitPrice(stats.medianUnitPrice)}/m²（約 ${formatUnitPrice(stats.medianUnitPrice * 3.30579)}/坪）`,
      `最高單價: ${formatUnitPrice(stats.maxUnitPrice)}/m²`,
      `最低單價: ${formatUnitPrice(stats.minUnitPrice)}/m²`,
      `平均總價: ${formatTotalPrice(stats.avgTotalPrice)}`,
    ].join('\n');

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得房價統計失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function calculateStatistics(records: TransactionRecord[]): PriceStatistics {
  const unitPrices = records
    .map((r) => safeParseNumber(r.unit_price))
    .filter((p) => p > 0)
    .sort((a, b) => a - b);

  const totalPrices = records
    .map((r) => safeParseNumber(r.total_price))
    .filter((p) => p > 0);

  const count = unitPrices.length;
  const sum = unitPrices.reduce((acc, p) => acc + p, 0);
  const totalSum = totalPrices.reduce((acc, p) => acc + p, 0);

  const median = count > 0
    ? count % 2 === 0
      ? (unitPrices[count / 2 - 1] + unitPrices[count / 2]) / 2
      : unitPrices[Math.floor(count / 2)]
    : 0;

  return {
    avgUnitPrice: count > 0 ? Math.round(sum / count) : 0,
    medianUnitPrice: Math.round(median),
    maxUnitPrice: count > 0 ? unitPrices[count - 1] : 0,
    minUnitPrice: count > 0 ? unitPrices[0] : 0,
    totalTransactions: count,
    avgTotalPrice: totalPrices.length > 0 ? Math.round(totalSum / totalPrices.length) : 0,
  };
}

function formatUnitPrice(price: number): string {
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1)} 萬元`;
  }
  return `${Math.round(price).toLocaleString()} 元`;
}

function formatTotalPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(2)} 億元`;
  }
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1)} 萬元`;
  }
  return `${price} 元`;
}
