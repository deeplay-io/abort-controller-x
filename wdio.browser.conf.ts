import path from 'node:path';
import '@wdio/types';

const isCI = Boolean(process.env.CI);
const browserName = (process.env.WDIO_BROWSER ?? 'chrome').toLowerCase();
const supportedBrowsers = new Set(['chrome', 'firefox', 'safari']);

if (!supportedBrowsers.has(browserName)) {
  throw new Error(`Unsupported browser "${browserName}". Use one of: ${[...supportedBrowsers].join(', ')}`);
}

const services: WebdriverIO.Config['services'] = [];
let capabilities: WebdriverIO.Capabilities[];

switch (browserName) {
  case 'chrome':
    capabilities = [{
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: isCI ? ['--headless=new', '--disable-gpu', '--no-sandbox'] : [],
      },
    }];
    services.push('chromedriver');
    break;
  case 'firefox':
    capabilities = [{
      browserName: 'firefox',
      'moz:firefoxOptions': {
        args: isCI ? ['-headless'] : [],
      },
    }];
    services.push('geckodriver');
    break;
  case 'safari':
    capabilities = [{ browserName: 'safari' }];
    services.push('safaridriver');
    break;
  default:
    // The runtime guard above should make this unreachable, but TypeScript needs the default branch.
    capabilities = [];
}

const config: WebdriverIO.Config = {
  runner: ['browser', {
    headless: isCI,
    viteConfig: {
      resolve: {
        alias: {
          'jest-message-util': path.resolve(__dirname, 'src/testUtils/jestMessageUtil.ts'),
        },
      },
    },
  }],
  specs: ['./src/**/*.test.ts'],
  maxInstances: 1,
  capabilities,
  services,
  reporters: ['spec'],
  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    timeout: 20000,
  },
};

export {config};
export default config;
