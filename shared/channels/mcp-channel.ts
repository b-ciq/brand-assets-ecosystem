/**
 * MCP Channel Adapter
 * Converts core search results into MCP-friendly responses (URLs and actions)
 */

import { 
  CoreSearchResponse, 
  MCPChannelResponse, 
  SearchIntent,
  CoreSearchFilters 
} from '../core-api/types';
import { BrandAssetsCore } from '../core-api';

export class MCPChannelAdapter {
  constructor(
    private core: BrandAssetsCore,
    private baseWebURL: string = 'http://localhost:3002'
  ) {}

  /**
   * Main MCP search method - returns simple URL-based responses
   */
  async search(query: string, filters: CoreSearchFilters = {}): Promise<MCPChannelResponse> {
    try {
      const coreResponse = await this.core.search(query, filters);
      return this.adaptToMCP(coreResponse);
      
    } catch (error) {
      return {
        type: 'mcp',
        action: 'generic_search',
        message: 'Error occurred during search',
        url: this.baseWebURL,
        confidence: 'low'
      };
    }
  }

  /**
   * Convert core response to MCP channel response
   */
  private adaptToMCP(coreResponse: CoreSearchResponse): MCPChannelResponse {
    const { intent, assets } = coreResponse;
    
    // Generate URL based on intent and results
    const hasResults = assets.length > 0;
    const url = this.generateURL(intent, hasResults);
    const action = this.determineAction(intent, hasResults);
    const message = this.generateMessage(intent, hasResults);

    return {
      type: 'mcp',
      action,
      message,
      url,
      confidence: intent.confidence
    };
  }

  /**
   * Generate appropriate URL based on intent
   */
  private generateURL(intent: SearchIntent, hasResults: boolean): string {
    const params = new URLSearchParams();

    switch (intent.type) {
      case 'specific_product':
        if (intent.product) {
          params.set('query', intent.product);
          if (intent.parameters.layout) {
            params.set('layout', intent.parameters.layout);
          }
          if (intent.parameters.background) {
            params.set('background', intent.parameters.background);
          }
          if (intent.parameters.fileType) {
            params.set('fileType', intent.parameters.fileType);
          }
          
          // If very specific (layout + background), try to open modal directly
          if (intent.confidence === 'high' && intent.parameters.layout && intent.parameters.background) {
            params.set('modal', `${intent.product}-${intent.parameters.layout}-${intent.parameters.background}`);
          }
          
          return `${this.baseWebURL}/?${params.toString()}`;
        }
        break;

      case 'specific_asset':
        if (intent.parameters.layout) {
          params.set('assetType', 'logo');
          params.set('layout', intent.parameters.layout);
        }
        return `${this.baseWebURL}/?${params.toString()}`;

      case 'browse_category':
        if (intent.product) {
          params.set('query', intent.product);
        }
        return `${this.baseWebURL}/?${params.toString()}`;

      case 'color_query':
        params.set('colors', 'true');
        return `${this.baseWebURL}/?${params.toString()}`;

      default:
        // General search - use any detected parameters
        if (intent.product) {
          params.set('query', intent.product);
        }
        return `${this.baseWebURL}/?${params.toString()}`;
    }

    return this.baseWebURL;
  }

  /**
   * Determine MCP action type
   */
  private determineAction(intent: SearchIntent, hasResults: boolean): MCPChannelResponse['action'] {
    if (intent.confidence === 'high' && intent.type === 'specific_product') {
      return 'direct_link';
    }
    
    if (intent.confidence === 'medium' && hasResults) {
      return 'filtered_search';
    }
    
    return 'generic_search';
  }

  /**
   * Generate user-friendly message
   */
  private generateMessage(intent: SearchIntent, hasResults: boolean): string {
    switch (intent.type) {
      case 'specific_product':
        if (intent.product) {
          return `Here's your ${intent.product.toUpperCase()} ${intent.parameters.layout || 'logo'}:`;
        }
        return "Here's your asset:";

      case 'specific_asset':
        return `Here are ${intent.parameters.layout || 'logo'} options:`;

      case 'browse_category':
        if (intent.product) {
          return `Browse all ${intent.product.toUpperCase()} assets:`;
        }
        return "Browse assets:";

      case 'color_query':
        return "Here's the CIQ color palette:";

      default:
        return hasResults ? "Here are your search results:" : "Search results:";
    }
  }

  /**
   * Handle color queries (separate from asset queries)
   */
  async searchColors(query: string): Promise<MCPChannelResponse> {
    // For now, return a simple response
    // This could be expanded to use the core API for color data
    return {
      type: 'mcp',
      action: 'direct_link',
      message: "Here's the CIQ color palette:",
      url: `${this.baseWebURL}/?colors=true`,
      confidence: 'high'
    };
  }
}