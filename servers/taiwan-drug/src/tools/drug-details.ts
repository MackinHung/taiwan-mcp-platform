import { fetchDrugData } from '../client.js';
import type { Env, ToolResult } from '../types.js';

export async function getDrugDetails(
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
          { type: 'text', text: `查無許可證字號「${trimmed}」的藥品詳細資訊` },
        ],
      };
    }

    const lines = [
      `=== 藥品完整資訊 ===`,
      `許可證字號: ${found['許可證字號'] ?? '未知'}`,
      `許可證種類: ${found['許可證種類'] ?? '未知'}`,
      ``,
      `【品名】`,
      `  中文品名: ${found['中文品名'] ?? '未知'}`,
      `  英文品名: ${found['英文品名'] ?? '未知'}`,
      ``,
      `【分類】`,
      `  藥品類別: ${found['藥品類別'] ?? '未知'}`,
      `  劑型: ${found['劑型'] ?? '未知'}`,
      `  管制藥品分類級別: ${found['管制藥品分類級別'] ?? '無'}`,
      ``,
      `【成分與適應症】`,
      `  主成分: ${found['主成分略述'] ?? '未知'}`,
      `  適應症: ${found['適應症'] ?? '未知'}`,
      ``,
      `【廠商資訊】`,
      `  申請商: ${found['申請商名稱'] ?? '未知'}`,
      `  申請商地址: ${found['申請商地址'] ?? '未知'}`,
      `  製造商: ${found['製造商名稱'] ?? '未知'}`,
      `  製造商地址: ${found['製造商地址'] ?? '未知'}`,
      ``,
      `【許可日期】`,
      `  發證日期: ${found['發證日期'] ?? '未知'}`,
      `  有效日期: ${found['有效日期'] ?? '未知'}`,
    ];

    return {
      content: [{ type: 'text', text: lines.join('\n') }],
    };
  } catch (err) {
    return {
      content: [
        { type: 'text', text: `取得藥品詳細資訊失敗: ${(err as Error).message}` },
      ],
      isError: true,
    };
  }
}
