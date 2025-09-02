/**
 * Simple product defaults configuration
 * YOU define what users get with "Quick Download" - no AI, no complexity
 */

export interface ProductDefaults {
  variant: 'horizontal' | 'vertical' | 'symbol';
  format: 'svg' | 'png' | 'jpeg';
  size: number;
  colorMode: 'dark' | 'light';
  reason: string;
}

export interface VariantMetadata {
  variant: 'horizontal' | 'vertical' | 'symbol';
  displayName: string;
  usageContext: string;
  isPrimary: boolean;
  priority: number; // Lower numbers = higher priority
}

export interface CIQVariantMetadata {
  colorVariant: '1-color' | '2-color';
  backgroundMode: 'light' | 'dark'; // Standardized field
  displayName: string;
  usageContext: string;
  isPrimary: boolean;
  priority: number;
}

// Variant metadata for display names and usage context
// Only horizontal + light background variants are marked as isPrimary: true
export const VARIANT_METADATA: Record<string, VariantMetadata[]> = {
  fuzzball: [
    { variant: 'horizontal', displayName: 'Fuzzball Horizontal Logo', usageContext: 'presentations, headers, documents', isPrimary: true, priority: 1 },
    { variant: 'symbol', displayName: 'Fuzzball Icon', usageContext: 'favicons, app icons, compact spaces', isPrimary: false, priority: 2 },
    { variant: 'vertical', displayName: 'Fuzzball Vertical Logo', usageContext: 'narrow layouts, sidebars', isPrimary: false, priority: 3 }
  ],
  ascender: [
    { variant: 'horizontal', displayName: 'Ascender Horizontal Logo', usageContext: 'presentations, headers, documents', isPrimary: true, priority: 1 },
    { variant: 'symbol', displayName: 'Ascender Icon', usageContext: 'favicons, app icons, compact spaces', isPrimary: false, priority: 2 },
    { variant: 'vertical', displayName: 'Ascender Vertical Logo', usageContext: 'narrow layouts, sidebars', isPrimary: false, priority: 3 }
  ],
  warewulf: [
    { variant: 'horizontal', displayName: 'Warewulf Horizontal Logo', usageContext: 'presentations, headers, documents', isPrimary: true, priority: 1 },
    { variant: 'symbol', displayName: 'Warewulf Icon', usageContext: 'favicons, app icons, compact spaces', isPrimary: false, priority: 2 },
    { variant: 'vertical', displayName: 'Warewulf Vertical Logo', usageContext: 'narrow layouts, sidebars', isPrimary: false, priority: 3 }
  ],
  'rlc-hardened': [
    { variant: 'horizontal', displayName: 'RLC Hardened Horizontal Logo', usageContext: 'presentations, headers, documents', isPrimary: true, priority: 1 },
    { variant: 'symbol', displayName: 'RLC Hardened Icon', usageContext: 'favicons, app icons, compact spaces', isPrimary: false, priority: 2 },
    { variant: 'vertical', displayName: 'RLC Hardened Vertical Logo', usageContext: 'narrow layouts, sidebars', isPrimary: false, priority: 3 }
  ]
};

// CIQ company logo variants - maps to 4 existing SVG files
// 1-color light mode is the preferred variant (dark logo for light backgrounds)
export const CIQ_VARIANT_METADATA: CIQVariantMetadata[] = [
  // Light mode variants (dark logos for light backgrounds)
  { colorVariant: '1-color', backgroundMode: 'light', displayName: 'CIQ Standard', usageContext: 'general business use, presentations', isPrimary: true, priority: 1 },
  { colorVariant: '2-color', backgroundMode: 'light', displayName: 'CIQ Hero', usageContext: 'major presentations, marketing materials', isPrimary: false, priority: 2 },
  
  // Dark mode variants (light logos for dark backgrounds)  
  { colorVariant: '1-color', backgroundMode: 'dark', displayName: 'CIQ Standard (Dark)', usageContext: 'dark backgrounds, headers', isPrimary: false, priority: 3 },
  { colorVariant: '2-color', backgroundMode: 'dark', displayName: 'CIQ Hero (Dark)', usageContext: 'dark hero sections, premium contexts', isPrimary: false, priority: 4 }
];

