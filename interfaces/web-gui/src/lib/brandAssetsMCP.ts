import { spawn } from 'child_process';
import path from 'path';
import { getSpecificVariantMetadata, isCIQCompanyLogo, getCIQVariantMetadata } from './productDefaults';

interface MCPAsset {
  url: string;
  filename: string;
  name?: string;
  description?: string;
  background: string;
  color: string;
  layout: string;
  type: string;
  size: string;
  tags: string[];
}

interface MCPResponse {
  status: string;
  total_found: number;
  assets: Record<string, Record<string, MCPAsset>>;
  colors?: any;
  confidence: string;
  recommendation?: string;
  error?: string;
}

interface BrandAssetsMCPConfig {
  mcpServerPath?: string;
  cliWrapperPath?: string;
  cloudEndpoint?: string;
  useCloudEndpoint?: boolean;
}

export class BrandAssetsMCP {
  private mcpPath: string;
  private cliPath: string;
  private cloudEndpoint?: string;
  private useCloudEndpoint: boolean;

  constructor(config: BrandAssetsMCPConfig = {}) {
    // Default to development MCP in monorepo
    this.mcpPath = path.resolve(config.mcpServerPath || 
      '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/interfaces/mcp-server/server.py');
    this.cliPath = path.resolve(config.cliWrapperPath || 
      '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/interfaces/mcp-server/cli_wrapper.py');
    this.cloudEndpoint = config.cloudEndpoint;
    this.useCloudEndpoint = config.useCloudEndpoint || false;
  }

  async searchAssets(query: string): Promise<MCPResponse> {
    // Use cloud endpoint if configured
    if (this.useCloudEndpoint && this.cloudEndpoint) {
      return this.callCloudEndpoint(query);
    }

    // Otherwise use local CLI wrapper
    return new Promise((resolve, reject) => {
      // Use the CLI wrapper
      const python = spawn('python3', [this.cliPath, query]);
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
          reject(new Error(`CLI wrapper failed: ${errorOutput}`));
          return;
        }

        try {
          // Parse the JSON output
          const lines = output.trim().split('\n');
          const jsonOutput = lines[lines.length - 1];
          const result = JSON.parse(jsonOutput);
          resolve(result);
        } catch (parseError) {
          reject(new Error(`Failed to parse CLI response: ${parseError}\nOutput: ${output}`));
        }
      });

