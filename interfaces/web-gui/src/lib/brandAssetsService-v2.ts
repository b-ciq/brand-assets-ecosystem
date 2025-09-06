/**
 * Brand Assets Service V2
 * Uses the new channel adapter architecture for better separation of concerns
 * Includes fallback to V1 service for safety
 */

import { WebChannelAdapter, WebSearchFilters, WebChannelResponse } from '@brand-assets/shared/channels';
import { BrandAssetsCore, MCPAssetDataSource, CoreSearchEngine } from '@brand-assets/shared/core-api';
import { BrandAssetsMCP } from './brandAssetsMCP';
import { Asset } from '@/types/asset';

// Fallback to V1 service
import { searchAssets as searchAssetsV1, SimpleSearchFilters } from './brandAssetsService';

// Environment flag to enable/disable new architecture
const USE_CHANNEL_ADAPTER = process.env.USE_CHANNEL_ADAPTER === 'true';

// Initialize the new architecture
let webChannelAdapter: WebChannelAdapter | null = null;

if (USE_CHANNEL_ADAPTER) {
  try {
    // Initialize MCP client (reuse existing logic)
    const USE_CLOUD_ENDPOINT = process.env.USE_CLOUD_ENDPOINT === 'true' || 
                              (process.env.NODE_ENV === 'production' && process.env.FASTMCP_API_KEY);

    const mcp = new BrandAssetsMCP({
      mcpServerPath: '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/interfaces/mcp-server/server.py',
      cliWrapperPath: '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/interfaces/mcp-server/cli_wrapper.py',
      cloudEndpoint: 'https://quantic-asset-server.fastmcp.app/mcp',
      useCloudEndpoint: USE_CLOUD_ENDPOINT
    });

    // Create MCP client adapter to make BrandAssetsMCP compatible with MCPAssetDataSource
    const mcpClientAdapter = {
      searchAssets: async (query: string) => {
        return await mcp.searchAssets(query);
      }
    };

    // Create channel adapter stack
    const searchEngine = new CoreSearchEngine();
    const dataSource = new MCPAssetDataSource(mcpClientAdapter, searchEngine);
    const core = new BrandAssetsCore(dataSource);
    webChannelAdapter = new WebChannelAdapter(core);

    console.log('🔄 Channel adapter architecture initialized');
  } catch (error) {
    console.warn('⚠️  Failed to initialize channel adapter, falling back to V1:', error);
    webChannelAdapter = null;
  }
}

export interface SimpleSearchResponse {
  assets: Asset[];
  total: number;
  confidence?: string;
  recommendation?: string;
}

export interface SimpleSearchFilters {
  fileType?: string;
  assetType?: string;
  brand?: string;
  background?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical' | 'symbol';
  showPreferredOnly?: boolean; // Default: true - only show preferred variants
}

/**
 * Main search function - uses new architecture if available, falls back to V1
 */
export async function searchAssets(query: string, filters?: SimpleSearchFilters): Promise<SimpleSearchResponse> {
  // Try new channel adapter architecture first
  if (USE_CHANNEL_ADAPTER && webChannelAdapter) {
    try {
      console.log('🚀 Using channel adapter architecture');
      const result = await searchWithChannelAdapter(query, filters);
      console.log(`✅ Channel adapter returned ${result.total} results`);
      return result;
    } catch (error) {
      console.warn('⚠️  Channel adapter failed, falling back to V1:', error);
      // Fall through to V1 implementation
    }
  }

  // Fallback to V1 service
  console.log('📦 Using legacy V1 service');
  return searchAssetsV1(query, filters);
}

/**
 * Search using the new channel adapter
 */
async function searchWithChannelAdapter(
  query: string, 
  filters?: SimpleSearchFilters
): Promise<SimpleSearchResponse> {
  if (!webChannelAdapter) {
    throw new Error('Channel adapter not initialized');
  }

  // Convert SimpleSearchFilters to WebSearchFilters
  const webFilters: WebSearchFilters = {
    fileType: filters?.fileType,
    assetType: filters?.assetType,
    brand: filters?.brand,
    background: filters?.background,
    layout: filters?.layout,
    showPreferredOnly: filters?.showPreferredOnly
  };

  const webResponse = await webChannelAdapter.search(query, webFilters);

  // Convert WebAsset back to Asset format (they should be compatible)
  const assets = webResponse.assets.map(webAsset => convertWebAssetToAsset(webAsset));

  return {
    assets,
    total: webResponse.total,
    confidence: webResponse.confidence,
    recommendation: webResponse.recommendation
  };
}

/**
 * Convert WebAsset to Asset format (should be 1:1 mapping)
 */
function convertWebAssetToAsset(webAsset: any): Asset {
  // The WebAsset interface was designed to match Asset exactly, so this should be a simple pass-through
  return {
    id: webAsset.id,
    title: webAsset.title,
    displayName: webAsset.displayName,
    description: webAsset.description,
    conciseDescription: webAsset.conciseDescription,
    url: webAsset.url,
    thumbnailUrl: webAsset.thumbnailUrl,
    fileType: webAsset.fileType,
    fileSize: webAsset.fileSize,
    dimensions: webAsset.dimensions,
    tags: webAsset.tags,
    brand: webAsset.brand,
    createdAt: webAsset.createdAt,
    category: webAsset.category,
    assetType: webAsset.assetType,
    metadata: webAsset.metadata
  };
}

/**
 * Get current architecture info (for debugging)
 */
export function getArchitectureInfo() {
  return {
    useChannelAdapter: USE_CHANNEL_ADAPTER,
    channelAdapterInitialized: webChannelAdapter !== null,
    version: 'v2'
  };
}