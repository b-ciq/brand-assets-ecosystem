import { spawn } from 'child_process';
import path from 'path';
import { Asset, MCPResponse, MCPAsset, SearchResponse, SearchFilters } from '../types';

export interface BrandAssetsClientConfig {
  mcpServerPath?: string;
  cliWrapperPath?: string;
  cloudEndpoint?: string;
  useCloudEndpoint?: boolean;
}

export class BrandAssetsClient {
  private config: BrandAssetsClientConfig;

  constructor(config: BrandAssetsClientConfig = {}) {
    this.config = {
      mcpServerPath: config.mcpServerPath || '/Users/bchristensen/Documents/GitHub/brand-assets/server.py',
      cliWrapperPath: config.cliWrapperPath || '/Users/bchristensen/Documents/GitHub/brand-assets/cli_wrapper.py',
      cloudEndpoint: config.cloudEndpoint || 'https://brand-asset-server.fastmcp.app',
      useCloudEndpoint: config.useCloudEndpoint || false,
      ...config
    };
  }

  async searchAssets(query: string, filters?: SearchFilters): Promise<SearchResponse> {
    try {
      const mcpResponse = await this.callMCPServer(query);
      const transformedResponse = this.transformMCPResponse(mcpResponse);
      
      // Apply filters if provided
      if (filters) {
        transformedResponse.assets = this.applyFilters(transformedResponse.assets, filters);
        transformedResponse.total = transformedResponse.assets.length;
      }

      return {
        assets: transformedResponse.assets,
        total: transformedResponse.total,
        page: 1, // For now, we don't support pagination at MCP level
        hasMore: false,
        confidence: transformedResponse.confidence,
        recommendation: transformedResponse.recommendation
      };
    } catch (error) {
      throw new Error(`Brand assets search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async callMCPServer(query: string): Promise<MCPResponse> {
    if (this.config.useCloudEndpoint) {
      return this.callCloudEndpoint(query);
    } else {
      return this.callLocalMCP(query);
    }
  }

  private async callLocalMCP(query: string): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      const python = spawn('python3', [this.config.cliWrapperPath!, query]);
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
    const response = await fetch(`${this.config.cloudEndpoint}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`Cloud endpoint request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private transformMCPResponse(mcpResponse: MCPResponse): { assets: Asset[], total: number, confidence: string, recommendation?: string } {
    const assets: Asset[] = [];

    if (mcpResponse.error) {
      throw new Error(mcpResponse.error);
    }

    if (mcpResponse.assets) {
      Object.entries(mcpResponse.assets).forEach(([product, productAssets]) => {
        Object.entries(productAssets).forEach(([assetKey, asset]) => {
          assets.push({
            id: `${product}-${assetKey}`,
            title: asset.filename.replace(/\.[^/.]+$/, ""),
            description: `${product} ${asset.type} - ${asset.layout}`,
            url: asset.url,
            thumbnailUrl: asset.url,
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

  private applyFilters(assets: Asset[], filters: SearchFilters): Asset[] {
    return assets.filter(asset => {
      if (filters.brand && asset.brand.toLowerCase() !== filters.brand.toLowerCase()) {
        return false;
      }
      
      if (filters.fileType && asset.fileType !== filters.fileType) {
        return false;
      }
      
      if (filters.background && asset.metadata?.background !== filters.background) {
        return false;
      }
      
      if (filters.layout && asset.metadata?.layout !== filters.layout) {
        return false;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        const hasMatchingTag = filters.tags.some(filterTag => 
          asset.tags.some(assetTag => 
            assetTag.toLowerCase().includes(filterTag.toLowerCase())
          )
        );
        if (!hasMatchingTag) {
          return false;
        }
      }
      
      return true;
    });
  }

  // Utility method to get available brands
  async getBrands(): Promise<string[]> {
    const response = await this.searchAssets(''); // Empty query to get all assets
    const brands = [...new Set(response.assets.map(asset => asset.brand))];
    return brands.sort();
  }

  // Utility method to get available file types
  async getFileTypes(): Promise<string[]> {
    const response = await this.searchAssets('');
    const fileTypes = [...new Set(response.assets.map(asset => asset.fileType))];
    return fileTypes.sort();
  }
}