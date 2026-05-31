import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    setupFiles: ['./src/__tests__/setup.tsx'],
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      thresholds: {
        branches: 30,
        functions: 40,
        lines: 40,
        statements: 40,
      },
      exclude: [
        'src/main.tsx',
        'src/vite-env.d.ts',
        'src/__tests__/**',
        '**/*.d.ts',
      ],
    },
    include: ['**/src/__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@hotel/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
});