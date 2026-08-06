import os from 'node:os';
import { defineConfig } from 'vitest/config';

const freeMemMb = os.freemem() / 1024 / 1024;
const maxForks = freeMemMb < 3000 ? 1 : Math.max(2, Math.min(8, Math.floor(freeMemMb / 1000)));

export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: {
        maxForks,
        minForks: 1,
      },
    },
  },
});
