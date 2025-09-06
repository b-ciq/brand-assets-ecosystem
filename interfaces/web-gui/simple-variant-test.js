const puppeteer = require('puppeteer');

async function simpleVariantTest() {
  const browser = await puppeteer.launch({ headless: false, defaultViewport: { width: 1200, height: 800 } });
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Click asset to open modal
    await page.click('.rounded-lg');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Take screenshot to see modal state
    await page.screenshot({ path: 'variant-modal-check.png', fullPage: true });
    console.log('Screenshot saved - checking modal state');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

simpleVariantTest();