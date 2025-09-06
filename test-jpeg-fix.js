const { chromium } = require('playwright');

async function testJpegFix() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing JPEG background fix...');
  
  page.on('console', msg => {
    if (msg.text().includes('Error') || msg.text().includes('Failed')) {
      console.log('🚨 BROWSER ERROR:', msg.text());
    }
  });
  
  let downloadCount = 0;
  page.on('download', async download => {
    downloadCount++;
    const filename = download.suggestedFilename();
    const path = `/tmp/test-${downloadCount}-${filename}`;
    await download.saveAs(path);
    console.log(`✅ Downloaded ${downloadCount}: ${filename}`);
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Click first asset
    await page.click('[class*="cursor-pointer rounded-lg"]:first-of-type');
    await page.waitForSelector('[class*="absolute inset-0 bg-black"]');
    
    // Test Light Mode JPEG
    console.log('🔆 Testing Light Mode JPEG...');
    await page.evaluate(() => document.documentElement.classList.remove('dark'));
    await page.click('button:has-text("ADVANCED OPTIONS")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("JPG")');
    
    // Force click the download button
    await page.evaluate(() => {
      const downloadBtn = document.querySelector('button[class*="bg-green-600"]');
      if (downloadBtn) downloadBtn.click();
    });
    
    await page.waitForTimeout(3000);
    
    // Test Dark Mode JPEG
    console.log('🌙 Testing Dark Mode JPEG...');
    await page.evaluate(() => document.documentElement.classList.add('dark'));
    await page.waitForTimeout(500);
    
    // Force click download again
    await page.evaluate(() => {
      const downloadBtn = document.querySelector('button[class*="bg-green-600"]');
      if (downloadBtn) downloadBtn.click();
    });
    
    await page.waitForTimeout(3000);
    
    console.log(`\\n📊 Results: ${downloadCount} downloads completed`);
    
    if (downloadCount === 0) {
      console.log('❌ No downloads occurred - there may still be issues');
    } else {
      console.log('✅ Downloads successful - check console for any canvas errors');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testJpegFix().catch(console.error);