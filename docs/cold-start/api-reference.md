# API 路由 & 型別參考

> **Agent 自主維護**: 新增或修改 API route、型別時應同步更新本文件。

## Key Types Quick Reference

```typescript
// 組合門檻（核心商業邏輯）
FREE_COMPOSITION_LIMIT = 10  // ≤10 servers → 可自配，不強制走平台路由
ROUTED_COMPOSITION = 10+     // >10 servers → 必須使用 Composer 路由

Plan: 'free' | 'developer' | 'team' | 'enterprise'
Scenario: 'hobby' | 'business' | 'enterprise' | 'regulated'
Role: 'user' | 'developer' | 'admin'
Category: 'government' | 'finance' | 'utility' | 'social' | 'other'

ReviewStatus: pending_scan | scanning | scan_passed | scan_failed
            | sandbox_testing | sandbox_passed | sandbox_failed
            | human_review | approved | rejected

BadgeSource:     'open_audited' | 'open' | 'declared' | 'undeclared'
BadgeData:       'public' | 'account' | 'personal' | 'sensitive'
BadgePermission: 'readonly' | 'limited_write' | 'full_write' | 'system'
BadgeCommunity:  'new' | 'rising' | 'popular' | 'trusted'

// API envelope
ApiResponse<T> { success, data, error, meta? }
PaginationMeta { total, page, limit, total_pages }

// MCP Protocol
McpRequest  { jsonrpc: '2.0', id, method, params? }
McpResponse { jsonrpc: '2.0', id, result?, error? }
McpToolDefinition { name, description, inputSchema }
```

---

## API Routes

```
# Auth
GET  /api/auth/github, GET /api/auth/github/callback
GET  /api/auth/google, GET /api/auth/google/callback
POST /api/auth/logout, GET /api/auth/me

# Servers (public)
GET /api/servers(?category=&badge_data=&search=&page=&limit=)
GET /api/servers/:slug, GET /api/servers/:slug/tools, GET /api/servers/:slug/reviews

# Servers (auth)
POST /api/servers/:slug/star, DELETE /api/servers/:slug/star
POST /api/servers/:slug/report

# Upload (developer role)
POST /api/upload, PUT /api/servers/:slug, POST /api/servers/:slug/versions

# Compositions (auth)
GET/POST /api/compositions, GET/PUT/DELETE /api/compositions/:id
POST /api/compositions/:id/servers, DELETE /api/compositions/:id/servers/:sid

# API Keys (auth)
GET/POST /api/keys, DELETE /api/keys/:id

# Admin (admin role)
GET /api/admin/review-queue, POST /api/admin/review/:server_id
GET /api/admin/stats, GET /api/admin/users, PUT /api/admin/users/:id

# MCP Endpoints
POST /mcp/u/:slug (composition), POST /mcp/s/:slug (single server)
```
