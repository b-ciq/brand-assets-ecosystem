const { chromium } = require('playwright');

async function captureScreenshots() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 } // Standard desktop resolution
  });
  const page = await context.newPage();

  console.log('📸 Capturing Interface Screenshots for UX Evaluation');
  console.log('=====================================================');

  try {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Let everything render

    console.log('✅ Page loaded, beginning screenshot capture...');

    // 1. Initial Load State
    console.log('📷 1. Capturing initial load state...');
    await page.screenshot({
      path: '/tmp/claude/01-initial-load.png',
      fullPage: true
    });

    // 2. Dropdown Open State
    console.log('📷 2. Capturing dropdown open state...');
    const selectTrigger = await page.locator('button[role="combobox"]').first();
    await selectTrigger.click();
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/tmp/claude/02-dropdown-open.png',
      fullPage: true
    });

    // 3. Different Filter Selected (LOGOS)
    console.log('📷 3. Capturing LOGOS filter selected...');
    const logosOption = await page.locator('[role="option"]').filter({ hasText: 'LOGOS' });
    await logosOption.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/claude/03-logos-selected.png',
      fullPage: true
    });

    // 4. Toggle in "All Variants" Mode
    console.log('📷 4. Capturing toggle in "All Variants" mode...');
    const toggle = await page.locator('button[aria-label="Toggle display mode"]').first();
    await toggle.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/claude/04-all-variants-toggle.png',
      fullPage: true
    });

    // 5. Search with Results
    console.log('📷 5. Capturing search with results...');
    const searchInput = await page.locator('input[placeholder="Search"]').first();
    await searchInput.fill('fuzzball');
    await page.waitForTimeout(3000); // Wait for search results

    await page.screenshot({
      path: '/tmp/claude/05-search-with-results.png',
      fullPage: true
    });

    // 6. Solution Brief Filter
    console.log('📷 6. Capturing solution brief filter...');
    await selectTrigger.click();
    await page.waitForTimeout(500);
    const docOption = await page.locator('[role="option"]').filter({ hasText: 'SOLUTION BRIEF' });
    await docOption.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/claude/06-solution-brief-filter.png',
      fullPage: true
    });

    // 7. Mobile/Responsive View
    console.log('📷 7. Capturing mobile responsive view...');
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X size
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/tmp/claude/07-mobile-responsive.png',
      fullPage: true
    });

    // 8. Tablet View
    console.log('📷 8. Capturing tablet view...');
    await page.setViewportSize({ width: 768, height: 1024 }); // iPad size
    await page.waitForTimeout(1000);

    await page.screenshot({
      path: '/tmp/claude/08-tablet-view.png',
      fullPage: true
    });

    // 9. Reset to desktop and capture clean state
    console.log('📷 9. Capturing final clean state...');
    await page.setViewportSize({ width: 1440, height: 900 });
    await searchInput.fill('');
    await selectTrigger.click();
    await page.waitForTimeout(500);
    const allTypesOption = await page.locator('[role="option"]').filter({ hasText: 'ALL TYPES' });
    await allTypesOption.click();
    await page.waitForTimeout(2000);

    await page.screenshot({
      path: '/tmp/claude/09-clean-final-state.png',
      fullPage: true
    });

    console.log('✅ Screenshot capture complete! Files saved to /tmp/claude/');
    console.log('');
    console.log('📋 Screenshots captured:');
    console.log('  01-initial-load.png         - First impression of interface');
    console.log('  02-dropdown-open.png        - Filter dropdown interaction');
    console.log('  03-logos-selected.png       - Filter selection feedback');
    console.log('  04-all-variants-toggle.png  - Toggle component state');
    console.log('  05-search-with-results.png  - Search functionality');
    console.log('  06-solution-brief-filter.png- Document filtering');
    console.log('  07-mobile-responsive.png    - Mobile usability');
    console.log('  08-tablet-view.png          - Tablet adaptation');
    console.log('  09-clean-final-state.png    - Reset state clarity');

  } catch (error) {
    console.error('❌ Screenshot capture failed:', error.message);
  } finally {
    await browser.close();
  }
}

captureScreenshots();