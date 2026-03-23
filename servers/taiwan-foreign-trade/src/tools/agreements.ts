import { fetchEcaFtaAgreements } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function listEcaFtaAgreementsTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const country = (args.country as string | undefined)?.trim() ?? '';
    const keyword = (args.keyword as string | undefined)?.trim() ?? '';

    const all = await fetchEcaFtaAgreements();

    let filtered = all;

    if (country.length > 0) {
      filtered = filtered.filter(
        (a) =>
          a.partnerCountry.includes(country) ||
          a.partnerCode.includes(country)
      );
    }

    if (keyword.length > 0) {
      filtered = filtered.filter(
        (a) =>
          a.name.includes(keyword) ||
          a.characteristics.includes(keyword)
      );
    }

    if (filtered.length === 0) {
      const parts: string[] = [];
      if (country) parts.push(`國家「${country}」`);
      if (keyword) parts.push(`關鍵字「${keyword}」`);
      const filterDesc = parts.length > 0 ? parts.join('、') : '';
      const msg = filterDesc
        ? `搜尋${filterDesc}查無相關經貿協定`
        : '目前無經貿協定資料';
      return { content: [{ type: 'text', text: msg }] };
    }

    const lines = filtered.map((a) => {
      return [
        `${a.name}`,
        `  生效日期: ${a.effectiveDate}`,
        `  夥伴國別: ${a.partnerCode}`,
        `  夥伴國家: ${a.partnerCountry}`,
        `  協定特性: ${a.characteristics}`,
      ].join('\n');
    });

    const parts: string[] = [];
    if (country) parts.push(`國家「${country}」`);
    if (keyword) parts.push(`關鍵字「${keyword}」`);
    const filterDesc = parts.length > 0 ? `搜尋${parts.join('、')}` : '';

    const header = filterDesc
      ? `${filterDesc}共找到 ${filtered.length} 筆經貿協定`
      : `台灣經貿協定（共 ${all.length} 筆）`;

    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n\n')}` }],
    };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `取得經貿協定失敗: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
