import type { Env, ToolResult } from '../types.js';
import {
  normalizeCity,
  fetchArcGis,
  fetchTaichungApi,
  ARCGIS_LAYERS,
} from '../client.js';

/**
 * query_urban_renewal_areas: 查詢都市更新與重劃區資訊
 */
export async function queryUrbanRenewalAreas(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const cityArg = args.city as string;
    if (!cityArg) {
      return {
        content: [{ type: 'text', text: '錯誤：請提供城市名稱（city 參數）' }],
        isError: true,
      };
    }

    const city = normalizeCity(cityArg);
    const status = args.status as string | undefined;

    // Route to Taichung API
    if (city === '臺中市') {
      return await queryTaichungRenewal(city, status);
    }

    // Default: Taipei ArcGIS REST
    let where = '1=1';
    if (status) {
      const statusMap: Record<string, string> = {
        planned: '規劃中',
        approved: '已核定',
        completed: '已完成',
      };
      const mapped = statusMap[status.toLowerCase()] ?? status;
      where = `STATUS LIKE '%${mapped}%'`;
    }

    const data = await fetchArcGis(ARCGIS_LAYERS.URBAN_RENEWAL, {
      where,
      outFields: '*',
      returnGeometry: 'false',
    });

    if (!data.features || data.features.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `${city} 查無都市更新/重劃區資料${status ? `（狀態篩選：${status}）` : ''}`,
        }],
      };
    }

    const lines = data.features.map((f, i) => {
      const attrs = f.attributes;
      const name = (attrs.NAME ?? attrs.PROJECT_NAME ?? '未知案名') as string;
      const approvalDate = (attrs.APPROVAL_DATE ?? attrs.ApprovalDate ?? '') as string;
      const featureStatus = (attrs.STATUS ?? attrs.Stage ?? '') as string;
      const area = attrs.AREA_SQM ?? attrs.Shape_Area;

      const parts = [`${i + 1}. 更新案名稱：${name}`];
      if (featureStatus) parts.push(`   開發階段：${featureStatus}`);
      if (approvalDate) parts.push(`   核定日期：${approvalDate}`);
      if (area) parts.push(`   面積：${Number(area).toFixed(2)} 平方公尺`);
      return parts.join('\n');
    });

    const header = `${city} 都市更新/重劃區查詢結果${status ? `（狀態：${status}）` : ''}\n共 ${data.features.length} 筆資料\n${'─'.repeat(30)}`;
    return { content: [{ type: 'text', text: `${header}\n${lines.join('\n\n')}` }] };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `查詢都市更新失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}

async function queryTaichungRenewal(city: string, status?: string): Promise<ToolResult> {
  const params: Record<string, string> = {};
  if (status) params.status = status;

  const data = await fetchTaichungApi('UrbanRenewal', params);

  if (!data.result || data.result.length === 0) {
    return {
      content: [{
        type: 'text',
        text: `${city} 查無都市更新/重劃區資料${status ? `（狀態篩選：${status}）` : ''}`,
      }],
    };
  }

  const lines = data.result.map((item, i) => {
    const parts = [`${i + 1}. 更新案名稱：${item.zone_name}`];
    if (item.status) parts.push(`   開發階段：${item.status}`);
    if (item.approval_date) parts.push(`   核定日期：${item.approval_date}`);
    if (item.area_sqm) parts.push(`   面積：${item.area_sqm.toFixed(2)} 平方公尺`);
    return parts.join('\n');
  });

  const header = `${city} 都市更新/重劃區查詢結果${status ? `（狀態：${status}）` : ''}\n共 ${data.result.length} 筆資料\n${'─'.repeat(30)}`;
  return { content: [{ type: 'text', text: `${header}\n${lines.join('\n\n')}` }] };
}
