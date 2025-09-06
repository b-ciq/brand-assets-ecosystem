import { NextRequest, NextResponse } from 'next/server';
import { searchAssets as searchAssetsV2, SimpleSearchFilters, getArchitectureInfo } from '@/lib/brandAssetsService-v2';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';
  const fileType = searchParams.get('fileType') || undefined;
  const assetType = searchParams.get('assetType') || undefined;
  const brand = searchParams.get('brand') || undefined;
  const background = searchParams.get('background') as 'light' | 'dark' | undefined;
  const layout = searchParams.get('layout') as 'horizontal' | 'vertical' | 'symbol' | undefined;
  const showPreferredOnly = searchParams.get('showPreferredOnly') !== 'false'; // Default: true
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');

  // Debug endpoint - return architecture info if requested
  if (searchParams.get('debug') === 'architecture') {
    return NextResponse.json(getArchitectureInfo());
  }

  try {
    // Build filters object
    const filters: SimpleSearchFilters = {};
    if (fileType) filters.fileType = fileType;
    if (assetType) filters.assetType = assetType;
    if (brand) filters.brand = brand;
    if (background) filters.background = background;
    if (layout) filters.layout = layout;
    filters.showPreferredOnly = showPreferredOnly;

    // Search using the V2 service (with automatic fallback to V1)
    const searchQuery = query || '';
    const response = await searchAssetsV2(searchQuery, Object.keys(filters).length > 0 ? filters : undefined);
    
    // Apply pagination to the results
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedAssets = response.assets.slice(startIndex, endIndex);

    const paginatedResponse = {
      assets: paginatedAssets,
      total: response.total,
      page,
      hasMore: endIndex < response.assets.length,
      confidence: response.confidence,
      recommendation: response.recommendation,
      // Add architecture info for debugging
      _debug: {
        architecture: getArchitectureInfo(),
        searchQuery,
        filtersApplied: filters,
        totalBeforePagination: response.assets.length
      }
    };

    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Brand Assets V2 search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search brand assets (V2)',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Try queries like "CIQ logo", "Fuzzball assets", or "brand colors"',
        _debug: {
          architecture: getArchitectureInfo()
        }
      },
      { status: 500 }
    );
  }
}