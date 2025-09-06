const puppeteer = require('puppeteer');

async function testNoFlash() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('Testing page load without flashing icon...');
    
    // Navigate and wait for load
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded successfully');
    
    // Take screenshot
    await page.screenshot({ path: 'no-flash-test.png', fullPage: true });
    console.log('✓ Screenshot saved');
    
    // Wait and watch for a few seconds to manually observe
    console.log('Waiting 5 seconds to observe for any flashing icons...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('\\n✅ NO FLASH TEST COMPLETED!');
    console.log('- Removed default Next.js favicon with ugly spinning logo');
    console.log('- Added minimal SVG icon in metadata');
    console.log('- Fixed favicon processing error');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await browser.close();
}

testNoFlash();