      python.on('error', (error) => {
        reject(new Error(`Failed to start CLI wrapper: ${error.message}`));
      });
    });
  }

  private async callCloudEndpoint(query: string): Promise<MCPResponse> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream'
      };

      // Add authentication if API key is available
      if (process.env.FASTMCP_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.FASTMCP_API_KEY}`;
      }

      // Call the MCP tool using JSON-RPC protocol
      const response = await fetch(this.cloudEndpoint!, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: 'get_brand_assets',
            arguments: { request: query }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`FastMCP request failed: ${response.status} ${response.statusText}`);
      }

      const responseText = await response.text();
      
      // Parse the event stream response
      let jsonData: any = null;
      if (responseText.includes('event: message')) {
        const lines = responseText.split('\n');
        const dataLine = lines.find(line => line.startsWith('data: '));
        if (dataLine) {
          jsonData = JSON.parse(dataLine.substring(6));
        }
      } else {
        jsonData = JSON.parse(responseText);
      }

      if (jsonData?.error) {
        throw new Error(`FastMCP error: ${jsonData.error.message}`);
      }

      // Transform FastMCP response to our expected format
      const mcpData = jsonData.result?.structuredContent;
      if (!mcpData) {
        return {
          status: 'success',
          total_found: 0,
          assets: {},
          confidence: 'none',
          recommendation: 'No assets found'
        };
      }

      // Convert FastMCP format to our MCPResponse format
      const assets: Record<string, Record<string, MCPAsset>> = {};
      
      // Handle single-product response format (e.g., "ciq", "fuzzball")
      if (mcpData.logos?.assets) {
        const product = mcpData.product || 'brand';
        assets[product] = {};
        
        mcpData.logos.assets.forEach((logo: any, index: number) => {
          const key = logo.layout ? `${logo.layout}_${logo.background}` : `asset_${index}`;
          assets[product][key] = {
            url: logo.url,
            filename: logo.filename,
            background: logo.background || 'light',
            color: logo.background === 'dark' ? 'white' : 'black',
            layout: logo.layout || 'unknown',
            type: logo.type || 'logo',
            size: 'large',
            tags: logo.description ? [logo.description] : []
          };
        });
      }
      
      // Handle multi-product response format (e.g., "logo", "fuzz")
      else if (mcpData.by_product) {
        mcpData.by_product.forEach((productData: any) => {
          const product = productData.product.toLowerCase();
          assets[product] = {};
          
          productData.assets.forEach((asset: any, index: number) => {
            const key = asset.layout ? `${asset.layout}_${asset.background}` : `asset_${index}`;
            assets[product][key] = {
              url: asset.url,
              filename: asset.filename,
              background: asset.background || 'light',
              color: asset.background === 'dark' ? 'white' : 'black',
              layout: asset.layout || 'unknown',
              type: asset.type || 'logo',
              size: 'large',
              tags: asset.description ? [asset.description] : []
            };
          });
        });
      }

      return {
        status: 'success',
        total_found: mcpData.logos?.count || mcpData.total_count || 0,
        assets,
        confidence: mcpData.confidence || 'medium',
        recommendation: mcpData.summary || `Found ${mcpData.logos?.count || mcpData.total_count || 0} assets`
      };
    } catch (error) {
      throw new Error(`FastMCP cloud endpoint error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Normalize asset URLs to avoid CORS issues
  static normalizeAssetUrl(url: string): string {
    // If URL points to localhost:3000 but we're on 3002, convert to same-origin relative path
    if (url.includes('localhost:3000/') || url.includes('127.0.0.1:3000/')) {
      // Extract the path part after the domain
      const pathMatch = url.match(/https?:\/\/[^\/]+(.*)$/);
      if (pathMatch) {
        return pathMatch[1]; // Returns the path part like "/assets/products/..."
      }
    }
    
    // If URL is already relative or from same origin, use as-is
    if (url.startsWith('/') || url.startsWith('./') || !url.includes('://')) {
      return url;
    }
    
    // For any other external URLs, keep as-is (might need proxy later)
    return url;
  }

  // Generate concise description based on asset metadata and usage rules
  static generateConciseDescription(product: string, assetKey: string, asset: any): string {
    // Tier 3: CIQ Brand-Critical Assets (complex usage rules)
    if (product === 'ciq' && asset.type === 'logo') {
      if (asset.layout === 'twocolor') {
        return 'Hero • Only use in simple layouts';
      }
      if (asset.layout === 'onecolor') {
        return 'General use • Most layouts';
      }
      if (asset.layout === 'green') {
        return 'High impact • Ad campaigns';
      }
    }

    // Tier 2: Context-Aware Assets (moderate complexity)
    if (asset.tags?.includes('supporting') || asset.tags?.includes('footer')) {
      return 'Supporting • Secondary use';
    }
    
    if (asset.tags?.includes('hero') || asset.tags?.includes('primary')) {
      return 'Primary • Featured use';
    }

    // Tier 1: Simple Assets (basic descriptors)
    if (asset.type === 'icon') {
      return 'Square • Compact use';
    }
    
    if (asset.type === 'logo') {
      if (asset.layout === 'horizontal') {
        return 'Standard choice';
      }
      if (asset.layout === 'vertical') {
        return 'Minimal horizontal space only';
      }
    }
    
    if (asset.type === 'document') {
      // Extract document type from description or doc_type
      const docType = asset.doc_type || asset.description;
      if (docType?.includes('solution')) return 'Sales overview';
      if (docType?.includes('brief')) return 'Product overview';
      if (docType?.includes('datasheet')) return 'Technical specs';
      if (docType?.includes('guide')) return 'Setup guide';
      return 'Reference doc';
    }

    // Fallback: Basic type + background
    const background = asset.background ? ` • ${asset.background === 'dark' ? 'Dark' : 'Light'}` : '';
    return `${asset.type?.charAt(0).toUpperCase()}${asset.type?.slice(1)}${background}`;
  }

  // Add CIQ company logos to search results
  static addCIQLogos(assets: any[]) {
    // Add all 4 CIQ variants using actual file names
    const ciqVariants = getCIQVariantMetadata();
    
    ciqVariants.forEach((variant) => {
      // Map to actual file names: CIQ_logo_1clr_lightmode.svg, etc.
      const filename = `CIQ_logo_${variant.colorVariant === '1-color' ? '1clr' : '2clr'}_${variant.backgroundMode}mode.svg`;
      
      assets.push({
        id: `ciq-${variant.colorVariant}-${variant.backgroundMode}`,
        title: filename,
        displayName: variant.displayName,
        description: `CIQ company logo - ${variant.displayName}`,
        conciseDescription: variant.usageContext,
        url: `/assets/global/CIQ_logos/${filename}`,
        thumbnailUrl: `/assets/global/CIQ_logos/${filename}`,
        fileType: 'svg',
        dimensions: { width: 100, height: 100 },
        tags: ['ciq', 'company', 'logo'],
        brand: 'CIQ',
        category: 'company-logo',
        assetType: 'logo',
        metadata: {
          backgroundMode: variant.backgroundMode,
          colorVariant: variant.colorVariant,
          isPrimary: variant.isPrimary,
          usageContext: variant.usageContext
        }
      });
    });
  }

  // Convert MCP response to our Asset interface format
  static transformMCPResponse(mcpResponse: MCPResponse) {
    const assets: any[] = [];

    if (mcpResponse.error) {
      throw new Error(mcpResponse.error);
    }

    if (mcpResponse.assets) {
      // Flatten the nested structure
      Object.entries(mcpResponse.assets).forEach(([product, productAssets]) => {
        Object.entries(productAssets).forEach(([assetKey, asset]) => {
          // Determine variant from asset layout or filename
          const variant = asset.layout as 'horizontal' | 'vertical' | 'symbol';
          
          // Get metadata for this specific variant
          const variantMeta = getSpecificVariantMetadata(product, variant);
          
          // Generate display name and description
          const displayName = variantMeta?.displayName || 
            `${product.charAt(0).toUpperCase()}${product.slice(1)} ${variant.charAt(0).toUpperCase()}${variant.slice(1)} Logo`;
          
          // Add light mode version (original -blk.svg file)
          assets.push({
            id: `${product}-${variant}-light`,
            title: asset.name || (asset.filename ? asset.filename.replace(/\.[^/.]+$/, "") : "Unknown Asset"),
            displayName: displayName,
            description: asset.description || `${product} ${asset.type} - ${asset.layout}`,
            conciseDescription: this.generateConciseDescription(product, assetKey, asset),
            url: this.normalizeAssetUrl(asset.url),
            thumbnailUrl: this.normalizeAssetUrl(asset.url),
            fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'unknown' : 'unknown',
            dimensions: asset.size === 'large' ? { width: 100, height: 100 } : { width: 100, height: 100 },
            tags: asset.tags || [],
            brand: product.toUpperCase(),
            category: 'product-logo',
            assetType: 'logo',
            metadata: {
              backgroundMode: 'light', // Light mode version (dark logo for light backgrounds)
              variant: variant,
              isPrimary: variantMeta?.isPrimary && variant === 'horizontal', // Only horizontal light mode is primary
              usageContext: variantMeta?.usageContext || 'general use',
              // Legacy fields
              background: asset.background,
              color: asset.color,
              layout: asset.layout,
              size: asset.size
            }
          });
          
          // Add dark mode version (same file but will be color-manipulated)
          assets.push({
            id: `${product}-${variant}-dark`,
            title: `${asset.name || (asset.filename ? asset.filename.replace(/\.[^/.]+$/, "") : "Unknown Asset")} (Dark)`,
            displayName: `${displayName} (Dark)`,
            description: `${asset.description || `${product} ${asset.type} - ${asset.layout}`} - Dark mode`,
            conciseDescription: this.generateConciseDescription(product, assetKey, asset),
            url: this.normalizeAssetUrl(asset.url), // Same file, color manipulation happens in modal/download
            thumbnailUrl: this.normalizeAssetUrl(asset.url),
            fileType: asset.filename ? asset.filename.split('.').pop()?.toLowerCase() || 'unknown' : 'unknown',
            dimensions: asset.size === 'large' ? { width: 100, height: 100 } : { width: 100, height: 100 },
            tags: [...(asset.tags || []), 'dark-mode'],
            brand: product.toUpperCase(),
            category: 'product-logo',
            assetType: 'logo',
            metadata: {
              backgroundMode: 'dark', // Dark mode version (light logo for dark backgrounds)
              variant: variant,
              isPrimary: false, // Dark mode variants are never primary
              usageContext: variantMeta?.usageContext || 'general use',
              // Legacy fields
              background: 'dark',
              color: asset.color,
              layout: asset.layout,
              size: asset.size
            }
          });
        });
      });
    }

    // Add CIQ company logos from actual provided assets
    this.addCIQLogos(assets);

    return {
      assets,
      total: assets.length, // Updated total includes CIQ logos
      confidence: mcpResponse.confidence,
      recommendation: mcpResponse.recommendation
    };
  }
}