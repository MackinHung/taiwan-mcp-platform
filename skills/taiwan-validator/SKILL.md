---
name: taiwan-validator
description: "5 tools for Taiwan data validation: national ID, tax ID, phone number, bank account, license plate"
version: 1.0.0
metadata:
  openclaw:
    requires:
      env:
        - FORMOSA_MCP_API_KEY
      bins:
        - node
    primaryEnv: FORMOSA_MCP_API_KEY
    homepage: https://formosa-mcp-platform.pages.dev
    os: [macos, linux, windows]
---

# Taiwan Validator MCP Server

Validate common Taiwan identifiers and numbers, including national ID (with check digit verification), unified business number (tax ID), mobile phone number (with carrier detection), bank account format, and license plate format.

## Tools

| Tool | Description |
|------|-------------|
| `validate_national_id` | Validate Taiwan national ID number (1 letter + 9 digits with check digit) |
| `validate_tax_id` | Validate Taiwan unified business number (8 digits with check digit) |
| `validate_phone` | Validate Taiwan mobile phone format and detect carrier |
| `validate_bank_account` | Validate Taiwan bank account format (bank code + account number) |
| `validate_license_plate` | Validate Taiwan license plate format (car, motorcycle, commercial) |

## Usage

### Via OpenClaw Config (openclaw.json)
```json
{
  "mcpServers": {
    "taiwan-validator": {
      "url": "https://formosa-mcp-platform.pages.dev/mcp/s/taiwan-validator",
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
Local validation algorithms (no external API required)

## Trust Grade
This server is reviewed and graded by Taiwan MCP Platform's trust system.
