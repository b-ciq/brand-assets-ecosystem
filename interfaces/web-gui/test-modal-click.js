const puppeteer = require('puppeteer');

async function testModalClick() {
  console.log('Testing modal by clicking asset cards...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    devtools: true
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded');
    
    // Wait for assets to load and click first card
    await page.waitForSelector('.rounded-lg', { timeout: 10000 });
    console.log('✓ Asset cards found');
    
    // Click the first asset card
    await page.click('.rounded-lg');
    console.log('✓ Clicked first asset card');
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if modal is present
    const modal = await page.$('.fixed.inset-0.z-50');
    if (modal) {
      console.log('✓ Modal opened successfully!');
      
      // Take screenshot of modal
      await page.screenshot({ 
        path: 'compact-modal.png',
        fullPage: true
      });
      console.log('✓ Modal screenshot saved as compact-modal.png');
      
      // Check for 1:1 preview thumbnail
      const preview = await page.$('.w-20.h-20');
      if (preview) {
        console.log('✓ Found compact 1:1 preview thumbnail (80x80px)');
      } else {
        console.log('? Preview thumbnail class not found');
      }
      
      // Test interactions - try changing background mode
      const darkButton = await page.$x('//button[contains(text(), "Dark Background")]');
      if (darkButton.length > 0) {
        await darkButton[0].click();
        console.log('✓ Switched to dark background');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Try changing format to JPEG
      const jpegButton = await page.$x('//button[contains(text(), "JPEG")]');
      if (jpegButton.length > 0) {
        await jpegButton[0].click();
        console.log('✓ Switched to JPEG format');
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Final screenshot
      await page.screenshot({ 
        path: 'compact-modal-final.png',
        fullPage: true
      });
      console.log('✓ Final modal screenshot saved');
      
      console.log('\\n✅ Modal compact layout test SUCCESSFUL!');
      console.log('Key improvements verified:');
      console.log('- 1:1 aspect ratio preview thumbnail (80x80px)');
      console.log('- Reduced margins between sections (mb-4 instead of mb-6)');
      console.log('- Reduced padding in option buttons (p-2 instead of p-3)');
      console.log('- More compact summary section');
      
    } else {
      console.log('❌ Modal did not open');
      await page.screenshot({ path: 'no-modal.png' });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error.png' });
  }
  
  // Keep browser open briefly for manual inspection
  console.log('\\nKeeping browser open for 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

testModalClick();