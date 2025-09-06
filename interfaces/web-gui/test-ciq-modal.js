const puppeteer = require('puppeteer');

async function testCIQModalFiltering() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 100,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    
    console.log('1. Navigating to http://localhost:3002');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle2' });
    
    console.log('2. Page loaded, checking content');
    const pageContent = await page.evaluate(() => {
      const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
        placeholder: i.placeholder,
        type: i.type,
        value: i.value
      }));
      return { inputs, bodyText: document.body.innerText.substring(0, 300) };
    });
    console.log('Found inputs:', pageContent.inputs);
    console.log('Page preview:', pageContent.bodyText);
    
    // Try to find the search input with a more flexible approach
    const searchInput = await page.$('input') || await page.$('[placeholder*="Search"]') || await page.$('[placeholder*="search"]');
    
    if (searchInput) {
      console.log('3. Found search input, typing CIQ');
      await searchInput.type('ciq');
      await page.keyboard.press('Enter');
      
      // Wait for potential search results
      await page.waitForTimeout(2000);
    } else {
      console.log('3. No search input found, checking if CIQ assets are already visible');
    }
    
    console.log('3. Looking for CIQ logo asset card');
    const assetCards = await page.$$('[data-testid="asset-card"], .group.cursor-pointer');
    
    if (assetCards.length === 0) {
      console.log('   No asset cards found, checking page content...');
      const bodyText = await page.evaluate(() => document.body.innerText);
      console.log('   Page content preview:', bodyText.substring(0, 500));
      
      // Try to find any clickable elements
      const clickableElements = await page.$$('button, [role="button"], [onclick]');
      console.log(`   Found ${clickableElements.length} clickable elements`);
      
      // Look for any CIQ-related content
      const ciqContent = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll('*'));
        return elements.filter(el => el.textContent?.toLowerCase().includes('ciq')).map(el => ({
          tag: el.tagName,
          text: el.textContent?.substring(0, 100),
          className: el.className
        }));
      });
      console.log('   CIQ-related content:', ciqContent);
    }
    
    if (assetCards.length > 0) {
      console.log(`   Found ${assetCards.length} asset card(s)`);
      
      console.log('4. Clicking on the first asset card to open modal');
      await assetCards[0].click();
      
      // Wait for modal to appear
      await page.waitForTimeout(1000);
      
      console.log('5. Looking for Light mode tab');
      const lightModeTab = await page.$('button:has-text("Light mode")') || 
                          await page.$x('//button[contains(text(), "Light mode")]');
      
      if (lightModeTab.length > 0) {
        console.log('6. Found Light mode tab, taking screenshot');
        await page.screenshot({ 
          path: '/tmp/ciq-light-mode.png', 
          fullPage: true 
        });
        console.log('   Screenshot saved: /tmp/ciq-light-mode.png');
        
        console.log('7. Clicking Dark mode tab');
        const darkModeTab = await page.$x('//button[contains(text(), "Dark mode")]');
        if (darkModeTab.length > 0) {
          await darkModeTab[0].click();
          await page.waitForTimeout(1000);
          
          console.log('8. Taking screenshot of Dark mode');
          await page.screenshot({ 
            path: '/tmp/ciq-dark-mode.png', 
            fullPage: true 
          });
          console.log('   Screenshot saved: /tmp/ciq-dark-mode.png');
          
          console.log('9. Checking variant differences');
          const lightVariants = await page.evaluate(() => {
            // Switch back to light mode first
            const lightBtn = Array.from(document.querySelectorAll('button')).find(b => 
              b.textContent?.includes('Light mode'));
            if (lightBtn) lightBtn.click();
            
            // Get variant info
            return Array.from(document.querySelectorAll('[data-testid="variant"], .grid > div')).map(el => ({
              text: el.textContent,
              src: el.querySelector('img')?.src || 'no-img'
            }));
          });
          
          await page.waitForTimeout(500);
          
          const darkVariants = await page.evaluate(() => {
            // Switch to dark mode
            const darkBtn = Array.from(document.querySelectorAll('button')).find(b => 
              b.textContent?.includes('Dark mode'));
            if (darkBtn) darkBtn.click();
            
            // Get variant info  
            return Array.from(document.querySelectorAll('[data-testid="variant"], .grid > div')).map(el => ({
              text: el.textContent,
              src: el.querySelector('img')?.src || 'no-img'
            }));
          });
          
          console.log('Light mode variants:', lightVariants);
          console.log('Dark mode variants:', darkVariants);
          
          // Check if variants are different
          const variantsDifferent = JSON.stringify(lightVariants) !== JSON.stringify(darkVariants);
          console.log('10. Variants different between modes:', variantsDifferent);
          
        } else {
          console.log('   Dark mode tab not found');
        }
      } else {
        console.log('   Light mode tab not found, checking modal content');
        const modalContent = await page.evaluate(() => {
          const modal = document.querySelector('[role="dialog"], .modal, .fixed.inset-0');
          return modal ? modal.innerText : 'No modal found';
        });
        console.log('   Modal content:', modalContent.substring(0, 500));
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await browser.close();
  }
}

testCIQModalFiltering().catch(console.error);