export const PRODUCT_DEFAULTS: Record<string, ProductDefaults> = {
  // CIQ company logo - different defaults than product logos
  ciq: {
    variant: 'horizontal', // Not used for CIQ, but required by interface
    format: 'png',
    size: 512,
    colorMode: 'light', // Maps to light-mode for CIQ
    reason: 'Standard business logo for general use'
  },

  // Product logos - sensible defaults based on common use cases
  fuzzball: {
    variant: 'horizontal',      // Most versatile for presentations, headers
    format: 'png',              // Universal compatibility
    size: 512,                  // Good balance of quality vs file size
    colorMode: 'dark',          // Works on most light backgrounds
    reason: 'Optimized for presentations and general business use'
  },

  ascender: {
    variant: 'horizontal',      // Professional layout for business contexts
    format: 'png',              // Broad compatibility
    size: 512,                  // Standard resolution
    colorMode: 'dark',          // Professional appearance
    reason: 'Professional standard for technical documentation'
  },

  warewulf: {
    variant: 'horizontal',      // Consistent with other products
    format: 'png',              // Safe choice for compatibility  
    size: 512,                  // Balanced size
    colorMode: 'dark',          // Clear on light backgrounds
    reason: 'Versatile for technical presentations and documentation'
  },

  'rlc-hardened': {
    variant: 'horizontal',      // Consistent with other products
    format: 'png',              // Safe choice for compatibility  
    size: 512,                  // Balanced size
    colorMode: 'dark',          // Clear on light backgrounds
    reason: 'Enterprise-grade for security-focused presentations'
  },

  // Fallback default for any unrecognized products
  default: {
    variant: 'horizontal',      // Safest choice for most contexts
    format: 'png',              // Most compatible format
    size: 512,                  // Reasonable balance
    colorMode: 'dark',          // Works on most backgrounds
    reason: 'General-purpose configuration for business use'
  }
};

/**
 * Get product defaults with fallback
 */
export function getProductDefaults(productId: string): ProductDefaults {
  return PRODUCT_DEFAULTS[productId] || PRODUCT_DEFAULTS.default;
}

/**
 * Generate descriptive filename for download
 */
export function generateQuickFilename(productId: string, defaults: ProductDefaults): string {
  const parts = [
    productId,
    defaults.variant,
    defaults.colorMode,
    defaults.format !== 'svg' ? `${defaults.size}px` : null
  ].filter(Boolean);

  return `${parts.join('-')}.${defaults.format}`;
}

/**
 * Get variant metadata for a product with fallback
 */
export function getVariantMetadata(productId: string): VariantMetadata[] {
  return VARIANT_METADATA[productId] || [
    { variant: 'horizontal', displayName: `${productId.charAt(0).toUpperCase()}${productId.slice(1)} Horizontal Logo`, usageContext: 'presentations, headers, documents', isPrimary: true, priority: 1 },
    { variant: 'symbol', displayName: `${productId.charAt(0).toUpperCase()}${productId.slice(1)} Icon`, usageContext: 'favicons, app icons, compact spaces', isPrimary: false, priority: 2 },
    { variant: 'vertical', displayName: `${productId.charAt(0).toUpperCase()}${productId.slice(1)} Vertical Logo`, usageContext: 'narrow layouts, sidebars', isPrimary: false, priority: 3 }
  ];
}

/**
 * Get specific variant metadata for a product and variant
 */
export function getSpecificVariantMetadata(productId: string, variant: 'horizontal' | 'vertical' | 'symbol'): VariantMetadata | undefined {
  const variants = getVariantMetadata(productId);
  return variants.find(v => v.variant === variant);
}

/**
 * Get the primary (recommended) variant for a product
 */
export function getPrimaryVariant(productId: string): VariantMetadata {
  const variants = getVariantMetadata(productId);
  return variants.find(v => v.isPrimary) || variants[0];
}

/**
 * Get CIQ variant metadata
 */
export function getCIQVariantMetadata(): CIQVariantMetadata[] {
  return CIQ_VARIANT_METADATA;
}

/**
 * Get primary CIQ variant (1-color light-mode)
 */
export function getPrimaryCIQVariant(): CIQVariantMetadata {
  return CIQ_VARIANT_METADATA.find(v => v.isPrimary) || CIQ_VARIANT_METADATA[0];
}

/**
 * Check if a brand/product is CIQ company logo
 */
export function isCIQCompanyLogo(productId: string): boolean {
  return productId.toLowerCase() === 'ciq';
}

/**
 * Get user-friendly description of what will be downloaded
 */
export function getQuickDownloadDescription(productId: string): string {
  const defaults = getProductDefaults(productId);
  
  if (isCIQCompanyLogo(productId)) {
    const ciqVariant = getPrimaryCIQVariant();
    return `${defaults.format.toUpperCase()} • ${ciqVariant.colorVariant} • ${ciqVariant.backgroundMode} mode`;
  }
  
  return `${defaults.format.toUpperCase()} • ${defaults.variant} • ${defaults.colorMode} • ${defaults.size !== 512 || defaults.format === 'svg' ? '' : '512px'}`.replace('  ', ' ').trim();
}