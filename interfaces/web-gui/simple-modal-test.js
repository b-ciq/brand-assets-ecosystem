const puppeteer = require('puppeteer');

async function simpleModalTest() {
  console.log('Taking screenshot of current page...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the web GUI
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded');
    
    // Take initial screenshot
    await page.screenshot({ 
      path: 'current-page.png',
      fullPage: true
    });
    console.log('✓ Screenshot saved as current-page.png');
    
    // Wait a bit and try to find any clickable elements
    await page.waitForTimeout(2000);
    
    // Look for any asset-related elements
    const assetElements = await page.$$('[class*="asset"], [class*="card"], [class*="logo"], button, [role="button"]');
    console.log(`Found ${assetElements.length} potential interactive elements`);
    
    // Try clicking the first interactive element if any exist
    if (assetElements.length > 0) {
      try {
        await assetElements[0].click();
        console.log('✓ Clicked first interactive element');
        
        // Wait for any modal
        await page.waitForTimeout(1000);
        
        // Check if modal appeared
        const modal = await page.$('.fixed.inset-0');
        if (modal) {
          console.log('✓ Modal found!');
          await page.screenshot({ 
            path: 'modal-found.png',
            fullPage: true
          });
          console.log('✓ Modal screenshot saved');
        } else {
          console.log('No modal found, taking another screenshot');
          await page.screenshot({ 
            path: 'after-click.png',
            fullPage: true
          });
        }
      } catch (error) {
        console.log('Could not click element:', error.message);
      }
    }
    
    console.log('\\n✅ Simple test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'error.png' });
  } finally {
    // Keep browser open for 5 seconds to manually inspect
    console.log('Keeping browser open for manual inspection...');
    await page.waitForTimeout(5000);
    await browser.close();
  }
}

simpleModalTest();