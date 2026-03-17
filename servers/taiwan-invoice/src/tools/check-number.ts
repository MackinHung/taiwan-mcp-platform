import { fetchApi, toInvTerm } from '../client.js';
import type { Env, ToolResult, WinningListResponse } from '../types.js';

export async function checkInvoiceNumber(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const invoiceNumber = args.invoiceNumber as string | undefined;
    if (!invoiceNumber || invoiceNumber.length !== 8 || !/^\d{8}$/.test(invoiceNumber)) {
      return {
        content: [
          { type: 'text', text: '請提供 8 位數字的發票號碼（不含英文字軌）' },
        ],
        isError: true,
      };
    }

    const period = args.period as string | undefined;
    const invTerm = toInvTerm(period);

    const data = await fetchApi<WinningListResponse>(env, 'QryWinningList', {
      generation: 'V2',
      invTerm,
    });

    const result = matchPrize(invoiceNumber, data);

    if (result) {
      return {
        content: [
          {
            type: 'text',
            text: [
              `=== 對獎結果 (${data.invoYm}) ===`,
              '',
              `發票號碼: ${invoiceNumber}`,
              `結果: 中獎！`,
              `獎項: ${result.prizeName}`,
              `獎金: $${parseInt(result.amount, 10).toLocaleString()}`,
            ].join('\n'),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: 'text',
          text: [
            `=== 對獎結果 (${data.invoYm}) ===`,
            '',
            `發票號碼: ${invoiceNumber}`,
            `結果: 未中獎`,
          ].join('\n'),
        },
      ],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `對獎失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}

interface PrizeMatch {
  prizeName: string;
  amount: string;
}

function matchPrize(
  number: string,
  data: WinningListResponse
): PrizeMatch | null {
  // Check special prize (特別獎) - full 8 digits
  if (number === data.superPrizeNo) {
    return { prizeName: '特別獎', amount: data.superPrizeAmt };
  }

  // Check grand prize (特獎) - full 8 digits
  if (number === data.spcPrizeNo) {
    return { prizeName: '特獎', amount: data.spcPrizeAmt };
  }

  // Collect all first prize numbers
  const firstPrizes = [
    data.firstPrizeNo1,
    data.firstPrizeNo2,
    data.firstPrizeNo3,
  ].filter(Boolean);

  // Check first prize (頭獎) - full 8 digits
  if (firstPrizes.some((p) => number === p)) {
    return { prizeName: '頭獎', amount: data.firstPrizeAmt };
  }

  // Check second prize (二獎) - last 7 digits
  if (firstPrizes.some((p) => number.slice(1) === p!.slice(1))) {
    return { prizeName: '二獎', amount: data.secondPrizeAmt };
  }

  // Check third prize (三獎) - last 6 digits
  if (firstPrizes.some((p) => number.slice(2) === p!.slice(2))) {
    return { prizeName: '三獎', amount: data.thirdPrizeAmt };
  }

  // Check fourth prize (四獎) - last 5 digits
  if (firstPrizes.some((p) => number.slice(3) === p!.slice(3))) {
    return { prizeName: '四獎', amount: data.fourthPrizeAmt };
  }

  // Check fifth prize (五獎) - last 4 digits
  if (firstPrizes.some((p) => number.slice(4) === p!.slice(4))) {
    return { prizeName: '五獎', amount: data.fifthPrizeAmt };
  }

  // Check sixth prize (六獎) - last 3 digits match first prize
  if (firstPrizes.some((p) => number.slice(5) === p!.slice(5))) {
    return { prizeName: '六獎', amount: data.sixthPrizeAmt };
  }

  // Check additional sixth prize (增開六獎) - last 3 digits
  const sixthPrizes = [
    data.sixthPrizeNo1,
    data.sixthPrizeNo2,
    data.sixthPrizeNo3,
  ].filter(Boolean);

  if (sixthPrizes.some((p) => number.slice(5) === p)) {
    return { prizeName: '增開六獎', amount: data.sixthPrizeAmt };
  }

  return null;
}
