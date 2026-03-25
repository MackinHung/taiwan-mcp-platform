import type { Env, ToolResult, ActiveFault } from '../types.js';
import { fetchActiveFaultsCsv, parseCsv, haversineDistance } from '../client.js';

/**
 * Get active faults near a given coordinate.
 * Fetches the CSV from GSMMA/data.gov.tw and computes distances.
 */
export async function getActiveFaultsNearby(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const latitude = args.latitude as number | undefined;
    const longitude = args.longitude as number | undefined;
    const radiusKm = (args.radius_km as number) ?? 50;

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

    const csvText = await fetchActiveFaultsCsv();
    const rows = parseCsv(csvText);

    if (rows.length === 0) {
      return {
        content: [{ type: 'text', text: '無法取得活動斷層資料' }],
        isError: true,
      };
    }

    const faults = parseFaultRows(rows);
    const nearby = findNearbyFaults(faults, latitude, longitude, radiusKm);

    if (nearby.length === 0) {
      return {
        content: [{
          type: 'text',
          text: `座標 (${latitude}, ${longitude}) 半徑 ${radiusKm} 公里內無已知活動斷層`,
        }],
      };
    }

    const lines = [
      `📍 查詢座標: (${latitude}, ${longitude})`,
      `🔍 搜尋半徑: ${radiusKm} 公里`,
      `📊 找到 ${nearby.length} 條活動斷層:`,
      '',
      ...nearby.map((f, i) => [
        `${i + 1}. ${f.fault.name}`,
        `   編號: ${f.fault.number}`,
        `   距離: ${f.distance.toFixed(1)} 公里`,
        `   長度: ${f.fault.length_km} 公里`,
        `   類型: ${f.fault.type}`,
        `   最近活動: ${f.fault.last_activity}`,
      ].join('\n')),
      '',
      '※ 資料來源：經濟部地質調查及礦業管理中心',
    ];

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `查詢附近活動斷層失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}

function parseFaultRows(rows: Record<string, string>[]): ActiveFault[] {
  return rows
    .filter((row) => {
      const lat = parseFloat(row['latitude'] ?? row['Latitude'] ?? row['lat'] ?? '');
      const lon = parseFloat(row['longitude'] ?? row['Longitude'] ?? row['lon'] ?? '');
      return !isNaN(lat) && !isNaN(lon);
    })
    .map((row) => ({
      name: row['name'] ?? row['Name'] ?? row['fault_name'] ?? row['FaultName'] ?? '未知斷層',
      number: row['number'] ?? row['Number'] ?? row['fault_no'] ?? row['FaultNo'] ?? '',
      latitude: parseFloat(row['latitude'] ?? row['Latitude'] ?? row['lat'] ?? '0'),
      longitude: parseFloat(row['longitude'] ?? row['Longitude'] ?? row['lon'] ?? '0'),
      length_km: parseFloat(row['length_km'] ?? row['Length'] ?? row['length'] ?? '0'),
      type: row['type'] ?? row['Type'] ?? row['fault_type'] ?? row['FaultType'] ?? '未知',
      last_activity: row['last_activity'] ?? row['LastActivity'] ?? row['activity'] ?? '未知',
    }));
}

interface NearbyFault {
  fault: ActiveFault;
  distance: number;
}

function findNearbyFaults(
  faults: ActiveFault[],
  lat: number,
  lon: number,
  radiusKm: number
): NearbyFault[] {
  const results: NearbyFault[] = [];
  for (const fault of faults) {
    const dist = haversineDistance(lat, lon, fault.latitude, fault.longitude);
    if (dist <= radiusKm) {
      results.push({ fault, distance: dist });
    }
  }
  return results.sort((a, b) => a.distance - b.distance);
}
