export interface Env {
  SERVER_NAME: string;
  SERVER_VERSION: string;
}

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export interface CompanyBasic {
  Business_Accounting_NO: string;
  Company_Name: string;
  Company_Status_Desc: string;
  Capital_Stock_Amount: number;
  Paid_In_Capital_Amount: number;
  Responsible_Name: string;
  Company_Location: string;
  Register_Organization_Desc: string;
  Company_Setup_Date: string;
  Change_Of_Approval_Data: string;
  Revoke_App_Date: string;
  Case_Status: string;
  Case_Status_Desc: string;
  Sus_App_Date: string;
  Sus_Beg_Date: string;
  Sus_End_Date: string;
}

export interface CompanyWithBusiness {
  Business_Accounting_NO: string;
  Company_Name: string;
  Company_Status: string;
  Company_Status_Desc: string;
  Company_Setup_Date: string;
  Cmp_Business: Array<{
    Business_Seq_NO: string;
    Business_Item: string;
    Business_Item_Desc: string;
  }>;
}

export interface DirectorRecord {
  Person_Position_Name: string;
  Person_Name: string;
  Juristic_Person_Name: string;
  Person_Shareholding: number;
}

export interface JsonRpcRequest {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: unknown;
  error?: { code: number; message: string };
}
