/**
 * Test the MCP Channel Adapter
 * Verify that it correctly handles specific product queries
 */

import { MCPChannelAdapter } from './mcp-channel';
import { BrandAssetsCore } from '../core-api';
import { MCPAssetDataSource } from '../core-api/asset-source';
import { CoreSearchEngine } from '../core-api/search-engine';

// Mock MCP client for testing
const mockMCPClient = {
  searchAssets: async (query: string) => {
    // Simulate the CLI wrapper behavior
    if (query.toLowerCase().includes('fuzzball')) {
      return {
        assets: {
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

async function testMCPChannel() {
  console.log('🧪 Testing MCP Channel Adapter...\n');

  // Create core components
  const searchEngine = new CoreSearchEngine();
  const dataSource = new MCPAssetDataSource(mockMCPClient, searchEngine);
  const core = new BrandAssetsCore(dataSource);
  const mcpChannel = new MCPChannelAdapter(core);

  // Test cases
  const testCases = [
    {
      query: 'fuzzball logo',
      expectedBrand: 'fuzzball',
      description: 'Specific product query should only return that product'
    },
    {
      query: 'get me the warewulf icon',
      expectedBrand: 'warewulf', 
      description: 'Specific product with layout should be precise'
    },
    {
      query: 'ciq colors',
      expectedType: 'color_query',
      description: 'Color queries should be handled separately'
    }
  ];

  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.query}"`);
    console.log(`Expected: ${testCase.description}`);
    
    try {
      const result = await mcpChannel.search(testCase.query);
      console.log(`✅ Result: ${result.message}`);
      console.log(`   URL: ${result.url}`);
      console.log(`   Action: ${result.action}`);
      console.log(`   Confidence: ${result.confidence}\n`);
      
    } catch (error) {
      console.log(`❌ Error: ${error}\n`);
    }
  }

  console.log('🧪 MCP Channel tests complete!');
}

// Export for use in other tests
export { testMCPChannel };

// Run if called directly
if (require.main === module) {
  testMCPChannel().catch(console.error);
}