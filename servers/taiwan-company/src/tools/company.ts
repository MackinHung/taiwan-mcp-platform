import type { Env, ToolResult } from '../types.js';
import {
  lookupByTaxId,
  searchByName,
  getBusinessItems,
  getDirectors,
  formatRocDate,
  formatCapital,
  COMPANY_STATUS,
} from '../client.js';

export async function searchCompany(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const keyword = args.keyword as string;
    if (!keyword) {
      return {
        content: [{ type: 'text', text: '請提供搜尋關鍵字（keyword 參數）' }],
        isError: true,
      };
    }

    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 50);
    const statusCode = (args.status as string) ?? '01';

    const companies = await searchByName(keyword, statusCode, limit);

    if (companies.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到包含「${keyword}」的公司` }],
      };
    }

    const lines = companies.slice(0, limit).map((c, i) => [
      `${i + 1}. ${c.Company_Name}`,
      `   統編: ${c.Business_Accounting_NO} | 狀態: ${c.Company_Status_Desc}`,
      `   資本額: ${formatCapital(c.Capital_Stock_Amount)} | 負責人: ${c.Responsible_Name}`,
      `   地址: ${c.Company_Location}`,
    ].join('\n'));

    return {
      content: [{
        type: 'text',
        text: `搜尋「${keyword}」結果（${lines.length} 筆）\n\n${lines.join('\n\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `搜尋公司失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getCompanyDetail(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const taxId = args.tax_id as string;
    if (!taxId) {
      return {
        content: [{ type: 'text', text: '請提供統一編號（tax_id 參數）' }],
        isError: true,
      };
    }

    if (!/^\d{8}$/.test(taxId)) {
      return {
        content: [{ type: 'text', text: '統一編號必須為 8 位數字' }],
        isError: true,
      };
    }

    const companies = await lookupByTaxId(taxId);

    if (companies.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到統編「${taxId}」的公司` }],
      };
    }

    const c = companies[0];
    const text = [
      `${c.Company_Name}`,
      `統一編號: ${c.Business_Accounting_NO}`,
      `狀態: ${c.Company_Status_Desc}`,
      `資本額: ${formatCapital(c.Capital_Stock_Amount)}`,
      `實收資本額: ${formatCapital(c.Paid_In_Capital_Amount)}`,
      `負責人: ${c.Responsible_Name}`,
      `地址: ${c.Company_Location}`,
      `登記機關: ${c.Register_Organization_Desc}`,
      `設立日期: ${formatRocDate(c.Company_Setup_Date)}`,
      `最後變更: ${formatRocDate(c.Change_Of_Approval_Data)}`,
    ].join('\n');

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢公司詳情失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getCompanyDirectors(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const taxId = args.tax_id as string;
    if (!taxId) {
      return {
        content: [{ type: 'text', text: '請提供統一編號（tax_id 參數）' }],
        isError: true,
      };
    }

    if (!/^\d{8}$/.test(taxId)) {
      return {
        content: [{ type: 'text', text: '統一編號必須為 8 位數字' }],
        isError: true,
      };
    }

    const directors = await getDirectors(taxId);

    if (directors.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到統編「${taxId}」的董監事資料` }],
      };
    }

    const lines = directors.map((d, i) => {
      const holding = d.Person_Shareholding
        ? `持股 ${d.Person_Shareholding.toLocaleString()} 股`
        : '';
      const juristic = d.Juristic_Person_Name
        ? `（代表: ${d.Juristic_Person_Name}）`
        : '';
      return `${i + 1}. ${d.Person_Position_Name}: ${d.Person_Name}${juristic} ${holding}`;
    });

    return {
      content: [{
        type: 'text',
        text: `統編 ${taxId} 董監事名單（${directors.length} 人）\n\n${lines.join('\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢董監事失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getCompanyBusiness(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const taxId = args.tax_id as string;
    if (!taxId) {
      return {
        content: [{ type: 'text', text: '請提供統一編號（tax_id 參數）' }],
        isError: true,
      };
    }

    if (!/^\d{8}$/.test(taxId)) {
      return {
        content: [{ type: 'text', text: '統一編號必須為 8 位數字' }],
        isError: true,
      };
    }

    const results = await getBusinessItems(taxId);

    if (results.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到統編「${taxId}」的營業項目` }],
      };
    }

    const company = results[0];
    const items = company.Cmp_Business ?? [];

    if (items.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `${company.Company_Name}（${taxId}）暫無登記營業項目`,
        }],
      };
    }

    const lines = items.map(
      (b) => `${b.Business_Item} ${b.Business_Item_Desc}`
    );

    return {
      content: [{
        type: 'text',
        text: `${company.Company_Name} 營業項目（${items.length} 項）\n\n${lines.join('\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢營業項目失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function listCompanyStatus(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  const lines = Object.entries(COMPANY_STATUS).map(
    ([code, desc]) => `${code}: ${desc}`
  );

  return {
    content: [{
      type: 'text',
      text: `公司登記狀態代碼（${lines.length} 種）\n\n${lines.join('\n')}\n\n搜尋時預設只顯示「01 核准設立」的公司，可用 status 參數指定其他狀態。`,
    }],
  };
}
