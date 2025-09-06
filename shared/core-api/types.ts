/**
 * Core API Types for Brand Assets Multi-Channel System
 * Shared across all UI channels (MCP, Web, Slack)
 */

// Core asset data structure
export interface CoreAsset {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  fileType: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  tags: string[];
  brand: string;
  category: 'product-logo' | 'company-logo' | 'document';
  description?: string;
  metadata: {
    layout?: 'horizontal' | 'vertical' | 'symbol' | 'onecolor' | 'twocolor' | 'green';
    background?: 'light' | 'dark';
    color?: string;
    isPrimary?: boolean;
    usageContext?: string;
  };
}

// Search query intent classification
export interface SearchIntent {
  type: 'specific_product' | 'specific_asset' | 'browse_category' | 'general_search' | 'color_query';
  confidence: 'high' | 'medium' | 'low';
  product?: string;
  assetType?: string;
  parameters: {
    layout?: string;
    background?: string;
    fileType?: string;
  };
}

// Core search filters
export interface CoreSearchFilters {
  query?: string;
  brand?: string;
  fileType?: string;
  assetType?: string;
  background?: 'light' | 'dark';
  layout?: string;
  category?: string;
}

// Core search response (before channel adaptation)
export interface CoreSearchResponse {
  assets: CoreAsset[];
  total: number;
  intent: SearchIntent;
  confidence: string;
  metadata: {
    originalQuery: string;
    filtersApplied: CoreSearchFilters;
    processingTime?: number;
  };
}

// Channel-specific response types
export type ChannelResponse = MCPChannelResponse | WebChannelResponse | SlackChannelResponse;

export interface MCPChannelResponse {
  type: 'mcp';
  action: 'direct_link' | 'filtered_search' | 'generic_search';
  message: string;
  url: string;
  confidence: string;
}

export interface WebChannelResponse {
  type: 'web';
  assets: CoreAsset[];
  total: number;
  hasMore: boolean;
  filters: CoreSearchFilters;
  intent: SearchIntent;
}

export interface SlackChannelResponse {
  type: 'slack';
  text: string;
  blocks: any[]; // Slack block kit format
  attachments?: any[];
}