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
  metadata?: {
    background?: string;
    color?: string;
    layout?: string;
    size?: string;
    variant?: 'horizontal' | 'vertical' | 'symbol';
    isPrimary?: boolean; // True for the recommended default download
    usageContext?: string; // "presentations", "headers", "favicons", etc.
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