import type { Env, ToolResult, TradeStatRecord } from '../types.js';
import { fetchTradeStats } from '../client.js';

export async function getTradeStatistics(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const year = args.year as string | undefined;
    const country = args.country as string | undefined;
    const commodity = args.commodity as string | undefined;
    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 100);

    const params: Record<string, string> = {};
    if (year) {
      params['filters'] = JSON.stringify({ 年月: year });
    }

    const records = await fetchTradeStats(params);

    let filtered = records;
    if (country) {
      filtered = filtered.filter((r) => r.國家?.includes(country));
    }
    if (commodity) {
      filtered = filtered.filter((r) => r.貨品名稱?.includes(commodity));
    }

    if (filtered.length === 0) {
      return {
        content: [{ type: 'text', text: buildNoResultMessage(year, country, commodity) }],
      };
    }

    const limited = filtered.slice(0, limit);
    const lines = formatTradeStats(limited);

    const header = buildHeader(filtered.length, limit, year, country, commodity);

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢貿易統計失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

function buildNoResultMessage(
  year?: string,
  country?: string,
  commodity?: string
): string {
  const conditions: string[] = [];
  if (year) conditions.push(`年份=${year}`);
  if (country) conditions.push(`國家=${country}`);
  if (commodity) conditions.push(`貨品=${commodity}`);
  const label = conditions.length > 0 ? conditions.join('、') : '指定條件';
  return `找不到符合${label}的貿易統計資料`;
}

function buildHeader(
  totalCount: number,
  limit: number,
  year?: string,
  country?: string,
  commodity?: string
): string {
  const parts: string[] = ['台灣進出口貿易統計'];
  const filters: string[] = [];
  if (year) filters.push(`年份: ${year}`);
  if (country) filters.push(`國家: ${country}`);
  if (commodity) filters.push(`貨品: ${commodity}`);
  if (filters.length > 0) parts.push(filters.join(' | '));

  const countInfo = totalCount > limit
    ? `（顯示前 ${limit} 筆，共 ${totalCount} 筆）`
    : `（${totalCount} 筆）`;
  parts.push(countInfo);
  return parts.join('\n');
}

function formatTradeStats(records: TradeStatRecord[]): string[] {
  return records.map((r) => {
    const importVal = r.進口值 ?? 'N/A';
    const exportVal = r.出口值 ?? 'N/A';
    const balance = computeBalance(r.出口值, r.進口值);
    return [
      `期間: ${r.年月 ?? 'N/A'} | 國家: ${r.國家 ?? 'N/A'}`,
      `  貨品: ${r.貨品名稱 ?? 'N/A'}（${r.貨品號列 ?? ''})`,
      `  進口值: ${importVal} | 出口值: ${exportVal} | 差額: ${balance}`,
    ].join('\n');
  });
}

function computeBalance(exportVal?: string, importVal?: string): string {
  const exp = parseFloat(exportVal ?? '');
  const imp = parseFloat(importVal ?? '');
  if (isNaN(exp) || isNaN(imp)) return 'N/A';
  const diff = exp - imp;
  const sign = diff >= 0 ? '+' : '';
  return `${sign}${diff.toLocaleString()}`;
}
