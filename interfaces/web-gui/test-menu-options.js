const { chromium } = require('playwright');

async function testMenuOptions() {
  console.log('🚀 Starting comprehensive menu options test...\n');

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the app
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');

  // Test results tracking
  const testResults = {
    issues: [],
    successes: [],
    totalTests: 0
  };

  // Helper function to wait for search results
  async function waitForResults(expectedType = null) {
    try {
      // Wait for loading to finish
      await page.waitForSelector('[data-testid="asset-grid"], .text-center', { timeout: 10000 });

      // Check if there are results or "no assets found"
      const hasResults = await page.$('[data-testid="asset-grid"] > div > div');
      const noResults = await page.$('text=No assets found');

      if (noResults) {
        return { count: 0, assets: [], hasResults: false };
      }

      if (!hasResults) {
        return { count: 0, assets: [], hasResults: false };
      }

      // Get all asset cards
      const assets = await page.$$('[data-testid="asset-grid"] > div > div');

      // Get asset details
      const assetDetails = [];
      for (const asset of assets) {
        try {
          const titleElement = await asset.$('.font-medium');
          const subtitleElement = await asset.$('.text-xs');

          const title = titleElement ? await titleElement.textContent() : 'No title';
          const subtitle = subtitleElement ? await subtitleElement.textContent() : 'No subtitle';

          assetDetails.push({ title, subtitle });
        } catch (e) {
          // Skip assets that don't have the expected structure
        }
      }

      return { count: assets.length, assets: assetDetails, hasResults: true };
    } catch (error) {
      console.log(`⚠️  Error waiting for results: ${error.message}`);
      return { count: 0, assets: [], hasResults: false };
    }
  }

  // Helper function to get current dropdown label
  async function getDropdownLabel() {
    try {
      const dropdown = await page.$('select[data-name="filter menu"]');
      const selectedValue = await dropdown.evaluate(el => el.value);
      const selectedOption = await dropdown.evaluate((el, value) => {
        const option = el.querySelector(`option[value="${value}"]`);
        return option ? option.textContent : 'Unknown';
      }, selectedValue);
      return { value: selectedValue, label: selectedOption };
    } catch (error) {
      return { value: 'error', label: 'Could not read dropdown' };
    }
  }

  // Helper function to select dropdown option
  async function selectDropdownOption(value, expectedLabel) {
    testResults.totalTests++;
    console.log(`\n📋 Testing: ${expectedLabel} (value: "${value}")`);

    try {
      // Select the option
      await page.selectOption('select[data-name="filter menu"]', value);
      await page.waitForTimeout(1000); // Wait for UI update

      // Check dropdown label
      const dropdownState = await getDropdownLabel();
      console.log(`   Selected value: "${dropdownState.value}"`);
      console.log(`   Dropdown shows: "${dropdownState.label}"`);

      if (dropdownState.label !== expectedLabel) {
        testResults.issues.push({
          test: `Dropdown Label - ${expectedLabel}`,
          expected: expectedLabel,
          actual: dropdownState.label,
          severity: 'high'
        });
        console.log(`   ❌ ISSUE: Expected label "${expectedLabel}", got "${dropdownState.label}"`);
      } else {
        testResults.successes.push(`Dropdown Label - ${expectedLabel}: ✅`);
        console.log(`   ✅ Label correct: "${expectedLabel}"`);
      }

      // Wait for and analyze results
      console.log(`   🔍 Waiting for search results...`);
      const results = await waitForResults();

      console.log(`   📊 Found ${results.count} assets`);
      if (results.count > 0) {
        console.log(`   📝 Sample assets:`);
        results.assets.slice(0, 3).forEach((asset, i) => {
          console.log(`      ${i + 1}. "${asset.title}" - ${asset.subtitle}`);
        });
      }

      return results;

    } catch (error) {
      testResults.issues.push({
        test: `Menu Selection - ${expectedLabel}`,
        expected: 'Successful selection and results',
        actual: `Error: ${error.message}`,
        severity: 'critical'
      });
      console.log(`   ❌ CRITICAL ERROR: ${error.message}`);
      return { count: 0, assets: [], hasResults: false };
    }
  }

  // Test each menu option multiple times
  console.log('🎯 Testing each menu option with multiple iterations...\n');

  // Test 1: LOGOS - should show preferred logo variants
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- LOGOS Test Iteration ${i} ---`);
    const results = await selectDropdownOption('logo', 'LOGOS');

    // Analyze results for LOGOS
    if (results.hasResults) {
      const hasDocuments = results.assets.some(asset =>
        asset.subtitle.toLowerCase().includes('brief') ||
        asset.subtitle.toLowerCase().includes('document') ||
        asset.subtitle.toLowerCase().includes('pdf')
      );

      const logoVariants = results.assets.filter(asset =>
        asset.title.toLowerCase().includes('logo') ||
        asset.subtitle.toLowerCase().includes('logo')
      );

      if (hasDocuments) {
        testResults.issues.push({
          test: `LOGOS Filter - Iteration ${i}`,
          expected: 'Only logo assets',
          actual: 'Contains documents/PDFs',
          severity: 'high'
        });
        console.log(`   ❌ ISSUE: LOGOS showing documents (should only show logos)`);
      }

      // Check if showing multiple variants vs preferred only
      const productGroups = {};
      logoVariants.forEach(asset => {
        const productName = asset.title.split(' ')[0].toLowerCase();
        if (!productGroups[productName]) productGroups[productName] = 0;
        productGroups[productName]++;
      });

      const multipleVariants = Object.values(productGroups).some(count => count > 1);
      if (multipleVariants) {
        console.log(`   ⚠️  Note: Showing multiple variants per product (expected: preferred only)`);
      } else {
        testResults.successes.push(`LOGOS Filter - Iteration ${i}: Shows preferred variants only ✅`);
        console.log(`   ✅ Showing preferred variants only`);
      }
    }
  }

  // Test 2: SOLUTION BRIEFS - should show only solution briefs
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- SOLUTION BRIEFS Test Iteration ${i} ---`);
    const results = await selectDropdownOption('document', 'SOLUTION BRIEF');

    // Analyze results for SOLUTION BRIEFS
    if (results.hasResults) {
      const hasLogos = results.assets.some(asset =>
        asset.title.toLowerCase().includes('logo') ||
        asset.subtitle.toLowerCase().includes('logo')
      );

      const hasDocuments = results.assets.some(asset =>
        asset.subtitle.toLowerCase().includes('brief') ||
        asset.subtitle.toLowerCase().includes('document') ||
        asset.subtitle.toLowerCase().includes('pdf')
      );

      if (hasLogos) {
        testResults.issues.push({
          test: `SOLUTION BRIEF Filter - Iteration ${i}`,
          expected: 'Only document assets',
          actual: 'Contains logos',
          severity: 'high'
        });
        console.log(`   ❌ ISSUE: SOLUTION BRIEF showing logos (should only show documents)`);
      }

      if (hasDocuments) {
        testResults.successes.push(`SOLUTION BRIEF Filter - Iteration ${i}: Shows documents only ✅`);
        console.log(`   ✅ Showing documents only`);
      }
    }
  }

  // Test 3: SHOW ALL VARIANTS - should show all orientations and color modes
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- SHOW ALL VARIANTS Test Iteration ${i} ---`);
    const results = await selectDropdownOption('show-all-variants', 'SHOW ALL VARIANTS');

    // Analyze results for SHOW ALL VARIANTS
    if (results.hasResults) {
      const logoAssets = results.assets.filter(asset =>
        asset.title.toLowerCase().includes('logo')
      );

      // Group by product to count variants
      const productGroups = {};
      logoAssets.forEach(asset => {
        const productName = asset.title.split(' ')[0].toLowerCase();
        if (!productGroups[productName]) productGroups[productName] = [];
        productGroups[productName].push(asset);
      });

      let hasMultipleVariants = false;
      Object.entries(productGroups).forEach(([product, assets]) => {
        if (assets.length > 1) {
          hasMultipleVariants = true;
          console.log(`   📊 ${product.toUpperCase()}: ${assets.length} variants`);
        }
      });

      if (hasMultipleVariants) {
        testResults.successes.push(`SHOW ALL VARIANTS - Iteration ${i}: Shows multiple variants ✅`);
        console.log(`   ✅ Showing multiple variants per product`);
      } else {
        testResults.issues.push({
          test: `SHOW ALL VARIANTS - Iteration ${i}`,
          expected: 'Multiple variants per product (horizontal, vertical, symbol)',
          actual: 'Only one variant per product',
          severity: 'high'
        });
        console.log(`   ❌ ISSUE: Should show multiple variants but only showing one per product`);
      }
    }
  }

  // Test 4: ALL TYPES - should show preferred logos + solution briefs
  for (let i = 1; i <= 3; i++) {
    console.log(`\n--- ALL TYPES Test Iteration ${i} ---`);
    const results = await selectDropdownOption('', 'ALL TYPES');

    // Analyze results for ALL TYPES
    if (results.hasResults) {
      const hasLogos = results.assets.some(asset =>
        asset.title.toLowerCase().includes('logo')
      );

      const hasDocuments = results.assets.some(asset =>
        asset.subtitle.toLowerCase().includes('brief') ||
        asset.subtitle.toLowerCase().includes('document')
      );

      if (hasLogos && hasDocuments) {
        testResults.successes.push(`ALL TYPES - Iteration ${i}: Shows both logos and documents ✅`);
        console.log(`   ✅ Showing both logos and documents`);
      } else if (!hasLogos) {
        testResults.issues.push({
          test: `ALL TYPES - Iteration ${i}`,
          expected: 'Both logos and documents',
          actual: 'Missing logos',
          severity: 'high'
        });
        console.log(`   ❌ ISSUE: Missing logos`);
      } else if (!hasDocuments) {
        testResults.issues.push({
          test: `ALL TYPES - Iteration ${i}`,
          expected: 'Both logos and documents',
          actual: 'Missing documents',
          severity: 'high'
        });
        console.log(`   ❌ ISSUE: Missing documents`);
      }

      // Check if showing preferred variants only (not all variants)
      const logoAssets = results.assets.filter(asset =>
        asset.title.toLowerCase().includes('logo')
      );

      const productGroups = {};
      logoAssets.forEach(asset => {
        const productName = asset.title.split(' ')[0].toLowerCase();
        if (!productGroups[productName]) productGroups[productName] = 0;
        productGroups[productName]++;
      });

      const multipleVariants = Object.values(productGroups).some(count => count > 1);
      if (multipleVariants) {
        testResults.issues.push({
          test: `ALL TYPES - Iteration ${i}`,
          expected: 'Preferred variants only',
          actual: 'Multiple variants per product',
          severity: 'medium'
        });
        console.log(`   ⚠️  Note: Showing multiple variants (expected: preferred only)`);
      } else {
        testResults.successes.push(`ALL TYPES - Iteration ${i}: Shows preferred variants only ✅`);
        console.log(`   ✅ Showing preferred variants only`);
      }
    }
  }

  // Final test: Switch between options rapidly to test state management
  console.log(`\n--- RAPID SWITCHING Test ---`);
  const switchSequence = [
    { value: 'logo', label: 'LOGOS' },
    { value: 'show-all-variants', label: 'SHOW ALL VARIANTS' },
    { value: 'document', label: 'SOLUTION BRIEF' },
    { value: '', label: 'ALL TYPES' },
    { value: 'logo', label: 'LOGOS' }
  ];

  for (const option of switchSequence) {
    await selectDropdownOption(option.value, option.label);
    await page.waitForTimeout(500); // Brief pause between switches
  }

  // Generate comprehensive test report
  console.log('\n' + '='.repeat(80));
  console.log('📊 COMPREHENSIVE TEST REPORT');
  console.log('='.repeat(80));

  console.log(`\n✅ TOTAL TESTS RUN: ${testResults.totalTests}`);
  console.log(`✅ SUCCESSES: ${testResults.successes.length}`);
  console.log(`❌ ISSUES FOUND: ${testResults.issues.length}`);

  if (testResults.successes.length > 0) {
    console.log('\n🎉 SUCCESSFUL BEHAVIORS:');
    testResults.successes.forEach(success => {
      console.log(`  • ${success}`);
    });
  }

  if (testResults.issues.length > 0) {
    console.log('\n🚨 ISSUES IDENTIFIED:');

    // Group by severity
    const critical = testResults.issues.filter(i => i.severity === 'critical');
    const high = testResults.issues.filter(i => i.severity === 'high');
    const medium = testResults.issues.filter(i => i.severity === 'medium');

    if (critical.length > 0) {
      console.log('\n  🔴 CRITICAL ISSUES:');
      critical.forEach(issue => {
        console.log(`    • ${issue.test}`);
        console.log(`      Expected: ${issue.expected}`);
        console.log(`      Actual: ${issue.actual}`);
      });
    }

    if (high.length > 0) {
      console.log('\n  🟠 HIGH PRIORITY ISSUES:');
      high.forEach(issue => {
        console.log(`    • ${issue.test}`);
        console.log(`      Expected: ${issue.expected}`);
        console.log(`      Actual: ${issue.actual}`);
      });
    }

    if (medium.length > 0) {
      console.log('\n  🟡 MEDIUM PRIORITY ISSUES:');
      medium.forEach(issue => {
        console.log(`    • ${issue.test}`);
        console.log(`      Expected: ${issue.expected}`);
        console.log(`      Actual: ${issue.actual}`);
      });
    }

    console.log('\n📝 RECOMMENDED FIXES:');
    if (testResults.issues.some(i => i.test.includes('SHOW ALL VARIANTS') && i.actual.includes('Only one variant'))) {
      console.log('  1. Fix SHOW ALL VARIANTS to display multiple variants per product');
    }
    if (testResults.issues.some(i => i.test.includes('LOGOS') && i.actual.includes('documents'))) {
      console.log('  2. Fix LOGOS filter to exclude documents/PDFs');
    }
    if (testResults.issues.some(i => i.test.includes('SOLUTION BRIEF') && i.actual.includes('logos'))) {
      console.log('  3. Fix SOLUTION BRIEF filter to exclude logos');
    }
    if (testResults.issues.some(i => i.test.includes('Dropdown Label'))) {
      console.log('  4. Fix dropdown label display issues');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TEST COMPLETE');
  console.log('='.repeat(80));

  await browser.close();
  return testResults;
}

// Run the test
testMenuOptions().catch(console.error);