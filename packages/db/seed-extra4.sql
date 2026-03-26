-- Extra 4 servers (srv054-srv057) + their tools (tool271-tool290)
-- announce, foreign-trade, gazette, local-announce

-- === SERVERS ===

INSERT OR IGNORE INTO servers (
  id, owner_id, slug, name, description, version, category, tags,
  endpoint_url, declared_data_sensitivity, declared_permissions,
  declared_external_urls, is_open_source, review_status, is_published,
  is_official, data_source_agency, data_update_frequency, license, github_url, data_source_license,
  published_at, created_at, updated_at
) VALUES (
  'srv054', 'admin001', 'taiwan-announce', '政府公告', '行政院全國公告查詢', '1.0.0', 'government', '["公告","政府","announcement"]',
  'https://taiwan-announce-mcp.watermelom5404.workers.dev/', 'public', 'readonly',
  '[]', 1, 'approved', 1,
  1, '全國法規資料庫', 'daily', 'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-announce', '政府資料開放授權條款-第1版',
  '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z'
);

INSERT OR IGNORE INTO servers (
  id, owner_id, slug, name, description, version, category, tags,
  endpoint_url, declared_data_sensitivity, declared_permissions,
  declared_external_urls, is_open_source, review_status, is_published,
  is_official, data_source_agency, data_update_frequency, license, github_url, data_source_license,
  published_at, created_at, updated_at
) VALUES (
  'srv055', 'admin001', 'taiwan-foreign-trade', '國際貿易', '國際貿易局貿易政策、全球商機、進口規定', '1.0.0', 'government', '["貿易","進出口","trade","commerce"]',
  'https://taiwan-foreign-trade-mcp.watermelom5404.workers.dev/', 'public', 'readonly',
  '[]', 1, 'approved', 1,
  1, '經濟部國際貿易署', 'daily', 'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-foreign-trade', '政府資料開放授權條款-第1版',
  '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z'
);

INSERT OR IGNORE INTO servers (
  id, owner_id, slug, name, description, version, category, tags,
  endpoint_url, declared_data_sensitivity, declared_permissions,
  declared_external_urls, is_open_source, review_status, is_published,
  is_official, data_source_agency, data_update_frequency, license, github_url, data_source_license,
  published_at, created_at, updated_at
) VALUES (
  'srv056', 'admin001', 'taiwan-gazette', '行政院公報', '行政院公報查詢、草案預告、公報統計', '1.0.0', 'government', '["公報","法規","gazette","regulation"]',
  'https://taiwan-gazette-mcp.watermelom5404.workers.dev/', 'public', 'readonly',
  '[]', 1, 'approved', 1,
  1, '行政院公報資訊網', 'daily', 'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-gazette', '政府資料開放授權條款-第1版',
  '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z'
);

INSERT OR IGNORE INTO servers (
  id, owner_id, slug, name, description, version, category, tags,
  endpoint_url, declared_data_sensitivity, declared_permissions,
  declared_external_urls, is_open_source, review_status, is_published,
  is_official, data_source_agency, data_update_frequency, license, github_url, data_source_license,
  published_at, created_at, updated_at
) VALUES (
  'srv057', 'admin001', 'taiwan-local-announce', '地方公告', '六都地方政府公告查詢與統計', '1.0.0', 'government', '["公告","地方政府","六都","local"]',
  'https://taiwan-local-announce-mcp.watermelom5404.workers.dev/', 'public', 'readonly',
  '[]', 1, 'approved', 1,
  1, '六都政府公開資訊', 'daily', 'AGPL-3.0', 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-local-announce', '政府資料開放授權條款-第1版',
  '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z', '2026-03-26T00:00:00Z'
);

-- === TOOLS ===

-- srv054: taiwan-announce (5 tools)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool271', 'srv054', 'list_announcements', 'List Announcements', '列出最新政府公告（支援分頁）',
   '{"type":"object","properties":{"limit":{"type":"number","description":"回傳筆數（預設20）"},"offset":{"type":"number","description":"跳過筆數（分頁用）"}},"required":[]}', '2026-03-26T00:00:00Z'),
  ('tool272', 'srv054', 'search_announcements', 'Search Announcements', '依關鍵字搜尋政府公告主旨',
   '{"type":"object","properties":{"keyword":{"type":"string","description":"搜尋關鍵字"},"limit":{"type":"number","description":"回傳筆數（預設20）"}},"required":["keyword"]}', '2026-03-26T00:00:00Z'),
  ('tool273', 'srv054', 'get_announcements_by_agency', 'Get Announcements By Agency', '依機關名稱篩選公告',
   '{"type":"object","properties":{"agency":{"type":"string","description":"機關名稱"},"limit":{"type":"number","description":"回傳筆數（預設20）"}},"required":["agency"]}', '2026-03-26T00:00:00Z'),
  ('tool274', 'srv054', 'get_announcements_by_date', 'Get Announcements By Date', '依日期範圍篩選公告',
   '{"type":"object","properties":{"start_date":{"type":"string","description":"起始日期 YYYY-MM-DD"},"end_date":{"type":"string","description":"結束日期 YYYY-MM-DD"},"limit":{"type":"number","description":"回傳筆數"}},"required":["start_date"]}', '2026-03-26T00:00:00Z'),
  ('tool275', 'srv054', 'get_announcement_stats', 'Get Announcement Stats', '公告統計摘要（機關分布、日期範圍）',
   '{"type":"object","properties":{},"required":[]}', '2026-03-26T00:00:00Z');

