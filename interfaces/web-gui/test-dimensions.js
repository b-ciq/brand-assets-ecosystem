const puppeteer = require('puppeteer');

async function testDimensions() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 800 } });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Open modal
    await page.click('.rounded-lg');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✓ Modal opened, checking dimension display');
    
    // Take screenshot of default state
    await page.screenshot({ path: 'dimensions-default.png', fullPage: true });
    console.log('✓ Default dimensions screenshot');
    
    // Open advanced options to access size controls
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
      
      // Change to large size
      const largeSizeButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const largeBtn = buttons.find(btn => btn.textContent?.trim() === 'L');
        if (largeBtn) {
          largeBtn.click();
          return true;
        }
        return false;
      });
      
      if (largeSizeButton) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✓ Changed to large size');
        
        await page.screenshot({ path: 'dimensions-large.png', fullPage: true });
        console.log('✓ Large size screenshot saved');
      }
      
      // Try custom size
      const customButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const customBtn = buttons.find(btn => btn.textContent?.trim() === 'Custom');
        if (customBtn) {
          customBtn.click();
          return true;
        }
        return false;
      });
      
      if (customButton) {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Enter custom size
        const customInput = await page.$('input[type="number"]');
        if (customInput) {
          await customInput.click();
          await customInput.evaluate(el => el.select());
          await customInput.type('1024');
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('✓ Set custom size to 1024px');
          await page.screenshot({ path: 'dimensions-custom.png', fullPage: true });
          console.log('✓ Custom size screenshot saved');
        }
      }
    }
    
    console.log('\\n✅ DIMENSION DISPLAY TEST COMPLETED!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

testDimensions();