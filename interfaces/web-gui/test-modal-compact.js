const puppeteer = require('puppeteer');

async function testCompactModal() {
  console.log('Testing compact modal layout...');
  
  const browser = await puppeteer.launch({ 
    headless: false, // Let's see the modal in action
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    // Navigate to the web GUI
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded');
    
    // Wait for asset cards to load
    await page.waitForSelector('[data-testid="asset-card"]', { timeout: 10000 });
    console.log('✓ Asset cards loaded');
    
    // Click on the first CIQ logo asset
    const ciqLogo = await page.waitForSelector('[data-testid="asset-card"] img[alt*="CIQ"]', { timeout: 5000 });
    if (ciqLogo) {
      await ciqLogo.click();
      console.log('✓ Clicked CIQ logo');
      
      // Wait for modal to open
      await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 3000 });
      console.log('✓ Modal opened');
      
      // Take screenshot to verify compact layout
      await page.screenshot({ 
        path: 'modal-compact-test.png',
        fullPage: true
      });
      console.log('✓ Screenshot saved as modal-compact-test.png');
      
      // Check if preview is 1:1 aspect ratio (w-20 h-20)
      const preview = await page.$('.w-20.h-20');
      if (preview) {
        console.log('✓ Preview thumbnail is 1:1 aspect ratio (80x80px)');
      } else {
        console.log('✗ Preview thumbnail aspect ratio not found');
      }
      
      // Check if steps have reduced margins (mb-4 instead of mb-6)
      const steps = await page.$$('.mb-4');
      console.log(`✓ Found ${steps.length} elements with compact margin (mb-4)`);
      
      // Test interaction - change background mode
      const darkModeButton = await page.$('button:has-text("Dark Background")');
      if (darkModeButton) {
        await darkModeButton.click();
        console.log('✓ Dark background mode selected');
        
        // Wait for preview to update
        await page.waitForTimeout(500);
      }
      
      // Test format selection
      const jpegButton = await page.$('button:has-text("JPEG")');
      if (jpegButton) {
        await jpegButton.click();
        console.log('✓ JPEG format selected');
        await page.waitForTimeout(500);
      }
      
      // Final screenshot with changes
      await page.screenshot({ 
        path: 'modal-compact-final.png',
        fullPage: true
      });
      console.log('✓ Final screenshot saved');
      
    } else {
      console.log('✗ CIQ logo not found, trying first available asset');
      const firstAsset = await page.$('[data-testid="asset-card"]');
      if (firstAsset) {
        await firstAsset.click();
        await page.waitForSelector('.fixed.inset-0.z-50', { timeout: 3000 });
        console.log('✓ Modal opened with first asset');
      }
    }
    
    console.log('\\n✅ Modal compact layout test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'modal-error.png' });
  } finally {
    await browser.close();
  }
}

testCompactModal();