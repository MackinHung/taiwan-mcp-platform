# UI/UX Pro Max Skill — 冷啟動指南

> **用途**: 本文件供 agent 執行平台 UI 工作時快速參考 UI/UX Pro Max Skill 的規則與流程。
> **來源**: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)（`.claude/skills/ui-ux-pro-max/SKILL.md`）
> **適用範圍**: `packages/ui/public/` 下的所有 HTML、JS、CSS 檔案

---

## 什麼是 UI/UX Pro Max Skill

一套 AI design intelligence 系統，包含 50+ styles、161 color palettes、57 font pairings、99 UX guidelines、25 chart types，橫跨 10 個技術棧。提供 priority-based 的設計規則與 searchable database。

### 何時使用

- **必須使用**: 設計新頁面、建立/重構 UI 元件、選擇配色/字型/排版、Review UI 無障礙性與一致性
- **建議使用**: UI 看起來不夠專業但原因不明、上線前品質優化、跨平台設計對齊
- **不需要**: 純 backend/API/DB 邏輯、DevOps、非視覺自動化腳本

### 如何調用

```bash
# 生成完整 design system（新頁面/新專案必做）
python3 skills/ui-ux-pro-max/scripts/search.py "<product_type> <keywords>" --design-system -p "Project Name"

# 特定 domain 深入查詢
python3 skills/ui-ux-pro-max/scripts/search.py "<keyword>" --domain <domain>

# 可用 domains: product, style, color, typography, landing, chart, ux, google-fonts, react, web, prompt
```

---

## 10 大規則類別（按優先級）

| # | Category | Impact | 關鍵檢查 | 反模式 |
|---|----------|--------|----------|--------|
| 1 | **Accessibility** | CRITICAL | Contrast 4.5:1、focus rings、alt text、keyboard nav、aria-labels | 移除 focus ring、icon-only button 無 label |
| 2 | **Touch & Interaction** | CRITICAL | Min 44x44px、8px+ spacing、loading feedback | 僅依賴 hover、0ms 狀態切換 |
| 3 | **Performance** | HIGH | WebP/AVIF、lazy loading、CLS < 0.1、skeleton loading | Layout thrashing、cumulative layout shift |
| 4 | **Style Selection** | HIGH | 風格一致、SVG icons（非 emoji）、平台適配 | Flat 與 skeuomorphic 混用、emoji 當 icon |
| 5 | **Layout & Responsive** | HIGH | Mobile-first、viewport meta、無水平捲動 | 固定 px 寬度、禁用 zoom |
| 6 | **Typography & Color** | MEDIUM | Base 16px、line-height 1.5、semantic color tokens | Body text < 12px、raw hex in components |
| 7 | **Animation** | MEDIUM | 150-300ms duration、transform/opacity only、motion 有意義 | 純裝飾動畫、animate width/height、無 reduced-motion |
| 8 | **Forms & Feedback** | MEDIUM | Visible labels、error near field、progressive disclosure | Placeholder-only label、top-only errors |
| 9 | **Navigation Patterns** | HIGH | Predictable back、bottom nav <=5 items、deep linking | Overloaded nav、broken back behavior |
| 10 | **Charts & Data** | LOW | Legends visible、accessible colors、interactive tooltips | 僅用顏色區分資料 |

---

## Agent 快速檢查清單

在修改 `packages/ui/public/` 的 HTML/JS/CSS 時，依序檢查：

### CRITICAL（必須通過）
- [ ] 文字 contrast ratio >= 4.5:1（大字 3:1）
- [ ] 所有 interactive element 有 visible focus ring（2-4px）
- [ ] Icon-only button 有 `aria-label`
- [ ] 可點擊元素最小 44x44px
- [ ] Touch targets 間距 >= 8px
- [ ] Async 操作有 loading feedback（spinner / skeleton）

### HIGH（應該通過）
- [ ] 使用 SVG icon（Lucide-style），非 emoji
- [ ] 圖片有 `width`/`height` 或 `aspect-ratio`（防 CLS）
- [ ] Mobile-first：375px 可正常瀏覽、無水平捲動
- [ ] `<meta name="viewport" content="width=device-width, initial-scale=1">`
- [ ] Spacing 遵循 4/8px 系統
- [ ] Nav 一致：所有頁面相同結構

