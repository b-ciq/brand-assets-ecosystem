const puppeteer = require('puppeteer');

async function testUICleanup() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 800 } });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Open modal
    await page.click('.rounded-lg');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✓ Modal opened');
    
    // Open advanced options
    const advancedButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const advancedBtn = buttons.find(btn => 
        btn.textContent?.includes('ADVANCED OPTIONS')
      );
      if (advancedBtn) {
        advancedBtn.click();
        return true;
      }
      return false;
    });
    
    if (advancedButton) {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✓ Opened advanced options');
      
      // Take screenshot to verify UI cleanup
      await page.screenshot({ path: 'ui-cleanup-advanced.png', fullPage: true });
      console.log('✓ Screenshot saved - UI cleanup verification');
      
      console.log('\\n✅ UI CLEANUP TEST COMPLETED!');
      console.log('Changes made:');
      console.log('- Removed color option (neutral/green)');
      console.log('- Removed descriptive text under format buttons');
      console.log('- Matched asset type button heights to other buttons');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

testUICleanup();