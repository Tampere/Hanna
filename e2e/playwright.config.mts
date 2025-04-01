import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  projects: [
    {
      name: 'Chrome',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: { ignoreHTTPSErrors: true },
      },
    },
  ],
};

export default config;
