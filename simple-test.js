const { chromium } = require('playwright');

async function simpleTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Simple JPEG test...');
  
  let downloadCount = 0;
  page.on('download', async download => {
    downloadCount++;
    const filename = download.suggestedFilename();
    console.log(`📦 Download ${downloadCount}: ${filename}`);
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Click first asset and set up for JPEG download  
    await page.click('[class*="cursor-pointer rounded-lg"]:first-of-type');
    await page.waitForSelector('[class*="absolute inset-0 bg-black"]');
    await page.click('button:has-text("ADVANCED OPTIONS")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("JPG")');
    
    // Light mode download
    console.log('Testing light mode...');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.evaluate(() => document.querySelector('button[class*="bg-green-600"]')?.click());
    await page.waitForTimeout(2000);
    
    // Dark mode download  
    console.log('Testing dark mode...');
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.evaluate(() => document.querySelector('button[class*="bg-green-600"]')?.click());
    await page.waitForTimeout(2000);
    
    console.log(`Total downloads: ${downloadCount}`);
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

simpleTest().catch(console.error);