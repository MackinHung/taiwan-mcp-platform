export interface Env {
  EINVOICE_APP_ID: string;
  EINVOICE_UUID: string;
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface WinningListResponse {
  v: string;
  code: number;
  msg: string;
  invoYm: string;
  superPrizeNo: string;
  spcPrizeNo: string;
  firstPrizeNo1: string;
  firstPrizeNo2?: string;
  firstPrizeNo3?: string;
  sixthPrizeNo1?: string;
  sixthPrizeNo2?: string;
  sixthPrizeNo3?: string;
  superPrizeAmt: string;
  spcPrizeAmt: string;
  firstPrizeAmt: string;
  secondPrizeAmt: string;
  thirdPrizeAmt: string;
  fourthPrizeAmt: string;
  fifthPrizeAmt: string;
  sixthPrizeAmt: string;
}

export interface InvoiceHeader {
  v: string;
  code: number;
  msg: string;
  invNum: string;
  invoiceDate: string;
  sellerName: string;
  invoiceStatusDesc: string;
  invoiceTime: string;
  sellerBan: string;
  amount: string;
}

export interface InvoiceDetail {
  v: string;
  code: number;
  msg: string;
  invNum: string;
  details: Array<{
    rowNum: string;
    description: string;
    quantity: string;
    unitPrice: string;
    amount: string;
  }>;
}
