import { Asset } from '@/types/asset';
import { 
  UserContext, 
  SmartDefaults, 
  DownloadConfig, 
  LogoVariant, 
  FormatChoice, 
  BackgroundMode, 
  ColorChoice,
  SmartDefaultsOptions,
  AssetUsageMetrics
} from './types';
import { ContextDetector } from './context';

export class SmartDefaultsEngine {
  private options: SmartDefaultsOptions;

  constructor(options: SmartDefaultsOptions = {}) {
    this.options = {
      enableMachineLearning: false, // Start simple
      useTeamPatterns: true,
      useTimeBasedHeuristics: true,
      confidenceThreshold: 0.6,
      fallbackToMostPopular: true,
      ...options
    };
  }

  /**
   * Generate smart defaults for an asset based on user context
   */
  async generateDefaults(
    asset: Asset, 
    context: UserContext,
    usageMetrics?: AssetUsageMetrics
  ): Promise<SmartDefaults> {
    const reasoning: string[] = [];
    
    // 1. Determine background mode
    const backgroundMode = this.selectBackgroundMode(context, reasoning);
    
    // 2. Select optimal variant
    const variant = this.selectVariant(asset, context, usageMetrics, reasoning);
    
    // 3. Choose format based on user role and context
    const format = this.selectFormat(context, reasoning);
    
    // 4. Optimize size for context and format
    const size = this.selectSize(format, context, usageMetrics, reasoning);
    
    // 5. Determine color mode
    const colorMode = this.selectColorMode(context, backgroundMode, reasoning);
    
    // 6. Calculate confidence score
    const confidence = this.calculateConfidence(context, usageMetrics, reasoning);
    
    // 7. Generate alternatives
    const alternatives = this.generateAlternatives(
      { variant, format, size, backgroundMode, colorMode },
      context,
      usageMetrics
    );

    return {
      variant,
      format,
      size,
      backgroundMode,
      colorMode,
      confidence,
      reasoning,
      alternatives
    };
  }

  /**
   * Select optimal background mode for the logo
   */
  private selectBackgroundMode(context: UserContext, reasoning: string[]): BackgroundMode {
    // Primary: Use detected optimal background mode
    const detectedMode = ContextDetector.detectOptimalBackgroundMode(context);
    reasoning.push(`Background mode: ${detectedMode} (based on ${context.deviceTheme ? 'device theme' : 'usage context'})`);
    
    return detectedMode;
  }

  /**
   * Select the best logo variant based on context and usage patterns
   */
  private selectVariant(
    asset: Asset, 
    context: UserContext, 
    metrics?: AssetUsageMetrics,
    reasoning: string[] = []
  ): LogoVariant {
    
    // Team patterns take precedence
    if (this.options.useTeamPatterns && context.teamUsagePatterns) {
      const teamPreferred = Object.entries(context.teamUsagePatterns.commonVariants)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (teamPreferred) {
        reasoning.push(`Variant: ${teamPreferred[0]} (team's most used: ${teamPreferred[1]} downloads)`);
        return teamPreferred[0] as LogoVariant;
      }
    }

    // Asset-specific usage metrics
    if (metrics?.variantPopularity) {
      const mostPopular = Object.entries(metrics.variantPopularity)
        .sort(([,a], [,b]) => b - a)[0];
      
      if (mostPopular) {
        reasoning.push(`Variant: ${mostPopular[0]} (most popular for this asset: ${mostPopular[1]} downloads)`);
        return mostPopular[0] as LogoVariant;
      }
    }

    // Role-based defaults
    switch (context.userRole) {
      case 'marketer':
      case 'sales':
        reasoning.push(`Variant: horizontal (optimal for presentations and marketing materials)`);
        return 'horizontal'; // Best for presentations, decks, marketing
      
      case 'engineer':
        switch (context.purposeHint) {
          case 'documentation':
          case 'app':
            reasoning.push(`Variant: horizontal (best for documentation headers)`);
            return 'horizontal';
          default:
            reasoning.push(`Variant: symbol (compact, good for technical contexts)`);
            return 'symbol';
        }
      
      case 'designer':
        // Designers might want different variants for different contexts
        if (context.purposeHint === 'social') {
          reasoning.push(`Variant: symbol (optimal for social media profiles)`);
          return 'symbol';
        }
        reasoning.push(`Variant: horizontal (versatile choice for design work)`);
        return 'horizontal';
      
      default:
        reasoning.push(`Variant: horizontal (safe default for general use)`);
        return 'horizontal'; // Safe default
    }
  }

  /**
   * Select optimal format based on user role and context
   */
  private selectFormat(context: UserContext, reasoning: string[]): FormatChoice {
    // Role-based format selection
    switch (context.userRole) {
      case 'designer':
        reasoning.push(`Format: svg (designers need scalable vector format)`);
        return 'svg'; // Designers usually want vectors
      
      case 'engineer':
        switch (context.purposeHint) {
          case 'website':
          case 'app':
          case 'documentation':
            reasoning.push(`Format: svg (optimal for web development)`);
            return 'svg'; // SVG for web development
          default:
            reasoning.push(`Format: png (reliable format for technical documentation)`);
            return 'png';
        }
      
      case 'marketer':
      case 'sales':
        switch (context.purposeHint) {
          case 'presentation':
            reasoning.push(`Format: png (reliable for presentations)`);
            return 'png'; // PNG for presentations (better compatibility)
          case 'print':
            reasoning.push(`Format: svg (scalable for print materials)`);
            return 'svg'; // Vector for print
          case 'email':
          case 'social':
            reasoning.push(`Format: png (best email/social compatibility)`);
            return 'png'; // PNG for email/social (better support)
          default:
            reasoning.push(`Format: png (versatile for marketing use)`);
            return 'png';
        }
      
      default:
        reasoning.push(`Format: png (safe default with broad compatibility)`);
        return 'png'; // Safe default
    }
  }

