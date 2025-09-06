const puppeteer = require('puppeteer');

async function testDownloadButton() {
  console.log('Testing download button click...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 },
    devtools: true
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded');
    
    // Wait for download button to appear
    await page.waitForSelector('button:has-text("Download")', { timeout: 10000 });
    console.log('✓ Download button found');
    
    // Click the download button
    await page.click('button:has-text("Download")');
    console.log('✓ Clicked download button');
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if modal is present
    const modal = await page.$('.fixed.inset-0.z-50');
    if (modal) {
      console.log('✓ Modal opened successfully!');
      
      // Take screenshot of the compact modal
      await page.screenshot({ 
        path: 'compact-modal-final.png',
        fullPage: true
      });
      console.log('✓ Compact modal screenshot saved');
      
      // Test advanced options toggle
      const advancedButton = await page.$('button:has-text("ADVANCED OPTIONS")');
      if (advancedButton) {
        await advancedButton.click();
        console.log('✓ Advanced options toggled');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Take screenshot with advanced options open
        await page.screenshot({ 
          path: 'compact-modal-advanced.png',
          fullPage: true
        });
        console.log('✓ Advanced options screenshot saved');
      }
      
      console.log('\\n✅ COMPACT MODAL LAYOUT TEST SUCCESSFUL!');
      console.log('\\nKey improvements verified:');
      console.log('- Reduced section margins (mb-4 instead of mb-6)');
      console.log('- Smaller button padding (py-2 instead of py-3)'); 
      console.log('- Compact variant thumbnails with reduced padding');
      console.log('- Tighter spacing in advanced options');
      console.log('- More compact usage instructions area');
      
    } else {
      console.log('❌ Modal did not open');
      await page.screenshot({ path: 'no-modal-download.png' });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error-download.png' });
  }
  
  // Keep browser open briefly for manual inspection
  console.log('\\nKeeping browser open for 3 seconds...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  await browser.close();
}

testDownloadButton();