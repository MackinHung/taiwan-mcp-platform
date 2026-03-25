import { fetchTransactions, DATASETS, parseRocDate, safeParseNumber, sqmToPing, westernToRocPrefix } from '../client.js';
import type { Env, ToolResult, TransactionRecord } from '../types.js';

/**
 * search_transactions_by_date: 依日期範圍查詢成交案件
 */
export async function searchTransactionsByDate(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const startDate = args.start_date as string | undefined;
    const endDate = args.end_date as string | undefined;
    const city = args.city as string | undefined;
    const minPrice = args.min_price as number | undefined;
    const maxPrice = args.max_price as number | undefined;

    if (!startDate) {
      return {
        content: [{ type: 'text', text: '請提供起始日期（格式: YYYYMM，例如 202501）' }],
        isError: true,
      };
    }

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

    const rocStart = westernToRocPrefix(startDate);
    const rocEnd = endDate ? westernToRocPrefix(endDate) : null;

    const filtered = records.filter((r) => {
      const dateStr = (r.transaction_date || '').replace(/\//g, '').trim();

      if (dateStr.length < 5) return false;
      const datePeriod = dateStr.substring(0, rocStart.length);

      if (datePeriod < rocStart) return false;
      if (rocEnd && datePeriod > rocEnd) return false;

      if (city && !r.district?.includes(city)) return false;

      const price = safeParseNumber(r.total_price);
      if (minPrice !== undefined && price < minPrice) return false;
      if (maxPrice !== undefined && price > maxPrice) return false;

      return true;
    });

    if (filtered.length === 0) {
      const dateRange = endDate ? `${startDate} ~ ${endDate}` : `${startDate} 起`;
      return {
        content: [{
          type: 'text',
          text: `在 ${dateRange} 期間查無符合條件的成交資料`,
        }],
      };
    }

    const display = filtered.slice(0, 30);
    const lines = display.map((r) => formatDateSearchResult(r));

    const dateRange = endDate ? `${startDate} ~ ${endDate}` : `${startDate} 起`;
    const header = `日期範圍 ${dateRange} 的成交資料（共 ${filtered.length} 筆，顯示 ${display.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢成交案件失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function formatDateSearchResult(r: TransactionRecord): string {
  const date = parseRocDate(r.transaction_date);
  const totalPrice = safeParseNumber(r.total_price);
  const area = safeParseNumber(r.building_area);
  const ping = sqmToPing(area);

  return [
    `交易日期: ${date}`,
    `地址: ${r.address || '未揭露'}`,
    `總價: ${formatPrice(totalPrice)}`,
    `面積: ${area > 0 ? `${area} m²（${ping} 坪）` : '未提供'}`,
    `類型: ${r.building_type || '未提供'}`,
  ].join('\n');
}

function formatPrice(price: number): string {
  if (price >= 100000000) {
    return `${(price / 100000000).toFixed(2)} 億元`;
  }
  if (price >= 10000) {
    return `${(price / 10000).toFixed(1)} 萬元`;
  }
  return `${price} 元`;
}
