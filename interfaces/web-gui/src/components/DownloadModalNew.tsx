'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { X, Download, ChevronRight, ChevronDown } from 'lucide-react';
import { convertSvgToRaster, isSvgUrl, getFileExtension } from '@/lib/svgConverter';
import { manipulateSvgColors, BRAND_COLORS } from '@/lib/svgColorTest';
import { getVariantMetadata, getPrimaryVariant, isCIQCompanyLogo, getCIQVariantMetadata, getPrimaryCIQVariant } from '@/lib/productDefaults';

interface DownloadModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
}

type ColorMode = 'light' | 'dark';
type LogoVariant = 'horizontal' | 'vertical' | 'symbol';
type ColorChoice = 'neutral' | 'green';
type AssetType = 'svg' | 'png' | 'jpg';
type SizeChoice = 'S' | 'M' | 'L' | 'Custom';

// Visual height sizing - consistent optical size across orientations
const VISUAL_HEIGHT_MAP = {
  S: 128,  // Small visual height
  M: 256,  // Medium visual height  
  L: 512   // Large visual height
};

export default function DownloadModalNew({ asset, isOpen, onClose }: DownloadModalProps) {
  // Extract product name from asset for dynamic variant generation
  const getProductName = (asset: Asset): string => {
    // Try to get from brand first, then parse from ID
    if (asset.brand) {
      return asset.brand.toLowerCase();
    }
    // Parse from asset ID (format: "product-variant")
    const productMatch = asset.id.split('-')[0];
    return productMatch || 'fuzzball'; // fallback
  };

  const productName = getProductName(asset);
  const isCIQLogo = isCIQCompanyLogo(productName);

  // State declarations first
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced options  
  const [colorChoice, setColorChoice] = useState<ColorChoice>('neutral');
  const [assetType, setAssetType] = useState<AssetType>('png'); // PNG with transparency as default
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>('M');
  const [customSize, setCustomSize] = useState<string>('256'); // Default to medium visual height
  
  // State
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Generate dynamic variants based on asset type
  const getDynamicVariants = () => {
    if (isCIQLogo) {
      // CIQ company logo variants: show 1-color and 2-color for current mode
      const ciqVariants = getCIQVariantMetadata();
      const currentModeVariants = ciqVariants.filter(variant => 
        variant.backgroundMode === colorMode
      );
      
      return currentModeVariants.map(variant => {
        const filename = `CIQ_logo_${variant.colorVariant === '1-color' ? '1clr' : '2clr'}_${variant.backgroundMode}mode.svg`;
        
        return {
          id: variant.colorVariant, // Use color variant as ID (1-color or 2-color)
          displayName: variant.displayName.replace(` (${variant.backgroundMode === 'dark' ? 'Dark' : ''})`, ''), // Clean name
          aspectRatio: 'aspect-[2/1]', // CIQ logos are wider
          logoPath: `/assets/global/CIQ_logos/${filename}`
        };
      });
    }
    
    // Product logo variants: horizontal/vertical/symbol
    const variantMetadata = getVariantMetadata(productName);
    const baseUrl = asset.url;
    
    return variantMetadata.map(variant => {
      // Generate the variant URL by constructing it properly for each product
      // Handle patterns like: Fuzzball_logo_h-blk.svg, WarewulfPro_logo_h-blk.svg, etc.
      let variantUrl = baseUrl;
      const variantSuffix = variant.variant === 'horizontal' ? 'h' : variant.variant === 'vertical' ? 'v' : 'symbol';
      
      // More robust regex that handles different product naming patterns
      // Matches: ProductName_logo_(h|v|symbol)-blk.svg
      const logoPattern = /(.*_logo_)(symbol|v|h)(-blk\.svg)$/;
      const match = baseUrl.match(logoPattern);
      
      if (match) {
        // If the URL matches our expected pattern, replace the variant part
        variantUrl = `${match[1]}${variantSuffix}${match[3]}`;
      } else {
        // Fallback: try to construct URL from the base by extracting directory and product name
        const urlParts = baseUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const basePath = urlParts.slice(0, -1).join('/');
        
        // Try to extract product name from filename (e.g., "WarewulfPro_logo_h-blk.svg" -> "WarewulfPro")
        const productMatch = fileName.match(/^([^_]+(?:Pro)?)/);
        if (productMatch) {
          const productName = productMatch[1];
          variantUrl = `${basePath}/${productName}_logo_${variantSuffix}-blk.svg`;
        }
      }
      
      console.log(`Variant ${variant.variant}: ${baseUrl} → ${variantUrl}`);
      
      return {
        id: variant.variant,
        displayName: variant.displayName,
        aspectRatio: variant.variant === 'horizontal' ? 'aspect-[4/3]' : 'aspect-square',
        logoPath: variantUrl
      };
    });
  };

  // Regenerate variants when color mode changes (for CIQ logos)
  const variants = getDynamicVariants();

  // Get primary variant based on asset type
  const getInitialVariant = () => {
    if (isCIQLogo) {
      const primaryCIQ = getPrimaryCIQVariant();
      return `${primaryCIQ.colorVariant}-${primaryCIQ.backgroundMode}`;
    } else {
      const primaryProduct = getPrimaryVariant(productName);
      return primaryProduct.variant;
    }
  };

  // Initialize selectedVariant after states are set
  useEffect(() => {
    if (!selectedVariant) {
      setSelectedVariant(getInitialVariant());
    }
  }, [selectedVariant]);

  const isOriginalSvg = asset.fileType.toLowerCase() === 'svg' || asset.url.toLowerCase().includes('.svg');

  // Generate preview based on color mode and color choice
  useEffect(() => {
    if (!isOpen || !isOriginalSvg) {
      setPreviewUrl(asset.thumbnailUrl || asset.url);
      return;
    }

    const generatePreview = async () => {
      try {
        const response = await fetch(asset.url);
        const svgContent = await response.text();
        
        let processedSvg = svgContent;
        
        // Apply color based on mode and choice
        if (colorMode === 'dark') {
          // Dark mode = logo will be on dark background, so use light logo
          processedSvg = manipulateSvgColors(svgContent, '#FFFFFF');
        } else if (colorChoice === 'green') {
          // Light mode with green color choice
          processedSvg = manipulateSvgColors(svgContent, BRAND_COLORS['brand-green']);
        }
        // else: light mode with neutral = use original (likely dark) colors
        
        const encodedSvg = btoa(unescape(encodeURIComponent(processedSvg)));
        setPreviewUrl(`data:image/svg+xml;base64,${encodedSvg}`);
      } catch (error) {
        console.error('Preview generation failed:', error);
        setPreviewUrl(asset.thumbnailUrl || asset.url);
      }
    };

    generatePreview();
  }, [isOpen, colorMode, colorChoice, asset.url, asset.thumbnailUrl, isOriginalSvg]);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Calculate optical scaling based on visual height while preserving aspect ratios
  const getOpticalScaling = () => {
    const visualHeight = sizeChoice === 'Custom' 
      ? parseInt(customSize) || 256 
      : VISUAL_HEIGHT_MAP[sizeChoice];
    
    // Get the selected variant's URL to extract original SVG dimensions
    const selectedVariantData = variants.find(v => v.id === selectedVariant);
    const variantUrl = selectedVariantData?.logoPath || asset.url;
    
    // Extract viewBox dimensions from SVG if possible, otherwise use known ratios
    // For now, use the known aspect ratios from the actual SVG files:
    let originalAspectRatio: number;
    
    if (selectedVariant === 'horizontal') {
      // Fuzzball horizontal: viewBox="0 0 733.5 221.9" = 3.3:1 ratio
      originalAspectRatio = 733.5 / 221.9;
    } else if (selectedVariant === 'vertical') {
      // Fuzzball vertical: viewBox="0 0 497.28125 444.66988" = 1.12:1 ratio  
      originalAspectRatio = 497.28125 / 444.66988;
    } else {
      // Fuzzball symbol: viewBox="0 0 309.3 304" = 1.02:1 ratio
      originalAspectRatio = 309.3 / 304;
    }
    
    // Scale by visual height, preserve original aspect ratio
    return {
      height: visualHeight,
      width: Math.round(visualHeight * originalAspectRatio)
    };
  };

  const generateFileName = () => {
    const baseName = productName.toLowerCase();
    const variant = selectedVariant !== 'horizontal' ? `-${selectedVariant}` : '';
    const color = colorChoice === 'green' ? '-green' : '';
    const mode = colorMode === 'dark' ? '-light-on-dark' : '';
    const scaling = getOpticalScaling();
    const size = assetType !== 'svg' ? `-${scaling.height}h` : '';
    const ext = assetType === 'jpg' ? 'jpg' : assetType;
    return `${baseName}${variant}${color}${mode}${size}.${ext}`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      let blob: Blob;
      
      if (assetType === 'svg') {
        // SVG download
        const response = await fetch(asset.url);
        let svgContent = await response.text();
        
        if (colorChoice === 'green') {
          svgContent = manipulateSvgColors(svgContent, BRAND_COLORS['brand-green']);
        }
        
        blob = new Blob([svgContent], { type: 'image/svg+xml' });
      } else {
        // Raster conversion with optical scaling
        const scaling = getOpticalScaling();
        
        // Get the correct variant URL for the selected orientation
        const selectedVariantData = variants.find(v => v.id === selectedVariant);
        let sourceUrl = selectedVariantData?.logoPath || asset.url;
        console.log('Converting variant:', selectedVariant, 'from URL:', sourceUrl);
        
        // Apply color modifications  
        if (colorChoice === 'green' || colorMode === 'dark') {
          try {
            const response = await fetch(sourceUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
            }
            const svgContent = await response.text();
            let processedSvg = svgContent;
            
            if (colorMode === 'dark') {
              // Dark mode = white/light logos for dark backgrounds
              processedSvg = manipulateSvgColors(svgContent, '#FFFFFF');
            } else if (colorChoice === 'green') {
              processedSvg = manipulateSvgColors(svgContent, BRAND_COLORS['brand-green']);
            }
            
            const encodedSvg = btoa(unescape(encodeURIComponent(processedSvg)));
            sourceUrl = `data:image/svg+xml;base64,${encodedSvg}`;
          } catch (fetchError) {
            console.error('Failed to fetch SVG for color modification:', fetchError);
            // Continue with original URL if color modification fails
          }
        }
        
        // Direct SVG to raster conversion to avoid CORS issues
        try {
          // Always fetch the SVG content first to avoid CORS issues
          let svgContent: string;
          
          if (sourceUrl.startsWith('data:image/svg+xml')) {
            // Already processed SVG data URL
            const base64Data = sourceUrl.split(',')[1];
            svgContent = atob(base64Data);
          } else {
            // Fetch SVG content directly
            const response = await fetch(sourceUrl);
            if (!response.ok) {
              throw new Error(`Failed to fetch SVG: ${response.status} ${response.statusText}`);
            }
            svgContent = await response.text();
          }
          
          // Create data URL from SVG content
          const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
          console.log('Created data URL for conversion, length:', dataUrl.length);
          console.log('Target dimensions:', scaling.width, 'x', scaling.height);
          
          // Convert using data URL to avoid CORS
          try {
            blob = await convertSvgToRaster(dataUrl, {
              format: assetType === 'jpg' ? 'jpeg' : 'png',
              width: scaling.width,
              height: scaling.height,
              quality: assetType === 'jpg' ? 0.92 : undefined,
              backgroundColor: assetType === 'jpg' ? '#FFFFFF' : undefined
            });
            console.log('Conversion successful, blob size:', blob.size);
          } catch (rasterError) {
            console.error('Raster conversion failed, trying direct canvas approach:', rasterError);
            
            // Fallback: Direct canvas conversion
            blob = await new Promise<Blob>((resolve, reject) => {
              const img = new Image();
              img.onload = () => {
                try {
                  const canvas = document.createElement('canvas');
                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('Cannot get canvas context');
                  
                  canvas.width = scaling.width;
                  canvas.height = scaling.height;
                  
                  // Clear with transparent or white background
                  if (assetType === 'jpg') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                  }
                  
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  
                  canvas.toBlob((canvasBlob) => {
                    if (canvasBlob) {
                      resolve(canvasBlob);
                    } else {
                      reject(new Error('Canvas to blob conversion failed'));
                    }
                  }, `image/${assetType === 'jpg' ? 'jpeg' : 'png'}`, assetType === 'jpg' ? 0.92 : undefined);
                } catch (canvasError) {
                  reject(canvasError);
                }
              };
              img.onerror = () => reject(new Error('Image load failed in fallback'));
              img.src = dataUrl;
            });
            console.log('Direct canvas conversion successful, blob size:', blob.size);
          }
        } catch (conversionError) {
          console.error('SVG conversion failed:', conversionError);
          throw new Error(`Failed to convert SVG to ${assetType.toUpperCase()}: ${conversionError instanceof Error ? conversionError.message : 'Unknown error'}`);
        }
      }
      
      // Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = generateFileName();
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      onClose();
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-[#2a2d33] rounded-lg shadow-xl p-6 w-[507px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">
            Download fuzzball logo
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Color Mode */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Color mode
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-600">
            <button
              onClick={() => setColorMode('light')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-r border-gray-600 ${
                colorMode === 'light' 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-transparent text-gray-300 hover:bg-gray-600'
              }`}
            >
              Light mode
            </button>
            <button
              onClick={() => setColorMode('dark')}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                colorMode === 'dark' 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-transparent text-gray-300 hover:bg-gray-600'
              }`}
            >
              Dark mode
            </button>
          </div>
        </div>

        {/* Select Variant */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Select variant
          </label>
          <div className="grid grid-cols-3 gap-3">
            {variants.map(({ id, displayName, aspectRatio, logoPath }) => {
              // Get the actual logo variant with proper coloring
              const getVariantContent = () => {
                // For CIQ logos, never apply color manipulation - use provided files as-is
                if (isCIQLogo) {
                  return (
                    <div className="flex items-center justify-center w-full h-full p-2">
                      <img 
                        src={logoPath}
                        alt={`${id} logo variant`}
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  );
                }
                
                // For product logos, apply color manipulation based on mode and choice
                const logoStyle = (() => {
                  if (colorMode === 'dark') {
                    // Dark mode: use white/light logos
                    return { filter: 'invert(1)' };
                  } else if (colorChoice === 'green') {
                    // Light mode with green choice
                    return { filter: 'sepia(1) saturate(5) hue-rotate(140deg) brightness(0.8)' };
                  } else {
                    // Light mode with neutral: use dark logos (no filter needed)
                    return { filter: 'none' };
                  }
                })();
                
                // Use the specific logo variant file for each layout
                return (
                  <div className="flex items-center justify-center w-full h-full p-2">
                    <img 
                      src={logoPath}
                      alt={`${id} logo variant`}
                      className="max-w-full max-h-full object-contain"
                      style={logoStyle}
                    />
                  </div>
                );
              };
              
              return (
                <div key={id} className="flex flex-col items-center">
                  <button
                    onClick={() => setSelectedVariant(id)}
                    className={`aspect-square rounded-lg border-2 transition-all p-4 flex items-center justify-center w-full`}
                    style={{
                      opacity: selectedVariant === id ? 1.0 : 0.35,
                      backgroundColor: colorMode === 'light' 
                        ? '#f3f4f6'  // Light gray background for light mode
                        : '#4b5563',  // Dark background for dark mode
                      borderColor: colorMode === 'light'
                        ? '#d1d5db'   // Light border for light mode
                        : '#6b7280'   // Dark border for dark mode
                    }}
                  >
                    {getVariantContent()}
                  </button>
                  <label className="text-xs text-gray-400 mt-2 text-center">
                    {displayName.replace(' Logo', '')}
                  </label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-6">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            ADVANCED OPTIONS
            {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {showAdvanced && (
            <div className="mt-4 space-y-6">
              {/* Color */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Color
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-600">
                  <button
                    onClick={() => setColorChoice('neutral')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors border-r border-gray-600 ${
                      colorChoice === 'neutral' 
                        ? 'bg-gray-500 text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Neutral
                  </button>
                  <button
                    onClick={() => setColorChoice('green')}
                    className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                      colorChoice === 'green' 
                        ? 'bg-gray-500 text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Green
                  </button>
                </div>
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Asset type
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-600">
                  <button
                    onClick={() => setAssetType('svg')}
                    className={`flex-1 py-3 px-2 text-center transition-colors border-r border-gray-600 ${
                      assetType === 'svg' 
                        ? 'bg-gray-500 text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">SVG</div>
                    <div className="text-xs opacity-75">(scalable)</div>
                  </button>
                  <button
                    onClick={() => setAssetType('png')}
                    className={`flex-1 py-3 px-2 text-center transition-colors border-r border-gray-600 ${
                      assetType === 'png' 
                        ? 'bg-gray-500 text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">PNG</div>
                    <div className="text-xs opacity-75">(transparent BG)</div>
                  </button>
                  <button
                    onClick={() => setAssetType('jpg')}
                    className={`flex-1 py-3 px-2 text-center transition-colors ${
                      assetType === 'jpg' 
                        ? 'bg-gray-500 text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    <div className="text-sm font-medium">JPG</div>
                    <div className="text-xs opacity-75">(scalable)</div>
                  </button>
                </div>
              </div>

              {/* Size */}
              {assetType !== 'svg' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Size
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-600">
                    {(['S', 'M', 'L', 'Custom'] as const).map((size, index) => (
                      <button
                        key={size}
                        onClick={() => setSizeChoice(size)}
                        className={`flex-1 py-3 px-2 text-sm font-medium transition-colors ${
                          index < 3 ? 'border-r border-gray-600' : ''
                        } ${
                          sizeChoice === size 
                            ? 'bg-gray-500 text-white' 
                            : 'bg-transparent text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {sizeChoice === 'Custom' && (
                    <input
                      type="number"
                      value={customSize}
                      onChange={(e) => setCustomSize(e.target.value)}
                      className="mt-3 w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                      placeholder="512"
                      min="1"
                      max="4096"
                    />
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="mb-6 p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-300 leading-relaxed">
            Descriptive usage instructions go here. Keep them concise and actionable. Descriptive usage instructions go here.
          </p>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download size={16} />
          {isDownloading ? 'PREPARING...' : 'DOWNLOAD'}
        </button>
      </div>
    </div>
  );
}