import { getSportTypeSummary, getAllFacilities } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getSportTypes(
  _env: Env,
  _args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const summary = getSportTypeSummary();
    const totalFacilities = getAllFacilities().length;

    const lines = summary.map((s) =>
      `- ${s.sportType}：${s.count} 間場館`
    );

    const header = `全國運動場館統計（共 ${totalFacilities} 間場館）\n支援的運動項目及場館數量：`;
    return {
      content: [{ type: 'text', text: `${header}\n\n${lines.join('\n')}` }],
    };
  } catch (err) {
    return {
      content: [{ type: 'text', text: `取得運動項目失敗: ${(err as Error).message}` }],
      isError: true,
    };
  }
}
