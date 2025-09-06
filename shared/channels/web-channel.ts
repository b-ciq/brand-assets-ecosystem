/**
 * Web Channel Adapter
 * Converts core search results into the format expected by the web GUI
 */

import { 
  CoreSearchResponse, 
  CoreAsset,
  SearchIntent,
  CoreSearchFilters 
} from '../core-api/types';
import { BrandAssetsCore } from '../core-api';

// Import web GUI types (these would be imported from the web GUI package)
export interface WebAsset {
  id: string;
  title: string;
  displayName?: string;
  description?: string;
  conciseDescription?: string;
  url: string;
  thumbnailUrl?: string;
  fileType: string;
  fileSize?: number;
  dimensions?: {
    width: number;
    height: number;
  };
  tags?: string[];
  brand?: string;
  createdAt?: string;
  category?: 'company-logo' | 'product-logo' | 'document' | 'color-palette' | 'font';
  assetType?: 'logo' | 'pdf' | 'color' | 'font' | 'icon';
  metadata?: {
    backgroundMode?: 'light' | 'dark';
    colorVariant?: '1-color' | '2-color';
    variant?: 'horizontal' | 'vertical' | 'symbol';
    background?: string; // Legacy
    color?: string; // Legacy
    layout?: string; // Legacy
    size?: string; // Legacy
    isPrimary?: boolean;
    usageContext?: string;
    colorCode?: string;
    fontFamily?: string;
    documentType?: 'solution-brief' | 'datasheet' | 'guide';
  };
}

export interface WebSearchFilters {
  fileType?: string;
  assetType?: string;
  brand?: string;
  background?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical' | 'symbol';
  showPreferredOnly?: boolean;
}

export interface WebChannelResponse {
  assets: WebAsset[];
  total: number;
  confidence?: string;
  recommendation?: string;
}

export class WebChannelAdapter {
  constructor(
    private core: BrandAssetsCore
  ) {}

