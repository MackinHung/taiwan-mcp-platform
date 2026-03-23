import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@formosa-mcp/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