### MEDIUM（盡量通過）
- [ ] Body font >= 16px、line-height 1.5+
- [ ] 使用 semantic color tokens（CSS variables），非 hardcoded hex
- [ ] 動畫 150-300ms、僅用 transform/opacity
- [ ] 支援 `prefers-reduced-motion`
- [ ] Form inputs 有 visible label（非僅 placeholder）
- [ ] Error 訊息顯示在相關欄位旁

---

## Pre-Delivery Checklist

交付 UI 代碼前的最終驗證：

### Visual Quality
- [ ] 無 emoji 作為 structural icon（平台已改用 Lucide-style SVG）
- [ ] Icon 來自同一 icon family，stroke width 一致
- [ ] Hover/pressed state 不造成 layout shift（用 `filter: brightness()` 非 `transform: scale()`）
- [ ] 使用 CSS variables（`var(--primary)` 等），非 ad-hoc hex

### Interaction
- [ ] 所有可點擊元素有 `cursor: pointer`
- [ ] Button async 操作時 disable + 顯示 spinner
- [ ] Tab order 符合視覺順序

### Light/Dark Mode（若適用）
- [ ] 兩個主題下文字 contrast >= 4.5:1
- [ ] Dividers/borders 在兩個主題下均可見
- [ ] Modal scrim 足夠深（40-60% black）

### Layout
- [ ] Safe area 正確（header/footer 不被裁切）
- [ ] 375px（小手機）與 1440px（桌面）均正常
- [ ] 固定元素（nav/footer）不遮擋捲動內容
- [ ] 8px spacing rhythm 一致

### Accessibility
- [ ] 有意義的圖片/icon 有 alt text 或 aria-label
- [ ] 顏色不是唯一資訊指標（搭配 icon/text）
- [ ] Heading 層級正確（h1 > h2 > h3，無跳級）

---

## 適用於 Taiwan MCP Platform UI

### 現有架構

平台 UI 位於 `packages/ui/public/`，純 Vanilla HTML + JS + CSS（無 build step）：

| 類型 | 檔案 |
|------|------|
| HTML | `index.html`, `server.html`, `upload.html`, `my-mcp.html`, `my-servers.html`, `profile.html`, `admin.html`, `pricing.html`, `privacy.html`, `trust.html`, `transparency.html` |
| JS | `js/app.js`, `js/marketplace.js`, `js/server-detail.js`, `js/my-mcp.js`, `js/my-servers.js`, `js/upload.js`, `js/profile.js`, `js/admin.js` |
| CSS | `css/style.css`（2490 行，待拆分 — backlog 低優先） |

### 已完成的 UI/UX 改善（P3.5）

以下已按 Skill 規則實作完畢（參見 `wg-2-platform.md` P3.5 段落）：
- SVG Icon 系統取代 emoji（25+ Lucide-style inline SVG）
- Card hover 微互動（`filter: brightness` 非 `transform: scale`，避免 reflow）
- Mobile hamburger menu（全頁面）、4-column Footer、Scroll-to-Top
- Hero gradient 動畫 + counter 動畫、Skeleton loading
- Badge Rich Tooltip（CSS-only）
- 全頁面 nav 一致化（search bar + 5 links + hamburger）
- SEO 基礎設施（robots.txt, sitemap.xml, canonical, OG, JSON-LD）

### 平台特有注意事項

1. **Auth 狀態快閃 (FOUC)**: 依賴 async 狀態的 UI 預設用 `visibility: hidden` + `auth-ready` class，避免閃現
2. **Badge hover**: 禁用 `transform: scale()`（flex 容器內觸發 reflow），改用 `filter: brightness(1.2)`
3. **Tooltip 動畫**: 不用 `translateX/Y`（與定位規則衝突），用純 `opacity` 動畫
4. **CSS 單檔**: `style.css` 2490 行尚未拆分 — 新增樣式時注意命名衝突，使用 BEM 或 prefix
5. **10 頁 nav 同步**: 修改 nav 結構需同步更新全部 HTML 檔案

### 下一步 UI 工作（P4 backlog）

- MCP Chat 試玩頁面 (`chat.html`) — 適用 Skill 的 Forms & Feedback + Animation 規則
- Analytics Dashboard — 適用 Skill 的 Charts & Data 規則
- `style.css` 拆分為模組 — 適用 Style Selection + consistency 規則

---

## 參考連結

- [GitHub Repo](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Skill Marketplace](https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill/ui-ux-pro-max)
- [平台 UI 冷啟動](./wg-2-platform.md)（P3.5 段落有完整 UI/UX 改善記錄）
