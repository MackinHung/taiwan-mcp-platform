import { fetchDrugData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getDrugByLicense(
  env: Env,
  args: Record<string, unknown>
): Promise<ToolResult> {
  try {
    const licenseNumber = args.licenseNumber as string | undefined;
    if (!licenseNumber || licenseNumber.trim().length === 0) {
      return {
        content: [{ type: 'text', text: '請提供許可證字號' }],
        isError: true,
      };
    }

    const trimmed = licenseNumber.trim();
    const data = await fetchDrugData(1000);
    const found = data.find(
      (r) => r['許可證字號'] && r['許可證字號'].includes(trimmed)
    );

    if (!found) {
      return {
        content: [
          { type: 'text', text: `查無許可證字號「${trimmed}」的藥品` },
        ],
      };
    }

    const lines = [
      `許可證字號: ${found['許可證字號'] ?? '未知'}`,
      `中文品名: ${found['中文品名'] ?? '未知'}`,
      `英文品名: ${found['英文品名'] ?? '未知'}`,
      `適應症: ${found['適應症'] ?? '未知'}`,
      `藥品類別: ${found['藥品類別'] ?? '未知'}`,
      `劑型: ${found['劑型'] ?? '未知'}`,
      `主成分: ${found['主成分略述'] ?? '未知'}`,
      `申請商: ${found['申請商名稱'] ?? '未知'}`,
      `製造商: ${found['製造商名稱'] ?? '未知'}`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `查詢許可證失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
