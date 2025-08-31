import { spawn } from 'child_process';
import path from 'path';

interface MCPAsset {
  url: string;
  filename: string;
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

export class BrandAssetsMCP {
  private mcpPath: string;

  constructor() {
    // Path to your brand-assets MCP server
    this.mcpPath = path.resolve('/Users/bchristensen/Documents/GitHub/brand-assets/server.py');
  }

  async searchAssets(query: string): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      // Use the CLI wrapper
      const cliPath = path.resolve('/Users/bchristensen/Documents/GitHub/brand-assets/cli_wrapper.py');
      const python = spawn('python3', [cliPath, query]);
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
          assets.push({
            id: `${product}-${assetKey}`,
            title: asset.filename.replace(/\.[^/.]+$/, ""), // Remove extension
            description: `${product} ${asset.type} - ${asset.layout}`,
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
              size: asset.size
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