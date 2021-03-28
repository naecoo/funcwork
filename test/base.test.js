const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

let page, browser;

beforeAll(async () => {
  try {
    browser = await puppeteer.launch({
      ignoreDefaultArgs: ['--disable-extensions'],
      args: [
        '--no-sandbox',
      ],
    });
    page = await browser.newPage();
    const content = await fs.promises.readFile(path.resolve(__dirname, './index.html'), 'utf8');
    await page.setContent(content);
  } catch (error) {
    console.log(error.message);
  }
});
afterAll(async () => {
  if (browser) {
    await browser.close()
  }
});

beforeEach(async () => {
  const jsContent = await fs.promises.readFile(path.resolve(__dirname, '../dist/index.iife.js'), 'utf8');
  await page.evaluate(`${jsContent}window.funcWork=funcWork`);
  await page.evaluate(() => {
    window.fw = new window.funcWork();
  });
});

test('base test', () => {
  expect('1').toMatch(/1/)
});