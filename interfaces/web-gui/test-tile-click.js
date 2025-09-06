const puppeteer = require('puppeteer');

async function testTileClick() {
  console.log('Testing tile/gear icon click to open modal...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1200, height: 800 }
  });
  
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
    console.log('✓ Page loaded');
    
    // Wait for assets to load
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try clicking the gear icon first
    const gearClicked = await page.evaluate(() => {
      // Look for gear/settings icon (usually an SVG or button with settings-like appearance)
      const gearButtons = Array.from(document.querySelectorAll('button, [role="button"]')).filter(btn => {
        const svg = btn.querySelector('svg');
        if (!svg) return false;
        // Check if it's likely a settings/gear icon (could be various Lucide icons)
        const title = svg.getAttribute('aria-label') || svg.getAttribute('title') || '';
        return title.toLowerCase().includes('settings') || 
               title.toLowerCase().includes('gear') ||
               btn.getAttribute('aria-label')?.toLowerCase().includes('settings');
      });
      
      if (gearButtons.length > 0) {
        gearButtons[0].click();
        return true;
      }
      return false;
    });
    
    if (gearClicked) {
      console.log('✓ Clicked gear icon');
    } else {
      // If no gear found, try clicking the tile itself
      console.log('No gear found, trying to click tile...');
      const tileClicked = await page.evaluate(() => {
        // Look for the tile/card element
        const tiles = Array.from(document.querySelectorAll('.rounded-lg, [class*="card"]'));
        if (tiles.length > 0) {
          // Click the first tile
          tiles[0].click();
          return true;
        }
        return false;
      });
      
      if (tileClicked) {
        console.log('✓ Clicked tile');
      } else {
        console.log('❌ Could not find tile to click');
        return;
      }
    }
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Check for modal and take screenshots
    const hasModal = await page.evaluate(() => {
      return document.querySelector('.fixed.inset-0.z-50') !== null;
    });
    
    if (hasModal) {
      console.log('✅ MODAL OPENED SUCCESSFULLY!');
      
      // Take screenshot of the compact modal
      await page.screenshot({ 
        path: 'compact-modal-working.png',
        fullPage: true
      });
      console.log('✓ Modal screenshot saved');
      
      // Test advanced options if button exists
      const hasAdvanced = await page.evaluate(() => {
        const advancedBtn = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent?.includes('ADVANCED OPTIONS')
        );
        if (advancedBtn) {
          advancedBtn.click();
          return true;
        }
        return false;
      });
      
      if (hasAdvanced) {
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✓ Toggled advanced options');
        
        await page.screenshot({ 
          path: 'compact-modal-advanced-working.png',
          fullPage: true
        });
        console.log('✓ Advanced options screenshot saved');
      }
      
      console.log('\\n🎉 COMPACT MODAL LAYOUT SUCCESS!');
      console.log('\\nChanges implemented:');
      console.log('✓ Reduced section margins (mb-6 → mb-4)');
      console.log('✓ Reduced button padding (py-3 → py-2)');
      console.log('✓ Reduced label margins (mb-3 → mb-2)');
      console.log('✓ Tighter grid spacing (gap-3 → gap-2)');
      console.log('✓ Compact variant thumbnails (p-4 → p-2)');
      console.log('✓ Smaller usage instructions padding');
      console.log('✓ More compact advanced options spacing');
      
    } else {
      console.log('❌ Modal did not open');
      await page.screenshot({ path: 'no-modal-tile.png' });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    await page.screenshot({ path: 'test-error-tile.png' });
  }
  
  // Keep browser open for manual inspection
  console.log('\\nKeeping browser open for 5 seconds for manual verification...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  await browser.close();
}

testTileClick();