  /**
   * Select optimal size based on format and usage context
   */
  private selectSize(
    format: FormatChoice, 
    context: UserContext, 
    metrics?: AssetUsageMetrics,
    reasoning: string[] = []
  ): number {
    
    // SVG doesn't need size consideration (it's scalable)
    if (format === 'svg') {
      reasoning.push(`Size: N/A (SVG is scalable)`);
      return 512; // Nominal value for SVG
    }

    // Use team average if available
    if (metrics?.averageSize && metrics.averageSize > 0) {
      reasoning.push(`Size: ${metrics.averageSize}px (team average for this asset)`);
      return Math.round(metrics.averageSize);
    }

    // Context-based size selection
    switch (context.purposeHint) {
      case 'social':
        reasoning.push(`Size: 400px (optimized for social media)`);
        return 400; // Good for social media avatars
      
      case 'website':
      case 'app':
        reasoning.push(`Size: 512px (optimal for web/app usage)`);
        return 512; // Good balance for web
      
      case 'presentation':
        reasoning.push(`Size: 1024px (high resolution for presentations)`);
        return 1024; // Higher res for presentations
      
      case 'print':
        reasoning.push(`Size: 1024px (high resolution for print materials)`);
        return 1024; // High res for print
      
      case 'email':
        reasoning.push(`Size: 256px (compact for email)`);
        return 256; // Smaller for email
      
      case 'documentation':
        reasoning.push(`Size: 256px (appropriate for documentation)`);
        return 256; // Smaller for docs
      
      default:
        reasoning.push(`Size: 512px (balanced default size)`);
        return 512; // Safe default
    }
  }

  /**
   * Select color mode based on context and background
   */
  private selectColorMode(
    context: UserContext, 
    backgroundMode: BackgroundMode,
    reasoning: string[]
  ): ColorChoice {
    
    // Team patterns
    if (context.teamUsagePatterns?.rolePatterns?.[context.userRole!]?.colorMode) {
      const teamPreferred = context.teamUsagePatterns.rolePatterns[context.userRole!].colorMode;
      reasoning.push(`Color: ${teamPreferred} (team preference for ${context.userRole})`);
      return teamPreferred;
    }

    // Context-based color logic
    switch (context.purposeHint) {
      case 'presentation':
      case 'print':
        // Presentations and print usually want brand colors
        reasoning.push(`Color: neutral (professional for ${context.purposeHint})`);
        return 'neutral';
      
      case 'social':
      case 'website':
        // Social and web can be more vibrant
        reasoning.push(`Color: green (brand color appropriate for ${context.purposeHint})`);
        return 'green';
      
      default:
        // Safe default
        reasoning.push(`Color: neutral (safe default)`);
        return 'neutral';
    }
  }

  /**
   * Calculate confidence score for the generated defaults
   */
  private calculateConfidence(
    context: UserContext, 
    metrics?: AssetUsageMetrics,
    reasoning: string[] = []
  ): number {
    let confidence = 0.5; // Base confidence
    
    // Boost confidence based on available data
    if (context.userRole && context.userRole !== 'unknown') {
      confidence += 0.2; // We know the user role
    }
    
    if (context.purposeHint) {
      confidence += 0.2; // We know the usage context
    }
    
    if (context.teamUsagePatterns) {
      confidence += 0.15; // We have team patterns
    }
    
    if (metrics) {
      confidence += 0.1; // We have asset-specific metrics
    }
    
    if (context.deviceTheme) {
      confidence += 0.05; // We know device preference
    }

    return Math.min(confidence, 1.0); // Cap at 1.0
  }

  /**
   * Generate alternative configurations
   */
  private generateAlternatives(
    mainConfig: DownloadConfig,
    context: UserContext,
    metrics?: AssetUsageMetrics
  ): Partial<DownloadConfig>[] {
    const alternatives: Partial<DownloadConfig>[] = [];
    
    // Alternative background mode
    alternatives.push({
      backgroundMode: mainConfig.backgroundMode === 'light' ? 'dark' : 'light'
    });
    
    // Alternative format (if not designer)
    if (context.userRole !== 'designer' && mainConfig.format !== 'svg') {
      alternatives.push({ format: 'svg' });
    }
    
    // Alternative variant
    if (mainConfig.variant !== 'horizontal') {
      alternatives.push({ variant: 'horizontal' });
    }
    if (mainConfig.variant !== 'symbol') {
      alternatives.push({ variant: 'symbol' });
    }
    
    // Alternative size (for raster formats)
    if (mainConfig.format !== 'svg') {
      if (mainConfig.size !== 1024) {
        alternatives.push({ size: 1024 }); // High res option
      }
      if (mainConfig.size !== 256) {
        alternatives.push({ size: 256 }); // Compact option
      }
    }
    
    return alternatives.slice(0, 3); // Limit to top 3 alternatives
  }

  /**
   * Validate that generated defaults are reasonable
   */
  validateDefaults(defaults: SmartDefaults): boolean {
    // Basic validation
    if (defaults.confidence < this.options.confidenceThreshold!) {
      return false;
    }
    
    // Size validation
    if (defaults.size < 16 || defaults.size > 4096) {
      return false;
    }
    
    // Reasoning should exist
    if (!defaults.reasoning || defaults.reasoning.length === 0) {
      return false;
    }
    
    return true;
  }
}