/**
 * Core Search Engine - Shared Business Logic
 * Intent classification and asset search logic used by all channels
 */

import { CoreAsset, SearchIntent, CoreSearchFilters, CoreSearchResponse } from './types';

export class CoreSearchEngine {
  private productPatterns = {
    'ciq': ['ciq', 'company', 'brand', 'main'],
    'fuzzball': ['fuzzball', 'fuzz ball', 'fuzz', 'fuz', 'workload', 'hpc'],
    'warewulf': ['warewulf', 'ware', 'war', 'cluster', 'provisioning'],
    'apptainer': ['apptainer', 'app', 'container', 'scientific'],
    'ascender': ['ascender', 'asc', 'automation', 'ansible'],
    'bridge': ['bridge', 'bri', 'centos', 'migration'],
    'support': ['support', 'sup', 'ciq support'],
    'rlc-ai': ['rlc-ai', 'rlc ai', 'rocky linux ai'],
    'rlc-hardened': ['rlc-hardened', 'rlc hardened', 'rocky linux hardened', 'rlc', 'rocky linux commercial', 'rock', 'rocky', 'rocky linux', 'roc'],
    'rlc-lts': ['rlc-lts', 'rlc lts', 'rocky linux lts', 'long term support', 'lts']
  };

  private intentPatterns = {
    'specific_product': [
      /^(get|find|show)\s+(me\s+)?the\s+(\w+)\s+(logo|icon)/i,
      /^(\w+)\s+(logo|icon|assets?)$/i,
      /^(i\s+need|need)\s+(a|the)?\s*(\w+)\s+(logo|icon)/i
    ],
    'browse_category': [
      /^(all|show\s+all)\s+(\w+)/i,
      /^everything\s+(for\s+)?(\w+)/i,
      /^complete\s+(\w+)\s+(set|package|collection)/i
    ],
    'color_query': [
      /colors?|palette|design\s+system/i
    ]
  };

  /**
   * CENTRALIZED PRODUCT RESOLUTION - Single source of truth
   * Resolves any user input to the correct product IDs
   * This is the authoritative method for ALL search intelligence
   */
  resolveProductsFromQuery(query: string): string[] {
    const normalizedQuery = query.toLowerCase().trim();
    const matches: { productId: string, pattern: string, length: number }[] = [];
    
    // Find all matches with their pattern lengths
    for (const [productId, patterns] of Object.entries(this.productPatterns)) {
      for (const pattern of patterns) {
        const patternLower = pattern.toLowerCase();
        if (normalizedQuery.includes(patternLower)) {
          matches.push({ 
            productId, 
            pattern: patternLower, 
            length: patternLower.length 
          });
        }
      }
    }
    
    if (matches.length === 0) return [];
    
    // If multiple matches, prefer the longest/most specific patterns
    const maxLength = Math.max(...matches.map(m => m.length));
    const bestMatches = matches.filter(m => m.length === maxLength);
    
    // Return unique product IDs from best matches
    return [...new Set(bestMatches.map(m => m.productId))];
  }

  /**
   * Classify user intent from search query
   */
  classifyIntent(query: string): SearchIntent {
    const queryLower = query.toLowerCase().trim();
    
    // Use centralized product resolution
    const resolvedProducts = this.resolveProductsFromQuery(query);
    const detectedProduct = resolvedProducts.length > 0 ? resolvedProducts[0] : this.detectProduct(queryLower);
    
    // DEBUG: Log product resolution
    console.log('🎯 Intent Debug:', {
      query,
      resolvedProducts,
      detectedProduct,
      fallbackDetected: this.detectProduct(queryLower)
    });
    
    // Detect intent type
    let intentType: SearchIntent['type'] = 'general_search';
    let confidence: SearchIntent['confidence'] = 'low';

    // Check for color queries first
    if (this.intentPatterns.color_query.some(pattern => pattern.test(queryLower))) {
      intentType = 'color_query';
      confidence = 'high';
    }
    // Check for specific product patterns
    else if (this.intentPatterns.specific_product.some(pattern => pattern.test(queryLower))) {
      intentType = detectedProduct ? 'specific_product' : 'specific_asset';
      confidence = detectedProduct ? 'high' : 'medium';
    }
    // Check for browse category patterns
    else if (this.intentPatterns.browse_category.some(pattern => pattern.test(queryLower))) {
      intentType = 'browse_category';
      confidence = 'medium';
    }
    // Single word product name
    else if (detectedProduct && queryLower.split(' ').length <= 2) {
      intentType = 'specific_product';
      confidence = 'medium';
    }

    // Extract parameters
    const parameters = this.extractParameters(queryLower);

    return {
      type: intentType,
      confidence,
      product: detectedProduct,
      parameters
    };
  }

