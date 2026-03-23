---
name: taiwan-invoice
description: "5 tools for Taiwan e-invoice data: winning numbers, prize check, invoice header, invoice detail, recent periods"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - TW_MCP_API_KEY
      bins:
        - node
    primaryEnv: TW_MCP_API_KEY
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Invoice MCP Server

Access Taiwan's Uniform Invoice (e-invoice) system, including winning number lookup, prize checking, invoice header/detail queries, and period listings.

## Tools

| Tool | Description |
|------|-------------|
| `get_winning_numbers` | Query winning invoice numbers for a given period |
| `check_invoice_number` | Check if an invoice number has won a prize |
| `query_invoice_header` | Query e-invoice header information |
| `query_invoice_detail` | Query e-invoice purchase details |
| `get_recent_periods` | List recent queryable invoice periods |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-invoice": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-invoice",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```

### Get an API Key
1. Visit https://formosa-mcp-platform.pages.dev
2. Sign in with GitHub or Google
3. Go to Profile > API Keys > Create New Key

## Data Source
Ministry of Finance E-Invoice Platform Open Data API

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
