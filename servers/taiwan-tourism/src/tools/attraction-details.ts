import { fetchAttractions } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getAttractionDetails(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return {
        content: [{ type: 'text', text: '請提供景點名稱' }],
        isError: true,
      };
    }

    const { records } = await fetchAttractions({
      keyword: name.trim(),
      limit: 10,
    });

    if (!records || records.length === 0) {
      return {
        content: [{ type: 'text', text: `查無景點「${name}」的詳細資料` }],
      };
    }

    // Find exact or best match
    const exactMatch = records.find(
      (r) => (r['Name'] ?? r['name'] ?? '') === name.trim()
    );
    const record = exactMatch ?? records[0];

    const detail = {
      name: record['Name'] ?? record['name'] ?? '未知',
      address: record['Add'] ?? record['Address'] ?? record['address'] ?? '',
      phone: record['Phone'] ?? record['Tel'] ?? record['phone'] ?? '',
      openTime: record['Opentime'] ?? record['openTime'] ?? '',
      ticketInfo: record['Ticketinfo'] ?? record['ticketInfo'] ?? '',
      description: record['Description'] ?? record['description'] ?? '',
      city: record['Region'] ?? record['region'] ?? '',
      category: record['Class1'] ?? record['Class'] ?? record['category'] ?? '',
      lat: record['Py'] ?? record['lat'] ?? '',
      lng: record['Px'] ?? record['lng'] ?? '',
      photoUrl: record['Picture1'] ?? record['photoUrl'] ?? '',
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得景點詳情失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
