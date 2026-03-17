# WG-1 Batch 2 — MCP Server 製造規格

> **範圍**: 僅限 `servers/` 目錄
> **參考實作**: `servers/taiwan-weather/`（8 tools, 66 tests）
> **流水線**: Research → Scaffold → TDD → Security → Token → Review → Ship

---

## 開發清單

### Phase A：法律類 ⚖️

| # | Server | 資料來源 | API | 狀態 |
|---|--------|----------|-----|------|
| 1 | `taiwan-law` | 法務部全國法規資料庫 | `https://law.moj.gov.tw/api/` | 待開發 |
| 2 | `taiwan-judgment` | 司法院裁判書開放資料 | `http://data.judicial.gov.tw/jdg/api/` | 待開發 |
| 3 | `taiwan-legislative` | 立法院開放資料 | `https://v2.ly.govapi.tw` | 待開發 |

### Phase B：企業類 🏢

| # | Server | 資料來源 | API | 狀態 |
|---|--------|----------|-----|------|
| 4 | ~~`taiwan-company`~~ | 經濟部商工登記 GCIS | `https://data.gcis.nat.gov.tw/od/data/api/` | ✅ Module M (58 tests) — Batch 1 已完成 |
| 5 | ~~`taiwan-exchange-rate`~~ | 台灣銀行匯率 | `https://rate.bot.com.tw/xrt/flcsv/0/day` | ✅ Module O (60 tests) — Batch 1 已完成 |
| 6 | `taiwan-procurement` | 政府採購標案 | `https://pms.sme.gov.tw/PMSApi/v2/ODT/OPN` | 待開發 |

### Phase C：勞動/保險類 🛡️

| # | Server | 資料來源 | API | 狀態 |
|---|--------|----------|-----|------|
| 7 | ~~`taiwan-labor`~~ | 勞動部開放資料 | `https://apiservice.mol.gov.tw/OdService/` | ✅ Module V (47 tests) — Batch 1 已完成 |
| 8 | `taiwan-insurance-calc` | 公式計算（勞保/健保/勞退） | 無外部 API — 純演算法 | 待開發 |

### Phase D：醫療/衛生類 🏥

| # | Server | 資料來源 | API | 狀態 |
|---|--------|----------|-----|------|
| 9 | ~~`taiwan-hospital`~~ | 健保署特約院所 | `https://data.nhi.gov.tw/` | ✅ Module L (57 tests) — Batch 1 已完成 |
| 10 | `taiwan-drug` | 食藥署藥品許可證 | `https://data.fda.gov.tw/opendata/exportDataList.do` | 待開發 |
| 11 | `taiwan-cdc` | 疾管署傳染病監測 | `https://data.cdc.gov.tw/api/action/datastore_search` | 待開發 |

### Phase E：生活類 🏠

