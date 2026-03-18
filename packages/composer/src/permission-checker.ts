/**
 * Permission Checker — soft enforcement for MCP tool calls.
 * Checks if a tool call matches the server's declared permissions.
 * Always allows the call (soft enforcement), only logs violations.
 */

export interface PermissionContext {
  serverId: string;
  serverName: string;
  declaredPermissions: 'readonly' | 'limited_write' | 'full_write' | 'system';
  declaredExternalUrls: string[];
}

export interface PermissionViolation {
  type: 'write_on_readonly' | 'undeclared_url_in_args';
  toolName: string;
  serverId: string;
  evidence: string;
  severity: 'warn' | 'info';
}

export interface PermissionCheckResult {
  allowed: true; // Always true (soft enforcement)
  violations: PermissionViolation[];
}

// Write-indicating tool name prefixes
const WRITE_PREFIXES = [
  'create_', 'update_', 'delete_', 'remove_', 'add_',
  'set_', 'put_', 'post_', 'patch_',
];

// Write-indicating description keywords
const WRITE_KEYWORDS = [
  'create', 'update', 'delete', 'remove', 'modify',
  'write', 'insert', 'upsert', 'mutate',
];

// URL regex
const URL_REGEX = /https?:\/\/[^\s"'<>)\]},]+/g;

/**
 * Extract origin from URL string. Returns null if invalid.
 */
function extractOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Check if a tool name indicates a write operation.
 */
export function isWriteToolName(toolName: string): boolean {
  const lower = toolName.toLowerCase();
  return WRITE_PREFIXES.some(prefix => lower.startsWith(prefix));
}

/**
 * Check if a tool description indicates a write operation.
 */
export function isWriteDescription(description: string): boolean {
  const lower = description.toLowerCase();
  return WRITE_KEYWORDS.some(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`);
    return regex.test(lower);
  });
}

/**
 * Find URLs in tool call arguments that are not declared.
 */
export function findUndeclaredUrlsInArgs(
  args: Record<string, unknown>,
  declaredUrls: string[]
): string[] {
  const argsStr = JSON.stringify(args);
  const urls = argsStr.match(URL_REGEX);
  if (!urls) return [];

  const declaredOrigins = new Set(
    declaredUrls
      .map(u => extractOrigin(u))
      .filter((o): o is string => o !== null)
  );

  return [...new Set(urls)].filter(url => {
    const origin = extractOrigin(url);
    return origin !== null && !declaredOrigins.has(origin);
  });
}

/**
 * Check permissions for a tool call. Always returns allowed: true.
 */
export function checkPermissions(
  context: PermissionContext,
  toolName: string,
  toolDescription: string,
  args: Record<string, unknown>
): PermissionCheckResult {
  const violations: PermissionViolation[] = [];

  // Check write operations on readonly servers
  if (context.declaredPermissions === 'readonly') {
    if (isWriteToolName(toolName)) {
      violations.push({
        type: 'write_on_readonly',
        toolName,
        serverId: context.serverId,
        evidence: `Tool name "${toolName}" indicates write operation on readonly server`,
        severity: 'warn',
      });
    }

    if (toolDescription && isWriteDescription(toolDescription)) {
      violations.push({
        type: 'write_on_readonly',
        toolName,
        serverId: context.serverId,
        evidence: 'Tool description contains write keywords on readonly server',
        severity: 'warn',
      });
    }
  }

  // Check for undeclared URLs in arguments
  const undeclaredUrls = findUndeclaredUrlsInArgs(
    args,
    context.declaredExternalUrls
  );
  for (const url of undeclaredUrls) {
    violations.push({
      type: 'undeclared_url_in_args',
      toolName,
      serverId: context.serverId,
      evidence: `Undeclared URL in arguments: ${url}`,
      severity: 'info',
    });
  }

  return { allowed: true, violations };
}
