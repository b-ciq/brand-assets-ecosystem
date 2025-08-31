const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2', timeout: 30000 });
    await page.screenshot({ path: 'current-implementation.png', fullPage: true });
    console.log('Screenshot saved as current-implementation.png');
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();