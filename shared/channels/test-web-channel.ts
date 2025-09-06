/**
 * Test the Web Channel Adapter
 * Verify that it correctly maintains web GUI compatibility while fixing the "fuzzball returns CIQ" issue
 */

import { WebChannelAdapter, WebSearchFilters } from './web-channel';
import { BrandAssetsCore } from '../core-api';
import { MCPAssetDataSource } from '../core-api/asset-source';
import { CoreSearchEngine } from '../core-api/search-engine';

// Mock MCP client for testing
const mockMCPClient = {
  searchAssets: async (query: string) => {
    // Simulate comprehensive asset data
    if (query.toLowerCase().includes('fuzzball') || !query.trim()) {
      return {
        assets: {
          ciq: {
            onecolor_light: {
              url: "/assets/global/CIQ_logos/CIQ_logo_1clr_lightmode.svg",
              filename: "CIQ_logo_1clr_lightmode.svg",
              background: "light",
              color: "black",
              layout: "onecolor",
              type: "logo",
              size: "large",
              tags: ["company", "primary"]
            }
          },
          fuzzball: {
            horizontal_black: {
              url: "http://localhost:3002/assets/products/fuzzball/logos/Fuzzball_logo_h-blk.svg",
              filename: "Fuzzball_logo_h-blk.svg",
              background: "light",
              color: "black",
              layout: "horizontal",
              type: "logo",
              size: "large",
              tags: []
            }
          }
        }
      };
    }
    
    // Default empty response
    return { assets: {} };
  }
};

async function testWebChannel() {
  console.log('🌐 Testing Web Channel Adapter...\n');

  // Create core components
  const searchEngine = new CoreSearchEngine();
  const dataSource = new MCPAssetDataSource(mockMCPClient, searchEngine);
  const core = new BrandAssetsCore(dataSource);
  const webChannel = new WebChannelAdapter(core);

  // Test cases
  const testCases = [
    {
      query: 'fuzzball logo',
      filters: { showPreferredOnly: true } as WebSearchFilters,
      description: 'Specific product query should only return Fuzzball, not CIQ',
      expected: {
        shouldIncludeFuzzball: true,
        shouldIncludeCIQ: false,
        totalAssets: 2 // light and dark versions of fuzzball
      }
    },
    {
      query: '', // Empty query (browse all)
      filters: { showPreferredOnly: true } as WebSearchFilters,
      description: 'General browse should show preferred from all brands',
      expected: {
        shouldIncludeFuzzball: true,
        shouldIncludeCIQ: true,
        totalAssets: 3 // 1 CIQ + 2 Fuzzball variants
      }
    },
    {
      query: 'fuzzball logo',
      filters: { showPreferredOnly: false } as WebSearchFilters,
      description: 'With showPreferredOnly=false, should show all variants',
      expected: {
        shouldIncludeFuzzball: true,
        shouldIncludeCIQ: false, // Still filtered by intent (specific product)
        totalAssets: 2
      }
    },
    {
      query: 'logo',
      filters: { brand: 'FUZZBALL' } as WebSearchFilters,
      description: 'Brand filter should work correctly',
      expected: {
        shouldIncludeFuzzball: true,
        shouldIncludeCIQ: false,
        totalAssets: 2
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.query}" with filters: ${JSON.stringify(testCase.filters)}`);
    console.log(`Expected: ${testCase.description}`);
    
    try {
      const result = await webChannel.search(testCase.query, testCase.filters);
      
      console.log(`✅ Results: ${result.total} assets found`);
      console.log(`   Confidence: ${result.confidence}`);
      
      if (result.recommendation) {
        console.log(`   Recommendation: ${result.recommendation}`);
      }
      
      // Check expectations
      const fuzzballAssets = result.assets.filter(asset => 
        asset.brand?.toLowerCase() === 'fuzzball'
      );
      const ciqAssets = result.assets.filter(asset => 
        asset.brand?.toLowerCase() === 'ciq'
      );
      
      console.log(`   Fuzzball assets: ${fuzzballAssets.length} (expected: ${testCase.expected.shouldIncludeFuzzball ? '> 0' : '0'})`);
      console.log(`   CIQ assets: ${ciqAssets.length} (expected: ${testCase.expected.shouldIncludeCIQ ? '> 0' : '0'})`);
      
      // Verify expectations
      if (testCase.expected.shouldIncludeFuzzball && fuzzballAssets.length === 0) {
        console.log(`   ❌ Expected Fuzzball assets but found none`);
      }
      if (!testCase.expected.shouldIncludeFuzzball && fuzzballAssets.length > 0) {
        console.log(`   ❌ Did not expect Fuzzball assets but found ${fuzzballAssets.length}`);
      }
      if (testCase.expected.shouldIncludeCIQ && ciqAssets.length === 0) {
        console.log(`   ❌ Expected CIQ assets but found none`);
      }
      if (!testCase.expected.shouldIncludeCIQ && ciqAssets.length > 0) {
        console.log(`   ❌ Did not expect CIQ assets but found ${ciqAssets.length}`);
      }
      
      // Show first few asset details
      if (result.assets.length > 0) {
        console.log(`   Sample assets:`);
        result.assets.slice(0, 3).forEach(asset => {
          console.log(`     - ${asset.displayName} (${asset.brand})`);
        });
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`❌ Error: ${error}\n`);
    }
  }

  console.log('🌐 Web Channel tests complete!');
}

// Export for use in other tests
export { testWebChannel };

// Run if called directly
if (require.main === module) {
  testWebChannel().catch(console.error);
}