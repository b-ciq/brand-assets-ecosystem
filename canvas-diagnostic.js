const { chromium } = require('playwright');

async function canvasDiagnostic() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  console.log('🔍 Canvas Diagnostic Test Starting...');
  
  // Track all downloads
  const downloads = [];
  page.on('download', async download => {
    const filename = download.suggestedFilename();
    const path = `/tmp/${filename}`;
    await download.saveAs(path);
    downloads.push({ filename, path });
    console.log(`📁 Downloaded: ${filename}`);
  });
  
  // Capture console logs
  page.on('console', msg => {
    if (msg.text().includes('DIAGNOSTIC') || msg.text().includes('Canvas')) {
      console.log('🎨', msg.text());
    }
  });
  
  try {
    await page.goto('http://localhost:3001');
    await page.waitForLoadState('networkidle');
    
    // Click first asset to open modal
    await page.click('[class*="cursor-pointer rounded-lg"]:first-of-type');
    await page.waitForSelector('[class*="absolute inset-0 bg-black"]');
    
    // Set to dark mode explicitly
    console.log('\\n🌙 Setting to DARK mode...');
    await page.evaluate(() => {
      document.documentElement.classList.remove('light');
      document.documentElement.classList.add('dark');
    });
    
    // Open advanced options and select JPG
    await page.click('button:has-text("ADVANCED OPTIONS")');
    await page.waitForTimeout(500);
    await page.click('button:has-text("JPG")');
    await page.waitForTimeout(500);
    
    // Trigger download (this will also trigger our diagnostic downloads)
    console.log('\\n📦 Triggering download with diagnostics...');
    await page.evaluate(() => {
      const downloadBtn = document.querySelector('button[class*="bg-green-600"]');
      if (downloadBtn) downloadBtn.click();
    });
    
    // Wait for all downloads to complete
    await page.waitForTimeout(5000);
    
    console.log('\\n📊 DOWNLOAD SUMMARY:');
    downloads.forEach(download => {
      console.log(`  - ${download.filename} → ${download.path}`);
    });
    
    console.log('\\n🔍 ANALYSIS INSTRUCTIONS:');
    console.log('1. Check debug-background-dark.png - should be solid dark gray');
    console.log('2. Check debug-final-dark.png - should show logo on dark background');
    console.log('3. Check actual .jpg download - compare with debug files');
    console.log('4. Open files in image viewer to verify colors');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  } finally {
    await browser.close();
  }
}

canvasDiagnostic().catch(console.error);