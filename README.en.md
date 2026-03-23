<p align="center">
  <h1 align="center">Formosa MCP Platform</h1>
  <p align="center">
    Taiwan's first MCP marketplace — Composer + Security Review Badges + 47 Government Open Data MCP Servers
  </p>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-AGPL--3.0-blue.svg" alt="AGPL-3.0"></a>
  <img src="https://img.shields.io/badge/MCP%20Servers-47-brightgreen" alt="39 MCP Servers">
  <img src="https://img.shields.io/badge/TypeScript-strict-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Cloudflare%20Workers-orange" alt="Cloudflare Workers">
</p>

<p align="center">
  <a href="README.md">中文</a> | <strong>English</strong>
</p>

---

## What is this?

An open-source toolkit that connects AI assistants (ChatGPT, Claude, etc.) to Taiwan government open data via [MCP (Model Context Protocol)](https://modelcontextprotocol.io/).

Use a single server, or combine multiple servers into one endpoint with the **Composer**. Each server comes with **Security Review Badges** indicating code quality and dependency risk.

Fully open-source (AGPL-3.0). Free to use, free to deploy.

---

## Features

- **47 MCP Servers** — covering Taiwan government open data across all major agencies
- **Composer** — combine multiple servers into a single endpoint with namespace routing
- **Security Review Badges** — automated security scanning and grading
- **SBOM / OSV scanning** — supply chain transparency and vulnerability detection

---

## 47 MCP Servers

**Weather & Environment** — `weather` `air-quality` `weather-alert` `reservoir` `disaster` `radiation` `water-quality`

**Transportation** — `transit` `parking` `youbike` `traffic-accident` `garbage`

**Finance** — `stock` `exchange-rate` `invoice` `budget` `tax` `customs`

**Healthcare** — `hospital` `drug` `cdc` `food-safety` `insurance-calc` `food-nutrition`

**Law & Politics** — `law` `judgment` `legislative` `procurement` `election`

**Daily Life** — `company` `labor` `patent` `calendar` `demographics` `tourism` `sports` `education`

**Culture & Entertainment** — `movie` `museum`

**Agriculture & Fishery** — `agri-price` `fishery` `animal-shelter`

**News** — `news` &nbsp;&nbsp; **Fire Services** — `fire-incident` &nbsp;&nbsp; **Utilities** — `validator`

> All server names are prefixed with `taiwan-`, e.g. `taiwan-weather`, `taiwan-stock`.

---

## Architecture

```
packages/
  shared/     Shared types, validation, error format
  db/         D1 Schema (15 tables)
  gateway/    API Gateway, OAuth, Rate Limiting
  review/     Security scanning, badge calculation
  composer/   MCP Proxy, Namespace Routing
  ui/         Frontend (vanilla HTML/JS/CSS)
servers/
  taiwan-*/   47 MCP Servers
```

Stack: Cloudflare Workers + D1 + KV + R2 + Pages, TypeScript, Hono, Vitest

---

## Contributing

This project accepts bug fixes and improvements to existing features. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Report vulnerabilities via GitHub's private vulnerability reporting. See [SECURITY.md](SECURITY.md).

## License

[AGPL-3.0](LICENSE) — Any modification or deployment (including SaaS) must be open-sourced under the same license.
