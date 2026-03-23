import type { Env, ToolResult } from '../types.js';
import { CITY_NAMES, ALL_CITY_IDS } from '../types.js';

export async function listSupportedCitiesTool(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  const lines = ALL_CITY_IDS.map((id) => `- ${id}: ${CITY_NAMES[id]}`);

  const text = [
    '支援的城市（六都）:',
    '',
    ...lines,
    '',
    '使用方式: 在其他工具的 city 參數中指定城市 ID',
    '例如: city = "taipei" 表示台北市',
  ].join('\n');

  return {
    content: [{ type: 'text', text }],
  };
}
