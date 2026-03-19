# 安全政策 Security Policy

## 支援版本

| 版本 | 支援狀態 |
|------|----------|
| latest (master) | ✅ 支援中 |

## 漏洞回報 Reporting a Vulnerability

發現安全漏洞時，請透過以下方式負責任地回報：

1. **請勿**在公開 Issue 中揭露漏洞細節
2. 請使用 [GitHub 私人漏洞回報功能](https://github.com/MackinHung/taiwan-mcp-platform/security/advisories/new) 提交報告
3. 報告中請包含：
   - 漏洞描述
   - 重現步驟
   - 潛在影響範圍
   - 建議修復方式(如果有的話)

## 安全功能 Security Features

本平台內建以下安全機制：

### 供應鏈安全
- **SBOM 生成** — CycloneDX 1.5 格式
- **VirusTotal 整合** — 套件掃描，具備降級容錯機制
- **OSV 定期掃描** — 定期比對 OSV 資料庫偵測已知漏洞

### 執行期防護
- **L2 行為沙箱** — 執行期 trace 分析與違規偵測
- **執行期監控** — 自動偵測工具濫用、錯誤率突增、新增 URL 模式
- **權限邊界執行** — 軟性 log-only 權限邊界控管

### 認證與存取控制
- **OAuth 認證** — GitHub + Google OAuth，安全 Session 管理
- **速率限制** — 所有 API 端點均設有 KV 支援的速率限制
- **輸入驗證** — 所有 API 輸入均透過 Zod Schema 驗證

### 信任評估
- **四維度信任標章** — 程式碼透明度、資料敏感度、權限範圍、社群信任自動評分


## 合規 Compliance

- 台灣個人資料保護法（PDPA）合規
- APEC CBPR 跨境隱私規則保障
- 資料外洩通報承諾(會盡量避免)
