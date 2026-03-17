-- Seed data for Taiwan MCP Platform

-- Admin user
INSERT INTO users (id, github_id, google_id, username, display_name, role, plan)
VALUES ('admin001', 0, NULL, 'admin', 'Platform Admin', 'admin', 'enterprise');

-- Sample servers
INSERT INTO servers (id, owner_id, slug, name, description, version, category, tags, is_official, is_published, review_status, badge_source, badge_data, badge_permission, badge_community)
VALUES
  ('srv001', 'admin001', 'taiwan-weather', '台灣氣象', '中央氣象署資料 — 天氣預報、地震、颱風、潮汐', '1.0.0', 'government', '["天氣","氣象","forecast","earthquake"]', 1, 1, 'approved', 'open', 'public', 'readonly', 'new'),
  ('srv002', 'admin001', 'taiwan-transit', '台灣交通', '公共運輸資料 — 台鐵、高鐵、公車即時到站', '0.1.0', 'government', '["交通","台鐵","高鐵","公車"]', 1, 0, 'pending_scan', 'declared', 'public', 'readonly', 'new'),
  ('srv003', 'admin001', 'taiwan-company', '台灣公司查詢', '經濟部商業司公司登記資料', '0.1.0', 'government', '["公司","商業","登記"]', 1, 0, 'pending_scan', 'declared', 'public', 'readonly', 'new');

-- Sample tools for taiwan-weather
INSERT INTO tools (id, server_id, name, display_name, description, input_schema)
VALUES
  ('tool001', 'srv001', 'get_forecast_36hr', '36小時天氣預報', '取得台灣各縣市未來 36 小時天氣預報', '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}'),
  ('tool002', 'srv001', 'get_forecast_7day', '7天天氣預報', '取得台灣各縣市未來 7 天天氣預報', '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}'),
  ('tool003', 'srv001', 'get_earthquake_recent', '最近地震', '取得最近地震報告', '{"type":"object","properties":{"limit":{"type":"number","description":"筆數（預設5）","default":5}}}'),
  ('tool004', 'srv001', 'get_typhoon_active', '颱風資訊', '取得目前活躍颱風資訊', '{"type":"object","properties":{}}'),
  ('tool005', 'srv001', 'get_weather_warning', '氣象警特報', '取得目前生效的氣象警特報', '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}'),
  ('tool006', 'srv001', 'get_rain_observation', '即時雨量', '取得即時雨量觀測', '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}'),
  ('tool007', 'srv001', 'get_tidal_forecast', '潮汐預報', '取得潮汐預報', '{"type":"object","properties":{"port":{"type":"string","description":"港口名稱"}},"required":["port"]}'),
  ('tool008', 'srv001', 'get_uv_index', '紫外線指數', '取得紫外線指數', '{"type":"object","properties":{"city":{"type":"string","description":"縣市名稱（不填=全部）"}}}');
