import { BrandAssetsMCP } from './brandAssetsMCP';
import { Asset } from '@/types/asset';

const mcp = new BrandAssetsMCP();

export interface SimpleSearchResponse {
  assets: Asset[];
  total: number;
  confidence?: string;
  recommendation?: string;
}

export interface SimpleSearchFilters {
  fileType?: string;
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