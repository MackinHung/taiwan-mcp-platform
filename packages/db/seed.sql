-- Seed data for Taiwan MCP Platform

-- Admin user
INSERT OR IGNORE INTO users (id, github_id, google_id, username, display_name, role, plan, created_at, updated_at)
VALUES ('admin001', 0, NULL, 'admin', 'Platform Admin', 'admin', 'free',
        strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- Sample servers
INSERT OR IGNORE INTO servers (
  id, owner_id, slug, name, description, version, category, tags,
  is_official, is_published, review_status,
  badge_source, badge_data, badge_permission, badge_community, badge_external,
  total_calls, total_stars, monthly_calls,
  declared_data_sensitivity, declared_permissions, declared_external_urls, is_open_source,
  created_at, updated_at, published_at
) VALUES
  ('srv001', 'admin001', 'taiwan-weather', '台灣氣象',
   '中央氣象署資料 — 天氣預報、地震、颱風、潮汐、紫外線', '1.0.0', 'government',
   '["天氣","氣象","forecast","earthquake"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://opendata.cwa.gov.tw"]', 1,
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv004', 'admin001', 'taiwan-air-quality', '台灣空氣品質',
   '環境部空氣品質監測 — AQI 指數、PM2.5、即時監測站資料', '1.0.0', 'government',
   '["空氣品質","AQI","PM2.5","環境"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://data.moenv.gov.tw"]', 1,
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv005', 'admin001', 'taiwan-electricity', '台灣電力資訊',
   '台電即時用電量、電力備轉容量、各機組發電資訊', '1.0.0', 'utility',
   '["電力","能源","台電","用電"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://www.taipower.com.tw"]', 1,
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now')),

  ('srv006', 'admin001', 'taiwan-stock', '台股即時報價',
   '台灣證券交易所即時股價、大盤指數、漲跌排行', '1.0.0', 'finance',
   '["股票","投資","金融","TWSE"]',
   1, 1, 'approved', 'open', 'public', 'readonly', 'new', 'unverified',
   0, 0, 0, 'public', 'readonly', '["https://www.twse.com.tw"]', 1,
   strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'), strftime('%Y-%m-%dT%H:%M:%SZ','now'));

-- Tools for taiwan-weather (8 tools)
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

-- Tools for taiwan-air-quality (5 tools)
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

-- Tools for taiwan-electricity (5 tools)
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

-- Tools for taiwan-stock (5 tools)
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
