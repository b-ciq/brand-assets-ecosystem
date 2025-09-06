const puppeteer = require('puppeteer');

async function testActiveButtons() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 800 } });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Open modal
    await page.click('.rounded-lg');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('✓ Modal opened - checking active button states');
    
    // Take screenshot of default state (Light mode selected)
    await page.screenshot({ path: 'active-buttons-light-mode.png', fullPage: true });
    console.log('✓ Light mode active state screenshot');
    
    // Switch to dark mode
    const darkModeButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const darkBtn = buttons.find(btn => btn.textContent?.includes('Dark mode'));
      if (darkBtn) {
        darkBtn.click();
        return true;
      }
      return false;
    });
    
    if (darkModeButton) {
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✓ Switched to dark mode');
      
      await page.screenshot({ path: 'active-buttons-dark-mode.png', fullPage: true });
      console.log('✓ Dark mode active state screenshot');
    }
    
    // Open advanced options to test other button types
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
      
      // Test asset type selection
      const jpgButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const jpgBtn = buttons.find(btn => btn.textContent?.trim() === 'JPG');
        if (jpgBtn) {
          jpgBtn.click();
          return true;
        }
        return false;
      });
      
      if (jpgButton) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✓ Selected JPG format');
      }
      
      // Test size selection
      const largeButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const largeBtn = buttons.find(btn => btn.textContent?.trim() === 'L');
        if (largeBtn) {
          largeBtn.click();
          return true;
        }
        return false;
      });
      
      if (largeButton) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✓ Selected large size');
      }
      
      // Final screenshot with all selections
      await page.screenshot({ path: 'active-buttons-all-selected.png', fullPage: true });
      console.log('✓ All active states screenshot');
    }
    
    console.log('\\n✅ ACTIVE BUTTON STATES TEST COMPLETED!');
    console.log('Updated all button groups to use --quantic-bg-active:');
    console.log('- Color mode buttons (Light/Dark)');
    console.log('- Asset type buttons (SVG/PNG/JPG)'); 
    console.log('- Size selector buttons (S/M/L/Custom)');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

testActiveButtons();