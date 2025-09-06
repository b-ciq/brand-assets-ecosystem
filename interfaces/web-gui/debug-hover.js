const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:3002');
  await page.waitForTimeout(2000);
  
  // Take screenshot of default state
  await page.screenshot({ path: 'default-state.png' });
  console.log('Default state screenshot saved');
  
  // Find an asset card and hover over it
  const assetCard = await page.locator('.group.cursor-pointer').first();
  await assetCard.hover();
  await page.waitForTimeout(1000);
  
  // Take screenshot of hover state
  await page.screenshot({ path: 'hover-state.png' });
  console.log('Hover state screenshot saved');
  
  console.log('Keeping browser open for inspection...');
  await page.waitForTimeout(30000); // Keep open for 30 seconds
  
  await browser.close();
})();