import { Asset } from '@/types/asset';
import { spawn } from 'child_process';
import path from 'path';
import { demoSearchAssets } from './demoSearchService';

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
  showAllVariants?: boolean; // Default: false - show all variants instead of just primary ones
}

/**
 * Call unified CLI search directly - no more complex transformations
 */
async function callUnifiedCLI(query: string, showAllVariants: boolean = false): Promise<any> {
  return new Promise((resolve, reject) => {
    const args = [CLI_WRAPPER_PATH, query];
    if (showAllVariants) {
      args.push('--show-all-variants');
    }
    const python = spawn('python3', args);
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
      if (asset.type === 'document') {
        // Handle PDF documents
        assets.push({
          id: `${product}-${assetKey}`,
          title: asset.filename?.replace(/\.[^/.]+$/, "") || "Unknown Document",
          displayName: asset.document_type === 'brand-guidelines' 
            ? 'Brand Guidelines'
            : `${product.toUpperCase()} ${asset.document_type?.replace('-', ' ')?.replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Document'}`,
          description: asset.description || asset.content_summary || `${product} ${asset.document_type || 'document'}`,
          url: asset.url,
          thumbnailUrl: asset.thumbnail_url || asset.url,
          fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'pdf' : 'pdf',
          dimensions: { width: 300, height: 400 }, // PDF thumbnail size
          tags: asset.tags || [],
          brand: product === 'general' ? 'CIQ' : product.toUpperCase(),
          category: asset.document_type === 'brand-guidelines' ? 'brand-document' : 'product-document',
          assetType: 'document',
          metadata: {
            documentType: asset.document_type,
            pages: asset.pages || 1,
            fileSize: asset.file_size,
            isPrimary: true,
            usageContext: asset.document_type === 'brand-guidelines' ? 'brand guidelines' : 'product information'
          }
        });
      } else {
        // Handle logo assets - don't create artificial light/dark variants
        assets.push({
          id: `${product}-${asset.layout}`,
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
            variant: asset.layout,
            isPrimary: true, // CLI backend returns primary variants
            usageContext: 'general use'
          }
        });
      }
    });
  });
  
  return assets;
}

export async function searchAssets(query: string, filters?: SimpleSearchFilters): Promise<SimpleSearchResponse> {
  // Check if we're in demo mode
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true' || process.env.DEMO_MODE === 'true';
  
  if (isDemoMode) {
    console.log(`🎭 Using demo mode search for: "${query}"`);
    const demoResult = await demoSearchAssets(query || '');
    return {
      assets: demoResult.assets,
      total: demoResult.total,
      confidence: demoResult.confidence,
      recommendation: demoResult.recommendation
    };
  }
  
  try {
    console.log(`🔄 Calling unified CLI search for: "${query}"`);
    
    // Call unified CLI search directly
    const showAllVariants = filters?.showAllVariants === true;
    const cliResult = await callUnifiedCLI(query || '', showAllVariants);
    
    // Transform CLI result to web format
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
        assets = assets.filter(asset => asset.brand?.toLowerCase() === filters.brand?.toLowerCase());
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