  /**
   * Detect product from query string
   */
  private detectProduct(query: string): string | undefined {
    let bestMatch: string | undefined;
    let bestScore = 0;

    for (const [product, patterns] of Object.entries(this.productPatterns)) {
      for (const pattern of patterns) {
        if (query.includes(pattern)) {
          const score = pattern.length; // Longer patterns = more specific
          if (score > bestScore) {
            bestScore = score;
            bestMatch = product;
          }
        }
      }
    }

    return bestMatch;
  }

  /**
   * Extract parameters from query
   */
  private extractParameters(query: string): SearchIntent['parameters'] {
    const parameters: SearchIntent['parameters'] = {};

    // Extract layout
    if (/horizontal|wide|header|lockup/.test(query)) {
      parameters.layout = 'horizontal';
    } else if (/vertical|tall|stacked/.test(query)) {
      parameters.layout = 'vertical';
    } else if (/icon|symbol|favicon/.test(query)) {
      parameters.layout = 'symbol';
    }

    // Extract background
    if (/dark|black|dark\s+(mode|theme|background)/.test(query)) {
      parameters.background = 'dark';
    } else if (/light|white|light\s+(mode|theme|background)/.test(query)) {
      parameters.background = 'light';
    }

    // Extract file type
    if (/svg|vector/.test(query)) {
      parameters.fileType = 'svg';
    } else if (/png|raster|bitmap/.test(query)) {
      parameters.fileType = 'png';
    } else if (/pdf|document/.test(query)) {
      parameters.fileType = 'pdf';
    }

    return parameters;
  }

  /**
   * Filter assets based on intent and filters
   */
  filterAssetsByIntent(
    assets: CoreAsset[],
    intent: SearchIntent,
    filters: CoreSearchFilters
  ): CoreAsset[] {
    let filteredAssets = [...assets];

    // Intent-based filtering
    if (intent.type === 'specific_product' && intent.product) {
      // For specific product queries, ONLY return that product's assets
      filteredAssets = filteredAssets.filter(asset => 
        asset.brand.toLowerCase() === intent.product!.toLowerCase()
      );
    }

    // Apply explicit filters
    if (filters.brand) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.brand.toLowerCase() === filters.brand!.toLowerCase()
      );
    }

    if (filters.fileType) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.fileType.toLowerCase() === filters.fileType!.toLowerCase()
      );
    }

    if (filters.background) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.metadata.background === filters.background
      );
    }

    if (filters.layout) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.metadata.layout === filters.layout
      );
    }

    if (filters.category) {
      filteredAssets = filteredAssets.filter(asset => 
        asset.category === filters.category
      );
    }

    return filteredAssets;
  }

  /**
   * Apply smart defaults based on intent
   */
  applySmartDefaults(
    assets: CoreAsset[],
    intent: SearchIntent,
    showPreferredOnly: boolean = false
  ): CoreAsset[] {
    let processedAssets = [...assets];

    // For general searches, show preferred variants
    if (intent.type === 'general_search' && showPreferredOnly) {
      processedAssets = processedAssets.filter(asset => asset.metadata.isPrimary);
    }

    // For specific product searches, show all variants of that product
    // (don't filter to preferred only)

    return processedAssets;
  }
}