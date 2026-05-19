import { defineConfig, devices } from '@playwright/test'

delete process.env.HTTP_PROXY
delete process.env.http_proxy
delete process.env.HTTPS_PROXY
delete process.env.https_proxy
delete process.env.ALL_PROXY
delete process.env.all_proxy
process.env.NO_PROXY = '127.0.0.1,localhost'
process.env.no_proxy = '127.0.0.1,localhost'

const PORT = process.env.PLAYWRIGHT_PORT ?? '5193'
const HOST = process.env.PLAYWRIGHT_HOST ?? '127.0.0.1'
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? `http://${HOST}:${PORT}`
const HR_BACKEND_PORT = process.env.PLAYWRIGHT_HR_BACKEND_PORT ?? '49081'
const HR_BACKEND_URL = process.env.PLAYWRIGHT_HR_BACKEND_URL ?? `http://127.0.0.1:${HR_BACKEND_PORT}`
const HR_E2E_DB = process.env.PLAYWRIGHT_HR_DB ?? 'qmjy_test_hr_e2e'
const FULL_PORT = process.env.PLAYWRIGHT_FULL_PORT ?? '5194'
const FULL_BASE_URL = process.env.PLAYWRIGHT_FULL_BASE_URL ?? `http://${HOST}:${FULL_PORT}`
const FULL_BACKEND_PORT = process.env.PLAYWRIGHT_FULL_BACKEND_PORT ?? '49082'
const FULL_BACKEND_URL = process.env.PLAYWRIGHT_FULL_BACKEND_URL ?? `http://127.0.0.1:${FULL_BACKEND_PORT}`
const FULL_E2E_DB = process.env.PLAYWRIGHT_FULL_DB ?? 'qmjy_test_e2e_all'
const DISABLE_WEBSERVER = process.env.PLAYWRIGHT_DISABLE_WEBSERVER === '1'
const DISABLE_HR_WEBSERVER = process.env.PLAYWRIGHT_DISABLE_HR_WEBSERVER === '1'
const DISABLE_FULL_WEBSERVER = process.env.PLAYWRIGHT_DISABLE_FULL_WEBSERVER === '1'
const PYTHON_EXECUTABLE = process.env.PLAYWRIGHT_PYTHON ?? '.venv/bin/python'

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
  },
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: ['pages/**'],
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'full-e2e',
      testMatch: ['pages/**/*.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: FULL_BASE_URL,
      },
    },
  ],
  webServer: DISABLE_WEBSERVER
    ? undefined
    : [
        ...(!DISABLE_HR_WEBSERVER
          ? [
              {
                command: `${PYTHON_EXECUTABLE} backend/test/start_human_resources_e2e_backend.py --port ${HR_BACKEND_PORT} --db ${HR_E2E_DB}`,
                url: `${HR_BACKEND_URL}/health`,
                reuseExistingServer: false,
                stdout: 'pipe',
                stderr: 'pipe',
                timeout: 300_000,
              },
              {
                command: `VITE_PROXY_TARGET=${HR_BACKEND_URL} VITE_API_BASE_URL=/api/v1 npm run dev -- --host ${HOST} --port ${PORT} --strictPort`,
                url: BASE_URL,
                reuseExistingServer: false,
                stdout: 'pipe',
                stderr: 'pipe',
                timeout: 120_000,
              },
            ]
          : []),
        ...(!DISABLE_FULL_WEBSERVER
          ? [
              {
                command: `${PYTHON_EXECUTABLE} backend/test/start_full_e2e_backend.py --port ${FULL_BACKEND_PORT} --db ${FULL_E2E_DB}`,
                url: `${FULL_BACKEND_URL}/health`,
                reuseExistingServer: false,
                stdout: 'pipe',
                stderr: 'pipe',
                timeout: 300_000,
              },
              {
                command: `VITE_PROXY_TARGET=${FULL_BACKEND_URL} VITE_API_BASE_URL=/api/v1 npm run dev -- --host ${HOST} --port ${FULL_PORT} --strictPort`,
                url: FULL_BASE_URL,
                reuseExistingServer: false,
                stdout: 'pipe',
                stderr: 'pipe',
                timeout: 120_000,
              },
            ]
          : []),
      ],
})