| # | Server | 資料來源 | API | 狀態 |
|---|--------|----------|-----|------|
| 12 | `taiwan-oil-price` | 中油主產品牌價 | `https://vipmbr.cpc.com.tw/opendata/swagger/index.html` | 待開發 |
| 13 | `taiwan-reservoir` | 水利署水庫水情 | `https://opendata.wra.gov.tw/openapi/swagger/index.html` | 待開發 |
| 14 | `taiwan-disaster` | NCDR 民生示警 | `https://alerts.ncdr.nat.gov.tw/api_swagger/index.html` | 待開發 |
| 15 | `taiwan-agri-price` | 農業部農產品交易行情 | `https://data.moa.gov.tw/api.aspx` (Dataset #037) | 待開發 |
| 16 | `taiwan-parking` | TDX 即時停車 | `https://tdx.transportdata.tw/` | 待開發 |

### Phase F：開發者工具類 🔧

| # | Server | 資料來源 | API | 狀態 |
|---|--------|----------|-----|------|
| 17 | `taiwan-validator` | 純演算法 | 無外部 API — 身分證/統編/手機/銀行帳號/車牌 | 待開發 |
| 18 | `taiwan-calendar` | 行政院人事行政總處假日表 | `https://data.gov.tw/dataset/14718` + 農曆演算法 | 待開發 |

---

## 各 Server 詳細規格

### 1. taiwan-law

- **API Base**: `https://law.moj.gov.tw/api/`
- **Auth**: 無
- **格式**: JSON / XML
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://law.moj.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `search_laws` — 法規名稱/關鍵字搜尋
  2. `get_law_by_id` — 依法規代碼取全文
  3. `get_law_articles` — 取特定法規所有條文
  4. `get_law_history` — 法規沿革/修正歷程
  5. `search_by_category` — 依法規分類查詢

---

### 2. taiwan-judgment

- **API Base**: `http://data.judicial.gov.tw/jdg/api/`
- **開放平台**: https://opendata.judicial.gov.tw/
- **Auth**: 無
- **格式**: JSON
- **License**: 政府開放授權（可商用）
- **GitHub 參考**: `0xyd/SunnyJudge`（Python 套件，可參考 API 結構）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["http://data.judicial.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `search_judgments` — 關鍵字全文搜尋裁判書
  2. `get_judgment_by_id` — 依案號取裁判書
  3. `search_by_court` — 依法院層級搜尋
  4. `search_by_case_type` — 依案件類型（民事/刑事/行政）
  5. `get_recent_judgments` — 取最新裁判書

---

### 3. taiwan-legislative

- **API Base**: `https://v2.ly.govapi.tw`
- **舊版**: https://data.ly.gov.tw/
- **Auth**: 可能需 API key（需確認）
- **格式**: JSON / XML
- **GitHub 參考**: `davidycliao/legisTaiwan`
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://v2.ly.govapi.tw", "https://data.ly.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `search_bills` — 搜尋法案
  2. `get_bill_status` — 法案審議進度
  3. `get_legislator_votes` — 委員投票紀錄
  4. `search_meetings` — 委員會議事查詢
  5. `get_interpellations` — 質詢紀錄查詢

---

### 4. taiwan-company

- **API Base**: `https://data.gcis.nat.gov.tw/od/data/api/`
- **Swagger**: https://data.gcis.nat.gov.tw/resources/swagger/index.html
- **Swagger JSON**: https://data.gcis.nat.gov.tw/resources/swagger/swagger.json
- **Auth**: IP 白名單（email `opendata.gcis@gmail.com` 免費申請）
- **格式**: JSON / XML
- **參數**: `$format=json`, `$filter=...`, `$skip=0`, `$top=50`（max 1000）
- **License**: 政府開放授權（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.gcis.nat.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**（已有 16 endpoints 可用）:
  1. `search_company_by_name` — 公司名稱關鍵字搜尋
  2. `get_company_by_tax_id` — 依統一編號查公司
  3. `get_company_directors` — 董監事/經理人資料
  4. `get_branch_offices` — 分公司查詢
  5. `search_by_industry` — 依營業項目代碼搜尋

---

### 5. taiwan-exchange-rate

- **CSV Endpoint**: `https://rate.bot.com.tw/xrt/flcsv/0/day`
- **Swagger**: `https://govdata.bot.com.tw/swagger-ui.html`
- **OAS**: `https://govdata.bot.com.tw/v3/api-docs`
- **第三方 JSON**: `http://asper-bot-rates.appspot.com/currency.json`
- **Auth**: 無
- **更新**: 每日 16:00
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://rate.bot.com.tw", "https://govdata.bot.com.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_all_rates` — 取得所有幣別即期/現金匯率
  2. `get_currency_rate` — 查詢特定幣別匯率
  3. `convert_currency` — 幣值換算（台幣↔外幣）
  4. `get_historical_rates` — 歷史匯率查詢
  5. `get_forward_rates` — 遠期匯率（10/30/60/90/120/150/180天）

---

### 6. taiwan-procurement

- **API**: `https://pms.sme.gov.tw/PMSApi/v2/ODT/OPN`
- **data.gov.tw**: Dataset #16370
- **Auth**: 無
- **格式**: JSON
- **License**: 政府開放授權（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://pms.sme.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `search_tenders` — 標案關鍵字搜尋
  2. `get_tender_details` — 取得標案詳細資訊
  3. `search_by_agency` — 依機關搜尋
  4. `get_awarded_contracts` — 決標公告查詢
  5. `get_recent_tenders` — 最新公告
- **注意**: API 文件較少，Stage 0 Research 需額外確認回傳結構

---

### 7. taiwan-labor

- **OAS Spec**: `https://apiservice.mol.gov.tw/OdService/doc/v3.json`
- **Swagger UI**: https://apiservice.mol.gov.tw/OdService/openapi/OAS.html
- **Auth**: API key（免費申請）
- **格式**: JSON / XML
- **License**: 政府資料開放授權 v1.0（可商用）
- **查詢限制**: 每次最多 1000 筆
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://apiservice.mol.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_minimum_wage` — 現行基本工資（月薪/時薪）
  2. `get_insurance_grade_table` — 勞保投保薪資級距表
  3. `search_job_vacancies` — 就業服務站職缺搜尋
  4. `get_labor_statistics` — 就業/失業/薪資統計
  5. `search_training_courses` — 職業訓練課程查詢

---

### 8. taiwan-insurance-calc

- **無外部 API** — 純公式計算
- **資料來源**:
  - 勞保局: https://www.bli.gov.tw/ （費率表）
  - 健保署: https://www.nhi.gov.tw/ （費率公告）
  - 勞退: 勞工退休金條例第 14 條
- **2026 費率常數**:
  - 基本工資: $29,500/月、$204/時
  - 勞保普通事故費率: 11.5%（被保險人 20%、雇主 70%、政府 10%）
  - 健保費率: 5.17%（被保險人 30%、雇主 60%、政府 10%）
  - 勞退雇主提繳: 6%（勞工自願 0-6%）
  - 就業保險費率: 1%
  - 職災保險費率: 依行業別（平均 ~0.21%）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `[]`（無外部呼叫）
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `calculate_labor_insurance` — 勞保費試算（含雇主/勞工/政府分擔）
  2. `calculate_health_insurance` — 健保費試算（含眷屬）
  3. `calculate_pension` — 勞退提繳試算
  4. `calculate_employer_cost` — 雇主總人事成本（勞保+健保+勞退+就保+職災）
  5. `get_salary_grade` — 查詢投保薪資級距對照表
- **注意**: 費率每年可能調整，需設計為可更新常數

---

### 9. taiwan-hospital

- **OAS**: `https://data.nhi.gov.tw/openapi.json`
- **data.gov.tw**: Dataset #39282（地區醫院）
- **查詢系統**: https://info.nhi.gov.tw/IODE0000/IODE0000S06
- **Auth**: 無
- **格式**: JSON / CSV
- **更新**: 每日
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.nhi.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `search_hospital_by_name` — 院所名稱搜尋
  2. `search_by_location` — 依縣市/鄉鎮搜尋
  3. `search_by_specialty` — 依科別搜尋
  4. `get_hospital_details` — 取得院所完整資訊（地址/電話/科別/健保代碼）
  5. `get_nearby_hospitals` — 依座標搜尋附近院所

---

### 10. taiwan-drug

- **OAS**: `https://data.fda.gov.tw/openapi.json`
- **API**: `https://data.fda.gov.tw/opendata/exportDataList.do?method=openDataApi&InfoId=36`
- **data.gov.tw**: Dataset #9122（全部藥品許可證）
- **仿單查詢**: https://mcp.fda.gov.tw/
- **Auth**: 無
- **格式**: JSON（大檔案為 ZIP 壓縮）
- **更新**: 每週
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.fda.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `search_drug_by_name` — 藥品名稱搜尋（中文/英文）
  2. `get_drug_by_license` — 依許可證號查詢
  3. `search_by_ingredient` — 依有效成分搜尋
  4. `get_drug_details` — 完整資訊（適應症/劑型/廠商/許可日期）
  5. `search_by_manufacturer` — 依藥廠搜尋
- **注意**: 資料集很大，可能需要預先下載建立索引或使用分頁

---

### 11. taiwan-cdc

- **CKAN API**: `https://od.cdc.gov.tw/cdc/Ckan01.json`
- **查詢**: `https://data.cdc.gov.tw/api/action/datastore_search?resource_id=<id>&limit=5`
- **開發文件**: https://data.cdc.gov.tw/en/pages/developer
- **NIDSS 統計**: https://nidss.cdc.gov.tw/
- **Auth**: 選用（CKAN token，公開 dataset 免認證）
- **格式**: JSON / CSV
- **License**: 政府資料開放授權 v1.0（可商用）
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.cdc.gov.tw", "https://od.cdc.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_disease_statistics` — 法定傳染病統計（1-5 類）
  2. `get_vaccination_schedule` — 疫苗接種排程
  3. `get_outbreak_alerts` — 疫情通報/警示
  4. `get_epidemic_trends` — 疫情趨勢（依疾病/地區/時間）
  5. `search_disease_info` — 傳染病介紹/預防資訊

---

### 12. taiwan-oil-price

- **SOAP**: `https://vipmbr.cpc.com.tw/cpcstn/listpricewebservice.asmx`
- **Swagger**: `https://vipmbr.cpc.com.tw/opendata/swagger/index.html`
- **data.gov.tw**: Dataset #6339
- **Auth**: 無
- **格式**: XML（SOAP）/ JSON（Swagger endpoint）
- **更新**: 每週（週日晚公布週一生效）
- **燃料代碼**: 1=92 無鉛、2=95 無鉛、3=98 無鉛、4=超級柴油、5=低硫燃油 0.5%、6=甲種低硫燃油
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://vipmbr.cpc.com.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_current_prices` — 取得所有燃料現行牌價
  2. `get_price_by_type` — 查特定燃料（92/95/98/柴油）
  3. `get_price_history` — 歷史油價查詢
  4. `get_price_change` — 本週調價幅度
  5. `calculate_fuel_cost` — 依公升數/金額換算
- **注意**: SOAP endpoint 回傳 XML，需轉 JSON；Swagger endpoint 可能更簡單

---

### 13. taiwan-reservoir

- **Swagger**: `https://opendata.wra.gov.tw/openapi/swagger/index.html`
- **OAS**: `https://opendata.wra.gov.tw/openapi/api/OpenData/openapi`
- **data.gov.tw**: Dataset #45501
- **歷史資料**: https://fhy.wra.gov.tw/fhyv2/monitor/reservoir
- **Auth**: API key（免費註冊 opendata.wra.gov.tw）
- **格式**: JSON
- **更新**: 每日
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://opendata.wra.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_all_reservoirs` — 全台水庫即時水情一覽
  2. `get_reservoir_by_name` — 依水庫名稱查詢
  3. `get_reservoir_by_region` — 依區域查詢（北/中/南/東）
  4. `get_low_capacity_alerts` — 蓄水率低於警戒值的水庫
  5. `get_rainfall_data` — 水庫集水區累計雨量

---

### 14. taiwan-disaster

- **Swagger**: `https://alerts.ncdr.nat.gov.tw/api_swagger/index.html`
- **API 說明**: https://alerts.ncdr.nat.gov.tw/alertMessageAPI.aspx
- **DataHub**: https://datahub.ncdr.nat.gov.tw/paradigm
- **細胞廣播**: https://cbs.tw/
- **Auth**: API key（免費註冊會員 alerts.ncdr.nat.gov.tw）
- **格式**: JSON（CAP — Common Alerting Protocol）
- **43 種警報類型**: 地震速報、地震報告、颱風、豪雨、強風、海嘯、水災、土石流、道路封閉、空氣品質...
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://alerts.ncdr.nat.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_active_alerts` — 取得所有生效中警報
  2. `get_alerts_by_type` — 依類型篩選（地震/颱風/豪雨...）
  3. `get_alerts_by_region` — 依縣市/地區篩選
  4. `get_earthquake_reports` — 地震報告（含震度/震央/規模）
  5. `get_alert_history` — 歷史警報查詢
- **注意**: CAP 格式需要解析 XML-like 結構，建議 Stage 0 先確認 JSON response 結構

---

### 15. taiwan-agri-price

- **API 專區**: https://data.moa.gov.tw/api.aspx
- **農產交易行情**: Dataset #037
- **AMIS 系統**: https://amis.afa.gov.tw/
- **Auth**: API key（免費註冊 data.moa.gov.tw）
- **格式**: JSON
- **更新**: 每日（收市後 ~18:00）
- **覆蓋**: 17 蔬菜批發市場 + 13 果菜市場 + 花卉市場
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.moa.gov.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_vegetable_prices` — 蔬菜批發行情（上/中/下/平均價）
  2. `get_fruit_prices` — 水果批發行情
  3. `search_product_price` — 依品名搜尋特定農產品價格
  4. `get_market_summary` — 特定市場當日交易概況
  5. `compare_market_prices` — 跨市場價格比較
- **欄位**: 交易日期、品名、市場名、上價/中價/下價/平均價（元/公斤）、交易量

---

### 16. taiwan-parking

- **TDX Platform**: https://tdx.transportdata.tw/
- **TDX Swagger**: https://tdx.transportdata.tw/api-service/swagger
- **data.taipei**: Dataset #128288（台北路邊停車）
- **Auth**: OAuth2 Client Credentials
  - 註冊: https://tdx.transportdata.tw/
  - Token endpoint: `https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token`
  - Token 有效期: 24 小時
- **格式**: JSON（OData 標準）
- **更新**: 即時（1-5 分鐘間隔）
- **免費額度**: 10,000 requests/day
- **覆蓋**: 台北/新北/台中/高雄/桃園
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://tdx.transportdata.tw"]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `search_parking_by_district` — 依行政區搜尋停車場
  2. `get_realtime_availability` — 即時空位查詢
  3. `get_parking_rates` — 費率查詢
  4. `search_nearby_parking` — 座標附近停車場（需指定城市）
  5. `get_roadside_parking` — 路邊停車格即時狀態
- **注意**: OAuth2 token 需每 24 小時刷新；OData 查詢語法需注意

---

### 17. taiwan-validator

- **無外部 API** — 純演算法
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `[]`
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `validate_national_id` — 身分證字號驗證（1 英文 + 9 數字，加權 checksum）
  2. `validate_tax_id` — 統一編號驗證（8 位數，模 5 checksum）
  3. `validate_phone` — 手機號碼格式驗證 + 電信業者判別（09xx 前綴）
  4. `validate_bank_account` — 銀行帳號格式（3 碼銀行代碼 + 帳號）
  5. `validate_license_plate` — 車牌號碼格式驗證（依車種：自用/營業/機車）
- **演算法參考**:
  - 身分證: 英文字母對應 10-35，加權 [1,9,8,7,6,5,4,3,2,1]，mod 10 = 0
  - 統編: 各位乘 [1,2,1,2,1,2,4,1]，個位十位分別加總，mod 5 = 0（第 7 位為 7 時有特殊規則）
  - 手機: `/^09\d{8}$/`，前綴 090x/091x/092x/093x/097x/098x/099x 對應電信商

---

### 18. taiwan-calendar

- **國定假日 data.gov.tw**: Dataset #14718（行政院人事行政總處）
- **Auth**: 無
- **農曆演算法**: 無需外部 API，使用天文曆法公式或查表法
- **Security Declaration**:
  - `declared_data_sensitivity`: `public`
  - `declared_permissions`: `readonly`
  - `declared_external_urls`: `["https://data.gov.tw"]`（僅假日資料下載）
  - `is_open_source`: `true`
- **建議 Tools**:
  1. `get_holidays` — 查詢指定年度國定假日（含補班日）
  2. `is_business_day` — 判斷指定日期是否為工作日
  3. `convert_to_lunar` — 國曆轉農曆
  4. `convert_to_solar` — 農曆轉國曆
  5. `get_solar_terms` — 查詢二十四節氣日期
- **額外建議 Tools**:
  6. `get_zodiac` — 生肖查詢
  7. `count_business_days` — 計算兩日期間工作天數
  8. `get_roc_date` — 西元↔民國年轉換

---

## 量產經驗與陷阱（承接 Batch 1）

> 以下為 Batch 1 累積經驗，Batch 2 開發時應注意：

- **SOAP API（中油）**: `vipmbr.cpc.com.tw` 回傳 XML，需 XML parser；優先試 Swagger endpoint 是否有 JSON
- **GCIS IP 白名單**: 需事先 email 申請，開發前先完成，避免 blocked
- **TDX OAuth2**: token 24 小時過期，client.ts 需實作自動刷新 + cache
- **CKAN API（疾管署）**: 不同 dataset 的 resource_id 不同，Stage 0 需先列出所有可用 resource
- **大型 JSON（藥品）**: data.fda.gov.tw 回傳整包 ZIP，可能需 preprocess 或建本地索引
- **CAP 格式（災害）**: Common Alerting Protocol 原本是 XML 標準，確認 NCDR API 回傳的是 JSON 還是 XML
- **農曆演算法**: 推薦使用 lookup table（1900-2100），避免天文計算複雜度
- **保險費率常數**: 每年可能調整，建議獨立 `constants.ts` 集中管理，方便年度更新

---

## 團隊模板

```
TeamCreate: mcp-factory-batch-2

建議分組（排除 4 個已完成重複，實際新增 14 個）:
  輪次 1: Phase A（法律 3 個）+ Phase F（工具 2 個）= 5 servers
  輪次 2: Phase B（採購 1 個）+ Phase C（保險 1 個）+ Phase D（藥品+疾管 2 個）= 4 servers
  輪次 3: Phase E（生活 5 個）= 5 servers

每輪角色:
  - factory-lead: 統籌 + 驗收
  - researcher (Explore): Stage 0 API 調研
  - builder-1 ~ builder-N (general-purpose): Stage 1-2 TDD 開發
  - qa-reviewer (general-purpose): Stage 3-5 品質閘門
```
