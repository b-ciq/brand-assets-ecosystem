export interface Asset {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl: string;
  fileType: string;
  dimensions: {
    width: number;
    height: number;
  };
  tags: string[];
  brand: string;
  fileSize?: number;
  metadata?: {
    background?: string;
    color?: string;
    layout?: string;
    size?: string;
    [key: string]: any;
  };
}

export interface SearchFilters {
  brand?: string;
  fileType?: string;
  tags?: string[];
  background?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical' | 'symbol';
}

export interface SearchResponse {
  assets: Asset[];
  total: number;
  page: number;
  hasMore: boolean;
  confidence?: string;
  recommendation?: string;
}

export interface MCPResponse {
  status: string;
  total_found: number;
  assets: Record<string, Record<string, MCPAsset>>;
  colors?: any;
  confidence: string;
  recommendation?: string;
  error?: string;
}

export interface MCPAsset {
  url: string;
  filename: string;
  background: string;
  color: string;
  layout: string;
  type: string;
  size: string;
  tags: string[];
}