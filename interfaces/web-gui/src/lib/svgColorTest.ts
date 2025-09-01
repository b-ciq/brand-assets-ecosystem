// Simple SVG color manipulation utility for testing
export function manipulateSvgColors(svgContent: string, targetColor: string): string {
  // Replace explicit fill colors
  let modifiedSvg = svgContent.replace(/fill="[^"]*"/g, `fill="${targetColor}"`);
  
  // For SVGs without explicit fills, add fill to the root SVG element
  if (!svgContent.includes('fill=')) {
    modifiedSvg = modifiedSvg.replace('<svg', `<svg fill="${targetColor}"`);
  }
  
  // Also handle paths without fills (they inherit from parent)
  modifiedSvg = modifiedSvg.replace(/<path(?![^>]*fill=)/g, `<path fill="${targetColor}"`);
  modifiedSvg = modifiedSvg.replace(/<polygon(?![^>]*fill=)/g, `<polygon fill="${targetColor}"`);
  modifiedSvg = modifiedSvg.replace(/<rect(?![^>]*fill=)/g, `<rect fill="${targetColor}"`);
  
  return modifiedSvg;
}

// Test function to create colored versions
export async function testSvgColoring() {
  const svgPaths = [
    '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/core-mcp-dev/assets/products/fuzzball/logos/Fuzzball_logo_h-blk.svg',
    '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/core-mcp-dev/assets/products/fuzzball/logos/Fuzzball_logo_v-blk.svg',
    '/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/core-mcp-dev/assets/products/fuzzball/logos/Fuzzball_logo_symbol-blk.svg'
  ];

  const testColors = {
    black: '#000000',
    white: '#FFFFFF', 
    green: '#097049',
    blue: '#0066CC'
  };

  console.log('Testing SVG color manipulation:');
  
  for (const svgPath of svgPaths) {
    const fileName = svgPath.split('/').pop();
    console.log(`\nTesting: ${fileName}`);
    
    try {
      const response = await fetch(svgPath.replace('/Users/bchristensen/Documents/GitHub/brand-assets-ecosystem/core-mcp-dev/', '/'));
      const svgContent = await response.text();
      
      for (const [colorName, colorValue] of Object.entries(testColors)) {
        const coloredSvg = manipulateSvgColors(svgContent, colorValue);
        const dataUrl = `data:image/svg+xml;base64,${btoa(coloredSvg)}`;
        console.log(`${colorName} version data URL length:`, dataUrl.length);
      }
      
    } catch (error) {
      console.error(`Failed to process ${fileName}:`, error);
    }
  }
}

// Brand color presets
export const BRAND_COLORS = {
  'black': '#000000',
  'white': '#FFFFFF',
  'brand-green': '#097049',
  'dark-green': '#075a37',
  'light-gray': '#cecfd2',
  'dark-gray': '#85888e'
} as const;

export type BrandColor = keyof typeof BRAND_COLORS;