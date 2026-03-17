import { fetchApi, toInvTerm } from '../client.js';
import type { Env, ToolResult, WinningListResponse } from '../types.js';

export async function getWinningNumbers(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const period = args.period as string | undefined;
    const invTerm = toInvTerm(period);

    const data = await fetchApi<WinningListResponse>(env, 'QryWinningList', {
      generation: 'V2',
      invTerm,
    });

    const firstPrizes = [
      data.firstPrizeNo1,
      data.firstPrizeNo2,
      data.firstPrizeNo3,
    ].filter(Boolean);

    const sixthPrizes = [
      data.sixthPrizeNo1,
      data.sixthPrizeNo2,
      data.sixthPrizeNo3,
    ].filter(Boolean);

    const lines = [
      `=== 統一發票中獎號碼 (${data.invoYm}) ===`,
      '',
      `特別獎 (${formatAmount(data.superPrizeAmt)}): ${data.superPrizeNo}`,
      `特獎 (${formatAmount(data.spcPrizeAmt)}): ${data.spcPrizeNo}`,
      `頭獎 (${formatAmount(data.firstPrizeAmt)}): ${firstPrizes.join(', ')}`,
      `二獎 (${formatAmount(data.secondPrizeAmt)}): 末 7 碼與頭獎相同`,
      `三獎 (${formatAmount(data.thirdPrizeAmt)}): 末 6 碼與頭獎相同`,
      `四獎 (${formatAmount(data.fourthPrizeAmt)}): 末 5 碼與頭獎相同`,
      `五獎 (${formatAmount(data.fifthPrizeAmt)}): 末 4 碼與頭獎相同`,
      `六獎 (${formatAmount(data.sixthPrizeAmt)}): 末 3 碼與頭獎相同`,
    ];

    if (sixthPrizes.length > 0) {
      lines.push(`增開六獎 (${formatAmount(data.sixthPrizeAmt)}): ${sixthPrizes.join(', ')}`);
    }

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢中獎號碼失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

function formatAmount(amt: string): string {
  const num = parseInt(amt, 10);
  if (isNaN(num)) return amt;
  return `$${num.toLocaleString()}`;
}
