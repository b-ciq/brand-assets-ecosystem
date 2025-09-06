const { chromium } = require('playwright');
const fs = require('fs');

async function testJpegBackgrounds() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('Testing JPEG background functionality...');
  
  // Listen for console messages and errors
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  // Listen for downloads
  let downloadedFiles = [];
  page.on('download', async download => {
    const filename = download.suggestedFilename();
    const path = `/tmp/${filename}`;
    await download.saveAs(path);
    downloadedFiles.push({ filename, path });
    console.log(`Downloaded: ${filename} to ${path}`);
  });
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Wait for asset cards to load
    await page.waitForSelector('[class*="cursor-pointer rounded-lg"]', { timeout: 10000 });
    
    // Click on the first asset card to open modal
    await page.click('[class*="cursor-pointer rounded-lg"]:first-of-type');
    
    // Wait for modal to open
    await page.waitForSelector('[class*="absolute inset-0 bg-black"]', { timeout: 5000 });
    
    console.log('Modal opened successfully');
    
    // Test 1: Light mode JPEG download
    console.log('\\nTesting light mode JPEG download...');
    
    // Ensure we're in light mode
    await page.evaluate(() => {
      document.documentElement.classList.remove('dark');
    });
    
    // Click Advanced Options to reveal format options
    await page.click('button:has-text("ADVANCED OPTIONS")');
    await page.waitForTimeout(500);
    
    // Select JPG format
    await page.click('button:has-text("JPG")');
    console.log('Selected JPG format');
    
    // Debug: Check available buttons after JPG selection
    const buttonsAfterJPG = await page.$$eval('button', buttons => 
      buttons.map(btn => ({
        text: btn.textContent?.trim(),
        visible: btn.offsetParent !== null,
        classes: btn.className
      }))
    );
    console.log('Buttons after JPG selection:', buttonsAfterJPG.filter(btn => btn.visible));
    
    // Click download button (try the main green download button)
    await page.click('button:has-text("DOWNLOAD")');
    
    // Wait a bit for download to process
    await page.waitForTimeout(2000);
    
    // Test 2: Dark mode JPEG download  
    console.log('\\nTesting dark mode JPEG download...');
    
    // Switch to dark mode
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    
    await page.waitForTimeout(500); // Let theme change take effect
    
    // Make sure JPG is still selected, then click download
    await page.click('button:has-text("DOWNLOAD")');
    
    // Wait for download
    await page.waitForTimeout(2000);
    
    console.log(`\\nTotal downloads: ${downloadedFiles.length}`);
    downloadedFiles.forEach(file => {
      console.log(`- ${file.filename} (${file.path})`);
      try {
        const stats = fs.statSync(file.path);
        console.log(`  Size: ${stats.size} bytes`);
      } catch (e) {
        console.log(`  Error reading file: ${e.message}`);
      }
    });
    
    // Check for console errors related to background
    const consoleLogs = await page.evaluate(() => {
      return window.console.logs || [];
    });
    
  } catch (error) {
    console.error('Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

testJpegBackgrounds().catch(console.error);