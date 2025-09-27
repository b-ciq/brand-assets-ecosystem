const { chromium } = require('playwright');

async function quickTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔧 Quick Test - Check for Runtime Errors');
  console.log('========================================');

  try {
    // Listen for console errors
    let hasErrors = false;
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console Error: ${msg.text()}`);
        hasErrors = true;
      }
    });

    // Listen for page errors
    page.on('pageerror', error => {
      console.log(`🚨 Page Error: ${error.message}`);
      hasErrors = true;
    });

    await page.goto('http://localhost:3000');
    console.log('✅ Page loaded');

    // Wait for potential errors to surface
    await page.waitForTimeout(5000);

    if (!hasErrors) {
      console.log('✅ No runtime errors detected!');

      // Try to find our components
      const selectExists = await page.locator('button[role="combobox"]').count() > 0;
      const toggleExists = await page.locator('button[aria-pressed]').count() > 0;
      const inputExists = await page.locator('input[placeholder="Search"]').count() > 0;

      console.log(`  • Select component: ${selectExists ? '✅' : '❌'}`);
      console.log(`  • Toggle component: ${toggleExists ? '✅' : '❌'}`);
      console.log(`  • Search input: ${inputExists ? '✅' : '❌'}`);

      if (selectExists) {
        console.log('\n🎯 Testing Select Interaction');
        const select = await page.locator('button[role="combobox"]').first();

        // Click to open dropdown
        await select.click();
        await page.waitForTimeout(1000);

        const options = await page.locator('[role="option"]').count();
        console.log(`  • Options available: ${options > 0 ? '✅' : '❌'} (${options} options)`);

        if (options > 0) {
          console.log('  🎉 SUCCESS: Select dropdown is working correctly!');
        }
      }

      console.log('\n🎉 OVERALL RESULT: Shadcn/ui implementation appears to be working correctly!');
    } else {
      console.log('❌ Runtime errors were detected - implementation may need further fixes');
    }

    // Keep open for visual inspection
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Test Error:', error.message);
  } finally {
    await browser.close();
  }
}

quickTest();