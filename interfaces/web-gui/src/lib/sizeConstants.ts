/**
 * Centralized size constants for brand asset downloads
 * 
 * Width-based sizing system with fixed aspect ratios:
 * - S: 512px width (Small)
 * - M: 1024px width (Medium) - Default
 * - L: 2048px width (Large)
 * 
 * All assets maintain their original aspect ratios.
 * Height is calculated automatically based on width.
 */

export type SizeChoice = 'S' | 'M' | 'L' | 'Custom Width';

// Width-based size presets (pixels)
export const SIZE_PRESETS = {
  S: 512,   // Small: 512px width
  M: 1024,  // Medium: 1024px width (default)
  L: 2048   // Large: 2048px width
} as const;

// Default size choice
export const DEFAULT_SIZE: SizeChoice = 'M';

// Default pixel value for quick downloads and fallbacks
export const DEFAULT_SIZE_PIXELS = SIZE_PRESETS[DEFAULT_SIZE];

// Size choice display labels
export const SIZE_LABELS = {
  S: 'Small (512px)',
  M: 'Medium (1024px)', 
  L: 'Large (2048px)',
  'Custom Width': 'Custom Width'
} as const;

// Custom size constraints
export const CUSTOM_SIZE_CONSTRAINTS = {
  min: 50,    // Minimum custom size
  max: 5000,  // Maximum custom size (reasonable range for logos)
  default: DEFAULT_SIZE_PIXELS
} as const;

// Helper function to get pixel value for any size choice
export function getSizePixels(choice: SizeChoice, customValue?: string | number): number {
  if (choice === 'Custom Width') {
    const customPixels = typeof customValue === 'string' 
      ? parseInt(customValue) 
      : customValue;
    
    // Return parsed value if valid, otherwise fallback to default
    if (!customPixels || isNaN(customPixels) || customPixels < CUSTOM_SIZE_CONSTRAINTS.min || customPixels > CUSTOM_SIZE_CONSTRAINTS.max) {
      return CUSTOM_SIZE_CONSTRAINTS.default;
    }
    
    return customPixels;
  }
  
  return SIZE_PRESETS[choice];
}

// Helper function to validate custom size and get error message
export function validateCustomSize(value: string | number): { isValid: boolean; errorMessage?: string } {
  const pixels = typeof value === 'string' ? parseInt(value) : value;
  
  if (!pixels || isNaN(pixels)) {
    return {
      isValid: false,
      errorMessage: `Size not supported, choose a range between ${CUSTOM_SIZE_CONSTRAINTS.min}-${CUSTOM_SIZE_CONSTRAINTS.max}px`
    };
  }
  
  if (pixels < CUSTOM_SIZE_CONSTRAINTS.min || pixels > CUSTOM_SIZE_CONSTRAINTS.max) {
    return {
      isValid: false,
      errorMessage: `Size not supported, choose a range between ${CUSTOM_SIZE_CONSTRAINTS.min}-${CUSTOM_SIZE_CONSTRAINTS.max}px`
    };
  }
  
  return { isValid: true };
}

// Helper function to get size choice from pixel value (for reverse lookup)
export function getSizeChoiceFromPixels(pixels: number): SizeChoice {
  // Find exact match first
  for (const [key, value] of Object.entries(SIZE_PRESETS)) {
    if (value === pixels) {
      return key as SizeChoice;
    }
  }
  
  // No exact match, return Custom Width
  return 'Custom Width';
}