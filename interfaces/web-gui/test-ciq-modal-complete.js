const puppeteer = require('puppeteer');

async function testCIQModalFiltering() {
  const browser = await puppeteer.launch({ 
    headless: false, 
    slowMo: 200,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });
    
    console.log('🌐 Step 1: Navigating to http://localhost:3002');
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle0' });
    
    console.log('🔍 Step 2: Looking for CIQ logo asset card');
    
    // Find all asset cards
    const assetCards = await page.$$('.group.cursor-pointer');
    console.log(`   Found ${assetCards.length} asset cards`);
    
    // Find the CIQ card specifically
    let ciqCard = null;
    for (let i = 0; i < assetCards.length; i++) {
      const cardText = await assetCards[i].evaluate(el => el.innerText.toLowerCase());
      if (cardText.includes('ciq')) {
        ciqCard = assetCards[i];
        console.log(`   ✅ Found CIQ card at position ${i + 1}`);
        break;
      }
    }
    
    if (!ciqCard) {
      console.log('   ❌ CIQ card not found');
      return;
    }
    
    console.log('🖱️ Step 3: Clicking on CIQ logo asset to open modal');
    await ciqCard.click();
    
    // Wait for modal to appear
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if modal opened
    const modal = await page.$('.fixed.inset-0');
    if (!modal) {
      console.log('   ❌ Modal did not open');
      return;
    }
    console.log('   ✅ Modal opened successfully');
    
    console.log('📸 Step 4: Taking screenshot of Light mode (default)');
    await page.screenshot({ 
      path: '/tmp/ciq-light-mode-test.png', 
      fullPage: true 
    });
    console.log('   📷 Screenshot saved: /tmp/ciq-light-mode-test.png');
    
    // Get Light mode variants (filter only CIQ logo variants)
    const lightVariants = await page.evaluate(() => {
      const variantButtons = Array.from(document.querySelectorAll('.grid > div button'));
      return variantButtons.map((btn, index) => {
        const img = btn.querySelector('img');
        const label = btn.parentElement?.querySelector('label');
        return {
          index,
          imageSrc: img?.src || 'no-image',
          label: label?.innerText || `Variant ${index + 1}`,
          opacity: btn.style.opacity || getComputedStyle(btn).opacity
        };
      }).filter(variant => variant.imageSrc.includes('CIQ_logo')); // Only CIQ variants
    });
    
    console.log('💡 Light mode variants found:', lightVariants.length);
    lightVariants.forEach((variant, i) => {
      console.log(`   ${i + 1}. ${variant.label} (opacity: ${variant.opacity})`);
      console.log(`      Image: ${variant.imageSrc.split('/').pop()}`);
    });
    
    console.log('🌙 Step 5: Clicking on Dark mode tab');
    const darkModeButton = await page.evaluateHandle(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.find(button => button.textContent?.includes('Dark mode'));
    });
    
    if (!darkModeButton) {
      console.log('   ❌ Dark mode button not found');
      return;
    }
    
    await darkModeButton.click();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for variants to update
    
    console.log('📸 Step 6: Taking screenshot of Dark mode');
    await page.screenshot({ 
      path: '/tmp/ciq-dark-mode-test.png', 
      fullPage: true 
    });
    console.log('   📷 Screenshot saved: /tmp/ciq-dark-mode-test.png');
    
    // Get Dark mode variants (filter only CIQ logo variants)
    const darkVariants = await page.evaluate(() => {
      const variantButtons = Array.from(document.querySelectorAll('.grid > div button'));
      return variantButtons.map((btn, index) => {
        const img = btn.querySelector('img');
        const label = btn.parentElement?.querySelector('label');
        return {
          index,
          imageSrc: img?.src || 'no-image',
          label: label?.innerText || `Variant ${index + 1}`,
          opacity: btn.style.opacity || getComputedStyle(btn).opacity
        };
      }).filter(variant => variant.imageSrc.includes('CIQ_logo')); // Only CIQ variants
    });
    
    console.log('🌙 Dark mode variants found:', darkVariants.length);
    darkVariants.forEach((variant, i) => {
      console.log(`   ${i + 1}. ${variant.label} (opacity: ${variant.opacity})`);
      console.log(`      Image: ${variant.imageSrc.split('/').pop()}`);
    });
    
    console.log('\n🔬 Step 7: Analyzing Results');
    
    // Compare variants
    const lightImages = lightVariants.map(v => v.imageSrc.split('/').pop());
    const darkImages = darkVariants.map(v => v.imageSrc.split('/').pop());
    
    console.log(`   Light mode images: [${lightImages.join(', ')}]`);
    console.log(`   Dark mode images:  [${darkImages.join(', ')}]`);
    
    const variantsDifferent = JSON.stringify(lightImages.sort()) !== JSON.stringify(darkImages.sort());
    const hasCorrectCount = lightVariants.length === 2 && darkVariants.length === 2;
    
    console.log('\n📊 Test Results:');
    console.log(`   ✅ Light mode shows 2 variants: ${lightVariants.length === 2 ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Dark mode shows 2 variants:  ${darkVariants.length === 2 ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Variants differ between modes: ${variantsDifferent ? 'PASS' : 'FAIL'}`);
    
    // Check for expected file patterns
    const hasLightModeFiles = lightImages.some(img => img.includes('lightmode'));
    const hasDarkModeFiles = darkImages.some(img => img.includes('darkmode'));
    
    console.log(`   ✅ Light mode shows lightmode files: ${hasLightModeFiles ? 'PASS' : 'FAIL'}`);
    console.log(`   ✅ Dark mode shows darkmode files:  ${hasDarkModeFiles ? 'PASS' : 'FAIL'}`);
    
    const overallResult = hasCorrectCount && variantsDifferent && hasLightModeFiles && hasDarkModeFiles;
    console.log(`\n🎯 OVERALL RESULT: ${overallResult ? '✅ PASS - CIQ mode filtering is working correctly!' : '❌ FAIL - Issues found with mode filtering'}`);
    
    // Wait a bit so user can see the results
    await new Promise(resolve => setTimeout(resolve, 3000));
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await browser.close();
  }
}

console.log('🧪 Starting CIQ Logo Mode Filtering Test...\n');
testCIQModalFiltering().catch(console.error);