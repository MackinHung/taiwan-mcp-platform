# Taiwan Flood & Water Resources MCP Server

An MCP (Model Context Protocol) server that provides real-time Taiwan flood and water resource data, deployed as a Cloudflare Worker.

Data sources: [Water Resources Agency (WRA) Open Data](https://opendata.wra.gov.tw/) and [Civil IoT Taiwan SensorThings API](https://sta.ci.taiwan.gov.tw/).

## Tools

| Tool | Description |
|------|-------------|
| `get_flood_potential` | Query flood potential data by county/town |
| `get_river_water_level` | Get river water level observations with warning status |
| `get_rainfall_data` | Query real-time rainfall data by city or station |
| `get_flood_warnings` | Get real-time flood warnings from Civil IoT sensors |
| `get_reservoir_status` | Get reservoir status including capacity, inflow, and outflow |

## Installation

```bash
npm install
```

## Development

```bash
# Run locally
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build
```

## Deployment

```bash
npx wrangler deploy
```

## MCP Endpoints

| Endpoint | Transport | Description |
|----------|-----------|-------------|
| `POST /` | JSON-RPC 2.0 | Legacy RPC endpoint |
| `ALL /mcp` | Streamable HTTP (MCP SDK) | Standard MCP transport |

### Example: List tools

```bash
curl -X POST https://your-worker.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

### Example: Call a tool

```bash
curl -X POST https://your-worker.workers.dev/ \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "id":2,
    "method":"tools/call",
    "params":{
      "name":"get_reservoir_status",
      "arguments":{"reservoir_name":"石門水庫"}
    }
  }'
```

## Security

| Property | Value |
|----------|-------|
| Data sensitivity | **Public** (government open data) |
| Permissions | **Readonly** (no writes, no side effects) |
| Authentication | None required |
| External APIs | WRA Open Data, Civil IoT SensorThings |

This server only reads publicly available government data. No API keys, authentication, or personal data involved.

## Tech Stack

- [Hono](https://hono.dev/) -- HTTP framework
- [MCP SDK](https://github.com/modelcontextprotocol/typescript-sdk) -- Model Context Protocol
- [Cloudflare Workers](https://workers.cloudflare.com/) -- Edge runtime
- [Vitest](https://vitest.dev/) -- Testing

## License

[AGPL-3.0](./LICENSE)