-- srv055: taiwan-foreign-trade (5 tools)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool276', 'srv055', 'search_trade_announcements', 'Search Trade Announcements', '搜尋國際貿易局貿易政策公告',
   '{"type":"object","properties":{"keyword":{"type":"string","description":"搜尋關鍵字"},"limit":{"type":"number","description":"回傳筆數"}},"required":["keyword"]}', '2026-03-26T00:00:00Z'),
  ('tool277', 'srv055', 'search_global_business_opportunities', 'Search Global Business Opportunities', '搜尋 50+ 國全球商機情報',
   '{"type":"object","properties":{"keyword":{"type":"string","description":"商機關鍵字"},"country":{"type":"string","description":"國家名稱"},"limit":{"type":"number","description":"回傳筆數"}},"required":[]}', '2026-03-26T00:00:00Z'),
  ('tool278', 'srv055', 'get_trade_news', 'Get Trade News', '取得國際貿易局最新新聞稿',
   '{"type":"object","properties":{"limit":{"type":"number","description":"回傳筆數（預設20）"}},"required":[]}', '2026-03-26T00:00:00Z'),
  ('tool279', 'srv055', 'lookup_import_regulations', 'Lookup Import Regulations', '查詢進口行政管理規定（工業、農業、其他三類）',
   '{"type":"object","properties":{"keyword":{"type":"string","description":"商品名稱或稅則號別"},"category":{"type":"string","description":"分類：industrial/agricultural/other"}},"required":["keyword"]}', '2026-03-26T00:00:00Z'),
  ('tool280', 'srv055', 'list_eca_fta_agreements', 'List ECA/FTA Agreements', '列出台灣已簽署的 ECA/FTA 經貿協定',
   '{"type":"object","properties":{},"required":[]}', '2026-03-26T00:00:00Z');

-- srv056: taiwan-gazette (5 tools)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool281', 'srv056', 'get_latest_gazette', 'Get Latest Gazette', '取得最新行政院公報',
   '{"type":"object","properties":{"limit":{"type":"number","description":"回傳筆數（預設20）"}},"required":[]}', '2026-03-26T00:00:00Z'),
  ('tool282', 'srv056', 'search_gazette', 'Search Gazette', '依關鍵字搜尋公報',
   '{"type":"object","properties":{"keyword":{"type":"string","description":"搜尋關鍵字"},"section":{"type":"string","description":"篇別（如院令、部令等）"},"limit":{"type":"number","description":"回傳筆數"}},"required":["keyword"]}', '2026-03-26T00:00:00Z'),
  ('tool283', 'srv056', 'get_gazette_detail', 'Get Gazette Detail', '取得公報完整內容（依 MetaId）',
   '{"type":"object","properties":{"meta_id":{"type":"string","description":"公報 MetaId"}},"required":["meta_id"]}', '2026-03-26T00:00:00Z'),
  ('tool284', 'srv056', 'list_draft_regulations', 'List Draft Regulations', '列出草案預告（開放民眾留言之草案）',
   '{"type":"object","properties":{"limit":{"type":"number","description":"回傳筆數（預設20）"}},"required":[]}', '2026-03-26T00:00:00Z'),
  ('tool285', 'srv056', 'get_gazette_statistics', 'Get Gazette Statistics', '公報篇別統計',
   '{"type":"object","properties":{},"required":[]}', '2026-03-26T00:00:00Z');

-- srv057: taiwan-local-announce (5 tools)
INSERT OR IGNORE INTO tools (id, server_id, name, display_name, description, input_schema, created_at) VALUES
  ('tool286', 'srv057', 'list_local_announcements', 'List Local Announcements', '列出六都地方政府公告',
   '{"type":"object","properties":{"city":{"type":"string","description":"城市名稱（台北/新北/桃園/台中/台南/高雄）"},"limit":{"type":"number","description":"回傳筆數"}},"required":[]}', '2026-03-26T00:00:00Z'),
  ('tool287', 'srv057', 'search_local_announcements', 'Search Local Announcements', '依關鍵字搜尋六都地方公告',
   '{"type":"object","properties":{"keyword":{"type":"string","description":"搜尋關鍵字"},"city":{"type":"string","description":"城市名稱"},"limit":{"type":"number","description":"回傳筆數"}},"required":["keyword"]}', '2026-03-26T00:00:00Z'),
  ('tool288', 'srv057', 'get_local_announcements_by_agency', 'Get Local Announcements By Agency', '依機關名稱篩選六都地方公告',
   '{"type":"object","properties":{"agency":{"type":"string","description":"機關名稱"},"city":{"type":"string","description":"城市名稱"},"limit":{"type":"number","description":"回傳筆數"}},"required":["agency"]}', '2026-03-26T00:00:00Z'),
  ('tool289', 'srv057', 'get_local_announce_stats', 'Get Local Announce Stats', '六都地方公告統計',
   '{"type":"object","properties":{"city":{"type":"string","description":"指定城市或全部"}},"required":[]}', '2026-03-26T00:00:00Z'),
  ('tool290', 'srv057', 'list_supported_cities', 'List Supported Cities', '列出支援的城市清單（六都）',
   '{"type":"object","properties":{},"required":[]}', '2026-03-26T00:00:00Z');
