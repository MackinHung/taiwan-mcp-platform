import { fetchAllSchools } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getSchoolDetails(
  _env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const name = args.name as string | undefined;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供學校名稱' }],
        isError: true,
      };
    }

    const trimmedName = name.trim();
    const records = await fetchAllSchools({ keyword: trimmedName });

    // Try exact match first, then partial match
    const exactMatch = records.find((r) => r.name === trimmedName);
    const match = exactMatch ?? records.find((r) => r.name.includes(trimmedName));

    if (!match) {
      // Suggest similar schools if any partial matches exist
      const suggestions = records.slice(0, 5).map((r) => r.name);
      const suggestionText = suggestions.length > 0
        ? `\n\n您可能在找：${suggestions.join('、')}`
        : '';
      return {
        content: [{
          type: 'text',
          text: `查無「${trimmedName}」的學校資料${suggestionText}`,
        }],
      };
    }

    const detail = {
      name: match.name,
      code: match.code,
      level: match.level,
      publicPrivate: match.publicPrivate,
      city: match.city,
      address: match.address,
      phone: match.phone,
      website: match.website,
    };

    return {
      content: [{ type: 'text', text: JSON.stringify(detail, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `取得學校詳情失敗: ${(err as Error).message}`,
      }],
      isError: true,
    };
  }
}
