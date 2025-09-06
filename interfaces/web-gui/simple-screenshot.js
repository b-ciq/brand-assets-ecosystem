const puppeteer = require('puppeteer');

async function takeScreenshot() {
  const browser = await puppeteer.launch();
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('Loading page...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle0',
      timeout: 10000 
    });
    
    console.log('Taking screenshot...');
    await page.screenshot({ 
      path: '/tmp/page-loaded.png',
      fullPage: true 
    });
    console.log('Screenshot saved to /tmp/page-loaded.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

takeScreenshot();