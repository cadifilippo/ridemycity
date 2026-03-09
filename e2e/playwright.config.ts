import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') });

if (!process.env.FIREBASE_API_KEY && process.env.VITE_FIREBASE_API_KEY) {
  process.env.FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY;
}

const shouldReuseExistingServer = process.env.PW_REUSE_SERVER === 'true';

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 60_000,

  use: {
    baseURL: process.env.WEB_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],

  webServer: [
    {
      command: 'pnpm dev',
      cwd: path.resolve(__dirname, '../apps/api'),
      port: 3000,
      reuseExistingServer: shouldReuseExistingServer,
      timeout: 30_000,
    },
    {
      command: 'VITE_E2E=true pnpm dev',
      cwd: path.resolve(__dirname, '../apps/web'),
      port: 5173,
      reuseExistingServer: shouldReuseExistingServer,
      timeout: 30_000,
    },
  ],
});
