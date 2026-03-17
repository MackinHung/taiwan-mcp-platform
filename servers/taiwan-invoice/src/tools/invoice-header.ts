import { fetchApi } from '../client.js';
import type { Env, ToolResult, InvoiceHeader } from '../types.js';

export async function queryInvoiceHeader(
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

    const data = await fetchApi<InvoiceHeader>(env, 'qryInvHeader', {
      type: 'QRCode',
      invNum,
      invDate,
      generation: 'V2',
    });

    const lines = [
      `=== 電子發票表頭 ===`,
      '',
      `發票號碼: ${data.invNum}`,
      `發票日期: ${data.invoiceDate}`,
      `開立時間: ${data.invoiceTime}`,
      `賣方名稱: ${data.sellerName}`,
      `賣方統編: ${data.sellerBan}`,
      `金額: $${data.amount}`,
      `狀態: ${data.invoiceStatusDesc}`,
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢發票表頭失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
