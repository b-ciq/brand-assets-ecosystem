const puppeteer = require('puppeteer');

async function testSimpleClick() {
  console.log('Testing simple button click...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded');
    
    // Wait a moment for everything to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find and click the download button by text content
    const downloadButtons = await page.$$eval('button', buttons => 
      buttons.map(button => ({
        text: button.textContent?.trim(),
        id: button.id,
        className: button.className
      }))
    );
    
    console.log('Found buttons:', downloadButtons);
    
    // Click the first button that contains "Download"
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const downloadButton = buttons.find(btn => 
        btn.textContent?.includes('Download') || 
        btn.textContent?.includes('DOWNLOAD')
      );
      
      if (downloadButton) {
        downloadButton.click();
        return true;
      }
      return false;
    });
    
    if (clicked) {
      console.log('✓ Clicked download button');
      
      // Wait for modal
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Take screenshot to see what happened
      await page.screenshot({ 
        path: 'after-download-click.png',
        fullPage: true
      });
      console.log('✓ Screenshot saved after button click');
      
      // Check for modal
      const hasModal = await page.evaluate(() => {
        return document.querySelector('.fixed.inset-0.z-50') !== null;
      });
      
      if (hasModal) {
        console.log('✅ Modal found! Taking final screenshot...');
        await page.screenshot({ 
          path: 'modal-success.png',
          fullPage: true
        });
      } else {
        console.log('⚠️  Modal not found, but click succeeded');
      }
      
    } else {
      console.log('❌ Could not find download button to click');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  // Keep browser open for manual inspection
  console.log('\\nKeeping browser open for 5 seconds for manual testing...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testSimpleClick();