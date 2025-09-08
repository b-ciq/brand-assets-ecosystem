// Demo-mode search service - client-side search using static data
import { Asset } from '@/types/asset';
import assetInventory from '@/data/asset-inventory.json';
import searchPatterns from '@/data/search-patterns.json';

export interface DemoSearchResponse {
  assets: Asset[];
  total: number;
  confidence?: string;
  recommendation?: string;
}

// Client-side implementation of the CLI backend logic
function resolveProductFromQuery(query: string): string | null {
  const queryLower = query.toLowerCase().trim();
  const { product_patterns } = searchPatterns;
  
  // Direct product name match
  if (queryLower in product_patterns) {
    return queryLower;
  }
  
  // Pattern matching
  for (const [product, aliases] of Object.entries(product_patterns)) {
    if (aliases.map(a => a.toLowerCase()).includes(queryLower)) {
      return product;
    }
  }
  
  return null;
}

function transformAssetData(cliStyleResult: any): Asset[] {
  const assets: Asset[] = [];
  
  if (!cliStyleResult.assets) return assets;
  
  Object.entries(cliStyleResult.assets).forEach(([product, productAssets]: [string, any]) => {
    Object.entries(productAssets).forEach(([assetKey, asset]: [string, any]) => {
      assets.push({
        id: `${product}-${asset.layout}-light`,
        title: asset.filename?.replace(/\.[^/.]+$/, "") || "Unknown Asset",
        displayName: `${product.toUpperCase()} Logo`,
        description: `${product} ${asset.type} - ${asset.layout}`,
        url: `https://raw.githubusercontent.com/b-ciq/brand-assets-ecosystem/main/interfaces/web-gui/public${asset.url}`,
        thumbnailUrl: asset.url, // Use relative path for static export
        fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'svg' : 'svg',
        dimensions: { width: 100, height: 100 },
        tags: asset.tags || [],
        brand: product.toUpperCase(),
        category: 'product-logo',
        assetType: 'logo',
        metadata: {
          backgroundMode: 'light',
          variant: asset.layout,
          isPrimary: true,
          usageContext: 'general use'
        }
      });
    });
  });
  
  return assets;
}

export async function demoSearchAssets(query: string): Promise<DemoSearchResponse> {
  console.log(`🔄 Demo mode search for: "${query}"`);
  
  const queryLower = query.toLowerCase().trim();
  let results: any = {};
  let totalFound = 0;
  
  // Resolve query to specific product
  const resolvedProduct = resolveProductFromQuery(query);
  
  if (resolvedProduct) {
    console.log(`🎯 Demo: Resolved '${query}' → '${resolvedProduct}'`);
    if (resolvedProduct in assetInventory.assets) {
      results[resolvedProduct] = (assetInventory.assets as any)[resolvedProduct];
      totalFound = Object.keys((assetInventory.assets as any)[resolvedProduct]).length;
    }
  } else if (queryLower === '' || ['all', 'logo', 'logos'].includes(queryLower)) {
    // Empty query - show all primary assets (like CLI backend)
    console.log(`🔍 Demo: Empty/general search - showing all primary assets`);
    results = { ...assetInventory.assets };
    totalFound = Object.values(assetInventory.assets).reduce((sum, productAssets) => 
      sum + Object.keys(productAssets as any).length, 0
    );
  } else {
    // General search - fallback to keyword matching
    console.log(`🔍 Demo: General search for '${query}'`);
    for (const [product, assets] of Object.entries(assetInventory.assets)) {
      const productMatches: any = {};
      
      for (const [assetKey, assetInfo] of Object.entries(assets as any)) {
        const matches = (
          queryLower.includes(product.toLowerCase()) ||
          queryLower.includes(assetKey.toLowerCase()) ||
          queryLower.includes((assetInfo as any).filename?.toLowerCase() || '') ||
          ((assetInfo as any).tags || []).some((tag: string) => queryLower.includes(tag.toLowerCase()))
        );
        
        if (matches) {
          productMatches[assetKey] = assetInfo;
          totalFound++;
        }
      }
      
      if (Object.keys(productMatches).length > 0) {
        results[product] = productMatches;
      }
    }
  }
  
  // No need to manually add CIQ - it's already in assetInventory.assets
  
  // Filter to primary variants only (horizontal layout preferred)
  const filteredResults: any = {};
  let filteredTotal = 0;
  
  for (const [product, productAssets] of Object.entries(results)) {
    let primaryKey = null;
    
    // Find horizontal layout first
    for (const [assetKey, assetInfo] of Object.entries(productAssets as any)) {
      if ((assetInfo as any).layout === 'horizontal') {
        primaryKey = assetKey;
        break;
      }
    }
    
    // Fallback to first asset
    if (!primaryKey && Object.keys(productAssets as any).length > 0) {
      primaryKey = Object.keys(productAssets as any)[0];
    }
    
    if (primaryKey) {
      filteredResults[product] = {[primaryKey]: (productAssets as any)[primaryKey]};
      filteredTotal++;
    }
  }
  
  const cliStyleResult = {
    status: 'success',
    total_found: filteredTotal,
    assets: filteredResults,
    confidence: 'medium',
    recommendation: `Found ${filteredTotal} assets matching '${query}' (primary variants)`
  };
  
  const assets = transformAssetData(cliStyleResult);
  
  console.log(`✅ Demo search returned ${assets.length} assets for "${query}"`);
  
  return {
    assets,
    total: assets.length,
    confidence: cliStyleResult.confidence,
    recommendation: cliStyleResult.recommendation
  };
}