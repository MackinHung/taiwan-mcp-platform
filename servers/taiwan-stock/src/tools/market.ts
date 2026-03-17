import type { Env, ToolResult } from '../types.js';
import { fetchMarketSummary, fetchMarketIndices, fetchTopVolume } from '../client.js';

export async function getMarketOverview(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const records = await fetchMarketSummary();
    if (records.length === 0) {
      return { content: [{ type: 'text', text: '無可用市場資料' }] };
    }

    const latest = records[records.length - 1];
    const changeSign = parseFloat(latest.Change) >= 0 ? '+' : '';
    const volume = BigInt(latest.TradeVolume).toLocaleString();
    const value = BigInt(latest.TradeValue).toLocaleString();

    const lines = [
      `台股每日行情摘要`,
      `日期: ${latest.Date}`,
      '',
      `加權指數: ${latest.TAIEX}`,
      `漲跌: ${changeSign}${latest.Change} 點`,
      `成交量: ${volume} 股`,
      `成交值: ${value} 元`,
      `成交筆數: ${parseInt(latest.Transaction, 10).toLocaleString()}`,
    ];

    if (records.length > 1) {
      lines.push('', '--- 近期走勢 ---');
      const recent = records.slice(-5);
      for (const r of recent) {
        const sign = parseFloat(r.Change) >= 0 ? '+' : '';
        lines.push(`${r.Date}: ${r.TAIEX}（${sign}${r.Change}）`);
      }
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得市場行情失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getMarketIndices(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string | undefined;
    const records = await fetchMarketIndices();

    let filtered = records;
    if (keyword) {
      filtered = records.filter((r) => r['指數'].includes(keyword));
    }

    if (filtered.length === 0) {
      const label = keyword ?? '全部';
      return { content: [{ type: 'text', text: `找不到「${label}」相關指數` }] };
    }

    const date = filtered[0]?.['日期'] ?? '';
    const lines = filtered.map((r) => {
      const dir = r['漲跌'] === '+' ? '+' : '-';
      return `${r['指數']}: ${r['收盤指數']}（${dir}${r['漲跌點數']}，${r['漲跌百分比']}%）`;
    });

    const header = keyword
      ? `「${keyword}」相關指數（${filtered.length} 項）`
      : `全部市場指數（${filtered.length} 項）`;

    return {
      content: [
        { type: 'text', text: `${header}\n日期: ${date}\n\n${lines.join('\n')}` },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得市場指數失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getTopVolume(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 20);
    const records = await fetchTopVolume();

    if (records.length === 0) {
      return { content: [{ type: 'text', text: '無可用成交量排行資料' }] };
    }

    const top = records.slice(0, limit);
    const lines = top.map((r) => {
      const dir = r.Dir === '+' ? '+' : '-';
      const vol = BigInt(r.TradeVolume).toLocaleString();
      return `${r.Rank}. ${r.Code} ${r.Name} — 收盤: ${r.ClosingPrice}（${dir}${r.Change}）成交量: ${vol}`;
    });

    const date = records[0]?.Date ?? '';
    return {
      content: [
        {
          type: 'text',
          text: `成交量排行（前 ${top.length} 名）\n日期: ${date}\n\n${lines.join('\n')}`,
        },
      ],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得成交量排行失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
