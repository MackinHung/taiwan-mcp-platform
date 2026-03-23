import { fetchAnnouncements } from '../client.js';
import type { Env, ToolResult } from '../types.js';

function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length !== 8) return yyyymmdd;
  return `${yyyymmdd.slice(0, 4)}/${yyyymmdd.slice(4, 6)}/${yyyymmdd.slice(6, 8)}`;
}

function getTodayYYYYMMDD(): string {
  const now = new Date();
  const y = String(now.getFullYear());
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function addDays(yyyymmdd: string, days: number): string {
  const year = parseInt(yyyymmdd.slice(0, 4), 10);
  const month = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  const day = parseInt(yyyymmdd.slice(6, 8), 10);
  const date = new Date(year, month, day + days);
  const y = String(date.getFullYear());
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export async function getAnnouncementStatsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const all = await fetchAnnouncements();

    if (all.length === 0) {
      return {
        content: [{ type: 'text', text: '目前無公告資料' }],
      };
    }

    // Agency distribution
    const agencyMap = new Map<string, number>();
    for (const a of all) {
      agencyMap.set(a.SendUnitName, (agencyMap.get(a.SendUnitName) ?? 0) + 1);
    }
    const agencyEntries = [...agencyMap.entries()].sort((a, b) => b[1] - a[1]);

    // Date range
    const sendDates = all.map((a) => a.SendDate).sort();
    const earliestSend = sendDates[0];
    const latestSend = sendDates[sendDates.length - 1];

    // Expiring soon (DueDate within 7 days)
    const today = getTodayYYYYMMDD();
    const sevenDaysLater = addDays(today, 7);
    const expiringSoon = all.filter(
      (a) => a.DueDate >= today && a.DueDate <= sevenDaysLater
    );

    const lines = [
      `=== 政府公告統計 ===`,
      `公告總數: ${all.length} 筆`,
      `發文日期範圍: ${formatDate(earliestSend)} ~ ${formatDate(latestSend)}`,
      ``,
      `--- 機關分布 ---`,
      ...agencyEntries.map(([name, count]) => `  ${name}: ${count} 筆`),
      ``,
      `--- 即將截止（7 日內） ---`,
    ];

    if (expiringSoon.length === 0) {
      lines.push('  無即將截止公告');
    } else {
      for (const a of expiringSoon) {
        lines.push(`  [截止 ${formatDate(a.DueDate)}] ${a.SendUnitName}: ${a.Subject.slice(0, 40)}...`);
      }
    }

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得公告統計失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
