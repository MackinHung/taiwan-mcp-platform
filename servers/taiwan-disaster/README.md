# Taiwan Disaster MCP Server

NCDR 民生示警 MCP Server -- 提供地震、颱風、豪雨、水災、土石流、空氣品質、強風等 43 類災害警報資訊。

## Data Source

- **API**: NCDR 民生示警 (`https://alerts.ncdr.nat.gov.tw/api`)
- **Auth**: None for public alerts (optional: `NCDR_API_KEY` for higher rate limits)
- **Format**: JSON (CAP-based, JSON-wrapped)
- **Alert Types**: 43 types including earthquake, typhoon, heavy rain, flood, landslide, air quality, strong wind

## Tools (5)

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `get_active_alerts` | 取得所有生效中警報 | - |
| `get_alerts_by_type` | 依類型篩選警報 | `alertType` |
| `get_alerts_by_region` | 依縣市/地區篩選 | `region` |
| `get_earthquake_reports` | 地震報告 | - |
| `get_alert_history` | 歷史警報查詢 | - |

## Alert Types

| Key | Chinese |
|-----|---------|
| `earthquake` | 地震 |
| `typhoon` | 颱風 |
| `heavy_rain` | 豪雨 |
| `flood` | 水災 |
| `landslide` | 土石流 |
| `air_quality` | 空氣品質 |
| `strong_wind` | 強風 |

## Development

```bash
npm install
npm test          # Run tests
npm run dev       # Start dev server
```

## Configuration

Optional: Set `NCDR_API_KEY` as a Cloudflare secret for higher API rate limits.

```bash
wrangler secret put NCDR_API_KEY
```

## Endpoints

- `POST /mcp` - Streamable HTTP (MCP SDK)
- `POST /` - JSON-RPC 2.0
- `GET /` - Server info
