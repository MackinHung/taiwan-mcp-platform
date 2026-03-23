-- 0006: Set default MCP Tool Annotations for all existing tools
-- All 47 servers are read-only government API wrappers:
--   readOnlyHint: true    (no side effects)
--   destructiveHint: false (no destructive operations)
--   idempotentHint: true   (same params = same result)
--   openWorldHint: true    (calls external government APIs)

UPDATE tools
SET annotations = '{"readOnlyHint":true,"destructiveHint":false,"idempotentHint":true,"openWorldHint":true}'
WHERE annotations IS NULL;
