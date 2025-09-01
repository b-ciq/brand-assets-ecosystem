import { spawn } from 'child_process';
import path from 'path';
import { getSpecificVariantMetadata } from './productDefaults';

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
          
          assets.push({
            id: `${product}-${assetKey}`,
            title: asset.name || asset.filename.replace(/\.[^/.]+$/, ""), // Keep original filename for compatibility
            displayName: displayName,
            description: asset.description || `${product} ${asset.type} - ${asset.layout}`,
            conciseDescription: this.generateConciseDescription(product, assetKey, asset),
            url: asset.url,
            thumbnailUrl: asset.url, // Same for now
            fileType: asset.filename.split('.').pop()?.toLowerCase() || 'unknown',
            dimensions: asset.size === 'large' ? { width: 100, height: 100 } : { width: 100, height: 100 },
            tags: asset.tags || [],
            brand: product.toUpperCase(),
            metadata: {
              background: asset.background,
              color: asset.color,
              layout: asset.layout,
              size: asset.size,
              variant: variant,
              isPrimary: variantMeta?.isPrimary || false,
              usageContext: variantMeta?.usageContext || 'general use'
            }
          });
        });
      });
    }

    return {
      assets,
      total: mcpResponse.total_found || assets.length,
      confidence: mcpResponse.confidence,
      recommendation: mcpResponse.recommendation
    };
  }
}