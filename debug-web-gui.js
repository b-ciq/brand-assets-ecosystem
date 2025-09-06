const { chromium } = require('playwright');

async function debugWebGUI() {
    const browser = await chromium.launch({ headless: false });
    const page = await browser.newPage();
    
    // Enable request/response logging
    page.on('request', request => {
        if (request.url().includes('/api/search')) {
            console.log(`🔍 API REQUEST: ${request.method()} ${request.url()}`);
        }
    });
    
    page.on('response', async response => {
        if (response.url().includes('/api/search')) {
            console.log(`📡 API RESPONSE: ${response.status()}`);
            const responseBody = await response.text();
            console.log('📄 Response Body (first 500 chars):', responseBody.substring(0, 500));
            
            // Parse and show asset titles
            try {
                const data = JSON.parse(responseBody);
                if (data.assets) {
                    console.log('🏷️  Asset Titles from API:');
                    data.assets.slice(0, 3).forEach((asset, i) => {
                        console.log(`   ${i + 1}. "${asset.title}"`);
                        console.log(`      Description: "${asset.description}"`);
                    });
                }
            } catch (e) {
                console.log('Error parsing response:', e.message);
            }
        }
    });
    
    // Navigate to web GUI
    console.log('🌐 Loading Web GUI...');
    await page.goto('http://localhost:3003');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Search for CIQ
    console.log('🔍 Searching for "ciq"...');
    await page.fill('[placeholder*="Search"], input[type="search"], input[type="text"]', 'ciq');
    await page.press('[placeholder*="Search"], input[type="search"], input[type="text"]', 'Enter');
    
    // Wait for search results
    await page.waitForTimeout(2000);
    
    // Check what's actually displayed in the DOM
    const assetTitles = await page.$$eval('[data-testid*="asset"], .asset-title, h3, h2', elements => 
        elements.map(el => el.textContent?.trim()).filter(text => text && text.length > 0)
    );
    
    console.log('🎨 Asset Titles in DOM:');
    assetTitles.slice(0, 5).forEach((title, i) => {
        console.log(`   ${i + 1}. "${title}"`);
    });
    
    // Check if we can find any asset elements
    const assetElements = await page.$$('[class*="asset"], [data-testid*="asset"], .card');
    console.log(`📦 Found ${assetElements.length} potential asset elements in DOM`);
    
    // Keep browser open for manual inspection
    console.log('🔍 Browser is open for manual inspection. Press Ctrl+C to close.');
    
    // Wait for user to manually close
    await page.waitForTimeout(30000);
    
    await browser.close();
}

debugWebGUI().catch(console.error);