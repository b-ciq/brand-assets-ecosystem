/**
 * Asset Data Source Abstraction
 * Provides unified interface to asset data (MCP server, API, etc.)
 */

import { CoreAsset, CoreSearchResponse, SearchIntent, CoreSearchFilters } from './types';
import { CoreSearchEngine } from './search-engine';

export interface AssetDataSource {
  search(query: string, filters?: CoreSearchFilters): Promise<CoreAsset[]>;
  getAssetById(id: string): Promise<CoreAsset | null>;
}

/**
 * MCP-based asset data source
 */
export class MCPAssetDataSource implements AssetDataSource {
  constructor(
    private mcpClient: any, // The existing MCP client
    private searchEngine: CoreSearchEngine
  ) {}

  async search(query: string, filters: CoreSearchFilters = {}): Promise<CoreAsset[]> {
    try {
      // STEP 1: Use centralized intelligence to resolve products
      const resolvedProducts = this.searchEngine.resolveProductsFromQuery(query);
      const intent = this.searchEngine.classifyIntent(query);
      
      let mcpResponse;
      
      if (resolvedProducts.length > 0) {
        // STEP 2: For specific products, fetch each product's data
        mcpResponse = { assets: {} };
        for (const productId of resolvedProducts) {
          try {
            const productResponse = await this.mcpClient.searchAssets(productId);
            if (productResponse.assets) {
              Object.assign(mcpResponse.assets, productResponse.assets);
            }
          } catch (error) {
            console.warn(`Failed to fetch data for product ${productId}:`, error);
          }
        }
      } else {
        // STEP 3: For general searches, get everything
        mcpResponse = await this.mcpClient.searchAssets(query);
      }
      
      // Transform MCP response to CoreAsset format
      const coreAssets = this.transformMCPResponse(mcpResponse, intent);
      
      // Apply intelligent filtering based on intent
      const filteredAssets = this.searchEngine.filterAssetsByIntent(
        coreAssets,
        intent,
        filters
      );
      
      // Apply smart defaults (but don't force preferred for specific product searches)
      const shouldShowPreferred = intent.type === 'general_search' || !query.trim();
      const finalAssets = this.searchEngine.applySmartDefaults(
        filteredAssets,
        intent,
        shouldShowPreferred
      );
      
      return finalAssets;
      
    } catch (error) {
      throw new Error(`Asset search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAssetById(id: string): Promise<CoreAsset | null> {
    // Implementation for getting specific asset
    // This would use the MCP client to fetch by ID
    throw new Error('Not implemented yet');
  }

  /**
   * Transform MCP response to CoreAsset format
   * This preserves the existing transformation logic but in the core layer
   */
  private transformMCPResponse(mcpResponse: any, intent: SearchIntent): CoreAsset[] {
    const assets: CoreAsset[] = [];

    if (!mcpResponse.assets) return assets;

    // Flatten the nested structure from MCP
    Object.entries(mcpResponse.assets).forEach(([product, productAssets]: [string, any]) => {
      Object.entries(productAssets).forEach(([assetKey, asset]: [string, any]) => {
        // Create light mode version
        assets.push({
          id: `${product}-${asset.layout}-light`,
          title: asset.name || asset.filename?.replace(/\.[^/.]+$/, "") || "Unknown Asset",
          url: this.normalizeAssetUrl(asset.url),
          thumbnailUrl: this.normalizeAssetUrl(asset.url),
          fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'unknown' : 'unknown',
          dimensions: { width: 100, height: 100 },
          tags: asset.tags || [],
          brand: product.toUpperCase(),
          category: product === 'ciq' ? 'company-logo' : 'product-logo',
          description: `${product} ${asset.type} - ${asset.layout}`,
          metadata: {
            layout: asset.layout,
            background: 'light',
            color: asset.color,
            isPrimary: asset.layout === 'horizontal' && product !== 'ciq', // Product horizontals are primary
            usageContext: 'general use'
          }
        });

        // Create dark mode version
        assets.push({
          id: `${product}-${asset.layout}-dark`,
          title: asset.name || asset.filename?.replace(/\.[^/.]+$/, "") || "Unknown Asset",
          url: this.normalizeAssetUrl(asset.url),
          thumbnailUrl: this.normalizeAssetUrl(asset.url),
          fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'unknown' : 'unknown',
          dimensions: { width: 100, height: 100 },
          tags: asset.tags || [],
          brand: product.toUpperCase(),
          category: product === 'ciq' ? 'company-logo' : 'product-logo',
          description: `${product} ${asset.type} - ${asset.layout} (dark mode)`,
          metadata: {
            layout: asset.layout,
            background: 'dark',
            color: 'white',
            isPrimary: false, // Dark mode versions are not primary by default
            usageContext: 'dark themes'
          }
        });
      });
    });

    // Add CIQ company logo (always available for general searches)
    // Only exclude it for specific product searches of other brands
    const shouldIncludeCIQ = intent.type !== 'specific_product' || 
                           intent.product === 'ciq' || 
                           !intent.product;
    
    // DEBUG: Log the decision making
    console.log('🔍 CIQ Decision:', {
      query: intent.product,
      intentType: intent.type,
      shouldInclude: shouldIncludeCIQ,
      reasons: {
        notSpecificProduct: intent.type !== 'specific_product',
        isCIQRequest: intent.product === 'ciq',
        noProduct: !intent.product
      }
    });
                           
    if (shouldIncludeCIQ) {
      assets.push({
        id: 'ciq-onecolor-light',
        title: 'CIQ_logo_1clr_lightmode',
        url: '/assets/global/CIQ_logos/CIQ_logo_1clr_lightmode.svg',
        thumbnailUrl: '/assets/global/CIQ_logos/CIQ_logo_1clr_lightmode.svg',
        fileType: 'svg',
        dimensions: { width: 100, height: 100 },
        tags: ['company', 'brand', 'primary'],
        brand: 'CIQ',
        category: 'company-logo',
        description: 'CIQ company logo - primary brand mark',
        metadata: {
          layout: 'onecolor',
          background: 'light',
          color: 'black',
          isPrimary: true, // This is the primary CIQ logo
          usageContext: 'primary branding'
        }
      });
    }

    return assets;
  }

  private normalizeAssetUrl(url: string): string {
    // Handle localhost URLs and other normalization
    if (url.includes('localhost:3000')) {
      return url.replace('localhost:3000', 'localhost:3002');
    }
    return url;
  }
}