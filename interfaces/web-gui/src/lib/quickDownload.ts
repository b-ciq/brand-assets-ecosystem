import { Asset } from '@/types/asset';
import { ProductDefaults, getProductDefaults, generateQuickFilename } from './productDefaults';
import { convertSvgToRaster } from './svgConverter';
import { manipulateSvgColors, BRAND_COLORS } from './svgColorTest';

/**
 * Simple quick download service - no complexity, just works
 */
export class QuickDownloadService {
  
  /**
   * Generate quick download with predefined defaults
   */
  async generateQuickDownload(asset: Asset): Promise<{
    blob: Blob;
    filename: string;
    description: string;
  }> {
    const defaults = getProductDefaults(asset.id);
    
    // Get the master SVG file path
    const svgPath = this.getMasterSVGPath(asset, defaults.variant);
    
    // Load and process SVG
    const svgContent = await this.loadAndProcessSVG(svgPath, defaults.colorMode);
    
    // Generate the final file
    let blob: Blob;
    if (defaults.format === 'svg') {
      blob = new Blob([svgContent], { type: 'image/svg+xml' });
    } else {
      // Convert to PNG/JPEG
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
      blob = await convertSvgToRaster(dataUrl, {
        format: defaults.format === 'jpeg' ? 'jpeg' : 'png',
        width: defaults.size,
        quality: defaults.format === 'jpeg' ? 0.92 : undefined,
        backgroundColor: defaults.format === 'jpeg' 
          ? (defaults.colorMode === 'dark' ? '#FFFFFF' : '#FFFFFF')
          : undefined
      });
    }
    
    const filename = generateQuickFilename(asset.id, defaults);
    const description = `${defaults.format.toUpperCase()} • ${defaults.variant} • ${defaults.colorMode}${defaults.format !== 'svg' ? ` • ${defaults.size}px` : ''}`;
    
    return { blob, filename, description };
  }
  
  /**
   * Get the master SVG file path for a variant
   */
  private getMasterSVGPath(asset: Asset, variant: string): string {
    // Extract the base URL pattern from the asset URL
    const baseUrl = asset.url;
    
    if (variant === 'horizontal') {
      // Replace any existing variant with horizontal pattern
      return baseUrl.replace(/(logo_)(symbol|v|h)(-blk\.svg)$/, '$1h$3');
    } else if (variant === 'symbol') {
      // Replace any existing variant with symbol pattern  
      return baseUrl.replace(/(logo_)(symbol|v|h)(-blk\.svg)$/, '$1symbol$3');
    } else if (variant === 'vertical') {
      // Replace any existing variant with vertical pattern
      return baseUrl.replace(/(logo_)(symbol|v|h)(-blk\.svg)$/, '$1v$3');
    }
    
    return baseUrl; // Fallback
  }
  
  /**
   * Load SVG content and apply color manipulation
   */
  private async loadAndProcessSVG(svgPath: string, colorMode: 'dark' | 'light'): Promise<string> {
    const response = await fetch(svgPath);
    if (!response.ok) {
      throw new Error(`Failed to load SVG: ${response.status} ${response.statusText}`);
    }
    
    let svgContent = await response.text();
    
    // Apply color manipulation based on mode
    if (colorMode === 'light') {
      // Light mode = white logo for dark backgrounds
      svgContent = manipulateSvgColors(svgContent, '#FFFFFF');
    }
    // Dark mode uses original black logo (no manipulation needed)
    
    return svgContent;
  }
  
  /**
   * Trigger browser download
   */
  static triggerDownload(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up
    window.URL.revokeObjectURL(url);
  }
}