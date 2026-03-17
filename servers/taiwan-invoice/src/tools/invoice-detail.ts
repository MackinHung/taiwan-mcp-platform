import { fetchApi } from '../client.js';
import type { Env, ToolResult, InvoiceDetail } from '../types.js';

export async function queryInvoiceDetail(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const invNum = args.invNum as string | undefined;
    const invDate = args.invDate as string | undefined;

    if (!invNum || !invDate) {
      return {
        content: [
          { type: 'text', text: '請提供發票號碼 (invNum) 和發票日期 (invDate, YYYY/MM/DD)' },
        ],
        isError: true,
      };
    }

    const data = await fetchApi<InvoiceDetail>(env, 'qryInvDetail', {
      type: 'QRCode',
      invNum,
      invDate,
      generation: 'V2',
    });

    if (!data.details || data.details.length === 0) {
      return {
        content: [
          { type: 'text', text: `發票 ${invNum} 無消費明細資料` },
        ],
      };
    }

    const header = `=== 電子發票消費明細 (${data.invNum}) ===\n`;
    const items = data.details.map((item) =>
      [
        `  ${item.rowNum}. ${item.description}`,
        `     數量: ${item.quantity}  單價: $${item.unitPrice}  金額: $${item.amount}`,
      ].join('\n')
    );

    return {
      content: [{ type: 'text', text: header + '\n' + items.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢發票明細失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
