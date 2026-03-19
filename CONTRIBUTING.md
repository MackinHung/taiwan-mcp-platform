# Contributing to Taiwan MCP Platform

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/MackinHung/taiwan-mcp-platform.git
   cd taiwan-mcp-platform
   npm install
   ```

2. **Run tests** to verify setup
   ```bash
   npm test
   ```

3. **Local development**
   ```bash
   cd packages/db && npm run migrate:local && npm run seed:local
   cd packages/gateway && npm run dev    # API on :8787
   cd packages/ui && npm run dev         # UI on :3000
   ```

## Coding Standards

- **Language**: TypeScript (strict mode), Vanilla JS for UI
- **Framework**: Hono for all Cloudflare Workers
- **Testing**: Vitest, TDD mandatory (write tests first)
- **Immutability**: Always create new objects, never mutate
- **Files**: 200-400 lines typical, 800 max
- **Functions**: < 50 lines
- **Error handling**: Use `AppError` from `packages/shared/src/errors.ts`
- **Validation**: Zod schemas from `packages/shared/src/validation.ts`
- **API responses**: `ApiResponse<T>` envelope from `packages/shared/src/types.ts`

## Pull Request Process

1. Create a feature branch from `master`
2. Write tests first (TDD approach)
3. Implement your changes
4. Ensure all tests pass (`npm test`)
5. Follow commit message format: `<type>: <description>`
   - Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`
6. Submit a PR with a clear description

## Adding a New MCP Server

Follow the pattern in `servers/taiwan-weather/`:

1. Create `servers/taiwan-<name>/` with:
   - `src/index.ts` - Hono worker entry
   - `src/tools.ts` - MCP tool definitions
   - `src/client.ts` - API client
   - `tests/` - Vitest tests
   - `wrangler.toml` - Worker config
   - `package.json`, `tsconfig.json`, `vitest.config.ts`
2. Write tests first
3. Implement 5 tools minimum
4. Add security declarations

## Cloudflare Configuration

The `wrangler.toml` files contain placeholder values (`<YOUR_*>`). To deploy:

1. Create the required Cloudflare resources (D1 database, KV namespaces, R2 bucket)
2. Replace placeholder IDs in `wrangler.toml` with your resource IDs
3. Set OAuth secrets via `wrangler secret put` or `.dev.vars` for local development
4. Set `COMPOSER_WORKER_URL` and `GATEWAY_WORKER_URL` in Cloudflare Pages environment variables

## Code of Conduct

Be respectful and constructive. We welcome contributors of all backgrounds and experience levels.

## License

By contributing, you agree that your contributions will be licensed under the AGPL-3.0 license.
