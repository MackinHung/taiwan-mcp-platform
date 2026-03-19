# WG-4: 安全標章與審核

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 新增掃描規則後應更新架構清單；發現新的安全議題或 pattern 應補充到對應段落。

**性質**: 混合子專案 — 研究 + 有限度代碼修改（僅 `packages/review/`）
**代碼範圍**: 僅 `packages/review/` (rules/ + src/)
**不碰**: 其他任何 packages/ 或 servers/

---

## 設計原則

本平台為**唯讀政府資料代理**，不儲存敏感個資。安全設計應與風險匹配，避免矯枉過正：
- Layer 1 自動靜態掃描已足夠覆蓋主要風險
- 不需要沙箱行為測試（MCP servers 只呼叫政府 API）
- 人工審查由 owner 視情況進行，不需要建流程系統

---

## 現有 Review 架構

```
packages/review/
  rules/
    eval-detect.ts        — eval/exec/Function 偵測
    network-check.ts      — 外連 URL 偵測 + 聲明比對
    env-leak.ts           — 環境變數洩漏 + 硬編碼 secret
    prompt-injection.ts   — Tool description 注入偵測
    cve-check.ts          — 依賴套件 CVE（硬編碼 DB，夠用）
    obfuscation-detect.ts — 混淆代碼偵測
    typosquatting-detect.ts — 套件名仿冒偵測
    suspicious-pattern.ts — 可疑模式偵測
  src/
    scanner.ts            — 掃描 orchestrator
    badge.ts              — 4 維度標章計算
    report.ts             — 審核報告生成
    pipeline.ts           — scan → badge → report 流程
    sbom.ts               — SBOM 生成
    virustotal.ts         — VirusTotal 整合
    external-scan.ts      — 外部掃描整合
    rescan.ts             — 重掃機制
```

---

## 4 維度標章系統

```
Source:     undeclared → declared → open → open_audited
Data:       public → account → personal → sensitive
Permission: readonly → limited_write → full_write → system
Community:  new → rising(100+) → popular(1k+) → trusted(10k+ & 50+ stars)
```

## 審核流程

```
自動掃描 (<2min): 8 rules 靜態掃描 → pass/warn/fail → 標章計算 → 報告
人工審查 (視需要): owner 針對 warn/fail 結果人工判讀，無需正式流程
```

---

## 已完成項目

- 8 條靜態掃描規則（含 typosquatting、obfuscation、suspicious pattern）
- 4 維度標章系統
- scan → badge → report pipeline
- SBOM 生成、VirusTotal 整合、外部掃描、重掃機制
- 事件應變 SOP (`docs/security/incident-response-sop.md`)

## 低優先可選項目

| 議題 | 說明 | 優先度 |
|------|------|--------|
| cve-check 接真實 API | 目前硬編碼 DB 已夠用，有需要再接 | 低 |
| 標章可信度用戶研究 | 了解用戶是否理解標章含義 | 低 |

---

## 團隊模板

```
TeamCreate: security-{topic}
Agents:
  - security-researcher (Explore): 搜尋安全相關資源
  - rule-developer (general-purpose): 新掃描規則開發 (TDD)
代碼修改必須 TDD + 跑 packages/review 全測試
```

## 新 Rule 開發 Pattern

```typescript
// rules/{name}.ts
import type { RuleResult } from '../src/types.js';
export function ruleName(source: string, ...args): RuleResult {
  // scan logic → return { rule, status, severity, message, locations? }
}

// tests/rules/{name}.test.ts — 寫在實作之前
describe('ruleName', () => {
  it('detects pattern X', () => { ... });
  it('passes clean code', () => { ... });
});
```
