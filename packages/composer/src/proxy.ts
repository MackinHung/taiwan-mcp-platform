export interface ProxyInput {
  endpointUrl: string;
  toolName: string;
  args: Record<string, unknown>;
  requestId: string | number;
}

export interface ProxyResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}

export async function proxyToolCall(input: ProxyInput): Promise<ProxyResult> {
  try {
    const response = await fetch(input.endpointUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: input.requestId,
        method: 'tools/call',
        params: {
          name: input.toolName,
          arguments: input.args,
        },
      }),
    });

    if (!response.ok) {
      return {
        content: [
          {
            type: 'text',
            text: `Upstream error: ${response.status} ${response.statusText}`,
          },
        ],
        isError: true,
      };
    }

    const data = (await response.json()) as {
      result?: ProxyResult;
      error?: { code: number; message: string };
    };

    if (data.error) {
      return {
        content: [
          { type: 'text', text: `Upstream error: ${data.error.message}` },
        ],
        isError: true,
      };
    }

    return data.result ?? { content: [{ type: 'text', text: 'No result' }] };
  } catch (err) {
    return {
      content: [
        {
          type: 'text',
          text: `Proxy error: ${(err as Error).message}`,
        },
      ],
      isError: true,
    };
  }
}
