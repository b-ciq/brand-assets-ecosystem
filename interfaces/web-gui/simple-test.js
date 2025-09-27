const { chromium } = require('playwright');

async function simpleTest() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('🔧 Simple Shadcn/ui Test');
  console.log('========================');

  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded');

    // Wait a bit for React to render
    await page.waitForTimeout(3000);

    // Check for any select element (more generic)
    const selectElements = await page.locator('button[role="combobox"], select, [data-testid*="select"], button[aria-haspopup="listbox"]').count();
    console.log(`📋 Select elements found: ${selectElements}`);

    // Check for toggle button
    const toggleElements = await page.locator('button[aria-pressed], button[role="switch"], [aria-label*="toggle"], [data-state]').count();
    console.log(`🔘 Toggle elements found: ${toggleElements}`);

    // Check for search input
    const searchElements = await page.locator('input[type="text"], input[placeholder*="search"], input[placeholder*="Search"]').count();
    console.log(`🔍 Search elements found: ${searchElements}`);

    // Check for header section
    const headerElements = await page.locator('div[data-name="header"], header, .header').count();
    console.log(`📰 Header elements found: ${headerElements}`);

    // Get all button texts to debug
    const buttons = await page.locator('button').all();
    console.log(`\n🎯 All button texts found:`);
    for (let i = 0; i < Math.min(buttons.length, 10); i++) {
      const text = await buttons[i].textContent();
      const role = await buttons[i].getAttribute('role');
      const ariaLabel = await buttons[i].getAttribute('aria-label');
      console.log(`  ${i+1}. "${text?.trim()}" (role: ${role}, aria-label: ${ariaLabel})`);
    }

    // Get page title and any error indicators
    const title = await page.title();
    console.log(`\n📄 Page title: ${title}`);

    // Check console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log(`🚨 Console error: ${msg.text()}`);
      }
    });

    // Take a longer pause to see the page
    console.log('\n⏸️  Pausing for 10 seconds for visual inspection...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
}

simpleTest();