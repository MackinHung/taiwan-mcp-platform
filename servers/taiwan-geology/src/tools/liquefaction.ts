import type { Env, ToolResult } from '../types.js';
import { fetchWmsFeatureInfo } from '../client.js';

/**
 * Query soil liquefaction potential for a given coordinate.
 * Uses GSMMA WMS GetFeatureInfo to query the liquefaction layer.
 */
export async function queryLiquefactionPotential(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const latitude = args.latitude as number | undefined;
    const longitude = args.longitude as number | undefined;

    if (latitude === undefined || longitude === undefined) {
      return {
        content: [{ type: 'text', text: '錯誤：必須提供 latitude 和 longitude 參數' }],
        isError: true,
      };
    }

    if (latitude < 21.5 || latitude > 25.5 || longitude < 119.0 || longitude > 122.5) {
      return {
        content: [{ type: 'text', text: '錯誤：座標超出台灣範圍（緯度 21.5-25.5，經度 119.0-122.5）' }],
        isError: true,
      };
    }

    const wmsResponse = await fetchWmsFeatureInfo(
      latitude,
      longitude,
      'Liquefaction_Potential'
    );

    if (!wmsResponse || wmsResponse.trim().length === 0) {
      return {
        content: [{
          type: 'text',
          text: `座標 (${latitude}, ${longitude}) 無土壤液化潛勢資料（可能不在調查範圍內）`,
        }],
      };
    }

    const level = parseLiquefactionLevel(wmsResponse);
    const levelDesc = getLevelDescription(level);

    const lines = [
      `📍 查詢座標: (${latitude}, ${longitude})`,
      `🔬 土壤液化潛勢: ${level}`,
      `📋 說明: ${levelDesc}`,
      '',
      '※ 資料來源：經濟部地質調查及礦業管理中心',
      '※ 本資料為潛勢分析結果，僅供參考',
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `查詢土壤液化潛勢失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

function parseLiquefactionLevel(wmsText: string): string {
  const lower = wmsText.toLowerCase();
  if (lower.includes('high') || lower.includes('高')) return '高潛勢';
  if (lower.includes('medium') || lower.includes('中')) return '中潛勢';
  if (lower.includes('low') || lower.includes('低')) return '低潛勢';
  return '無資料';
}

function getLevelDescription(level: string): string {
  switch (level) {
    case '高潛勢':
      return '該區域土壤液化風險較高，建議進行地質鑽探評估。地震時可能產生噴砂、沉陷等現象。';
    case '中潛勢':
      return '該區域土壤液化風險中等，建議於設計規劃時考量液化潛勢。';
    case '低潛勢':
      return '該區域土壤液化風險較低，一般建築設計即可滿足安全需求。';
    default:
      return '無調查資料或不在調查範圍內。';
  }
}
