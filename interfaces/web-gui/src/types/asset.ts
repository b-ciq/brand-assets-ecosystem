export type AssetCategory = 'company-logo' | 'product-logo' | 'document' | 'color-palette' | 'font';
export type AssetType = 'logo' | 'pdf' | 'color' | 'font' | 'icon';

export interface Asset {
  id: string;
  title: string;
  displayName?: string; // Human-readable name like "Fuzzball Horizontal Logo"
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
  category?: AssetCategory; // What type of asset this is
  assetType?: AssetType; // What format/medium the asset is
  metadata?: {
    // Universal mode field - what background the logo is designed for
    backgroundMode?: 'light' | 'dark'; // 'light' = dark logo for light backgrounds, 'dark' = light logo for dark backgrounds
    
    // Company logos (CIQ) specific
    colorVariant?: '1-color' | '2-color';
    
    // Product logos (Fuzzball, etc.) specific  
    variant?: 'horizontal' | 'vertical' | 'symbol';
    
    // Legacy fields (will migrate away from these)
    background?: string; // DEPRECATED: use backgroundMode
    color?: string;
    layout?: string;
    size?: string;
    
    // Universal fields
    isPrimary?: boolean; // True for the recommended default download
    usageContext?: string; // "presentations", "headers", "favicons", etc.
    
    // Future asset types
    colorCode?: string; // For color palette assets
    fontFamily?: string; // For font assets  
    documentType?: 'solution-brief' | 'datasheet' | 'guide'; // For PDF assets
  };
}

export interface SearchFilters {
  query: string;
  fileType?: string;
  assetType?: string;
  brand?: string;
  tags?: string[];
}

export interface SearchResponse {
  assets: Asset[];
  total: number;
  page: number;
  hasMore: boolean;
}