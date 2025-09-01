export interface ConversionOptions {
  format: 'png' | 'jpeg';
  width: number;
  height?: number; // If not provided, maintains aspect ratio
  quality?: number; // 0-1, only for JPEG
  backgroundColor?: string; // For JPEG background
  svgColor?: string; // Color to apply to SVG before conversion
}

export async function convertSvgToRaster(svgUrl: string, options: ConversionOptions): Promise<Blob> {
  // First try to fetch the content and convert to data URL to avoid CORS issues
  try {
    const dataUrl = await fetchSvgAsDataUrl(svgUrl, options.svgColor);
    return await convertDataUrlToRaster(dataUrl, options);
  } catch (error) {
    // Fallback: try direct loading with CORS (might work for same-origin)
    console.warn('Data URL conversion failed, trying direct image loading:', error);
    return await convertImageToRaster(svgUrl, options);
  }
}

async function convertDataUrlToRaster(dataUrl: string, options: ConversionOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      try {
        const canvas = renderImageToCanvas(img, options);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          `image/${options.format}`,
          options.format === 'jpeg' ? (options.quality || 0.92) : undefined
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image from data URL'));
    };
    
    img.src = dataUrl;
  });
}

async function convertImageToRaster(imageUrl: string, options: ConversionOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = renderImageToCanvas(img, options);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert canvas to blob'));
            }
          },
          `image/${options.format}`,
          options.format === 'jpeg' ? (options.quality || 0.92) : undefined
        );
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image - this may be due to CORS restrictions'));
    };
    
    img.src = imageUrl;
  });
}

function renderImageToCanvas(img: HTMLImageElement, options: ConversionOptions): HTMLCanvasElement {
  // Calculate dimensions
  const aspectRatio = img.naturalWidth / img.naturalHeight;
  const width = options.width;
  const height = options.height || Math.round(width / aspectRatio);
  
  // Create canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Could not get canvas context');
  }
  
  // Set canvas size
  canvas.width = width;
  canvas.height = height;
  
  // Set background for JPEG (PNG supports transparency)
  if (options.format === 'jpeg') {
    ctx.fillStyle = options.backgroundColor || '#FFFFFF';
    ctx.fillRect(0, 0, width, height);
  }
  
  // Draw the image onto canvas
  ctx.drawImage(img, 0, 0, width, height);
  
  return canvas;
}

async function fetchSvgAsDataUrl(url: string, svgColor?: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    let svgText = await response.text();
    
    // Apply color manipulation if requested
    if (svgColor) {
      svgText = manipulateSvgColors(svgText, svgColor);
    }
    
    // Clean up the SVG text and encode it
    const cleanSvg = svgText.trim();
    const encodedSvg = btoa(unescape(encodeURIComponent(cleanSvg)));
    
    return `data:image/svg+xml;base64,${encodedSvg}`;
  } catch (error) {
    throw new Error(`Failed to fetch SVG: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Simple SVG color manipulation
function manipulateSvgColors(svgContent: string, targetColor: string): string {
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

// Utility function to detect if a URL is likely an SVG
export function isSvgUrl(url: string): boolean {
  const urlLower = url.toLowerCase();
  return urlLower.includes('.svg') || 
         urlLower.startsWith('data:image/svg+xml') ||
         urlLower.includes('svg') ||
         // Many brand asset systems serve SVGs without .svg extension
         // Let's be more permissive and try to convert any vector-like asset
         urlLower.includes('vector') ||
         urlLower.includes('logo');
}

// Get file extension based on format
export function getFileExtension(format: 'svg' | 'png' | 'jpeg'): string {
  return format === 'jpeg' ? 'jpg' : format;
}