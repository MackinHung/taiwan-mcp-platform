import { fetchTransactions, DATASETS, parseRocDate, safeParseNumber, sqmToPing } from '../client.js';
import type { Env, ToolResult, TransactionRecord } from '../types.js';

/**
 * get_recent_transactions: 取得最新成交案件
 */
export async function getRecentTransactions(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const district = args.district as string | undefined;
    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 100);

    const params: Record<string, string> = {
      page: '0',
      size: String(Math.min(limit * 5, 1000)),
    };

    const records = await fetchTransactions(DATASETS.NTPC_REALESTATE, params);

    if (!records || records.length === 0) {
      return {
        content: [{ type: 'text', text: '查無最新成交資料' }],
      };
    }

    const filtered = district
      ? records.filter((r) => r.district?.includes(district))
      : records;

    if (filtered.length === 0) {
      return {
        content: [{
          type: 'text',
          text: district
            ? `新北市${district}查無最新成交資料`
            : '查無最新成交資料',
        }],
      };
    }

    // Sort by transaction_date descending (most recent first)
    const sorted = [...filtered].sort((a, b) => {
      const dateA = (a.transaction_date || '').replace(/\//g, '');
      const dateB = (b.transaction_date || '').replace(/\//g, '');
      return dateB.localeCompare(dateA);
    });

    const sliced = sorted.slice(0, limit);
    const lines = sliced.map((r) => formatRecentTransaction(r));

    const location = district ? `新北市${district}` : '新北市';
    const header = `${location}最新成交案件（共 ${filtered.length} 筆，顯示最新 ${sliced.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得最新成交資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function formatRecentTransaction(r: TransactionRecord): string {
  const date = parseRocDate(r.transaction_date);
  const totalPrice = safeParseNumber(r.total_price);
  const unitPrice = safeParseNumber(r.unit_price);
  const area = safeParseNumber(r.building_area);
  const ping = sqmToPing(area);

  return [
    `交易日期: ${date}`,
    `地區: ${r.district || '未知'}`,
    `地址: ${r.address || '未揭露'}`,
    `總價: ${formatPrice(totalPrice)}`,
    `單價: ${unitPrice > 0 ? `${formatPrice(unitPrice)}/m²` : '未提供'}`,
    `面積: ${area > 0 ? `${area} m²（${ping} 坪）` : '未提供'}`,
    `類型: ${r.building_type || '未提供'}`,
    `格局: ${formatLayout(r)}`,
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

function formatLayout(r: TransactionRecord): string {
  const rooms = r.rooms || '0';
  const halls = r.halls || '0';
  const baths = r.bathrooms || '0';
  if (rooms === '0' && halls === '0' && baths === '0') return '未提供';
  return `${rooms}房${halls}廳${baths}衛`;
}
