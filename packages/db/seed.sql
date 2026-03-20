-- Seed data for Taiwan MCP Platform

-- Admin user
INSERT OR IGNORE INTO users (id, github_id, google_id, username, display_name, role, plan, created_at, updated_at)
VALUES ('admin001', 0, NULL, 'admin', 'Platform Admin', 'admin', 'enterprise',
        strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- ============================================================
-- Servers (all 39)
-- ============================================================
INSERT OR IGNORE INTO servers (
  id, owner_id, slug, name, description, version, category, tags,
  is_official, is_published, review_status,
  badge_source, badge_data, badge_permission, badge_community, badge_external,
  total_calls, total_stars, monthly_calls,
  declared_data_sensitivity, declared_permissions, declared_external_urls, is_open_source,
  license, repo_url, data_source_license,
  data_source_agency, api_key_required, data_update_frequency, github_url,
  created_at, updated_at, published_at
) VALUES
  -- srv001: taiwan-weather
  ('srv001', 'admin001', 'taiwan-weather', '台灣氣象',
   '中央氣象署資料 — 天氣預報、地震、颱風、潮汐、紫外線', '1.0.0', 'government',
   '["天氣","氣象","forecast","earthquake"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://opendata.cwa.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'CWA (中央氣象署)', 1, 'hourly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-weather',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv004: taiwan-air-quality
  ('srv004', 'admin001', 'taiwan-air-quality', '台灣空氣品質',
   '環境部空氣品質監測 — AQI 指數、PM2.5、即時監測站資料', '1.0.0', 'government',
   '["空氣品質","AQI","PM2.5","環境"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.moenv.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOENV (環境部)', 1, 'hourly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-air-quality',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv005: taiwan-electricity
  ('srv005', 'admin001', 'taiwan-electricity', '台灣電力資訊',
   '台電即時用電量、電力備轉容量、各機組發電資訊', '1.0.0', 'utility',
   '["電力","能源","台電","用電"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://www.taipower.com.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'Taipower (台電)', 0, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-electricity',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv006: taiwan-stock
  ('srv006', 'admin001', 'taiwan-stock', '台股即時報價',
   '台灣證券交易所即時股價、大盤指數、漲跌排行', '1.0.0', 'finance',
   '["股票","投資","金融","TWSE"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://www.twse.com.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'TWSE (證交所)', 0, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-stock',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv007: taiwan-news
  ('srv007', 'admin001', 'taiwan-news', '台灣新聞',
   'RSS 新聞聚合 — 中央社、自由、聯合、TVBS、公視', '1.0.0', 'social',
   '["新聞","RSS","媒體","即時"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', NULL,
   'RSS (多來源)', 0, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-news',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv008: taiwan-hospital
  ('srv008', 'admin001', 'taiwan-hospital', '台灣醫療院所',
   '健保特約醫療院所查詢 — 診所、醫院、藥局搜尋', '1.0.0', 'government',
   '["醫療","健保","醫院","診所"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'NHI (健保署)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-hospital',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv009: taiwan-company
  ('srv009', 'admin001', 'taiwan-company', '台灣公司登記',
   '經濟部商業司公司登記查詢 — 統編、名稱、代表人', '1.0.0', 'government',
   '["公司","商業","統編","登記"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'GCIS (商業司)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-company',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv010: taiwan-transit
  ('srv010', 'admin001', 'taiwan-transit', '台灣交通',
   'TDX 交通資料 — 台鐵、高鐵、捷運、公車即時資訊', '1.0.0', 'government',
   '["交通","台鐵","高鐵","捷運","公車"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'TDX (交通部)', 1, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-transit',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv011: taiwan-exchange-rate
  ('srv011', 'admin001', 'taiwan-exchange-rate', '台灣匯率',
   '台灣銀行即時匯率查詢 — 現金/即期買賣、歷史走勢', '1.0.0', 'finance',
   '["匯率","外匯","台灣銀行","換匯"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'BOT (台灣銀行)', 0, 'hourly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-exchange-rate',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv012: taiwan-food-safety
  ('srv012', 'admin001', 'taiwan-food-safety', '台灣食品安全',
   '食藥署食品安全資訊 — 違規、檢驗、添加物查詢', '1.0.0', 'government',
   '["食安","食品","檢驗","違規"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'FDA (食藥署)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-food-safety',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv013: taiwan-weather-alert
  ('srv013', 'admin001', 'taiwan-weather-alert', '台灣氣象警報',
   '中央氣象署氣象警特報 — 豪雨、颱風、低溫特報', '1.0.0', 'government',
   '["氣象","警報","颱風","豪雨"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'CWA (中央氣象署)', 1, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-weather-alert',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv014: taiwan-invoice
  ('srv014', 'admin001', 'taiwan-invoice', '台灣電子發票',
   '財政部電子發票 — 載具查詢、中獎查詢、發票驗證', '1.0.0', 'government',
   '["發票","電子發票","財政","載具"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOF (財政部)', 1, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-invoice',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv015: taiwan-budget
  ('srv015', 'admin001', 'taiwan-budget', '台灣政府預算',
   '政府開放資料 — 中央/地方預算、歲出歲入查詢', '1.0.0', 'government',
   '["預算","財政","政府","開放資料"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'DGBAS (主計總處)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-budget',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv016: taiwan-tax
  ('srv016', 'admin001', 'taiwan-tax', '台灣稅務試算',
   '所得稅、營業稅、房屋稅、牌照稅試算工具', '1.0.0', 'finance',
   '["稅務","所得稅","營業稅","試算"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOF (財政部)', 0, 'static', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-tax',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv017: taiwan-labor
  ('srv017', 'admin001', 'taiwan-labor', '台灣勞動法規',
   '勞動基準法、勞保、就業保險相關計算與查詢', '1.0.0', 'government',
   '["勞動","勞基法","勞保","就業"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOL (勞動部)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-labor',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv018: taiwan-patent
  ('srv018', 'admin001', 'taiwan-patent', '台灣專利商標',
   '智慧財產局專利與商標查詢 — 專利搜尋、商標比對', '1.0.0', 'government',
   '["專利","商標","智慧財產","IP"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'TIPO (智慧局)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-patent',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv019: taiwan-customs
  ('srv019', 'admin001', 'taiwan-customs', '台灣海關貿易',
   '關務署海關進出口貿易統計查詢', '1.0.0', 'government',
   '["海關","貿易","進出口","關稅"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'Customs (關務署)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-customs',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv020: taiwan-law
  ('srv020', 'admin001', 'taiwan-law', '台灣法律查詢',
   '全國法規資料庫 — 法律條文、法規命令查詢', '1.0.0', 'government',
   '["法律","法規","條文","法務"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOJ (法務部)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-law',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv021: taiwan-judgment
  ('srv021', 'admin001', 'taiwan-judgment', '台灣裁判查詢',
   '司法院裁判書查詢系統 — 民事、刑事、行政裁判', '1.0.0', 'government',
   '["裁判","司法","判決","法院"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'JY (司法院)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-judgment',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv022: taiwan-legislative
  ('srv022', 'admin001', 'taiwan-legislative', '台灣立法資訊',
   '立法院開放資料 — 法案、議事、公報、質詢', '1.0.0', 'government',
   '["立法院","法案","議事","質詢"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'LY (立法院)', 1, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-legislative',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv023: taiwan-procurement
  ('srv023', 'admin001', 'taiwan-procurement', '台灣政府採購',
   '政府電子採購網 — 標案公告、決標資訊查詢', '1.0.0', 'government',
   '["採購","標案","決標","政府"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'PCC (工程會)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-procurement',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv024: taiwan-insurance-calc
  ('srv024', 'admin001', 'taiwan-insurance-calc', '台灣保險試算',
   '勞保、健保、國民年金保險費試算工具', '1.0.0', 'finance',
   '["保險","勞保","健保","國民年金"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'BLI (勞保局)', 0, 'static', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-insurance-calc',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv025: taiwan-drug
  ('srv025', 'admin001', 'taiwan-drug', '台灣藥品查詢',
   '食藥署藥品許可證、藥品成分、適應症查詢', '1.0.0', 'government',
   '["藥品","藥物","許可證","適應症"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'FDA (食藥署)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-drug',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv026: taiwan-cdc
  ('srv026', 'admin001', 'taiwan-cdc', '台灣疾病監測',
   '疾管署傳染病監測 — 疫情統計、疫苗、防疫資訊', '1.0.0', 'government',
   '["疾病","疫情","疫苗","防疫"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'CDC (疾管署)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-cdc',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv027: taiwan-oil-price
  ('srv027', 'admin001', 'taiwan-oil-price', '台灣油價',
   '中油即時油價查詢 — 汽油、柴油、液化石油氣價格', '1.0.0', 'utility',
   '["油價","中油","汽油","柴油"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'CPC (中油)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-oil-price',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv028: taiwan-reservoir
  ('srv028', 'admin001', 'taiwan-reservoir', '台灣水庫',
   '水利署水庫即時水情 — 蓄水量、進出水量、水位', '1.0.0', 'government',
   '["水庫","水情","蓄水量","水利"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'WRA (水利署)', 0, 'hourly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-reservoir',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv029: taiwan-disaster
  ('srv029', 'admin001', 'taiwan-disaster', '台灣災害',
   '國家災害防救科技中心 — 颱風、地震、洪水、土石流', '1.0.0', 'government',
   '["災害","颱風","地震","防災"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'NCDR (災防中心)', 1, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-disaster',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv030: taiwan-agri-price
  ('srv030', 'admin001', 'taiwan-agri-price', '台灣農產品價格',
   '農業部農產品交易行情 — 蔬菜、水果、花卉價格', '1.0.0', 'government',
   '["農產品","蔬菜","水果","行情"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOA (農業部)', 1, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-agri-price',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv031: taiwan-parking
  ('srv031', 'admin001', 'taiwan-parking', '台灣停車場',
   'TDX 停車場即時資訊 — 車位數、費率、位置查詢', '1.0.0', 'utility',
   '["停車","停車場","車位","費率"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'TDX (交通部)', 1, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-parking',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv032: taiwan-validator
  ('srv032', 'admin001', 'taiwan-validator', '台灣資料驗證',
   '台灣常用資料格式驗證 — 身分證、統編、手機、車牌', '1.0.0', 'utility',
   '["驗證","身分證","統編","手機"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', NULL,
   'N/A', 0, 'static', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-validator',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv033: taiwan-calendar
  ('srv033', 'admin001', 'taiwan-calendar', '台灣行事曆',
   '台灣國定假日、補班日、農曆節日查詢', '1.0.0', 'utility',
   '["行事曆","假日","補班","農曆"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', NULL,
   'DGPA (人事總處)', 0, 'static', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-calendar',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv034: taiwan-youbike
  ('srv034', 'admin001', 'taiwan-youbike', '台灣 YouBike',
   'YouBike 2.0 站點即時資訊 — 可借車輛、空位查詢', '1.0.0', 'utility',
   '["YouBike","單車","腳踏車","站點"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', NULL,
   'YouBike (微笑單車)', 0, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-youbike',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv035: taiwan-traffic-accident
  ('srv035', 'admin001', 'taiwan-traffic-accident', '台灣交通事故',
   '交通事故統計 — 事故類型、地點、傷亡分析', '1.0.0', 'government',
   '["交通事故","車禍","統計","安全"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'NPA (警政署)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-traffic-accident',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv036: taiwan-garbage
  ('srv036', 'admin001', 'taiwan-garbage', '台灣垃圾車',
   '環境部垃圾車即時 GPS 與收運時刻表查詢', '1.0.0', 'utility',
   '["垃圾車","回收","清運","GPS"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOENV (環境部)', 1, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-garbage',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv037: taiwan-demographics
  ('srv037', 'admin001', 'taiwan-demographics', '台灣人口統計',
   '內政部戶政司人口統計 — 縣市人口、年齡分布、趨勢', '1.0.0', 'government',
   '["人口","統計","戶政","趨勢"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOI (內政部)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-demographics',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv038: taiwan-tourism
  ('srv038', 'admin001', 'taiwan-tourism', '台灣觀光',
   '觀光署觀光景點、住宿、活動資訊查詢', '1.0.0', 'social',
   '["觀光","旅遊","景點","住宿"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'Tourism (觀光署)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-tourism',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv039: taiwan-sports
  ('srv039', 'admin001', 'taiwan-sports', '台灣運動設施',
   '教育部體育署運動場館查詢 — 地點、設施、開放時間', '1.0.0', 'social',
   '["運動","場館","健身","設施"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'SA (體育署)', 1, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-sports',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv040: taiwan-education
  ('srv040', 'admin001', 'taiwan-education', '台灣學校查詢',
   '教育部各級學校名錄查詢 — 國小到大學', '1.0.0', 'social',
   '["學校","教育","名錄","大學"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOE (教育部)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-education',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  -- srv041: taiwan-election
  ('srv041', 'admin001', 'taiwan-election', '台灣選舉',
   '中選會選舉結果 — 歷屆總統、立委、地方選舉數據', '1.0.0', 'government',
   '["選舉","投票","中選會","選舉結果"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '[]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'CEC (中選會)', 0, 'static', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-election',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- ============================================================
-- Tools for taiwan-weather (8 tools) — existing
-- ============================================================
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool001', 'srv001', 'get_forecast_36hr', '36小時天氣預報', '取得台灣各縣市未來 36 小時天氣預報',
   '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool002', 'srv001', 'get_forecast_7day', '7天天氣預報', '取得台灣各縣市未來 7 天天氣預報',
   '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool003', 'srv001', 'get_earthquake_recent', '最近地震', '取得最近地震報告',
   '{"type":"object","properties":{"limit":{"type":"number","description":"筆數（預設5）","default":5}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool004', 'srv001', 'get_typhoon_active', '颱風資訊', '取得目前活躍颱風資訊',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool005', 'srv001', 'get_weather_warning', '氣象警特報', '取得目前生效的氣象警特報',
   '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool006', 'srv001', 'get_rain_observation', '即時雨量', '取得即時雨量觀測',
   '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool007', 'srv001', 'get_tidal_forecast', '潮汐預報', '取得潮汐預報',
   '{"type":"object","properties":{"port":{"type":"string","description":"港口名稱"}},"required":["port"]}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool008', 'srv001', 'get_uv_index', '紫外線指數', '取得紫外線指數',
   '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- ============================================================
-- Tools for taiwan-air-quality (5 tools) — existing
-- ============================================================
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool011', 'srv004', 'get_aqi_all', '全台 AQI', '取得全台所有測站即時 AQI 資料',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool012', 'srv004', 'get_aqi_by_county', '縣市 AQI', '取得指定縣市的 AQI 資料',
   '{"type":"object","properties":{"county":{"type":"string","description":"縣市名稱"}},"required":["county"]}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool013', 'srv004', 'get_aqi_by_station', '測站 AQI', '取得指定測站的 AQI 資料',
   '{"type":"object","properties":{"station":{"type":"string","description":"測站名稱"}},"required":["station"]}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool014', 'srv004', 'get_unhealthy_stations', '不健康測站', '取得 AQI 超標的測站',
   '{"type":"object","properties":{"threshold":{"type":"number","description":"AQI 門檻值（預設101）","default":101}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool015', 'srv004', 'get_pm25_ranking', 'PM2.5 排行', '取得 PM2.5 濃度排行',
   '{"type":"object","properties":{"limit":{"type":"number","description":"筆數（預設10）","default":10}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- ============================================================
-- Tools for taiwan-electricity (5 tools) — existing
-- ============================================================
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool021', 'srv005', 'get_power_overview', '即時用電概況', '取得台電即時用電概況與備轉容量',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool022', 'srv005', 'get_power_generation', '各機組發電', '取得各發電機組即時發電資訊',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool023', 'srv005', 'get_power_usage_curve', '用電曲線', '取得今日用電負載曲線',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool024', 'srv005', 'get_reserve_margin', '備轉容量', '取得即時備轉容量率',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool025', 'srv005', 'get_power_by_type', '發電結構', '取得各類發電占比（火力、核能、再生能源等）',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- ============================================================
-- Tools for taiwan-stock (5 tools) — existing
-- ============================================================
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool031', 'srv006', 'get_stock_price', '即時股價', '查詢個股即時報價',
   '{"type":"object","properties":{"symbol":{"type":"string","description":"股票代號"}},"required":["symbol"]}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool032', 'srv006', 'get_market_index', '大盤指數', '取得加權指數即時資訊',
   '{"type":"object","properties":{}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool033', 'srv006', 'get_top_volume', '成交量排行', '取得成交量排行前 N 名',
   '{"type":"object","properties":{"limit":{"type":"number","description":"筆數（預設10）","default":10}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool034', 'srv006', 'get_top_movers', '漲跌排行', '取得漲跌幅排行',
   '{"type":"object","properties":{"direction":{"type":"string","enum":["up","down"],"description":"漲/跌"},"limit":{"type":"number","default":10}}}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool035', 'srv006', 'get_stock_info', '個股資訊', '查詢個股基本資料',
   '{"type":"object","properties":{"symbol":{"type":"string","description":"股票代號"}},"required":["symbol"]}',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- ============================================================
-- Tools for new servers (35 servers x 5 tools = 175 tools)
-- IDs: tool040+
-- ============================================================

-- taiwan-news (srv007)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool040', 'srv007', 'get_latest_news', '最新新聞', '取得各來源最新新聞',
   '{"type":"object","properties":{"limit":{"type":"number","default":10}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool041', 'srv007', 'get_news_by_category', '分類新聞', '依分類取得新聞',
   '{"type":"object","properties":{"category":{"type":"string","description":"新聞分類"}},"required":["category"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool042', 'srv007', 'search_news', '搜尋新聞', '以關鍵字搜尋新聞',
   '{"type":"object","properties":{"keyword":{"type":"string","description":"搜尋關鍵字"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool043', 'srv007', 'get_trending_topics', '熱門話題', '取得目前熱門話題',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool044', 'srv007', 'get_news_sources', '新聞來源', '取得支援的新聞來源列表',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-hospital (srv008)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool045', 'srv008', 'search_hospital', '搜尋醫院', '搜尋健保特約醫院',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool046', 'srv008', 'search_clinic', '搜尋診所', '搜尋健保特約診所',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool047', 'srv008', 'search_pharmacy', '搜尋藥局', '搜尋健保特約藥局',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool048', 'srv008', 'get_hospital_detail', '醫院詳情', '取得醫院詳細資訊',
   '{"type":"object","properties":{"id":{"type":"string","description":"醫院代碼"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool049', 'srv008', 'get_nearby_facilities', '附近醫療設施', '取得指定位置附近的醫療設施',
   '{"type":"object","properties":{"lat":{"type":"number"},"lng":{"type":"number"},"radius":{"type":"number","default":1000}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-company (srv009)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool050', 'srv009', 'search_company', '搜尋公司', '以名稱搜尋公司登記',
   '{"type":"object","properties":{"name":{"type":"string","description":"公司名稱"}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool051', 'srv009', 'get_company_detail', '公司詳情', '以統編查詢公司詳細資料',
   '{"type":"object","properties":{"tax_id":{"type":"string","description":"統一編號"}},"required":["tax_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool052', 'srv009', 'search_by_representative', '搜尋代表人', '以代表人姓名搜尋公司',
   '{"type":"object","properties":{"name":{"type":"string","description":"代表人姓名"}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool053', 'srv009', 'get_company_changes', '公司變更', '查詢公司變更紀錄',
   '{"type":"object","properties":{"tax_id":{"type":"string","description":"統一編號"}},"required":["tax_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool054', 'srv009', 'validate_tax_id', '驗證統編', '驗證統一編號是否有效',
   '{"type":"object","properties":{"tax_id":{"type":"string","description":"統一編號"}},"required":["tax_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-transit (srv010)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool055', 'srv010', 'search_tra_timetable', '台鐵時刻', '搜尋台鐵時刻表',
   '{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"},"date":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool056', 'srv010', 'search_thsr_timetable', '高鐵時刻', '搜尋高鐵時刻表',
   '{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"},"date":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool057', 'srv010', 'get_tra_liveboard', '台鐵即時', '取得台鐵車站即時到離站資訊',
   '{"type":"object","properties":{"station":{"type":"string","description":"車站名稱"}},"required":["station"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool058', 'srv010', 'get_metro_info', '捷運資訊', '取得捷運路線與站點資訊',
   '{"type":"object","properties":{"city":{"type":"string","description":"城市名稱"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool059', 'srv010', 'get_bus_arrival', '公車到站', '取得公車預估到站時間',
   '{"type":"object","properties":{"route":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-exchange-rate (srv011)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool060', 'srv011', 'get_current_rates', '即時匯率', '取得所有幣別即時匯率',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool061', 'srv011', 'get_rate_by_currency', '指定幣別匯率', '取得指定幣別的即時匯率',
   '{"type":"object","properties":{"currency":{"type":"string","description":"幣別代碼"}},"required":["currency"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool062', 'srv011', 'get_rate_history', '匯率歷史', '取得匯率歷史走勢',
   '{"type":"object","properties":{"currency":{"type":"string"},"days":{"type":"number","default":30}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool063', 'srv011', 'get_cross_rates', '交叉匯率', '取得交叉匯率計算',
   '{"type":"object","properties":{"from":{"type":"string"},"to":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool064', 'srv011', 'get_rate_comparison', '匯率比較', '比較不同銀行的匯率',
   '{"type":"object","properties":{"currency":{"type":"string","description":"幣別代碼"}},"required":["currency"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-food-safety (srv012)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool065', 'srv012', 'get_violations', '食安違規', '取得食品安全違規紀錄',
   '{"type":"object","properties":{"limit":{"type":"number","default":10}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool066', 'srv012', 'search_products', '搜尋產品', '搜尋食品產品資訊',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool067', 'srv012', 'get_inspections', '檢驗結果', '取得食品檢驗結果',
   '{"type":"object","properties":{"limit":{"type":"number","default":10}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool068', 'srv012', 'get_additives', '食品添加物', '查詢合法食品添加物',
   '{"type":"object","properties":{"keyword":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool069', 'srv012', 'get_recalls', '產品召回', '取得食品召回資訊',
   '{"type":"object","properties":{"limit":{"type":"number","default":10}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-weather-alert (srv013)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool070', 'srv013', 'get_active_alerts', '有效警報', '取得目前生效的氣象警特報',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool071', 'srv013', 'get_alerts_by_type', '依類型查警報', '依警報類型篩選',
   '{"type":"object","properties":{"type":{"type":"string","description":"警報類型"}},"required":["type"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool072', 'srv013', 'get_alerts_by_region', '依地區查警報', '依地區篩選警報',
   '{"type":"object","properties":{"region":{"type":"string","description":"地區名稱"}},"required":["region"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool073', 'srv013', 'get_alert_history', '警報歷史', '取得歷史警報紀錄',
   '{"type":"object","properties":{"days":{"type":"number","default":7}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool074', 'srv013', 'get_alert_statistics', '警報統計', '取得警報統計資料',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-invoice (srv014)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool075', 'srv014', 'check_invoice', '對獎查詢', '查詢發票是否中獎',
   '{"type":"object","properties":{"number":{"type":"string","description":"發票號碼"}},"required":["number"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool076', 'srv014', 'query_carrier', '載具查詢', '查詢載具歸戶發票',
   '{"type":"object","properties":{"carrier_id":{"type":"string"}},"required":["carrier_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool077', 'srv014', 'get_winning_numbers', '中獎號碼', '取得各期中獎號碼',
   '{"type":"object","properties":{"period":{"type":"string","description":"期別"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool078', 'srv014', 'verify_invoice', '驗證發票', '驗證發票真偽',
   '{"type":"object","properties":{"number":{"type":"string"},"date":{"type":"string"}},"required":["number","date"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool079', 'srv014', 'get_invoice_detail', '發票明細', '取得發票消費明細',
   '{"type":"object","properties":{"number":{"type":"string"}},"required":["number"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-budget (srv015)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool080', 'srv015', 'get_central_budget', '中央預算', '查詢中央政府預算',
   '{"type":"object","properties":{"year":{"type":"number","description":"年度"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool081', 'srv015', 'get_local_budget', '地方預算', '查詢地方政府預算',
   '{"type":"object","properties":{"city":{"type":"string"},"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool082', 'srv015', 'search_budget_items', '搜尋預算', '以關鍵字搜尋預算科目',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool083', 'srv015', 'get_revenue_stats', '歲入統計', '取得歲入統計資料',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool084', 'srv015', 'get_expenditure_stats', '歲出統計', '取得歲出統計資料',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-tax (srv016)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool085', 'srv016', 'calc_income_tax', '所得稅試算', '試算綜合所得稅',
   '{"type":"object","properties":{"income":{"type":"number"},"deductions":{"type":"number"}},"required":["income"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool086', 'srv016', 'calc_business_tax', '營業稅試算', '試算營業稅額',
   '{"type":"object","properties":{"revenue":{"type":"number"}},"required":["revenue"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool087', 'srv016', 'calc_house_tax', '房屋稅試算', '試算房屋稅額',
   '{"type":"object","properties":{"assessed_value":{"type":"number"}},"required":["assessed_value"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool088', 'srv016', 'calc_vehicle_tax', '牌照稅試算', '試算汽機車牌照稅',
   '{"type":"object","properties":{"cc":{"type":"number","description":"排氣量(cc)"}},"required":["cc"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool089', 'srv016', 'calc_estate_tax', '遺產稅試算', '試算遺產稅額',
   '{"type":"object","properties":{"estate_value":{"type":"number"}},"required":["estate_value"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-labor (srv017)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool090', 'srv017', 'calc_overtime_pay', '加班費試算', '計算加班費',
   '{"type":"object","properties":{"hourly_rate":{"type":"number"},"hours":{"type":"number"}},"required":["hourly_rate","hours"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool091', 'srv017', 'calc_labor_insurance', '勞保試算', '計算勞保保費',
   '{"type":"object","properties":{"salary":{"type":"number"}},"required":["salary"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool092', 'srv017', 'query_labor_law', '勞基法查詢', '查詢勞動基準法條文',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool093', 'srv017', 'calc_severance_pay', '資遣費試算', '計算資遣費',
   '{"type":"object","properties":{"salary":{"type":"number"},"years":{"type":"number"}},"required":["salary","years"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool094', 'srv017', 'get_minimum_wage', '基本工資', '取得目前基本工資資訊',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-patent (srv018)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool095', 'srv018', 'search_patent', '搜尋專利', '以關鍵字搜尋專利',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool096', 'srv018', 'search_trademark', '搜尋商標', '以關鍵字搜尋商標',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool097', 'srv018', 'get_patent_detail', '專利詳情', '取得專利詳細資訊',
   '{"type":"object","properties":{"patent_id":{"type":"string"}},"required":["patent_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool098', 'srv018', 'get_trademark_detail', '商標詳情', '取得商標詳細資訊',
   '{"type":"object","properties":{"trademark_id":{"type":"string"}},"required":["trademark_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool099', 'srv018', 'get_patent_statistics', '專利統計', '取得專利申請統計',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-customs (srv019)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool100', 'srv019', 'get_trade_statistics', '貿易統計', '取得進出口貿易統計',
   '{"type":"object","properties":{"year":{"type":"number"},"month":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool101', 'srv019', 'get_import_data', '進口資料', '取得進口資料',
   '{"type":"object","properties":{"commodity":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool102', 'srv019', 'get_export_data', '出口資料', '取得出口資料',
   '{"type":"object","properties":{"commodity":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool103', 'srv019', 'search_tariff', '關稅查詢', '查詢關稅稅則',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool104', 'srv019', 'get_trade_balance', '貿易餘額', '取得貿易餘額資料',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-law (srv020)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool105', 'srv020', 'search_law', '搜尋法律', '以關鍵字搜尋法律',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool106', 'srv020', 'get_law_detail', '法律詳情', '取得法律完整內容',
   '{"type":"object","properties":{"law_id":{"type":"string"}},"required":["law_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool107', 'srv020', 'get_law_articles', '法律條文', '取得指定法律的條文',
   '{"type":"object","properties":{"law_id":{"type":"string"},"article":{"type":"string"}},"required":["law_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool108', 'srv020', 'search_regulations', '搜尋法規命令', '搜尋法規命令',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool109', 'srv020', 'get_law_history', '法律沿革', '取得法律修正沿革',
   '{"type":"object","properties":{"law_id":{"type":"string"}},"required":["law_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-judgment (srv021)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool110', 'srv021', 'search_judgment', '搜尋裁判', '以關鍵字搜尋裁判書',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool111', 'srv021', 'get_judgment_detail', '裁判詳情', '取得裁判書完整內容',
   '{"type":"object","properties":{"judgment_id":{"type":"string"}},"required":["judgment_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool112', 'srv021', 'search_by_court', '依法院搜尋', '依法院搜尋裁判',
   '{"type":"object","properties":{"court":{"type":"string"}},"required":["court"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool113', 'srv021', 'search_by_type', '依類型搜尋', '依裁判類型搜尋',
   '{"type":"object","properties":{"type":{"type":"string","enum":["civil","criminal","administrative"]}},"required":["type"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool114', 'srv021', 'get_judgment_statistics', '裁判統計', '取得裁判統計資料',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-legislative (srv022)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool115', 'srv022', 'search_bills', '搜尋法案', '搜尋立法院法案',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool116', 'srv022', 'get_bill_detail', '法案詳情', '取得法案詳細資訊',
   '{"type":"object","properties":{"bill_id":{"type":"string"}},"required":["bill_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool117', 'srv022', 'get_proceedings', '議事紀錄', '取得議事紀錄',
   '{"type":"object","properties":{"date":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool118', 'srv022', 'get_interpellations', '質詢紀錄', '取得質詢紀錄',
   '{"type":"object","properties":{"legislator":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool119', 'srv022', 'get_gazette', '公報查詢', '查詢立法院公報',
   '{"type":"object","properties":{"keyword":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-procurement (srv023)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool120', 'srv023', 'search_tenders', '搜尋標案', '搜尋政府標案公告',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool121', 'srv023', 'get_tender_detail', '標案詳情', '取得標案詳細資訊',
   '{"type":"object","properties":{"tender_id":{"type":"string"}},"required":["tender_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool122', 'srv023', 'search_awards', '搜尋決標', '搜尋決標資訊',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool123', 'srv023', 'get_agency_stats', '機關統計', '取得機關採購統計',
   '{"type":"object","properties":{"agency":{"type":"string"}},"required":["agency"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool124', 'srv023', 'get_procurement_stats', '採購統計', '取得整體採購統計',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-insurance-calc (srv024)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool125', 'srv024', 'calc_labor_insurance', '勞保費試算', '計算勞工保險保費',
   '{"type":"object","properties":{"salary":{"type":"number"}},"required":["salary"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool126', 'srv024', 'calc_health_insurance', '健保費試算', '計算全民健保保費',
   '{"type":"object","properties":{"salary":{"type":"number"},"dependents":{"type":"number","default":0}},"required":["salary"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool127', 'srv024', 'calc_national_pension', '國保費試算', '計算國民年金保費',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool128', 'srv024', 'calc_retirement', '退休金試算', '試算勞退新制退休金',
   '{"type":"object","properties":{"salary":{"type":"number"},"years":{"type":"number"}},"required":["salary","years"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool129', 'srv024', 'compare_plans', '方案比較', '比較不同保險方案',
   '{"type":"object","properties":{"salary":{"type":"number"}},"required":["salary"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-drug (srv025)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool130', 'srv025', 'search_drug', '搜尋藥品', '以名稱搜尋藥品',
   '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool131', 'srv025', 'get_drug_detail', '藥品詳情', '取得藥品詳細資訊',
   '{"type":"object","properties":{"drug_id":{"type":"string"}},"required":["drug_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool132', 'srv025', 'search_by_ingredient', '依成分搜尋', '依藥品成分搜尋',
   '{"type":"object","properties":{"ingredient":{"type":"string"}},"required":["ingredient"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool133', 'srv025', 'get_drug_interactions', '藥物交互作用', '查詢藥物交互作用',
   '{"type":"object","properties":{"drugs":{"type":"array","items":{"type":"string"}}},"required":["drugs"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool134', 'srv025', 'get_drug_recalls', '藥品回收', '取得藥品回收資訊',
   '{"type":"object","properties":{"limit":{"type":"number","default":10}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-cdc (srv026)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool135', 'srv026', 'get_disease_stats', '疫情統計', '取得傳染病統計資料',
   '{"type":"object","properties":{"disease":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool136', 'srv026', 'get_vaccination_info', '疫苗資訊', '取得疫苗接種資訊',
   '{"type":"object","properties":{"vaccine":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool137', 'srv026', 'get_epidemic_alerts', '疫情警報', '取得目前疫情警報',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool138', 'srv026', 'get_travel_health', '旅遊健康', '取得國際旅遊健康資訊',
   '{"type":"object","properties":{"country":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool139', 'srv026', 'get_prevention_guide', '防疫指引', '取得疾病防疫指引',
   '{"type":"object","properties":{"disease":{"type":"string"}},"required":["disease"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-oil-price (srv027)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool140', 'srv027', 'get_current_prices', '即時油價', '取得目前各油品價格',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool141', 'srv027', 'get_price_history', '油價歷史', '取得油價歷史走勢',
   '{"type":"object","properties":{"fuel_type":{"type":"string"},"months":{"type":"number","default":6}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool142', 'srv027', 'get_price_forecast', '油價預測', '取得下週油價預測',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool143', 'srv027', 'compare_gas_stations', '加油站比較', '比較附近加油站價格',
   '{"type":"object","properties":{"lat":{"type":"number"},"lng":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool144', 'srv027', 'get_lpg_price', '液化石油氣價格', '取得液化石油氣價格',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-reservoir (srv028)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool145', 'srv028', 'get_reservoir_status', '水庫狀態', '取得指定水庫即時狀態',
   '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool146', 'srv028', 'get_all_reservoirs', '全部水庫', '取得全台水庫即時水情',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool147', 'srv028', 'get_water_level', '水位查詢', '取得水庫水位資料',
   '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool148', 'srv028', 'get_inflow_outflow', '進出水量', '取得水庫進出水量',
   '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool149', 'srv028', 'get_reservoir_history', '水庫歷史', '取得水庫歷史水情',
   '{"type":"object","properties":{"name":{"type":"string"},"days":{"type":"number","default":30}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-disaster (srv029)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool150', 'srv029', 'get_active_disasters', '活躍災害', '取得目前活躍災害資訊',
   '{"type":"object","properties":{}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool151', 'srv029', 'get_earthquake_alerts', '地震警報', '取得地震速報',
   '{"type":"object","properties":{"limit":{"type":"number","default":5}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool152', 'srv029', 'get_flood_warnings', '洪水警告', '取得洪水警告資訊',
   '{"type":"object","properties":{"region":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool153', 'srv029', 'get_landslide_alerts', '土石流警戒', '取得土石流警戒資訊',
   '{"type":"object","properties":{"region":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool154', 'srv029', 'get_disaster_history', '災害歷史', '取得歷史災害紀錄',
   '{"type":"object","properties":{"type":{"type":"string"},"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-agri-price (srv030)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool155', 'srv030', 'get_vegetable_prices', '蔬菜價格', '取得蔬菜交易行情',
   '{"type":"object","properties":{"name":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool156', 'srv030', 'get_fruit_prices', '水果價格', '取得水果交易行情',
   '{"type":"object","properties":{"name":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool157', 'srv030', 'get_flower_prices', '花卉價格', '取得花卉交易行情',
   '{"type":"object","properties":{"name":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool158', 'srv030', 'get_price_trends', '價格趨勢', '取得農產品價格趨勢',
   '{"type":"object","properties":{"name":{"type":"string"},"days":{"type":"number","default":30}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool159', 'srv030', 'search_market_prices', '搜尋市場價格', '搜尋市場交易價格',
   '{"type":"object","properties":{"keyword":{"type":"string"}},"required":["keyword"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-parking (srv031)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool160', 'srv031', 'search_parking', '搜尋停車場', '搜尋停車場',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool161', 'srv031', 'get_parking_detail', '停車場詳情', '取得停車場詳細資訊',
   '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool162', 'srv031', 'get_available_spaces', '空位查詢', '查詢停車場即時空位',
   '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool163', 'srv031', 'get_nearby_parking', '附近停車場', '取得附近停車場',
   '{"type":"object","properties":{"lat":{"type":"number"},"lng":{"type":"number"},"radius":{"type":"number","default":500}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool164', 'srv031', 'get_parking_rates', '停車費率', '取得停車場費率資訊',
   '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-validator (srv032)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool165', 'srv032', 'validate_national_id', '驗證身分證', '驗證身分證字號格式',
   '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool166', 'srv032', 'validate_tax_id', '驗證統編', '驗證統一編號格式',
   '{"type":"object","properties":{"tax_id":{"type":"string"}},"required":["tax_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool167', 'srv032', 'validate_phone', '驗證手機', '驗證手機號碼格式',
   '{"type":"object","properties":{"phone":{"type":"string"}},"required":["phone"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool168', 'srv032', 'validate_bank_account', '驗證銀行帳號', '驗證銀行帳號格式',
   '{"type":"object","properties":{"account":{"type":"string"},"bank_code":{"type":"string"}},"required":["account"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool169', 'srv032', 'validate_license_plate', '驗證車牌', '驗證車牌號碼格式',
   '{"type":"object","properties":{"plate":{"type":"string"}},"required":["plate"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-calendar (srv033)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool170', 'srv033', 'get_holidays', '國定假日', '取得國定假日列表',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool171', 'srv033', 'get_workdays', '補班日', '取得補班日列表',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool172', 'srv033', 'check_date', '查詢日期', '查詢指定日期是否為假日/補班日',
   '{"type":"object","properties":{"date":{"type":"string"}},"required":["date"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool173', 'srv033', 'get_lunar_date', '農曆查詢', '查詢農曆日期',
   '{"type":"object","properties":{"date":{"type":"string"}},"required":["date"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool174', 'srv033', 'get_long_weekends', '連假查詢', '取得連假資訊',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-youbike (srv034)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool175', 'srv034', 'search_stations', '搜尋站點', '搜尋 YouBike 站點',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool176', 'srv034', 'get_station_detail', '站點詳情', '取得站點詳細資訊',
   '{"type":"object","properties":{"station_id":{"type":"string"}},"required":["station_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool177', 'srv034', 'get_nearby_stations', '附近站點', '取得附近 YouBike 站點',
   '{"type":"object","properties":{"lat":{"type":"number"},"lng":{"type":"number"},"radius":{"type":"number","default":500}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool178', 'srv034', 'get_available_bikes', '可借車輛', '取得站點可借車輛數',
   '{"type":"object","properties":{"station_id":{"type":"string"}},"required":["station_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool179', 'srv034', 'get_station_statistics', '站點統計', '取得站點使用統計',
   '{"type":"object","properties":{"station_id":{"type":"string"}},"required":["station_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-traffic-accident (srv035)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool180', 'srv035', 'get_accident_stats', '事故統計', '取得交通事故統計',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool181', 'srv035', 'search_accidents', '搜尋事故', '搜尋交通事故紀錄',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool182', 'srv035', 'get_accidents_by_area', '地區事故', '取得指定地區事故',
   '{"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool183', 'srv035', 'get_accident_trends', '事故趨勢', '取得事故趨勢分析',
   '{"type":"object","properties":{"years":{"type":"number","default":5}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool184', 'srv035', 'get_cause_analysis', '肇因分析', '取得事故肇因分析',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-garbage (srv036)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool185', 'srv036', 'get_truck_location', '垃圾車位置', '取得垃圾車即時 GPS 位置',
   '{"type":"object","properties":{"city":{"type":"string"}},"required":["city"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool186', 'srv036', 'get_collection_schedule', '收運時刻', '取得垃圾收運時刻表',
   '{"type":"object","properties":{"city":{"type":"string"},"district":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool187', 'srv036', 'search_nearby_routes', '附近路線', '搜尋附近垃圾車路線',
   '{"type":"object","properties":{"lat":{"type":"number"},"lng":{"type":"number"},"radius":{"type":"number","default":500}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool188', 'srv036', 'get_route_detail', '路線詳情', '取得收運路線詳細資訊',
   '{"type":"object","properties":{"route_id":{"type":"string"}},"required":["route_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool189', 'srv036', 'get_recycling_points', '回收站點', '取得資源回收站點',
   '{"type":"object","properties":{"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-demographics (srv037)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool190', 'srv037', 'get_population', '人口查詢', '取得縣市人口數',
   '{"type":"object","properties":{"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool191', 'srv037', 'get_population_by_age', '年齡分布', '取得人口年齡分布',
   '{"type":"object","properties":{"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool192', 'srv037', 'get_population_trend', '人口趨勢', '取得人口趨勢資料',
   '{"type":"object","properties":{"city":{"type":"string"},"years":{"type":"number","default":10}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool193', 'srv037', 'get_birth_death_stats', '出生死亡統計', '取得出生死亡統計',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool194', 'srv037', 'get_migration_stats', '遷移統計', '取得人口遷移統計',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-tourism (srv038)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool195', 'srv038', 'search_attractions', '搜尋景點', '搜尋觀光景點',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool196', 'srv038', 'get_attraction_detail', '景點詳情', '取得景點詳細資訊',
   '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool197', 'srv038', 'search_hotels', '搜尋住宿', '搜尋住宿設施',
   '{"type":"object","properties":{"city":{"type":"string"},"keyword":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool198', 'srv038', 'get_events', '觀光活動', '取得觀光活動資訊',
   '{"type":"object","properties":{"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool199', 'srv038', 'get_tourism_statistics', '觀光統計', '取得觀光統計資料',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-sports (srv039)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool200', 'srv039', 'search_facilities', '搜尋場館', '搜尋運動場館',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool201', 'srv039', 'get_facility_detail', '場館詳情', '取得場館詳細資訊',
   '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool202', 'srv039', 'get_nearby_facilities', '附近場館', '取得附近運動場館',
   '{"type":"object","properties":{"lat":{"type":"number"},"lng":{"type":"number"},"radius":{"type":"number","default":2000}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool203', 'srv039', 'get_facility_schedule', '場館時間', '取得場館開放時間',
   '{"type":"object","properties":{"id":{"type":"string"}},"required":["id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool204', 'srv039', 'get_sports_statistics', '運動統計', '取得運動設施統計',
   '{"type":"object","properties":{"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-education (srv040)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool205', 'srv040', 'search_schools', '搜尋學校', '搜尋各級學校',
   '{"type":"object","properties":{"keyword":{"type":"string"},"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool206', 'srv040', 'get_school_detail', '學校詳情', '取得學校詳細資訊',
   '{"type":"object","properties":{"school_id":{"type":"string"}},"required":["school_id"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool207', 'srv040', 'get_schools_by_level', '依學級查詢', '依學級查詢學校',
   '{"type":"object","properties":{"level":{"type":"string","enum":["elementary","junior_high","senior_high","university"]},"city":{"type":"string"}},"required":["level"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool208', 'srv040', 'get_school_statistics', '學校統計', '取得學校統計資料',
   '{"type":"object","properties":{"city":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool209', 'srv040', 'get_enrollment_data', '招生資料', '取得招生人數資料',
   '{"type":"object","properties":{"level":{"type":"string"},"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- taiwan-election (srv041)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool210', 'srv041', 'get_election_results', '選舉結果', '取得選舉結果',
   '{"type":"object","properties":{"year":{"type":"number"},"type":{"type":"string"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool211', 'srv041', 'get_candidate_info', '候選人資訊', '取得候選人資訊',
   '{"type":"object","properties":{"name":{"type":"string"}},"required":["name"]}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool212', 'srv041', 'get_historical_results', '歷屆結果', '取得歷屆選舉結果',
   '{"type":"object","properties":{"type":{"type":"string","description":"選舉類型"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool213', 'srv041', 'get_voter_turnout', '投票率', '取得投票率資料',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now')),
  ('tool214', 'srv041', 'get_election_statistics', '選舉統計', '取得選舉統計資料',
   '{"type":"object","properties":{"year":{"type":"number"}}}', strftime('%Y-%m-%dT%H:%M:%SZ','now'));
