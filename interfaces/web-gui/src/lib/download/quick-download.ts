import { Asset } from '@/types/asset';
import { UserContext, DownloadConfig, SmartDefaults } from '../smart-defaults/types';
import { SmartDefaultsEngine } from '../smart-defaults/engine';
import { convertSvgToRaster, getFileExtension } from '../svgConverter';
import { manipulateSvgColors, BRAND_COLORS } from '../svgColorTest';

export interface QuickDownloadOptions {
  skipSmartDefaults?: boolean;
  overrideConfig?: Partial<DownloadConfig>;
  trackAnalytics?: boolean;
}

export interface QuickDownloadResult {
  blob: Blob;
  filename: string;
  config: DownloadConfig;
  smartDefaults?: SmartDefaults;
  downloadTime: number;
}

export class QuickDownloadService {
  private smartEngine: SmartDefaultsEngine;

  constructor() {
    this.smartEngine = new SmartDefaultsEngine({
      useTeamPatterns: true,
      confidenceThreshold: 0.6,
      fallbackToMostPopular: true
    });
  }

  /**
   * Perform a quick download with smart defaults
   */
  async quickDownload(
    asset: Asset,
    context: UserContext,
    options: QuickDownloadOptions = {}
  ): Promise<QuickDownloadResult> {
    const startTime = performance.now();
    
    try {
      // 1. Generate smart defaults (unless skipped)
      let smartDefaults: SmartDefaults | undefined;
      let config: DownloadConfig;

      if (!options.skipSmartDefaults) {
        smartDefaults = await this.smartEngine.generateDefaults(asset, context);
        config = {
          variant: smartDefaults.variant,
          format: smartDefaults.format,
          size: smartDefaults.size,
          backgroundMode: smartDefaults.backgroundMode,
          colorMode: smartDefaults.colorMode
        };
      } else {
        // Fallback to simple defaults
        config = this.getFallbackDefaults();
      }

      // 2. Apply any overrides
      if (options.overrideConfig) {
        config = { ...config, ...options.overrideConfig };
      }

      // 3. Generate the file
      const blob = await this.generateFile(asset, config);

      // 4. Generate filename
      const filename = this.generateFilename(asset, config);

      // 5. Track analytics (if enabled)
      if (options.trackAnalytics) {
        await this.trackDownload(asset, config, context, smartDefaults);
      }

      const downloadTime = performance.now() - startTime;

      return {
        blob,
        filename,
        config,
        smartDefaults,
        downloadTime
      };

    } catch (error) {
      console.error('Quick download failed:', error);
      throw new Error(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate the actual file blob based on configuration
   */
  private async generateFile(asset: Asset, config: DownloadConfig): Promise<Blob> {
    const isOriginalSvg = asset.fileType.toLowerCase() === 'svg' || 
                         asset.url.toLowerCase().includes('.svg');

    if (!isOriginalSvg) {
      // Handle non-SVG assets (just return the original)
      const response = await fetch(asset.url);
      return await response.blob();
    }

    // Handle SVG assets with color manipulation
    let svgContent = await this.fetchSvgContent(asset.url);

    // Apply color manipulation if needed
    if (config.colorMode === 'green') {
      svgContent = manipulateSvgColors(svgContent, BRAND_COLORS['brand-green']);
    } else if (config.backgroundMode === 'dark') {
      // For dark backgrounds, make logo white
      svgContent = manipulateSvgColors(svgContent, '#FFFFFF');
    }

    // Return SVG directly or convert to raster
    if (config.format === 'svg') {
      return new Blob([svgContent], { type: 'image/svg+xml' });
    } else {
      // Convert to PNG or JPEG
      const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
      
      return await convertSvgToRaster(dataUrl, {
        format: config.format === 'jpeg' ? 'jpeg' : 'png',
        width: config.size,
        quality: config.format === 'jpeg' ? 0.92 : undefined,
        backgroundColor: config.format === 'jpeg' 
          ? (config.backgroundMode === 'dark' ? '#1a1d23' : '#FFFFFF')
          : undefined
      });
    }
  }

  /**
   * Fetch SVG content from URL
   */
  private async fetchSvgContent(url: string): Promise<string> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
    }
    return await response.text();
  }

  /**
   * Generate descriptive filename based on configuration
   */
  private generateFilename(asset: Asset, config: DownloadConfig): string {
    const baseName = asset.title.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    const parts = [baseName];
    
    // Add variant if not horizontal (default)
    if (config.variant !== 'horizontal') {
      parts.push(config.variant);
    }
    
    // Add color info
    if (config.colorMode === 'green') {
      parts.push('green');
    } else if (config.backgroundMode === 'dark') {
      parts.push('white'); // White logo for dark backgrounds
    }
    
    // Add background context
    if (config.backgroundMode === 'dark') {
      parts.push('dark-bg');
    }
    
    // Add size for raster formats
    if (config.format !== 'svg') {
      parts.push(`${config.size}px`);
    }
    
    const extension = getFileExtension(config.format);
    return `${parts.join('-')}.${extension}`;
  }

  /**
   * Get fallback defaults when smart defaults are disabled
   */
  private getFallbackDefaults(): DownloadConfig {
    return {
      variant: 'horizontal',
      format: 'png',
      size: 512,
      backgroundMode: 'light',
      colorMode: 'neutral'
    };
  }

  /**
   * Track download analytics
   */
  private async trackDownload(
    asset: Asset,
    config: DownloadConfig,
    context: UserContext,
    smartDefaults?: SmartDefaults
  ): Promise<void> {
    try {
      const analyticsData = {
        eventType: 'quick_download' as const,
        assetId: asset.id,
        userContext: context,
        downloadConfig: config,
        wasSmartDefault: !!smartDefaults,
        smartDefaultsUsed: smartDefaults,
        timestamp: Date.now(),
        sessionId: context.sessionId || 'unknown'
      };

      // Send to analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analyticsData)
      });
    } catch (error) {
      console.warn('Failed to track download analytics:', error);
      // Don't fail the download for analytics errors
    }
  }

  /**
   * Trigger browser download of the blob
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

  /**
   * Preview what the smart defaults would be without downloading
   */
  async previewSmartDefaults(
    asset: Asset,
    context: UserContext
  ): Promise<SmartDefaults> {
    return await this.smartEngine.generateDefaults(asset, context);
  }
}