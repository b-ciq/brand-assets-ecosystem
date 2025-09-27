const { chromium } = require('playwright');

async function testMenuOptionsWithSearch() {
  console.log('🚀 Starting comprehensive menu options test with search...\n');

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

  // Add a search query to trigger results
  async function performSearch(query = 'logo') {
    try {
      // Find and fill the search input
      const searchInput = await page.$('input[placeholder="Search"]');
      if (searchInput) {
        await searchInput.clear();
        await searchInput.fill(query);
        await page.waitForTimeout(1000); // Wait for search to complete
      }
    } catch (error) {
      console.log(`⚠️  Could not perform search: ${error.message}`);
    }
  }

  // Helper function to wait for search results
  async function waitForResults() {
    try {
      // Wait for loading to finish
      await page.waitForSelector('.grid, .text-center', { timeout: 10000 });

      // Get all asset cards from the grid
      const assetCards = await page.$$('.grid > div');

      // Get asset details
      const assetDetails = [];
      for (const card of assetCards) {
        try {
          // Look for text content in the card
          const textElements = await card.$$('text=*');
          const texts = [];
          for (const el of textElements) {
            const text = await el.textContent();
            if (text && text.trim()) texts.push(text.trim());
          }

          // Try to find asset titles/descriptions in sliding panels or card text
          const titleElement = await card.$('.font-medium, .text-white.font-medium');
          const subtitleElement = await card.$('.text-xs, .text-white\\/80');

          const title = titleElement ? await titleElement.textContent() :
                       (texts.find(t => t.toLowerCase().includes('logo') || t.toLowerCase().includes('brief')) || 'Unknown');
          const subtitle = subtitleElement ? await subtitleElement.textContent() :
                          (texts.find(t => t.includes('(') || t.includes('Light') || t.includes('Dark')) || 'No subtitle');

          assetDetails.push({ title: title.trim(), subtitle: subtitle.trim() });
        } catch (e) {
          // Skip cards that don't have the expected structure
          assetDetails.push({ title: 'Asset found', subtitle: 'Details unavailable' });
        }
      }

      return { count: assetCards.length, assets: assetDetails, hasResults: assetCards.length > 0 };
    } catch (error) {
      console.log(`⚠️  Error waiting for results: ${error.message}`);
      return { count: 0, assets: [], hasResults: false };
    }
  }

  // Helper function to get current dropdown label and value
  async function getDropdownState() {
    try {
      const dropdown = await page.$('select[data-name="filter menu"]');
      if (!dropdown) return { value: 'not-found', label: 'Dropdown not found' };

      const selectedValue = await dropdown.evaluate(el => el.value);
      const selectedOption = await dropdown.evaluate((el, value) => {
        const option = el.querySelector(`option[value="${value}"]`);
        return option ? option.textContent.trim() : 'Unknown option';
      }, selectedValue);

      return { value: selectedValue, label: selectedOption };
    } catch (error) {
      return { value: 'error', label: 'Could not read dropdown' };
    }
  }

  // Helper function to select dropdown option and analyze results
  async function testDropdownOption(value, expectedLabel, testDescription) {
    testResults.totalTests++;
    console.log(`\n📋 ${testDescription}`);
    console.log(`   Selecting value: "${value}" (expecting label: "${expectedLabel}")`);

    try {
      // Get initial state
      const initialState = await getDropdownState();
      console.log(`   Initial dropdown: "${initialState.label}" (value: "${initialState.value}")`);

      // Select the option
      await page.selectOption('select[data-name="filter menu"]', value);
      await page.waitForTimeout(1000); // Wait for UI update

      // Get new state after selection
      const newState = await getDropdownState();
      console.log(`   After selection: "${newState.label}" (value: "${newState.value}")`);

      // Check if dropdown label is correct
      if (newState.label !== expectedLabel) {
        testResults.issues.push({
          test: `Dropdown Label - ${testDescription}`,
          expected: expectedLabel,
          actual: newState.label,
          severity: 'high'
        });
        console.log(`   ❌ ISSUE: Expected label "${expectedLabel}", got "${newState.label}"`);
      } else {
        testResults.successes.push(`Dropdown Label - ${testDescription}: ✅`);
        console.log(`   ✅ Label correct: "${expectedLabel}"`);
      }

      // Perform search to get results
      await performSearch();

      // Wait for and analyze results
      console.log(`   🔍 Waiting for search results...`);
      const results = await waitForResults();

      console.log(`   📊 Found ${results.count} assets`);
      if (results.count > 0) {
        console.log(`   📝 Sample assets:`);
        results.assets.slice(0, 5).forEach((asset, i) => {
          console.log(`      ${i + 1}. "${asset.title}" - ${asset.subtitle}`);
        });
      }

      return { state: newState, results };

    } catch (error) {
      testResults.issues.push({
        test: `Menu Selection - ${testDescription}`,
        expected: 'Successful selection and results',
        actual: `Error: ${error.message}`,
        severity: 'critical'
      });
      console.log(`   ❌ CRITICAL ERROR: ${error.message}`);
      return { state: { value: 'error', label: 'Error' }, results: { count: 0, assets: [], hasResults: false } };
    }
  }

  // Test each menu option with detailed analysis
  console.log('🎯 Testing each menu option with search queries...\n');

  // Test 1: ALL TYPES - baseline test (should show both logos and documents)
  const allTypesTest = await testDropdownOption('', 'ALL TYPES', 'ALL TYPES Test');
  const allTypesResults = allTypesTest.results;

  if (allTypesResults.hasResults) {
    const hasLogos = allTypesResults.assets.some(asset =>
      asset.title.toLowerCase().includes('logo')
    );
    const hasDocuments = allTypesResults.assets.some(asset =>
      asset.title.toLowerCase().includes('brief') ||
      asset.subtitle.toLowerCase().includes('brief') ||
      asset.title.toLowerCase().includes('guidelines')
    );

    console.log(`   📊 Analysis: Logos=${hasLogos}, Documents=${hasDocuments}`);

    if (hasLogos && hasDocuments) {
      testResults.successes.push('ALL TYPES: Shows both logos and documents ✅');
    } else {
      testResults.issues.push({
        test: 'ALL TYPES Content',
        expected: 'Both logos and documents',
        actual: `Logos: ${hasLogos}, Documents: ${hasDocuments}`,
        severity: 'high'
      });
    }
  }

  // Test 2: LOGOS - should show only logos
  const logosTest = await testDropdownOption('logo', 'LOGOS', 'LOGOS Test');
  const logosResults = logosTest.results;

  if (logosResults.hasResults) {
    const hasLogos = logosResults.assets.some(asset =>
      asset.title.toLowerCase().includes('logo')
    );
    const hasDocuments = logosResults.assets.some(asset =>
      asset.title.toLowerCase().includes('brief') ||
      asset.subtitle.toLowerCase().includes('brief') ||
      asset.title.toLowerCase().includes('guidelines')
    );

    console.log(`   📊 Analysis: Logos=${hasLogos}, Documents=${hasDocuments}`);

    if (hasLogos && !hasDocuments) {
      testResults.successes.push('LOGOS: Shows logos only ✅');
    } else {
      testResults.issues.push({
        test: 'LOGOS Filter',
        expected: 'Logos only',
        actual: `Logos: ${hasLogos}, Documents: ${hasDocuments}`,
        severity: 'high'
      });
    }
  }

  // Test 3: SOLUTION BRIEF - should show only documents
  const documentsTest = await testDropdownOption('document', 'SOLUTION BRIEF', 'SOLUTION BRIEF Test');
  const documentsResults = documentsTest.results;

  if (documentsResults.hasResults) {
    const hasLogos = documentsResults.assets.some(asset =>
      asset.title.toLowerCase().includes('logo')
    );
    const hasDocuments = documentsResults.assets.some(asset =>
      asset.title.toLowerCase().includes('brief') ||
      asset.subtitle.toLowerCase().includes('brief') ||
      asset.title.toLowerCase().includes('guidelines')
    );

    console.log(`   📊 Analysis: Logos=${hasLogos}, Documents=${hasDocuments}`);

    if (!hasLogos && hasDocuments) {
      testResults.successes.push('SOLUTION BRIEF: Shows documents only ✅');
    } else {
      testResults.issues.push({
        test: 'SOLUTION BRIEF Filter',
        expected: 'Documents only',
        actual: `Logos: ${hasLogos}, Documents: ${hasDocuments}`,
        severity: 'high'
      });
    }
  }

  // Test 4: SHOW ALL VARIANTS - critical test for dropdown issue
  console.log(`\n🔍 DETAILED SHOW ALL VARIANTS TEST:`);

  // First, check current state
  const preShowAllState = await getDropdownState();
  console.log(`   Pre-test state: "${preShowAllState.label}" (value: "${preShowAllState.value}")`);

  const showAllTest = await testDropdownOption('show-all-variants', 'SHOW ALL VARIANTS', 'SHOW ALL VARIANTS Test');
  const showAllResults = showAllTest.results;

  // Special analysis for SHOW ALL VARIANTS
  if (showAllResults.hasResults) {
    const logoAssets = showAllResults.assets.filter(asset =>
      asset.title.toLowerCase().includes('logo')
    );

    // Group by product to count variants
    const productGroups = {};
    logoAssets.forEach(asset => {
      // Extract product name from title (first word typically)
      const productName = asset.title.split(' ')[0].toLowerCase();
      if (!productGroups[productName]) productGroups[productName] = [];
      productGroups[productName].push(asset);
    });

    console.log(`   📊 Product variant analysis:`);
    let hasMultipleVariants = false;
    Object.entries(productGroups).forEach(([product, assets]) => {
      console.log(`      ${product.toUpperCase()}: ${assets.length} variants`);
      if (assets.length > 1) hasMultipleVariants = true;
    });

    if (hasMultipleVariants) {
      testResults.successes.push('SHOW ALL VARIANTS: Shows multiple variants per product ✅');
    } else {
      testResults.issues.push({
        test: 'SHOW ALL VARIANTS Functionality',
        expected: 'Multiple variants per product',
        actual: 'Only one variant per product',
        severity: 'high'
      });
    }
  }

  // Test 5: Rapid switching to test state persistence
  console.log(`\n🔄 RAPID SWITCHING TEST:`);
  const switchTests = [
    { value: 'logo', label: 'LOGOS', name: 'Switch to LOGOS' },
    { value: 'show-all-variants', label: 'SHOW ALL VARIANTS', name: 'Switch to SHOW ALL VARIANTS' },
    { value: 'document', label: 'SOLUTION BRIEF', name: 'Switch to SOLUTION BRIEF' },
    { value: '', label: 'ALL TYPES', name: 'Switch to ALL TYPES' }
  ];

  for (const switchTest of switchTests) {
    const result = await testDropdownOption(switchTest.value, switchTest.label, switchTest.name);
    await page.waitForTimeout(500); // Brief pause between switches
  }

  // Generate comprehensive report
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

    console.log('\n📝 PRIORITY FIXES NEEDED:');

    // Identify key issues
    const dropdownLabelIssues = testResults.issues.filter(i => i.test.includes('SHOW ALL VARIANTS') && i.expected === 'SHOW ALL VARIANTS');
    const filteringIssues = testResults.issues.filter(i => i.test.includes('Filter'));
    const functionalityIssues = testResults.issues.filter(i => i.test.includes('Functionality'));

    if (dropdownLabelIssues.length > 0) {
      console.log('  🎯 FIX 1: SHOW ALL VARIANTS dropdown option not working correctly');
      console.log('    - The "show-all-variants" value is not being handled properly');
      console.log('    - Dropdown label shows wrong value after selection');
    }

    if (filteringIssues.length > 0) {
      console.log('  🎯 FIX 2: Asset type filtering not working correctly');
      console.log('    - LOGOS filter may be showing documents');
      console.log('    - SOLUTION BRIEF filter may be showing logos');
    }

    if (functionalityIssues.length > 0) {
      console.log('  🎯 FIX 3: SHOW ALL VARIANTS not displaying multiple variants');
      console.log('    - Should show horizontal, vertical, symbol orientations');
      console.log('    - Should show light/dark color modes');
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('🏁 TEST COMPLETE - Ready for fixing issues');
  console.log('='.repeat(80));

  await browser.close();
  return testResults;
}

// Run the test
testMenuOptionsWithSearch().catch(console.error);