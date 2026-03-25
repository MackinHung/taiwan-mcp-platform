import type { Env, ToolResult } from '../types.js';
import { fetchWmsFeatureInfo } from '../client.js';

/**
 * Get geological map info for a given coordinate.
 * Uses GSMMA WMS GetFeatureInfo to query the geological map layer.
 */
export async function getGeologicalInfo(
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
      'GeologicalMap_50K'
    );

    if (!wmsResponse || wmsResponse.trim().length === 0) {
      return {
        content: [{
          type: 'text',
          text: `座標 (${latitude}, ${longitude}) 無地質圖資料（可能位於海域或未調查區域）`,
        }],
      };
    }

    const info = parseGeologicalInfo(wmsResponse);

    const lines = [
      `📍 查詢座標: (${latitude}, ${longitude})`,
      `🗺️ 地質圖資訊 (1:50,000)`,
      '',
      `地層名稱: ${info.formation}`,
      `地質年代: ${info.age}`,
      `岩性描述: ${info.lithology}`,
      `地層代號: ${info.code}`,
      '',
      '※ 資料來源：經濟部地質調查及礦業管理中心',
      '※ 比例尺 1:50,000，詳細地質資訊請參考現地調查',
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得地質圖資訊失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

interface GeologicalInfo {
  formation: string;
  age: string;
  lithology: string;
  code: string;
}

function parseGeologicalInfo(wmsText: string): GeologicalInfo {
  const lines = wmsText.split('\n').map((l) => l.trim()).filter(Boolean);

  let formation = '未知';
  let age = '未知';
  let lithology = '未知';
  let code = '未知';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('formation') || lower.includes('地層') || lower.includes('name')) {
      formation = extractValue(line);
    }
    if (lower.includes('age') || lower.includes('年代') || lower.includes('era')) {
      age = extractValue(line);
    }
    if (lower.includes('lithology') || lower.includes('岩性') || lower.includes('rock')) {
      lithology = extractValue(line);
    }
    if (lower.includes('code') || lower.includes('代號') || lower.includes('symbol')) {
      code = extractValue(line);
    }
  }

  // If no structured parsing, use the raw text as formation description
  if (formation === '未知' && lines.length > 0) {
    formation = lines.join('; ');
  }

  return { formation, age, lithology, code };
}

function extractValue(line: string): string {
  // Try common separators: =, :, |
  for (const sep of ['=', ':', '|']) {
    const idx = line.indexOf(sep);
    if (idx >= 0) {
      return line.substring(idx + 1).trim();
    }
  }
  return line;
}
