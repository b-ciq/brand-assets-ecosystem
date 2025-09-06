const { chromium } = require('playwright');

async function comprehensiveTest() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🧪 COMPREHENSIVE DARK MODE TEST');
  console.log('Testing: Dark mode selected → Light graphics on dark backgrounds');
  
  const downloads = [];
  page.on('download', async download => {
    const filename = download.suggestedFilename();
    const path = `/tmp/${filename}`;
    await download.saveAs(path);
    downloads.push({ filename, path, timestamp: Date.now() });
    console.log(`📁 Downloaded: ${filename}`);
  });
  
  page.on('console', msg => {
    if (msg.text().includes('colorMode') || msg.text().includes('Dark mode') || msg.text().includes('Background')) {
      console.log('🎨 BROWSER:', msg.text());
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Click first asset to open modal
    await page.click('[class*="cursor-pointer rounded-lg"]:first-of-type');
    await page.waitForSelector('[class*="absolute inset-0 bg-black"]');
    
    // Ensure we're in dark mode in the modal
    console.log('\\n🌙 Setting modal to DARK MODE...');
    await page.click('button:has-text("Dark mode")');
    await page.waitForTimeout(500);
    
    // Verify modal state
    const modalState = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const darkBtn = buttons.find(btn => btn.textContent?.includes('Dark mode'));
      return {
        darkButtonFound: !!darkBtn,
        darkButtonSelected: darkBtn?.classList.contains('bg-gray-500')
      };
    });
    console.log('📊 Modal state:', modalState);
    
    // Open advanced options
    await page.click('button:has-text("ADVANCED OPTIONS")');
    await page.waitForTimeout(500);
    
    console.log('\\n🧪 TESTING PNG DOWNLOAD (expecting transparent background)...');
    await page.click('button:has-text("PNG")');
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('button[class*="bg-green-600"]')?.click());
    await page.waitForTimeout(2000);
    
    console.log('\\n🧪 TESTING SVG DOWNLOAD (expecting light graphic)...');
    await page.click('button:has-text("SVG")');
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('button[class*="bg-green-600"]')?.click());
    await page.waitForTimeout(2000);
    
    console.log('\\n🧪 TESTING JPEG DOWNLOAD (expecting light graphic + dark background)...');
    await page.click('button:has-text("JPG")');
    await page.waitForTimeout(300);
    await page.evaluate(() => document.querySelector('button[class*="bg-green-600"]')?.click());
    await page.waitForTimeout(2000);
    
    console.log('\\n📊 DOWNLOAD RESULTS:');
    downloads.forEach(download => {
      console.log(`  📁 ${download.filename} → ${download.path}`);
    });
    
    console.log('\\n🔍 EXPECTATIONS VS REALITY:');
    console.log('Expected for DARK MODE:');
    console.log('  - PNG: Light graphic, transparent background');
    console.log('  - SVG: Light graphic, transparent background'); 
    console.log('  - JPG: Light graphic, dark background');
    console.log('\\nPlease check the downloaded files against these expectations.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

comprehensiveTest().catch(console.error);