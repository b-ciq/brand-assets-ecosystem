const { chromium } = require('playwright');

async function debugTheme() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Debugging theme detection...');
  
  // Capture all console messages
  page.on('console', msg => {
    console.log('BROWSER:', msg.text());
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Open modal and set up JPEG
    await page.click('[class*="cursor-pointer rounded-lg"]:first-of-type');
    await page.waitForSelector('[class*="absolute inset-0 bg-black"]');
    await page.click('button:has-text("ADVANCED OPTIONS")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("JPG")');
    
    // Test theme detection BEFORE download
    console.log('\\n🔍 Checking theme detection...');
    const themeCheck = await page.evaluate(() => {
      const hasLight = document.documentElement.classList.contains('light');
      const hasDark = document.documentElement.classList.contains('dark');
      const allClasses = document.documentElement.className;
      return { hasLight, hasDark, allClasses };
    });
    console.log('Initial theme state:', themeCheck);
    
    // Set to dark mode explicitly
    console.log('\\n🌙 Setting dark mode...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    
    const darkThemeCheck = await page.evaluate(() => {
      const hasLight = document.documentElement.classList.contains('light');
      const hasDark = document.documentElement.classList.contains('dark');
      const allClasses = document.documentElement.className;
      return { hasLight, hasDark, allClasses };
    });
    console.log('After setting dark mode:', darkThemeCheck);
    
    await page.waitForTimeout(500);
    
    // Now trigger download
    console.log('\\n📦 Triggering download...');
    await page.evaluate(() => {
      const downloadBtn = document.querySelector('button[class*="bg-green-600"]');
      if (downloadBtn) downloadBtn.click();
    });
    
    await page.waitForTimeout(3000);
    
  } catch (error) {
    console.error('Debug failed:', error);
  } finally {
    await browser.close();
  }
}

debugTheme().catch(console.error);