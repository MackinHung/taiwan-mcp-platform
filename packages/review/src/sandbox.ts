export interface SandboxInput {
  serverId: string;
  sourceCode: string;
}

export interface SandboxResult {
  status: 'sandbox_passed' | 'sandbox_failed';
  details: string;
  durationMs: number;
}

/**
 * Layer 2: Behavioral sandbox. Currently a stub that always passes.
 * In production, this would spin up an isolated environment and run
 * the MCP server with test requests to verify actual behavior.
 */
export async function runSandbox(input: SandboxInput): Promise<SandboxResult> {
  const start = Date.now();
  // Stub implementation - always passes
  const durationMs = Date.now() - start;

  return {
    status: 'sandbox_passed',
    details: `Sandbox check stub: server ${input.serverId} (no real sandbox yet)`,
    durationMs,
  };
}
