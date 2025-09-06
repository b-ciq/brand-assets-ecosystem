const { chromium } = require('playwright');

async function debugModal() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Opening page and debugging modal structure...');
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Wait for asset cards to load
    await page.waitForSelector('[class*="cursor-pointer rounded-lg"]', { timeout: 10000 });
    
    // Click on the first asset card to open modal
    await page.click('[class*="cursor-pointer rounded-lg"]:first-of-type');
    
    // Wait for modal to open
    await page.waitForSelector('[class*="absolute inset-0 bg-black"]', { timeout: 5000 });
    
    console.log('Modal opened, taking screenshot...');
    await page.screenshot({ path: '/tmp/modal-debug.png' });
    
    // Get all button text content
    const buttons = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        classes: btn.className,
        visible: btn.offsetParent !== null
      }))
    );
    
    console.log('Available buttons:', buttons.filter(btn => btn.visible && btn.text));
    
    // Look for any text containing JPG or jpg
    const jpgElements = await page.$$eval('*', elements => 
      elements
        .filter(el => el.textContent && (el.textContent.includes('JPG') || el.textContent.includes('jpg')))
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim(),
          classes: el.className
        }))
    );
    
    console.log('Elements containing JPG:', jpgElements);
    
    await page.waitForTimeout(5000); // Keep browser open for visual inspection
    
  } catch (error) {
    console.error('Debug failed:', error.message);
  } finally {
    await browser.close();
  }
}

debugModal().catch(console.error);