  /**
   * Main web search method - returns web GUI compatible response
   */
  async search(query: string, filters: WebSearchFilters = {}): Promise<WebChannelResponse> {
    try {
      // Convert web filters to core filters
      const coreFilters: CoreSearchFilters = {
        fileType: filters.fileType,
        background: filters.background,
        layout: filters.layout
      };

      const coreResponse = await this.core.search(query, coreFilters);
      return this.adaptToWeb(coreResponse, filters);
      
    } catch (error) {
      throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert core response to web channel response
   */
  private adaptToWeb(coreResponse: CoreSearchResponse, filters: WebSearchFilters): WebChannelResponse {
    const { intent, assets } = coreResponse;
    
    // Transform core assets to web assets
    let webAssets = assets.map(asset => this.transformCoreAssetToWeb(asset));

    // Apply web-specific filtering
    webAssets = this.applyWebFilters(webAssets, filters, intent);

    return {
      assets: webAssets,
      total: webAssets.length,
      confidence: intent.confidence,
      recommendation: this.generateWebRecommendation(intent, webAssets.length)
    };
  }

  /**
   * Transform a CoreAsset to WebAsset format
   */
  private transformCoreAssetToWeb(coreAsset: CoreAsset): WebAsset {
    const webAsset: WebAsset = {
      id: coreAsset.id,
      title: coreAsset.title,
      description: coreAsset.description,
      url: this.normalizeAssetUrl(coreAsset.url),
      thumbnailUrl: this.normalizeAssetUrl(coreAsset.thumbnailUrl),
      fileType: coreAsset.fileType,
      dimensions: coreAsset.dimensions,
      tags: coreAsset.tags,
      brand: coreAsset.brand,
      category: coreAsset.category as any, // Type assertion for category mapping
    };

    // Transform metadata
    if (coreAsset.metadata) {
      webAsset.metadata = {
        // Map new backgroundMode from legacy background
        backgroundMode: coreAsset.metadata.background as 'light' | 'dark',
        
        // Map layout to variant for product logos
        variant: coreAsset.metadata.layout as 'horizontal' | 'vertical' | 'symbol',
        
        // Preserve legacy fields for backward compatibility
        background: coreAsset.metadata.background,
        color: coreAsset.metadata.color,
        layout: coreAsset.metadata.layout,
        
        // Copy other fields
        isPrimary: coreAsset.metadata.isPrimary,
        usageContext: coreAsset.metadata.usageContext
      };

      // Special handling for CIQ company logos
      if (coreAsset.category === 'company-logo') {
        webAsset.metadata.colorVariant = '1-color'; // Most CIQ logos are 1-color
      }
    }

    // Generate display name
    webAsset.displayName = this.generateDisplayName(coreAsset);

    return webAsset;
  }

  /**
   * Apply web-specific filters (trusting core engine's product boundaries)
   */
  private applyWebFilters(assets: WebAsset[], filters: WebSearchFilters, intent: SearchIntent): WebAsset[] {
    let filteredAssets = [...assets];

    // Apply showPreferredOnly filter ONLY for presentation preferences, not product boundaries
    // Product boundaries are already enforced by the core engine
    const showPreferredOnly = filters.showPreferredOnly !== false;
    
    if (showPreferredOnly) {
      // Only filter for visual presentation - show primary variants
      // DO NOT filter by product - that's already handled by core engine
      filteredAssets = filteredAssets.filter(asset => {
        return asset.metadata?.isPrimary;
      });
    }

    // Apply other filters (maintaining existing logic)
    if (filters.fileType) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.fileType.toLowerCase() === filters.fileType!.toLowerCase()
      );
    }
    
    if (filters.assetType) {
      filteredAssets = filteredAssets.filter(asset => {
        if (filters.assetType === 'document') {
          return asset.description?.toLowerCase().includes('solution') || 
                 asset.tags?.some(tag => tag.toLowerCase().includes('solution'));
        }
        if (filters.assetType === 'logo') {
          return asset.description?.toLowerCase().includes('logo') ||
                 asset.tags?.some(tag => tag.toLowerCase().includes('logo')) ||
                 asset.metadata?.layout;
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

    return filteredAssets;
  }

  /**
   * Generate display name for asset
   */
  private generateDisplayName(asset: CoreAsset): string {
    const brand = asset.brand || 'Unknown';
    const layout = asset.metadata?.layout;
    const background = asset.metadata?.background;

    if (layout && background) {
      const layoutName = layout === 'horizontal' ? 'Horizontal' : 
                        layout === 'vertical' ? 'Vertical' : 
                        layout === 'symbol' ? 'Icon' : layout;
      const modeName = background === 'light' ? 'Logo' : 'Logo (Dark)';
      return `${brand} ${layoutName} ${modeName}`;
    }

    return `${brand} Logo`;
  }

  /**
   * Generate recommendation text based on search intent
   */
  private generateWebRecommendation(intent: SearchIntent, resultCount: number): string | undefined {
    if (resultCount === 0) {
      return "No assets found. Try a different search term.";
    }

    switch (intent.type) {
      case 'specific_product':
        if (intent.product) {
          return `Showing ${intent.product.toUpperCase()} brand assets.`;
        }
        break;
      
      case 'color_query':
        return "Use these colors for consistent brand presentation.";
        
      case 'browse_category':
        return `Browse all available ${intent.product || 'brand'} assets.`;
        
      default:
        if (resultCount > 5) {
          return "Use filters to narrow down results.";
        }
    }
    
    return undefined;
  }

  /**
   * Normalize asset URLs to work with current server
   */
  private normalizeAssetUrl(url: string): string {
    if (!url) return url;
    
    // Detect current server port from window.location or environment
    // For server-side, we need to determine the correct port
    if (typeof window !== 'undefined') {
      // Client-side: use current window location
      const currentPort = window.location.port;
      if (url.includes('localhost:') && currentPort) {
        return url.replace(/localhost:\d+/, `localhost:${currentPort}`);
      }
    } else {
      // Server-side: try to detect from environment or use relative URLs
      if (url.includes('localhost:')) {
        // Convert to relative URL for server-side rendering
        return url.replace(/^https?:\/\/localhost:\d+/, '');
      }
    }
    
    return url;
  }
}