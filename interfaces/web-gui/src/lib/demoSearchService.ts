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
      if (asset.type === 'document') {
        // Handle document assets (PDFs)
        const documentType = asset.document_type === 'brand-guidelines' ? 'Brand Guidelines' : 
          `${product.toUpperCase()} ${asset.document_type?.replace('-', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Document'}`;
        
        assets.push({
          id: `${product}-${assetKey}`,
          title: asset.filename?.replace(/\.[^/.]+$/, "") || "Unknown Document",
          displayName: documentType,
          description: asset.description || asset.content_summary || `${product} ${asset.document_type || 'document'}`,
          url: `https://raw.githubusercontent.com/b-ciq/brand-assets-ecosystem/main/interfaces/web-gui/public${asset.url}`,
          thumbnailUrl: asset.thumbnail_url, // Use thumbnail for documents
          fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'pdf' : 'pdf',
          dimensions: { width: 100, height: 100 },
          tags: asset.tags || [],
          brand: product.toUpperCase(),
          category: 'product-document',
          assetType: 'document',
          metadata: {
            documentType: asset.document_type,
            pages: asset.pages,
            fileSize: asset.file_size,
            usageContext: 'general use'
          }
        });
      } else {
        // Handle logo assets
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
      }
    });
  });
  
  return assets;
}

export async function demoSearchAssets(query: string, showAllVariants: boolean = false, assetType?: string): Promise<DemoSearchResponse> {
  console.log(`🔄 Demo mode search for: "${query}" (showAllVariants: ${showAllVariants})`);
  
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
  } else if (queryLower === '' || ['all', 'logo', 'logos', 'pdf', 'solution', 'brief', 'document', 'documents', 'brand', 'guidelines'].includes(queryLower)) {
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
          queryLower.includes((assetInfo as any).description?.toLowerCase() || '') ||
          queryLower.includes((assetInfo as any).document_type?.toLowerCase() || '') ||
          ((assetInfo as any).tags || []).some((tag: string) => queryLower.includes(tag.toLowerCase())) ||
          ((assetInfo as any).searchable_content || []).some((content: string) => content.toLowerCase().includes(queryLower))
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
  
  // Filter based on showAllVariants setting
  let filteredResults: any = {};
  let filteredTotal = 0;
  
  if (showAllVariants) {
    // Show all variants - no filtering
    filteredResults = { ...results };
    filteredTotal = Object.values(results).reduce((sum: number, productAssets) => 
      sum + Object.keys(productAssets as any).length, 0
    );
  } else {
    // Filter to primary variants only (horizontal layout preferred for logos, always include documents)
    for (const [product, productAssets] of Object.entries(results)) {
      const productResult: any = {};
      
      // Always include documents (they are not variants of each other)
      for (const [assetKey, assetInfo] of Object.entries(productAssets as any)) {
        if ((assetInfo as any).type === 'document') {
          productResult[assetKey] = assetInfo;
          filteredTotal++;
        }
      }
      
      // Find primary logo (horizontal layout preferred)
      let primaryLogoKey = null;
      for (const [assetKey, assetInfo] of Object.entries(productAssets as any)) {
        if ((assetInfo as any).type === 'logo' && (assetInfo as any).layout === 'horizontal') {
          primaryLogoKey = assetKey;
          break;
        }
      }
      
      // Fallback to first logo if no horizontal found
      if (!primaryLogoKey) {
        for (const [assetKey, assetInfo] of Object.entries(productAssets as any)) {
          if ((assetInfo as any).type === 'logo') {
            primaryLogoKey = assetKey;
            break;
          }
        }
      }
      
      if (primaryLogoKey) {
        productResult[primaryLogoKey] = (productAssets as any)[primaryLogoKey];
        filteredTotal++;
      }
      
      if (Object.keys(productResult).length > 0) {
        filteredResults[product] = productResult;
      }
    }
  }
  
  const cliStyleResult = {
    status: 'success',
    total_found: filteredTotal,
    assets: filteredResults,
    confidence: 'medium',
    recommendation: `Found ${filteredTotal} assets matching '${query}' (primary variants)`
  };
  
  let assets = transformAssetData(cliStyleResult);

  // Apply asset type filtering if specified
  if (assetType && assetType !== 'all' && assetType !== '') {
    console.log(`🔽 Demo: Filtering by asset type: ${assetType}`);
    assets = assets.filter(asset => asset.assetType === assetType);
  }

  console.log(`✅ Demo search returned ${assets.length} assets for "${query}"`);

  return {
    assets,
    total: assets.length,
    confidence: cliStyleResult.confidence,
    recommendation: cliStyleResult.recommendation
  };
}