export interface Asset {
  id: string;
  title: string;
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