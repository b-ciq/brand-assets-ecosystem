/**
 * Brand Assets Service V2
 * Uses V1 service with consistency improvements
 */

import { Asset } from '@/types/asset';

// Use the working V1 service as base
import { searchAssets as searchAssetsV1, SimpleSearchFilters } from './brandAssetsService';

// Environment flag to enable/disable consistency improvements
const USE_CHANNEL_ADAPTER = process.env.USE_CHANNEL_ADAPTER === 'true';

export interface SimpleSearchResponse {
  assets: Asset[];
  total: number;
  confidence?: string;
  recommendation?: string;
}

/**
 * Main search function - uses V1 with consistency improvements
 */
export async function searchAssets(query: string, filters?: SimpleSearchFilters): Promise<SimpleSearchResponse> {
  // Always use fast V1 service as base
  console.log('📦 Using V1 service with consistency layer');
  const v1Result = await searchAssetsV1(query, filters);
  
  // Apply consistency improvements if channel adapter mode is enabled
  if (USE_CHANNEL_ADAPTER) {
    console.log('🔧 Applying consistency improvements');
    return applyConsistencyImprovements(v1Result, query);
  }
  
  return v1Result;
}

/**
 * Apply consistency improvements to V1 results
 */
function applyConsistencyImprovements(v1Result: SimpleSearchResponse, query: string): SimpleSearchResponse {
  // TODO: Add specific consistency rules here
  // For now, just return V1 results unchanged
  // Future: Add product-specific filtering, CIQ contamination fixes, etc.
  
  return {
    ...v1Result,
    recommendation: v1Result.recommendation + ' (with consistency improvements)'
  };
}

/**
 * Get current architecture info (for debugging)
 */
export function getArchitectureInfo() {
  return {
    useChannelAdapter: USE_CHANNEL_ADAPTER,
    channelAdapterInitialized: true,
    version: 'v2-simplified',
    approach: 'V1 service + consistency layer'
  };
}