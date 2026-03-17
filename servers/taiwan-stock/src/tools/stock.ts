import type { Env, ToolResult } from '../types.js';
import { fetchValuation, fetchStockDayAll } from '../client.js';

export async function getStockInfo(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const code = args.code as string;
    if (!code) {
      return {
        content: [{ type: 'text', text: '請提供股票代碼（code 參數），例如 "2330"' }],
        isError: true,
      };
    }

    const [valuations, dailyData] = await Promise.all([
      fetchValuation(),
      fetchStockDayAll(),
    ]);

    const valuation = valuations.find((v) => v.Code === code);
    const daily = dailyData.find((d) => d.Code === code);

    if (!valuation && !daily) {
      return {
        content: [{ type: 'text', text: `找不到股票代碼 ${code} 的資料` }],
      };
    }

    const lines: string[] = [];

    if (daily) {
      const vol = BigInt(daily.TradeVolume).toLocaleString();
      const val = BigInt(daily.TradeValue).toLocaleString();
      lines.push(
        `${daily.Code} ${daily.Name}`,
        `日期: ${daily.Date}`,
        '',
        '--- 交易資訊 ---',
        `收盤價: ${daily.ClosingPrice}`,
        `開盤價: ${daily.OpeningPrice}`,
        `最高價: ${daily.HighestPrice}`,
        `最低價: ${daily.LowestPrice}`,
        `漲跌: ${daily.Change}`,
        `成交量: ${vol} 股`,
        `成交值: ${val} 元`,
        `成交筆數: ${parseInt(daily.Transaction, 10).toLocaleString()}`,
      );
    }

    if (valuation) {
      if (lines.length === 0) {
        lines.push(`${valuation.Code} ${valuation.Name}`, `日期: ${valuation.Date}`);
      }
      lines.push(
        '',
        '--- 估值指標 ---',
        `本益比 (P/E): ${valuation.PEratio || 'N/A'}`,
        `殖利率: ${valuation.DividendYield || 'N/A'}%`,
        `股價淨值比 (P/B): ${valuation.PBratio || 'N/A'}`,
      );
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得股票資料失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getStockSearch(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string;
    if (!keyword) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字（keyword 參數），例如 "台積" 或 "2330"' }],
        isError: true,
      };
    }

    const records = await fetchStockDayAll();

    const matched = records.filter(
      (r) => r.Code.includes(keyword) || r.Name.includes(keyword)
    );

    if (matched.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到符合「${keyword}」的股票` }],
      };
    }

    const limited = matched.slice(0, 20);
    const lines = limited.map((r) => {
      const vol = BigInt(r.TradeVolume).toLocaleString();
      return `${r.Code} ${r.Name} — 收盤: ${r.ClosingPrice}（${r.Change}）成交量: ${vol}`;
    });

    const header = matched.length > 20
      ? `符合「${keyword}」的股票（顯示前 20 筆，共 ${matched.length} 筆）`
      : `符合「${keyword}」的股票（${matched.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `搜尋股票失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
