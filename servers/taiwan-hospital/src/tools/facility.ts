import type { Env, ToolResult, FacilityRecord } from '../types.js';
import {
  FACILITY_TYPES,
  AREA_CODES,
  fetchFacilities,
  searchFacilitiesByName,
  fetchMultipleTypes,
} from '../client.js';

function formatRecord(record: FacilityRecord, index: number): string {
  const type = record.HOSP_CODE_CNAME || '';
  const departments = record.FUNCTYPE_CNAME
    ? record.FUNCTYPE_CNAME.split(',').slice(0, 5).join('、')
    : '';
  const services = record.SERVICE_CNAME
    ? record.SERVICE_CNAME.split(',').slice(0, 3).join('、')
    : '';

  const lines = [
    `${index + 1}. ${record.HOSP_NAME}`,
    `   類型: ${type} | 電話: ${record.TEL}`,
    `   地址: ${record.ADDRESS}`,
  ];

  if (departments) lines.push(`   科別: ${departments}`);
  if (services) lines.push(`   服務: ${services}`);

  return lines.join('\n');
}

export async function searchFacility(
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
    const facilityType = args.type as string | undefined;

    let resourceIds: string[];
    if (facilityType) {
      const ft = FACILITY_TYPES.find((t) => t.id === facilityType);
      if (!ft) {
        const available = FACILITY_TYPES.map((t) => `${t.id}（${t.name}）`).join('、');
        return {
          content: [{ type: 'text', text: `找不到類型「${facilityType}」。可用: ${available}` }],
        };
      }
      resourceIds = [ft.resourceId];
    } else {
      resourceIds = FACILITY_TYPES.map((t) => t.resourceId);
    }

    const results = await Promise.allSettled(
      resourceIds.map((rid) => searchFacilitiesByName(rid, keyword, limit))
    );

    const items: FacilityRecord[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        items.push(...r.value);
      }
    }

    if (items.length === 0) {
      return {
        content: [{ type: 'text', text: `找不到包含「${keyword}」的醫療機構` }],
      };
    }

    const top = items.slice(0, limit);
    const lines = top.map(formatRecord);
    return {
      content: [{
        type: 'text',
        text: `搜尋「${keyword}」結果（${top.length} 筆）\n\n${lines.join('\n\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `搜尋醫療機構失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getFacilityDetail(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const hospId = args.hosp_id as string;
    if (!hospId) {
      return {
        content: [{ type: 'text', text: '請提供醫事機構代碼（hosp_id 參數）' }],
        isError: true,
      };
    }

    const resourceIds = FACILITY_TYPES.map((t) => t.resourceId);
    const results = await Promise.allSettled(
      resourceIds.map((rid) =>
        fetchFacilities(rid, { limit: 1, filters: { HOSP_ID: hospId } })
      )
    );

    let found: FacilityRecord | undefined;
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.length > 0) {
        found = r.value[0];
        break;
      }
    }

    if (!found) {
      return {
        content: [{ type: 'text', text: `找不到代碼為「${hospId}」的醫療機構` }],
      };
    }

    const departments = found.FUNCTYPE_CNAME
      ? found.FUNCTYPE_CNAME.split(',').join('、')
      : '（無資料）';
    const services = found.SERVICE_CNAME
      ? found.SERVICE_CNAME.split(',').join('、')
      : '（無資料）';
    const schedule = found.HOLIDAYDUTY_CNAME
      ? found.HOLIDAYDUTY_CNAME.split(',').join('\n   ')
      : '（無資料）';

    const text = [
      `${found.HOSP_NAME}`,
      `代碼: ${found.HOSP_ID}`,
      `類型: ${found.HOSP_CODE_CNAME}`,
      `電話: ${found.TEL}`,
      `地址: ${found.ADDRESS}`,
      `轄區: ${found.BRANCH_TYPE_CNAME}`,
      `科別: ${departments}`,
      `服務: ${services}`,
      `特約起日: ${found.CONT_S_DATE}`,
      `看診時段:\n   ${schedule}`,
    ].join('\n');

    return { content: [{ type: 'text', text }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢機構詳情失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getFacilitiesByArea(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const area = args.area as string;
    if (!area) {
      const available = Object.keys(AREA_CODES).join('、');
      return {
        content: [{ type: 'text', text: `請提供縣市名稱（area 參數）。可用: ${available}` }],
        isError: true,
      };
    }

    const areaCode = AREA_CODES[area];
    if (!areaCode) {
      const available = Object.keys(AREA_CODES).join('、');
      return {
        content: [{ type: 'text', text: `找不到「${area}」。可用縣市: ${available}` }],
      };
    }

    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 50);
    const facilityType = args.type as string | undefined;

    let resourceIds: string[];
    if (facilityType) {
      const ft = FACILITY_TYPES.find((t) => t.id === facilityType);
      if (!ft) {
        const available = FACILITY_TYPES.map((t) => `${t.id}（${t.name}）`).join('、');
        return {
          content: [{ type: 'text', text: `找不到類型「${facilityType}」。可用: ${available}` }],
        };
      }
      resourceIds = [ft.resourceId];
    } else {
      resourceIds = FACILITY_TYPES.filter(
        (t) => t.id !== 'clinic' && t.id !== 'pharmacy'
      ).map((t) => t.resourceId);
    }

    const items = await fetchMultipleTypes(resourceIds, {
      limit: limit * 2,
      filters: { GOVAREANO: areaCode },
    });

    if (items.length === 0) {
      return {
        content: [{ type: 'text', text: `${area} 沒有找到醫療機構` }],
      };
    }

    const top = items.slice(0, limit);
    const lines = top.map(formatRecord);
    return {
      content: [{
        type: 'text',
        text: `${area} 醫療機構（${top.length} 筆）\n\n${lines.join('\n\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢區域醫療機構失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function getPharmacies(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const area = args.area as string;
    const keyword = args.keyword as string;

    if (!area && !keyword) {
      return {
        content: [{
          type: 'text',
          text: '請提供縣市名稱（area）或藥局名稱關鍵字（keyword）',
        }],
        isError: true,
      };
    }

    const limit = Math.min(Math.max((args.limit as number) ?? 20, 1), 50);
    const pharmacyType = FACILITY_TYPES.find((t) => t.id === 'pharmacy')!;

    let records: FacilityRecord[];

    if (keyword) {
      records = await searchFacilitiesByName(
        pharmacyType.resourceId,
        keyword,
        limit
      );
    } else {
      const areaCode = AREA_CODES[area];
      if (!areaCode) {
        const available = Object.keys(AREA_CODES).join('、');
        return {
          content: [{ type: 'text', text: `找不到「${area}」。可用縣市: ${available}` }],
        };
      }
      records = await fetchFacilities(pharmacyType.resourceId, {
        limit: limit * 2,
        filters: { GOVAREANO: areaCode },
      });
    }

    if (records.length === 0) {
      const target = keyword ? `「${keyword}」` : area;
      return {
        content: [{ type: 'text', text: `找不到${target}的藥局` }],
      };
    }

    const top = records.slice(0, limit);
    const lines = top.map(formatRecord);
    const label = keyword ? `搜尋「${keyword}」` : `${area}`;
    return {
      content: [{
        type: 'text',
        text: `${label} 藥局（${top.length} 筆）\n\n${lines.join('\n\n')}`,
      }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢藥局失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

export async function listFacilityTypes(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  const typeLines = FACILITY_TYPES.map(
    (t) => `${t.id}（${t.name}）`
  );

  const areaLines = Object.entries(AREA_CODES).map(
    ([name, code]) => `${name}（${code}）`
  );

  const text = [
    `醫療機構類型（${FACILITY_TYPES.length} 種）`,
    typeLines.join('\n'),
    '',
    `可查詢縣市（${Object.keys(AREA_CODES).length} 個）`,
    areaLines.join('、'),
  ].join('\n');

  return { content: [{ type: 'text', text }] };
}
