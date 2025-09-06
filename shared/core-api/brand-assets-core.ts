/**
 * Brand Assets Core API
 * Main service that coordinates search engine and data sources
 */

import { CoreAsset, CoreSearchResponse, SearchIntent, CoreSearchFilters } from './types';
import { CoreSearchEngine } from './search-engine';
import { AssetDataSource } from './asset-source';

export class BrandAssetsCore {
  private searchEngine: CoreSearchEngine;
  private dataSource: AssetDataSource;

  constructor(dataSource: AssetDataSource) {
    this.searchEngine = new CoreSearchEngine();
    this.dataSource = dataSource;
  }

  /**
   * Main search method - returns structured response with intent and assets
   */
  async search(
    query: string,
    filters: CoreSearchFilters = {}
  ): Promise<CoreSearchResponse> {
    const startTime = Date.now();
    
    try {
      // Classify the user's intent
      const intent = this.searchEngine.classifyIntent(query);
      
      // Get assets from data source with intelligent filtering
      const assets = await this.dataSource.search(query, filters);
      
      // Build response
      const response: CoreSearchResponse = {
        assets,
        total: assets.length,
        intent,
        confidence: intent.confidence,
        metadata: {
          originalQuery: query,
          filtersApplied: filters,
          processingTime: Date.now() - startTime
        }
      };

      return response;
      
    } catch (error) {
      throw new Error(`Core search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a specific asset by ID
   */
  async getAssetById(id: string): Promise<CoreAsset | null> {
    return this.dataSource.getAssetById(id);
  }

  /**
   * Get search suggestions based on partial query
   */
  getSearchSuggestions(partialQuery: string): string[] {
    const query = partialQuery.toLowerCase();
    const suggestions: string[] = [];

    // Add product suggestions
    const products = ['ciq', 'fuzzball', 'warewulf', 'apptainer', 'ascender', 'bridge', 'rlc'];
    for (const product of products) {
      if (product.startsWith(query)) {
        suggestions.push(`${product} logo`);
        suggestions.push(`${product} horizontal logo`);
        suggestions.push(`${product} icon`);
      }
    }

    // Add common search patterns
    if (query.includes('logo')) {
      suggestions.push('horizontal logos', 'vertical logos', 'icon logos');
    }
    
    if (query.includes('dark')) {
      suggestions.push('dark mode logos', 'dark background logos');
    }

    return suggestions.slice(0, 5); // Limit to 5 suggestions
  }

  /**
   * Validate search filters
   */
  validateFilters(filters: CoreSearchFilters): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (filters.background && !['light', 'dark'].includes(filters.background)) {
      errors.push('Invalid background value. Must be "light" or "dark"');
    }

    if (filters.fileType && !['svg', 'png', 'jpg', 'pdf'].includes(filters.fileType.toLowerCase())) {
      errors.push('Invalid file type. Must be svg, png, jpg, or pdf');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// Export factory function for easy initialization
export function createBrandAssetsCore(dataSource: AssetDataSource): BrandAssetsCore {
  return new BrandAssetsCore(dataSource);
}