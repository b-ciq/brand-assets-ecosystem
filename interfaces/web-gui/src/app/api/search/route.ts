import { NextRequest, NextResponse } from 'next/server';
import { searchAssets, SimpleSearchFilters } from '@/lib/brandAssetsService';

// Configure for static export in demo mode
export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';
  const fileType = searchParams.get('fileType') || undefined;
  const assetType = searchParams.get('assetType') || undefined;
  const brand = searchParams.get('brand') || undefined;
  const background = searchParams.get('background') as 'light' | 'dark' | undefined;
  const layout = searchParams.get('layout') as 'horizontal' | 'vertical' | 'symbol' | undefined;
  const showPreferredOnly = searchParams.get('showPreferredOnly') !== 'false'; // Default: true
  const showAllVariants = searchParams.get('showAllVariants') === 'true'; // Default: false
  const page = parseInt(searchParams.get('page') || '1');
  // When showing full inventory, use a much higher limit to show all assets
  const defaultLimit = showAllVariants ? '200' : '20';
  const limit = parseInt(searchParams.get('limit') || defaultLimit);

  try {
    // Build filters object
    const filters: SimpleSearchFilters = {};
    if (fileType) filters.fileType = fileType;
    if (assetType) filters.assetType = assetType;
    if (brand) filters.brand = brand;
    if (background) filters.background = background;
    if (layout) filters.layout = layout;
    filters.showPreferredOnly = showPreferredOnly;

    // Search using the service
    const searchQuery = query || '';
    // Add showAllVariants to filters if needed
    if (showAllVariants) {
      filters.showAllVariants = true;
    }
    const response = await searchAssets(searchQuery, Object.keys(filters).length > 0 ? filters : undefined);
    
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
      recommendation: response.recommendation
    };

    return NextResponse.json(paginatedResponse);
  } catch (error) {
    console.error('Brand Assets search error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to search brand assets',
        details: error instanceof Error ? error.message : 'Unknown error',
        suggestion: 'Try queries like "CIQ logo", "Fuzzball assets", or "brand colors"'
      },
      { status: 500 }
    );
  }
}

// TODO: Implement your MCP integration here
// Example structure for when you're ready to integrate your brand asset MCP:
/*
async function searchAssetsViaMCP(query: string, filters: any): Promise<Asset[]> {
  // Initialize your MCP client/connection
  const mcpClient = new YourBrandAssetMCP();
  
  // Call your MCP search method
  const results = await mcpClient.search({
    query,
    fileType: filters.fileType,
    // other filters...
  });
  
  // Transform MCP results to Asset interface
  return results.map(result => ({
    id: result.id,
    title: result.name || result.title,
    url: result.downloadUrl || result.url,
    thumbnailUrl: result.thumbnailUrl,
    fileType: result.type || 'unknown',
    fileSize: result.size,
    dimensions: result.dimensions,
    tags: result.tags || [],
    brand: result.brand,
    description: result.description,
    createdAt: result.createdAt
  }));
}
*/