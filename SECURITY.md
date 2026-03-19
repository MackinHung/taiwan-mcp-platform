# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (master) | Yes |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email the maintainer directly or use GitHub's private vulnerability reporting feature
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

We will acknowledge receipt within 48 hours and provide an estimated timeline for a fix.

## Security Features

This platform includes several built-in security features:

- **L2 Behavioral Sandbox**: Runtime trace analysis and violation detection for MCP servers
- **SBOM Generation**: CycloneDX 1.5 software bill of materials for all packages
- **Runtime Monitoring**: Automated detection of tool abuse, error spikes, and new URL patterns
- **VirusTotal Integration**: Package scanning with graceful degradation
- **OSV Re-scan**: Periodic vulnerability scanning against the OSV database
- **Permission Enforcement**: Soft log-only permission boundary enforcement
- **5-Dimension Trust Badges**: Automated security grading for all MCP servers
- **Rate Limiting**: KV-backed rate limiting on all API endpoints
- **OAuth Authentication**: GitHub and Google OAuth with secure session management
- **Input Validation**: Zod schema validation on all API inputs

## Secrets Management

- All secrets are stored in Cloudflare Workers secrets (via `wrangler secret`) or `.dev.vars` (local only)
- `.dev.vars` and `.env*` files are gitignored
- `wrangler.toml` files contain only placeholder values for resource IDs
- OAuth client secrets are never committed to the repository
