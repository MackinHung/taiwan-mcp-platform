import { fetchRates } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function convertCurrency(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const from = (args.from as string | undefined)?.toUpperCase();
    const to = (args.to as string | undefined)?.toUpperCase();
    const amount = args.amount as number | undefined;

    if (!from || !to || amount === undefined || amount === null) {
      return {
        content: [
          {
            type: 'text',
            text: '請提供 from（來源幣別）、to（目標幣別）、amount（金額）',
          },
        ],
        isError: true,
      };
    }

    if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
      return {
        content: [{ type: 'text', text: '金額必須為正數' }],
        isError: true,
      };
    }

    if (from === to) {
      return {
        content: [
          { type: 'text', text: `${amount} ${from} = ${amount} ${to}（相同幣別）` },
        ],
      };
    }

    const rates = await fetchRates();

    // TWD → foreign currency: use spotSelling (bank sells foreign to you)
    if (from === 'TWD') {
      const targetRate = rates.find(
        (r) => r.currencyCode.toUpperCase() === to
      );
      if (!targetRate) {
        return {
          content: [{ type: 'text', text: `找不到幣別 ${to} 的匯率` }],
        };
      }
      const selling = parseFloat(targetRate.spotSelling);
      if (isNaN(selling) || selling <= 0) {
        return {
          content: [
            { type: 'text', text: `${to} 即期賣出匯率無法使用: ${targetRate.spotSelling}` },
          ],
        };
      }
      const result = amount / selling;
      const text = [
        `${amount.toLocaleString()} TWD → ${to}`,
        `即期賣出匯率: ${targetRate.spotSelling}`,
        `換算結果: ${result.toFixed(2)} ${to}`,
      ].join('\n');
      return { content: [{ type: 'text', text }] };
    }

    // Foreign currency → TWD: use spotBuying (bank buys foreign from you)
    if (to === 'TWD') {
      const sourceRate = rates.find(
        (r) => r.currencyCode.toUpperCase() === from
      );
      if (!sourceRate) {
        return {
          content: [{ type: 'text', text: `找不到幣別 ${from} 的匯率` }],
        };
      }
      const buying = parseFloat(sourceRate.spotBuying);
      if (isNaN(buying) || buying <= 0) {
        return {
          content: [
            { type: 'text', text: `${from} 即期買入匯率無法使用: ${sourceRate.spotBuying}` },
          ],
        };
      }
      const result = amount * buying;
      const text = [
        `${amount.toLocaleString()} ${from} → TWD`,
        `即期買入匯率: ${sourceRate.spotBuying}`,
        `換算結果: ${result.toFixed(2)} TWD`,
      ].join('\n');
      return { content: [{ type: 'text', text }] };
    }

    // Foreign → Foreign: convert via TWD
    const sourceRate = rates.find(
      (r) => r.currencyCode.toUpperCase() === from
    );
    const targetRate = rates.find(
      (r) => r.currencyCode.toUpperCase() === to
    );

    if (!sourceRate) {
      return {
        content: [{ type: 'text', text: `找不到幣別 ${from} 的匯率` }],
      };
    }
    if (!targetRate) {
      return {
        content: [{ type: 'text', text: `找不到幣別 ${to} 的匯率` }],
      };
    }

    const buying = parseFloat(sourceRate.spotBuying);
    const selling = parseFloat(targetRate.spotSelling);

    if (isNaN(buying) || buying <= 0 || isNaN(selling) || selling <= 0) {
      return {
        content: [{ type: 'text', text: '匯率數值無法使用，無法換算' }],
      };
    }

    const twdAmount = amount * buying;
    const result = twdAmount / selling;
    const text = [
      `${amount.toLocaleString()} ${from} → ${to}`,
      `${from} 即期買入: ${sourceRate.spotBuying}`,
      `${to} 即期賣出: ${targetRate.spotSelling}`,
      `換算結果: ${result.toFixed(2)} ${to}`,
    ].join('\n');
    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `換算失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
