import { BrandAssetsMCP } from './brandAssetsMCP';
import { Asset } from '@/types/asset';

// Initialize MCP client with development server paths
// Can switch between local and FastMCP cloud endpoint for testing
const USE_CLOUD_ENDPOINT = process.env.USE_CLOUD_ENDPOINT === 'true' || 
                          (process.env.NODE_ENV === 'production' && process.env.FASTMCP_API_KEY);

const mcp = new BrandAssetsMCP({
  mcpServerPath: '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/core-mcp-dev/server.py',
  cliWrapperPath: '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/core-mcp-dev/cli_wrapper.py',
  cloudEndpoint: 'https://quantic-asset-server.fastmcp.app/mcp',
  useCloudEndpoint: USE_CLOUD_ENDPOINT
});

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
}

export async function searchAssets(query: string, filters?: SimpleSearchFilters): Promise<SimpleSearchResponse> {
  try {
    const searchQuery = query || '';
    const mcpResponse = await mcp.searchAssets(searchQuery);
    const transformedData = BrandAssetsMCP.transformMCPResponse(mcpResponse);
    
    let filteredAssets = transformedData.assets;

    // Apply filters if provided
    if (filters) {
      if (filters.fileType) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.fileType.toLowerCase() === filters.fileType!.toLowerCase()
        );
      }
      
      if (filters.assetType) {
        filteredAssets = filteredAssets.filter(asset => {
          // Check if the asset type matches
          // For documents, we need to check if it's specifically a solution brief
          if (filters.assetType === 'document') {
            return asset.description?.toLowerCase().includes('solution') || 
                   asset.conciseDescription?.toLowerCase().includes('solution') ||
                   asset.tags?.some(tag => tag.toLowerCase().includes('solution'));
          }
          // For logos, check if it's a logo type
          if (filters.assetType === 'logo') {
            return asset.description?.toLowerCase().includes('logo') ||
                   asset.conciseDescription?.toLowerCase().includes('logo') ||
                   asset.tags?.some(tag => tag.toLowerCase().includes('logo')) ||
                   asset.metadata?.layout; // Logos typically have layout metadata
          }
          return false;
        });
      }
      
      if (filters.brand) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.brand?.toLowerCase() === filters.brand!.toLowerCase()
        );
      }
      
      if (filters.background) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.metadata?.background === filters.background
        );
      }
      
      if (filters.layout) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.metadata?.layout === filters.layout
        );
      }
    }

    return {
      assets: filteredAssets,
      total: filteredAssets.length,
      confidence: transformedData.confidence,
      recommendation: transformedData.recommendation
    };
  } catch (error) {
    throw new Error(`Brand assets search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}