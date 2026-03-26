-- One-time UPDATE to fill missing marketplace card fields for 8 servers
-- Context: srv001,004-006 had INSERT OR IGNORE skip on re-seed;
--          srv054-057 seed-extra4.sql omitted these columns.

-- === Original 4 (srv001, srv004-006) ===

UPDATE servers SET
  data_source_agency = 'CWA (中央氣象署)',
  data_update_frequency = 'hourly',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-weather',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-weather';

UPDATE servers SET
  data_source_agency = 'MOENV (環境部)',
  data_update_frequency = 'hourly',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-air-quality',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-air-quality';

UPDATE servers SET
  data_source_agency = 'Taipower (台電)',
  data_update_frequency = 'real-time',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-electricity',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-electricity';

UPDATE servers SET
  data_source_agency = 'TWSE (證交所)',
  data_update_frequency = 'real-time',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-stock',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-stock';

-- === Extra 4 (srv054-057) ===

UPDATE servers SET
  data_update_frequency = 'daily',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-announce',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-announce';

UPDATE servers SET
  data_update_frequency = 'daily',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-foreign-trade',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-foreign-trade';

UPDATE servers SET
  data_update_frequency = 'daily',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-gazette',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-gazette';

UPDATE servers SET
  data_update_frequency = 'daily',
  license = 'AGPL-3.0',
  github_url = 'https://github.com/MackinHung/taiwan-mcp-platform/tree/master/servers/taiwan-local-announce',
  data_source_license = '政府資料開放授權條款-第1版'
WHERE slug = 'taiwan-local-announce';
