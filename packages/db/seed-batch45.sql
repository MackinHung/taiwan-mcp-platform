-- ============================================================
-- Batch 4 Servers (srv042-srv049) + Batch 5 (srv050-srv053)
-- Run AFTER seed.sql for complete seeding
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
  ('srv042', 'admin001', 'taiwan-food-nutrition', '台灣食品營養',
   'FDA 食品營養成分資料庫 — 食品搜尋、營養比較、營養素篩選', '1.0.0', 'government',
   '["食品","營養","FDA","成分"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.fda.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'FDA (食藥署)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-food-nutrition',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv043', 'admin001', 'taiwan-radiation', '台灣輻射監測',
   '原能會即時輻射監測 — 環境輻射值、異常警戒、監測站資料', '1.0.0', 'government',
   '["輻射","原能會","監測","AEC"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://www.aec.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'AEC (原能會)', 0, 'hourly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-radiation',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv044', 'admin001', 'taiwan-movie', '台灣電影院線',
   '文化部電影院線資訊 — 電影搜尋、電影院查詢、場次時間', '1.0.0', 'social',
   '["電影","院線","影展","文化"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.moc.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOC (文化部)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-movie',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv045', 'admin001', 'taiwan-fire-incident', '台灣火災統計',
   '消防署火災統計 — 火災案件、傷亡報告、起火原因分析', '1.0.0', 'government',
   '["火災","消防","統計","安全"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.nfa.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'NFA (消防署)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-fire-incident',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv046', 'admin001', 'taiwan-water-quality', '台灣水質監測',
   '環境部河川水質監測 — 水質數據、污染排名、水質趨勢', '1.0.0', 'government',
   '["水質","河川","污染","環境"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.moenv.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOENV (環境部)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-water-quality',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv047', 'admin001', 'taiwan-museum', '台灣博物館展覽',
   '文化部博物館與展覽資訊 — 博物館搜尋、展覽查詢、即將開展', '1.0.0', 'social',
   '["博物館","展覽","美術館","文化"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.moc.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOC (文化部)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-museum',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv048', 'admin001', 'taiwan-animal-shelter', '台灣動物收容',
   '農業部動物收容資訊 — 可領養動物、收容所搜尋、收容統計', '1.0.0', 'government',
   '["動物","收容","領養","寵物"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.moa.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOA (農業部)', 0, 'daily', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-animal-shelter',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv049', 'admin001', 'taiwan-fishery', '台灣漁業資訊',
   '農業部漁業署資料 — 漁業生產統計、漁港搜尋、養殖資訊', '1.0.0', 'government',
   '["漁業","漁港","養殖","水產"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.moa.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOA (農業部)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-fishery',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv050', 'admin001', 'taiwan-realestate', '台灣實價登錄',
   '內政部不動產實價登錄 — 成交查詢、區域房價統計、價格趨勢', '1.0.0', 'government',
   '["實價登錄","房價","不動產","買賣"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://plvr.land.moi.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOI (內政部)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-realestate',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv051', 'admin001', 'taiwan-geology', '台灣地質調查',
   '地質調查及礦業管理中心 — 土壤液化、活動斷層、地質敏感區', '1.0.0', 'government',
   '["地質","液化","斷層","崩塌"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://www.gsmma.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOEA (經濟部地質調查及礦業管理中心)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-geology',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv052', 'admin001', 'taiwan-flood', '台灣水災水情',
   '水利署水災水情資訊 — 淹水潛勢、河川水位、雨量、水庫水情', '1.0.0', 'government',
   '["水災","淹水","水位","雨量"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://fhy.wra.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'WRA (水利署)', 0, 'real-time', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-flood',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv053', 'admin001', 'taiwan-zoning', '台灣都市計畫',
   '內政部都市計畫 — 使用分區查詢、公共設施用地、都市更新', '1.0.0', 'government',
   '["都市計畫","分區","土地","更新"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://urban.tcd.gov.tw"]', 1,
   'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform', '政府資料開放授權條款-第1版',
   'MOI (內政部)', 0, 'monthly', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-zoning',
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- ============================================================
-- Endpoint URL updates for ALL servers
-- ============================================================
UPDATE servers SET endpoint_url = 'https://taiwan-weather-mcp.watermelom5404.workers.dev/' WHERE id = 'srv001';
UPDATE servers SET endpoint_url = 'https://taiwan-air-quality-mcp.watermelom5404.workers.dev/' WHERE id = 'srv004';
UPDATE servers SET endpoint_url = 'https://taiwan-electricity-mcp.watermelom5404.workers.dev/' WHERE id = 'srv005';
UPDATE servers SET endpoint_url = 'https://taiwan-stock-mcp.watermelom5404.workers.dev/' WHERE id = 'srv006';
UPDATE servers SET endpoint_url = 'https://taiwan-news-mcp.watermelom5404.workers.dev/' WHERE id = 'srv007';
UPDATE servers SET endpoint_url = 'https://taiwan-hospital.watermelom5404.workers.dev/' WHERE id = 'srv008';
UPDATE servers SET endpoint_url = 'https://taiwan-company.watermelom5404.workers.dev/' WHERE id = 'srv009';
UPDATE servers SET endpoint_url = 'https://taiwan-transit-mcp.watermelom5404.workers.dev/' WHERE id = 'srv010';
UPDATE servers SET endpoint_url = 'https://taiwan-exchange-rate-mcp.watermelom5404.workers.dev/' WHERE id = 'srv011';
UPDATE servers SET endpoint_url = 'https://taiwan-food-safety-mcp.watermelom5404.workers.dev/' WHERE id = 'srv012';
UPDATE servers SET endpoint_url = 'https://taiwan-weather-alert-mcp.watermelom5404.workers.dev/' WHERE id = 'srv013';
UPDATE servers SET endpoint_url = 'https://taiwan-invoice-mcp.watermelom5404.workers.dev/' WHERE id = 'srv014';
UPDATE servers SET endpoint_url = 'https://taiwan-budget-mcp.watermelom5404.workers.dev/' WHERE id = 'srv015';
UPDATE servers SET endpoint_url = 'https://taiwan-tax-mcp.watermelom5404.workers.dev/' WHERE id = 'srv016';
UPDATE servers SET endpoint_url = 'https://taiwan-labor-mcp.watermelom5404.workers.dev/' WHERE id = 'srv017';
UPDATE servers SET endpoint_url = 'https://taiwan-patent-mcp.watermelom5404.workers.dev/' WHERE id = 'srv018';
UPDATE servers SET endpoint_url = 'https://taiwan-customs-mcp.watermelom5404.workers.dev/' WHERE id = 'srv019';
UPDATE servers SET endpoint_url = 'https://taiwan-law-mcp.watermelom5404.workers.dev/' WHERE id = 'srv020';
UPDATE servers SET endpoint_url = 'https://taiwan-judgment-mcp.watermelom5404.workers.dev/' WHERE id = 'srv021';
UPDATE servers SET endpoint_url = 'https://taiwan-legislative-mcp.watermelom5404.workers.dev/' WHERE id = 'srv022';
UPDATE servers SET endpoint_url = 'https://taiwan-procurement-mcp.watermelom5404.workers.dev/' WHERE id = 'srv023';
UPDATE servers SET endpoint_url = 'https://taiwan-insurance-calc-mcp.watermelom5404.workers.dev/' WHERE id = 'srv024';
UPDATE servers SET endpoint_url = 'https://taiwan-drug-mcp.watermelom5404.workers.dev/' WHERE id = 'srv025';
UPDATE servers SET endpoint_url = 'https://taiwan-cdc-mcp.watermelom5404.workers.dev/' WHERE id = 'srv026';
UPDATE servers SET endpoint_url = 'https://taiwan-oil-price-mcp.watermelom5404.workers.dev/' WHERE id = 'srv027';
UPDATE servers SET endpoint_url = 'https://taiwan-reservoir-mcp.watermelom5404.workers.dev/' WHERE id = 'srv028';
UPDATE servers SET endpoint_url = 'https://taiwan-disaster-mcp.watermelom5404.workers.dev/' WHERE id = 'srv029';
UPDATE servers SET endpoint_url = 'https://taiwan-agri-price-mcp.watermelom5404.workers.dev/' WHERE id = 'srv030';
UPDATE servers SET endpoint_url = 'https://taiwan-parking-mcp.watermelom5404.workers.dev/' WHERE id = 'srv031';
UPDATE servers SET endpoint_url = 'https://taiwan-validator-mcp.watermelom5404.workers.dev/' WHERE id = 'srv032';
UPDATE servers SET endpoint_url = 'https://taiwan-calendar-mcp.watermelom5404.workers.dev/' WHERE id = 'srv033';
UPDATE servers SET endpoint_url = 'https://taiwan-youbike-mcp.watermelom5404.workers.dev/' WHERE id = 'srv034';
UPDATE servers SET endpoint_url = 'https://taiwan-traffic-accident-mcp.watermelom5404.workers.dev/' WHERE id = 'srv035';
UPDATE servers SET endpoint_url = 'https://taiwan-garbage-mcp.watermelom5404.workers.dev/' WHERE id = 'srv036';
UPDATE servers SET endpoint_url = 'https://taiwan-demographics-mcp.watermelom5404.workers.dev/' WHERE id = 'srv037';
UPDATE servers SET endpoint_url = 'https://taiwan-tourism-mcp.watermelom5404.workers.dev/' WHERE id = 'srv038';
UPDATE servers SET endpoint_url = 'https://taiwan-sports-mcp.watermelom5404.workers.dev/' WHERE id = 'srv039';
UPDATE servers SET endpoint_url = 'https://taiwan-education-mcp.watermelom5404.workers.dev/' WHERE id = 'srv040';
UPDATE servers SET endpoint_url = 'https://taiwan-election-mcp.watermelom5404.workers.dev/' WHERE id = 'srv041';
UPDATE servers SET endpoint_url = 'https://taiwan-food-nutrition-mcp.watermelom5404.workers.dev/' WHERE id = 'srv042';
UPDATE servers SET endpoint_url = 'https://taiwan-radiation-mcp.watermelom5404.workers.dev/' WHERE id = 'srv043';
UPDATE servers SET endpoint_url = 'https://taiwan-movie-mcp.watermelom5404.workers.dev/' WHERE id = 'srv044';
UPDATE servers SET endpoint_url = 'https://taiwan-fire-incident-mcp.watermelom5404.workers.dev/' WHERE id = 'srv045';
UPDATE servers SET endpoint_url = 'https://taiwan-water-quality-mcp.watermelom5404.workers.dev/' WHERE id = 'srv046';
UPDATE servers SET endpoint_url = 'https://taiwan-museum-mcp.watermelom5404.workers.dev/' WHERE id = 'srv047';
UPDATE servers SET endpoint_url = 'https://taiwan-animal-shelter-mcp.watermelom5404.workers.dev/' WHERE id = 'srv048';
UPDATE servers SET endpoint_url = 'https://taiwan-fishery-mcp.watermelom5404.workers.dev/' WHERE id = 'srv049';
UPDATE servers SET endpoint_url = 'https://taiwan-realestate-mcp.watermelom5404.workers.dev/' WHERE id = 'srv050';
UPDATE servers SET endpoint_url = 'https://taiwan-geology-mcp.watermelom5404.workers.dev/' WHERE id = 'srv051';
UPDATE servers SET endpoint_url = 'https://taiwan-flood-mcp.watermelom5404.workers.dev/' WHERE id = 'srv052';
UPDATE servers SET endpoint_url = 'https://taiwan-zoning-mcp.watermelom5404.workers.dev/' WHERE id = 'srv053';

-- tools_count is computed via JOIN, no UPDATE needed
