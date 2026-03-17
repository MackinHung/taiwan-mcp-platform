# WG-4: 安全標章與流程研究團

> **Agent 自主維護**: 本文件由工作中的 agent 持續更新。
> 新增掃描規則後應更新架構清單；發現新的安全議題或 pattern 應補充到對應段落。

**性質**: 混合子專案 — 研究 + 有限度代碼修改（僅 `packages/review/`）
**研究範圍**: `docs/security/` 目錄 + 全網搜尋
**代碼範圍**: 僅 `packages/review/` (rules/ + src/badge.ts + src/scanner.ts)
**不碰**: 其他任何 packages/ 或 servers/

---

## 現有 Review 架構

```
packages/review/
  rules/
    eval-detect.ts        — eval/exec/Function 偵測
    network-check.ts      — 外連 URL 偵測 + 聲明比對
    env-leak.ts           — 環境變數洩漏 + 硬編碼 secret
    prompt-injection.ts   — Tool description 注入偵測
    cve-check.ts          — 依賴套件 CVE（stub，硬編碼 DB）
  src/
    scanner.ts            — Layer 1 orchestrator
    badge.ts              — 4 維度標章計算
    sandbox.ts            — Layer 2 stub（待實作）
    report.ts             — 審核報告生成
    pipeline.ts           — scan → badge → report 流程
```

---

## 4 維度標章系統

```
Source:     undeclared → declared → open → open_audited
Data:       public → account → personal → sensitive
Permission: readonly → limited_write → full_write → system
Community:  new → rising(100+) → popular(1k+) → trusted(10k+ & 50+ stars)
```

## 審核流程（3 Layer）

```
Layer 1 (自動 <2min): 靜態掃描 5 rules → pass/warn/fail
Layer 2 (自動): 沙箱行為測試 → 聲明比對 (目前是 stub)
Layer 3 (人工 <10%): 人工審查（個資/金融/寫入/obfuscated）
```

---

## 研究 + 開發議題

| 類型 | 議題 | 產出 |
|------|------|------|
| 研究 | Layer 2 沙箱設計 (Workers 限制下) | docs/security/ 報告 |
| 研究 | 標章可信度 — 用戶理解度 | docs/security/ 報告 |
| 研究 | npm/Chrome/App Store 審核流程對比 | docs/security/ 報告 |
| 開發 | 新 rule: rug-pull pattern detection | rules/rug-pull.ts (TDD) |
| 開發 | 新 rule: dependency confusion detection | rules/dep-confusion.ts (TDD) |
| 開發 | 新 rule: typosquatting detection | rules/typosquat.ts (TDD) |
| 開發 | cve-check.ts 接真實 CVE API | 改進 rules/cve-check.ts |
| 開發 | badge.ts 加入升級/降級時間衰減 | 改進 src/badge.ts |
| 開發 | 社群信號防刷（Sybil resistance） | 改進 badge community 計算 |

---

## 團隊模板

```
TeamCreate: security-{topic}
Agents:
  - security-researcher (Explore): 搜尋安全相關資源
  - rule-developer (general-purpose): 新掃描規則開發 (TDD)
  - badge-analyst (Plan): 分析標章邏輯有效性
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
