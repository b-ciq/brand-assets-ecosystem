import { Asset } from '@/types/asset';
import { spawn } from 'child_process';
import path from 'path';

// Path to unified CLI search
const CLI_WRAPPER_PATH = path.resolve(process.cwd(), '../mcp-server/cli_wrapper.py');

export interface SimpleSearchResponse {
  assets: Asset[];
  total: number;
  confidence?: string;
  recommendation?: string;
}

export interface SimpleSearchFilters {
  fileType?: string;
  assetType?: string;
  brand?: string;
  background?: 'light' | 'dark';
  layout?: 'horizontal' | 'vertical' | 'symbol';
  showPreferredOnly?: boolean; // Default: true - only show preferred variants
}

/**
 * Call unified CLI search directly - no more complex transformations
 */
async function callUnifiedCLI(query: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const python = spawn('python3', [CLI_WRAPPER_PATH, query]);
    let output = '';
    let errorOutput = '';

    python.stdout.on('data', (data) => {
      output += data.toString();
    });

    python.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    python.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`CLI search failed: ${errorOutput}`));
        return;
      }

      try {
        const lines = output.trim().split('\n');
        const jsonOutput = lines[lines.length - 1];
        const result = JSON.parse(jsonOutput);
        resolve(result);
      } catch (parseError) {
        reject(new Error(`Failed to parse CLI response: ${parseError}\nOutput: ${output}`));
      }
    });

    python.on('error', (error) => {
      reject(new Error(`Failed to start CLI: ${error.message}`));
    });
  });
}

/**
 * Transform CLI result to Web API format - simplified since CLI now handles primary variant filtering
 */
function transformCLIResult(cliResult: any, showAllVariants: boolean = false): Asset[] {
  const assets: Asset[] = [];
  
  if (!cliResult.assets) return assets;
  
  // Transform each product's assets - CLI backend already filtered to primary variants
  Object.entries(cliResult.assets).forEach(([product, productAssets]: [string, any]) => {
    Object.entries(productAssets).forEach(([assetKey, asset]: [string, any]) => {
      // Create primary asset (light mode)
      assets.push({
        id: `${product}-${asset.layout}-light`,
        title: asset.filename?.replace(/\.[^/.]+$/, "") || "Unknown Asset",
        displayName: `${product.toUpperCase()} Logo`,
        description: `${product} ${asset.type} - ${asset.layout}`,
        url: asset.url, // Use URL as-is (relative path)
        thumbnailUrl: asset.url,
        fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'svg' : 'svg',
        dimensions: { width: 100, height: 100 },
        tags: asset.tags || [],
        brand: product.toUpperCase(),
        category: 'product-logo',
        assetType: 'logo',
        metadata: {
          backgroundMode: 'light',
          variant: asset.layout,
          isPrimary: true, // CLI backend returns primary variants
          usageContext: 'general use'
        }
      });
      
      // Add dark mode variant if requested (rare case)
      if (showAllVariants) {
        assets.push({
          id: `${product}-${asset.layout}-dark`,
          title: `${asset.filename?.replace(/\.[^/.]+$/, "") || "Unknown Asset"} (Dark)`,
          displayName: `${product.toUpperCase()} Logo (Dark)`,
          description: `${product} ${asset.type} - ${asset.layout} (dark mode)`,
          url: asset.url,
          thumbnailUrl: asset.url,
          fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'svg' : 'svg',
          dimensions: { width: 100, height: 100 },
          tags: [...(asset.tags || []), 'dark-mode'],
          brand: product.toUpperCase(),
          category: 'product-logo',
          assetType: 'logo',
          metadata: {
            backgroundMode: 'dark',
            variant: asset.layout,
            isPrimary: false,
            usageContext: 'dark themes'
          }
        });
      }
    });
  });
  
  return assets;
}

export async function searchAssets(query: string, filters?: SimpleSearchFilters): Promise<SimpleSearchResponse> {
  try {
    console.log(`🔄 Calling unified CLI search for: "${query}"`);
    
    // Call unified CLI search directly
    const cliResult = await callUnifiedCLI(query || '');
    
    // Transform CLI result to web format - CLI already returns primary variants
    const showAllVariants = filters?.showPreferredOnly === false;
    let assets = transformCLIResult(cliResult, showAllVariants);
    
    // Apply additional filters if specified
    if (filters) {
      if (filters.fileType) {
        assets = assets.filter(asset => asset.fileType === filters.fileType);
      }
      if (filters.assetType) {
        assets = assets.filter(asset => asset.assetType === filters.assetType);
      }
      if (filters.brand) {
        assets = assets.filter(asset => asset.brand?.toLowerCase() === filters.brand.toLowerCase());
      }
      if (filters.background) {
        assets = assets.filter(asset => asset.metadata?.backgroundMode === filters.background);
      }
      if (filters.layout) {
        assets = assets.filter(asset => asset.metadata?.variant === filters.layout);
      }
    }

    console.log(`✅ Unified CLI returned ${assets.length} assets for "${query}"`);

    return {
      assets,
      total: assets.length,
      confidence: cliResult.confidence || 'medium',
      recommendation: cliResult.recommendation || `Found ${assets.length} assets`
    };

  } catch (error) {
    console.error('Unified CLI search error:', error);
    
    return {
      assets: [],
      total: 0,
      confidence: 'none',
      recommendation: 'Search failed. Please try again.'
    };
  }
}