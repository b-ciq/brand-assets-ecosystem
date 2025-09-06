const puppeteer = require('puppeteer');

async function testPageLoad() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1200, height: 800 },
    slowMo: 100 // Slow down to catch the flash
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Testing page load for flashing icon...');
    
    // Take screenshot right after navigation starts
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });
    await page.screenshot({ path: 'page-load-early.png' });
    console.log('✓ Early load screenshot saved');
    
    // Take another after DOM is loaded
    await page.waitForLoadState('domcontentloaded');
    await page.screenshot({ path: 'page-load-dom.png' });
    console.log('✓ DOM loaded screenshot saved');
    
    // Wait for full network idle
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'page-load-complete.png' });
    console.log('✓ Complete load screenshot saved');
    
    console.log('\\n📸 Screenshots taken during different load phases');
    console.log('Check the images to see if the paint palette icon appears in early phases');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

testPageLoad();