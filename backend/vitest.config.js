import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    fileParallelism: false,
    globals: true,
    globalSetup: ['./tests/globalSetup.js'],
    setupFiles: ['./tests/setup.js'],
    testTimeout: 60000,
    hookTimeout: 60000,
    include: ['tests/**/*.test.js']
  }
});
