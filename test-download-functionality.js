const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  console.log('Starting Playwright test for brand asset browser download functionality...\n');
  
  // Launch browser with extended timeout
  const browser = await chromium.launch({ 
    headless: false,
    timeout: 60000
  });
  
  const context = await browser.newContext({
    // Set download path
    acceptDownloads: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  // Capture console messages and errors
  const consoleMessages = [];
  const errors = [];
  
  page.on('console', msg => {
    consoleMessages.push(`${msg.type()}: ${msg.text()}`);
    console.log(`Console ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
    console.log(`Page Error: ${error.message}`);
  });
  
  // Capture network errors
  page.on('requestfailed', request => {
    console.log(`Request failed: ${request.url()} - ${request.failure()?.errorText}`);
  });

  try {
    console.log('1. Navigating to http://localhost:3002...');
    
    // Navigate to the brand assets page
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // Wait a bit for any dynamic content to load
    await page.waitForTimeout(3000);
    
    console.log('2. Taking initial screenshot...');
    await page.screenshot({ path: 'initial-page-screenshot.png', fullPage: true });
    
    // Look for asset cards
    console.log('3. Looking for asset cards...');
    
    // Wait for asset cards to load
    const assetCards = await page.locator('[data-testid="asset-card"], .asset-card, [class*="asset"], [class*="card"]').all();
    
    if (assetCards.length === 0) {
      // Try alternative selectors
      const alternativeCards = await page.locator('img, [role="button"], button, a').all();
      console.log(`Found ${alternativeCards.length} potential interactive elements`);
      
      // Take screenshot of what's visible
      await page.screenshot({ path: 'no-asset-cards-found.png', fullPage: true });
      
      // Try to find any clickable elements that might be asset cards
      const clickableElements = await page.locator('*').evaluateAll(elements => {
        return elements.filter(el => {
          const rect = el.getBoundingClientRect();
          return rect.width > 100 && rect.height > 100 && 
                 (el.tagName === 'DIV' || el.tagName === 'BUTTON' || el.tagName === 'A') &&
                 (el.querySelector('img') || el.style.backgroundImage);
        }).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          hasImage: !!el.querySelector('img'),
          hasBackgroundImage: !!el.style.backgroundImage,
          text: el.textContent?.trim().substring(0, 50)
        }));
      });
      
      console.log('Potential asset card elements found:', clickableElements);
      
      if (clickableElements.length > 0) {
        // Try clicking on the first potential asset card
        const firstElement = page.locator('*').nth(0).filter({ has: page.locator('img') });
        if (await firstElement.count() > 0) {
          console.log('4. Clicking on first element with image...');
          await firstElement.first().click();
          await page.waitForTimeout(2000);
          await page.screenshot({ path: 'after-first-click.png', fullPage: true });
        }
      }
    } else {
      console.log(`Found ${assetCards.length} asset cards`);
      
      // Try to click on the first asset card
      console.log('4. Clicking on first asset card...');
      await assetCards[0].click();
      
      // Wait for modal to appear
      await page.waitForTimeout(2000);
      console.log('5. Taking screenshot after clicking asset card...');
      await page.screenshot({ path: 'after-asset-card-click.png', fullPage: true });
    }
    
    // Look for download modal
    console.log('6. Looking for download modal...');
    const modal = page.locator('[role="dialog"], .modal, [class*="modal"], [class*="dialog"]');
    const modalVisible = await modal.count() > 0;
    
    if (modalVisible) {
      console.log('Modal found! Taking screenshot...');
      await page.screenshot({ path: 'modal-visible.png', fullPage: true });
      
      // Look for variant selection
      console.log('7. Testing variant selection...');
      const variants = await page.locator('img, button, [class*="variant"], [class*="thumbnail"]').all();
      console.log(`Found ${variants.length} potential variant elements`);
      
      if (variants.length > 1) {
        console.log('Clicking on second variant...');
        await variants[1].click();
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'variant-selected.png', fullPage: true });
      }
      
      // Look for PNG download option
      console.log('8. Looking for PNG download option...');
      const downloadButtons = await page.locator('button, a, [class*="download"], [class*="png"]').all();
      
      for (let i = 0; i < downloadButtons.length; i++) {
        const button = downloadButtons[i];
        const text = await button.textContent();
        console.log(`Download button ${i}: "${text}"`);
        
        if (text && (text.toLowerCase().includes('png') || text.toLowerCase().includes('download'))) {
          console.log(`9. Attempting to click download button: "${text}"`);
          
          // Set up download listener
          const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
          
          try {
            await button.click();
            console.log('Clicked download button, waiting for download...');
            
            const download = await downloadPromise;
            console.log(`Download started: ${download.suggestedFilename()}`);
            
            // Save the download
            await download.saveAs(path.join(__dirname, 'downloaded-asset.png'));
            console.log('Download completed successfully!');
            
          } catch (downloadError) {
            console.log(`Download failed: ${downloadError.message}`);
          }
          
          break;
        }
      }
    } else {
      console.log('No modal found. Looking for any download functionality on the page...');
      
      // Look for any download-related buttons on the main page
      const downloadElements = await page.locator('button, a').filter({ hasText: /download|png|svg/i }).all();
      console.log(`Found ${downloadElements.length} download-related elements`);
      
      if (downloadElements.length > 0) {
        console.log('Trying to click first download element...');
        await downloadElements[0].click();
        await page.waitForTimeout(2000);
        await page.screenshot({ path: 'after-download-click.png', fullPage: true });
      }
    }
    
    // Final screenshot
    console.log('10. Taking final screenshot...');
    await page.screenshot({ path: 'final-screenshot.png', fullPage: true });
    
    // Wait a bit more to catch any late console messages
    await page.waitForTimeout(2000);
    
  } catch (error) {
    console.error('Test error:', error.message);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
    errors.push(error.message);
  }
  
  // Report results
  console.log('\n=== TEST RESULTS ===');
  console.log(`Total console messages: ${consoleMessages.length}`);
  console.log(`Total errors: ${errors.length}`);
  
  if (errors.length > 0) {
    console.log('\nErrors encountered:');
    errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }
  
  if (consoleMessages.length > 0) {
    console.log('\nConsole messages:');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. ${msg}`);
    });
  }
  
  // Save results to file
  const results = {
    timestamp: new Date().toISOString(),
    errors: errors,
    consoleMessages: consoleMessages,
    testCompleted: true
  };
  
  fs.writeFileSync('test-results.json', JSON.stringify(results, null, 2));
  console.log('\nTest results saved to test-results.json');
  console.log('Screenshots saved as PNG files in current directory');
  
  await browser.close();
  console.log('\nTest completed!');
})();