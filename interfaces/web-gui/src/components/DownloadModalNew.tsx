'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { X, Download, ChevronRight, ChevronDown } from 'lucide-react';
import { convertSvgToRaster, isSvgUrl, getFileExtension } from '@/lib/svgConverter';
import { manipulateSvgColors, BRAND_COLORS } from '@/lib/svgColorTest';
import { getVariantMetadata, getPrimaryVariant, isCIQCompanyLogo, getCIQVariantMetadata, getPrimaryCIQVariant } from '@/lib/productDefaults';
import { SizeChoice, SIZE_PRESETS, DEFAULT_SIZE, getSizePixels, SIZE_LABELS, CUSTOM_SIZE_CONSTRAINTS, validateCustomSize } from '@/lib/sizeConstants';

interface DownloadModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
}

type ColorMode = 'light' | 'dark';
type LogoVariant = 'horizontal' | 'vertical' | 'symbol';
type AssetType = 'svg' | 'png' | 'jpg';

// Width-based sizing system - now using centralized constants
// S: 512px, M: 1024px, L: 2048px width with maintained aspect ratios

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
  const [selectedVariantIndex, setSelectedVariantIndex] = useState<number>(0); // Track position for mode switching
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Handler for color mode changes with position persistence
  const handleColorModeChange = (newMode: ColorMode) => {
    setColorMode(newMode);
    
    // Keep the same variant position when switching modes
    // This will be called after colorMode state updates, triggering variant recalculation
  };
  
  // Advanced options
  const [assetType, setAssetType] = useState<AssetType>('png'); // PNG with transparency as default
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>(DEFAULT_SIZE);
  const [customSize, setCustomSize] = useState<string>(CUSTOM_SIZE_CONSTRAINTS.default.toString()); // Default to medium width
  const [customSizeError, setCustomSizeError] = useState<string>(''); // Error message for invalid custom size
  
  // State
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Smart variant selection system - works for defaults and future MCP integration
  const selectVariantByIndex = (variants: any[], targetIndex: number = 0) => {
    if (variants.length === 0) return;
    
    // Ensure index is within bounds, fallback to 0 if not
    const safeIndex = targetIndex < variants.length ? targetIndex : 0;
    setSelectedVariant(variants[safeIndex].id);
    setSelectedVariantIndex(safeIndex);
  };

  // Initialize selection when modal opens
  useEffect(() => {
    if (isOpen && !selectedVariant) {
      const variants = getDynamicVariants();
      // Use smart default selection (future MCP can override selectedVariantIndex)
      selectVariantByIndex(variants, selectedVariantIndex);
    }
  }, [isOpen]);
  
  // Handle variant updates when colorMode changes (maintain position)
  useEffect(() => {
    if (isOpen) {
      const variants = getDynamicVariants();
      // Maintain the same position when variants change due to mode switching
      selectVariantByIndex(variants, selectedVariantIndex);
    }
  }, [colorMode, isOpen]); // Trigger when colorMode changes

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
          aspectRatio: 'aspect-square', // Square thumbnails
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
        aspectRatio: 'aspect-square', // All thumbnails are square
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
        
        // Apply color based on mode
        if (colorMode === 'dark') {
          // Dark mode = logo will be on dark background, so use light logo
          processedSvg = manipulateSvgColors(svgContent, '#FFFFFF');
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
  }, [isOpen, colorMode, asset.url, asset.thumbnailUrl, isOriginalSvg]);

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

  // Calculate scaling preserving original SVG aspect ratios - NEVER distort logos
  const getOpticalScaling = () => {
    const targetWidth = getSizePixels(sizeChoice, customSize);
    
    // Width-based scaling system: specify width, let height scale naturally to preserve aspect ratio
    // The SVG converter will maintain the original aspect ratio automatically
    return {
      width: targetWidth,
      // Don't specify height - let SVG converter preserve original aspect ratio
      height: undefined
    };
  };

  const generateFileName = () => {
    const baseName = productName.toLowerCase();
    const variant = selectedVariant !== 'horizontal' ? `-${selectedVariant}` : '';
    const mode = colorMode === 'dark' ? '-light-on-dark' : '';
    const scaling = getOpticalScaling();
    const size = assetType !== 'svg' ? `-${scaling.width}px` : '';
    const ext = assetType === 'jpg' ? 'jpg' : assetType;
    return `${baseName}${variant}${mode}${size}.${ext}`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      let blob: Blob;
      
      if (assetType === 'svg') {
        // SVG download
        const response = await fetch(asset.url);
        let svgContent = await response.text();
        
        
        blob = new Blob([svgContent], { type: 'image/svg+xml' });
      } else {
        // Raster conversion with width-based scaling
        const scaling = getOpticalScaling();
        
        // Get the correct variant URL for the selected orientation
        const selectedVariantData = variants.find(v => v.id === selectedVariant);
        let sourceUrl = selectedVariantData?.logoPath || asset.url;
        console.log('Converting variant:', selectedVariant, 'from URL:', sourceUrl);
        
        // Apply color modifications  
        if (colorMode === 'dark') {
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
          
          // Convert using data URL to avoid CORS - preserve aspect ratio
          try {
            const getJpegBackgroundColor = () => {
              if (assetType === 'jpg') {
                // Use the same colorMode state as the preview and UI
                return colorMode === 'dark' ? '#13161b' : '#FFFFFF'; // dark-mode-900 : white
              }
              return undefined;
            };

            const conversionOptions: any = {
              format: assetType === 'jpg' ? 'jpeg' : 'png',
              height: scaling.height,
              quality: assetType === 'jpg' ? 0.92 : undefined,
              backgroundColor: getJpegBackgroundColor()
            };
            
            // Only specify width if it's defined (preserve aspect ratio when undefined)
            if (scaling.width) {
              conversionOptions.width = scaling.width;
            }
            
            blob = await convertSvgToRaster(dataUrl, conversionOptions);
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
                  
                  // Calculate proper dimensions preserving aspect ratio
                  const aspectRatio = img.naturalWidth / img.naturalHeight;
                  canvas.width = scaling.width;
                  canvas.height = scaling.height || Math.round(scaling.width / aspectRatio);
                  
                  // Apply theme-appropriate background for JPEG
                  if (assetType === 'jpg') {
                    // Use the same colorMode state as the preview and UI
                    const bgColor = colorMode === 'dark' ? '#13161b' : '#FFFFFF';
                    ctx.fillStyle = bgColor;
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
        className="relative rounded-lg shadow-xl p-6 w-[507px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        style={{ 
          backgroundColor: 'rgba(9, 9, 11, 0.85)',
          backdropFilter: 'blur(60px)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {asset.displayName || asset.title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-700 transition-colors text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Color Mode */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Color mode
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-600">
            <button
              onClick={() => handleColorModeChange('light')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors border-r border-gray-600 ${
                colorMode === 'light' 
                  ? 'text-white' 
                  : 'bg-transparent text-gray-300 hover:bg-gray-600'
              }`}
              style={{
                backgroundColor: colorMode === 'light' ? 'var(--quantic-bg-active)' : 'transparent'
              }}
            >
              Light mode
            </button>
            <button
              onClick={() => handleColorModeChange('dark')}
              className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                colorMode === 'dark' 
                  ? 'text-white' 
                  : 'bg-transparent text-gray-300 hover:bg-gray-600'
              }`}
              style={{
                backgroundColor: colorMode === 'dark' ? 'var(--quantic-bg-active)' : 'transparent'
              }}
            >
              Dark mode
            </button>
          </div>
        </div>

        {/* Select Variant */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Select variant
          </label>
          <div className="grid grid-cols-3 gap-2">
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
                <button
                  key={id}
                  onClick={() => {
                    setSelectedVariant(id);
                    // Update the index when user manually selects a variant
                    const variantIndex = variants.findIndex(v => v.id === id);
                    setSelectedVariantIndex(variantIndex);
                  }}
                  className={`rounded-lg border-2 transition-all p-2 flex items-center justify-center w-full`}
                  style={{
                    aspectRatio: '1 / 1', // Enforce perfect 1:1 square ratio
                    opacity: selectedVariant === id ? 1.0 : 0.35,
                    backgroundColor: colorMode === 'light' 
                      ? '#f3f4f6'  // Light gray background for light mode
                      : 'var(--quantic-bg-primary)',  // Dark background for dark mode
                    borderColor: colorMode === 'light'
                      ? '#d1d5db'   // Light border for light mode
                      : 'var(--quantic-border-primary)'   // Dark border for dark mode
                  }}
                >
                  {getVariantContent()}
                </button>
              );
            })}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="mb-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            ADVANCED OPTIONS
            {showAdvanced ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          {showAdvanced && (
            <div className="mt-3 space-y-4">
              {/* Asset Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Asset type
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-600">
                  <button
                    onClick={() => setAssetType('svg')}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors border-r border-gray-600 ${
                      assetType === 'svg' 
                        ? 'text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                    style={{
                      backgroundColor: assetType === 'svg' ? 'var(--quantic-bg-active)' : 'transparent'
                    }}
                  >
                    SVG
                  </button>
                  <button
                    onClick={() => setAssetType('png')}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors border-r border-gray-600 ${
                      assetType === 'png' 
                        ? 'text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                    style={{
                      backgroundColor: assetType === 'png' ? 'var(--quantic-bg-active)' : 'transparent'
                    }}
                  >
                    PNG
                  </button>
                  <button
                    onClick={() => setAssetType('jpg')}
                    className={`flex-1 py-2 px-4 text-sm font-medium transition-colors ${
                      assetType === 'jpg' 
                        ? 'text-white' 
                        : 'bg-transparent text-gray-300 hover:bg-gray-600'
                    }`}
                    style={{
                      backgroundColor: assetType === 'jpg' ? 'var(--quantic-bg-active)' : 'transparent'
                    }}
                  >
                    JPG
                  </button>
                </div>
              </div>

              {/* Size */}
              {assetType !== 'svg' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Size
                  </label>
                  <div className="flex rounded-lg overflow-hidden border border-gray-600">
                    {(['S', 'M', 'L', 'Custom Width'] as const).map((size, index) => (
                      <button
                        key={size}
                        onClick={() => setSizeChoice(size)}
                        className={`flex-1 py-2 px-2 text-sm font-medium transition-colors ${
                          index < 3 ? 'border-r border-gray-600' : ''
                        } ${
                          sizeChoice === size 
                            ? 'text-white' 
                            : 'bg-transparent text-gray-300 hover:bg-gray-600'
                        }`}
                        style={{
                          backgroundColor: sizeChoice === size ? 'var(--quantic-bg-active)' : 'transparent'
                        }}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  {sizeChoice === 'Custom Width' && (
                    <div>
                      <input
                        type="number"
                        value={customSize}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setCustomSize(newValue);
                          // Validate and set error message
                          const validation = validateCustomSize(newValue);
                          setCustomSizeError(validation.errorMessage || '');
                        }}
                        className="mt-2 w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:border-green-500 focus:outline-none"
                        placeholder={CUSTOM_SIZE_CONSTRAINTS.default.toString()}
                        min={CUSTOM_SIZE_CONSTRAINTS.min.toString()}
                        max={CUSTOM_SIZE_CONSTRAINTS.max.toString()}
                      />
                      {customSizeError && (
                        <div className="mt-1 text-sm text-red-400">
                          {customSizeError}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Usage Instructions */}
        <div className="mb-4 p-3 border-t border-gray-600">
          <p className="text-sm text-gray-300 leading-relaxed">
            {colorMode === 'dark' ? 'Dark mode' : 'Light mode'}, {assetType.toUpperCase()}{assetType !== 'svg' ? `, ${getSizePixels(sizeChoice, customSize)}px width (aspect ratio preserved)` : ' (scalable)'}
          </p>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Download size={16} />
          {isDownloading ? 'PREPARING...' : 'DOWNLOAD'}
        </button>
      </div>
    </div>
  );
}