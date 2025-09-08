'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { X, Download, FileImage, FileText, Monitor, Sun, Moon } from 'lucide-react';
import { convertSvgToRaster, isSvgUrl, getFileExtension } from '@/lib/svgConverter';
import { manipulateSvgColors, BRAND_COLORS } from '@/lib/svgColorTest';
import { SIZE_PRESETS, DEFAULT_SIZE, getSizePixels, CUSTOM_SIZE_CONSTRAINTS, validateCustomSize } from '@/lib/sizeConstants';

interface DownloadModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
}

type FormatType = 'svg' | 'png' | 'jpeg';
type SizePreset = 'S' | 'M' | 'L' | 'custom width';
type LogoVariant = 'horizontal' | 'vertical' | 'symbol';
type BackgroundMode = 'light' | 'dark';
type ColorMode = '1-color' | '2-color';
type BrandColor = 'black' | 'white' | 'brand-green' | 'dark-green';

// Size presets now imported from centralized constants
// S: 512px, M: 1024px, L: 2048px width-based sizing

const LOGO_VARIANTS = {
  horizontal: { label: 'Horizontal', desc: 'Wide layout' },
  vertical: { label: 'Vertical', desc: 'Stacked layout' },
  symbol: { label: 'Symbol Only', desc: 'Icon only' }
};

const COLOR_OPTIONS = {
  '1-color': {
    black: { label: 'Black', value: BRAND_COLORS.black, preview: '#000000' },
    white: { label: 'White', value: BRAND_COLORS.white, preview: '#FFFFFF' },
    'brand-green': { label: 'Brand Green', value: BRAND_COLORS['brand-green'], preview: '#097049' }
  },
  '2-color': {
    'original': { label: 'Original Colors', value: null, preview: 'linear-gradient(45deg, #000 50%, #097049 50%)' }
  }
};

export default function DownloadModal({ asset, isOpen, onClose }: DownloadModalProps) {
  // Detect the actual file type from the asset
  const assetFileType = asset.fileType.toLowerCase();
  const isOriginalSvg = assetFileType === 'svg' || asset.url.toLowerCase().includes('.svg');
  
  // Step-by-step state
  const [selectedVariant, setSelectedVariant] = useState<LogoVariant>('horizontal');
  const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>('light');
  const [colorMode, setColorMode] = useState<ColorMode>('1-color');
  const [selectedColor, setSelectedColor] = useState<BrandColor>('black');
  const [selectedFormat, setSelectedFormat] = useState<FormatType>(isOriginalSvg ? 'svg' : 'png');
  const [selectedSize, setSelectedSize] = useState<SizePreset>(DEFAULT_SIZE);
  const [customSize, setCustomSize] = useState<string>(CUSTOM_SIZE_CONSTRAINTS.default.toString());
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Preview state with caching
  const [previewDataUrl, setPreviewDataUrl] = useState<string>('');
  const [svgCache, setSvgCache] = useState<string>('');

  // Generate small preview when settings change (debounced for performance)
  useEffect(() => {
    if (!isOpen || !isOriginalSvg) return;
    
    // Debounce preview generation to avoid excessive updates
    const timer = setTimeout(async () => {
      try {
        // Cache SVG content on first fetch
        let svgContent = svgCache;
        if (!svgContent) {
          const response = await fetch(asset.thumbnailUrl || asset.url);
          svgContent = await response.text();
          setSvgCache(svgContent);
        }
        
        let processedSvg = svgContent;
        if (colorMode === '1-color' && selectedColor !== 'white') {
          const colorValue = COLOR_OPTIONS['1-color'][selectedColor as keyof typeof COLOR_OPTIONS['1-color']]?.value;
          if (colorValue) {
            processedSvg = manipulateSvgColors(svgContent, colorValue);
          }
        }
        
        // For preview, always use SVG data URL (no canvas rendering)
        const encodedSvg = btoa(unescape(encodeURIComponent(processedSvg)));
        setPreviewDataUrl(`data:image/svg+xml;base64,${encodedSvg}`);
      } catch (error) {
        console.error('Failed to generate preview:', error);
      }
    }, 150); // 150ms debounce for smooth UX
    
    return () => clearTimeout(timer);
  }, [isOpen, selectedVariant, backgroundMode, colorMode, selectedColor, asset.url, isOriginalSvg, svgCache]);
  
  // Close modal on escape key
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

  const handleFormatSelect = (format: FormatType) => {
    setSelectedFormat(format);
    if (format === 'svg') {
      // SVG doesn't need size selection, so we could auto-download
      // But let's keep consistent UX with download button
    }
  };

  const getSizeInPixels = () => {
    return getSizePixels(selectedSize === 'custom width' ? 'Custom Width' : selectedSize, customSize);
  };

  const generateFileName = () => {
    const baseName = asset.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const variant = selectedVariant !== 'horizontal' ? `-${selectedVariant}` : '';
    const color = colorMode === '1-color' && selectedColor !== 'black' ? `-${selectedColor}` : '';
    const mode = backgroundMode === 'dark' ? '-dark' : '';
    const size = selectedFormat !== 'svg' ? `-${getSizeInPixels()}px` : '';
    const extension = getFileExtension(selectedFormat);
    return `${baseName}${variant}${color}${mode}${size}.${extension}`;
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    
    try {
      let blob: Blob;
      
      // Get background color based on mode and format
      const getBackgroundColor = () => {
        if (selectedFormat === 'jpeg') {
          return backgroundMode === 'dark' 
            ? 'var(--quantic-bg-primary-dark)' // Will resolve to dark color
            : 'var(--quantic-bg-primary-light)'; // Will resolve to light color
        }
        return undefined; // Transparent for PNG/SVG
      };
      
      if (isOriginalSvg && selectedFormat === 'svg') {
        // Download colored SVG using cached content
        let svgContent = svgCache;
        if (!svgContent) {
          const response = await fetch(asset.thumbnailUrl || asset.url);
          svgContent = await response.text();
        }
        
        if (colorMode === '1-color' && selectedColor !== 'white') {
          const colorValue = COLOR_OPTIONS['1-color'][selectedColor as keyof typeof COLOR_OPTIONS['1-color']]?.value;
          if (colorValue) {
            svgContent = manipulateSvgColors(svgContent, colorValue);
          }
        }
        
        blob = new Blob([svgContent], { type: 'image/svg+xml' });
      } else if (isOriginalSvg && (selectedFormat === 'png' || selectedFormat === 'jpeg')) {
        // Convert SVG to PNG/JPEG using Canvas at full download size
        const size = getSizeInPixels();
        
        let processedSvgUrl = asset.url;
        if (colorMode === '1-color' && selectedColor !== 'white') {
          // Use cached SVG content for conversion
          let svgContent = svgCache;
          if (!svgContent) {
            const response = await fetch(asset.thumbnailUrl || asset.url);
            svgContent = await response.text();
          }
          
          const colorValue = COLOR_OPTIONS['1-color'][selectedColor as keyof typeof COLOR_OPTIONS['1-color']]?.value;
          if (colorValue) {
            const coloredSvg = manipulateSvgColors(svgContent, colorValue);
            const encodedSvg = btoa(unescape(encodeURIComponent(coloredSvg)));
            processedSvgUrl = `data:image/svg+xml;base64,${encodedSvg}`;
          }
        }
        
        blob = await convertSvgToRaster(processedSvgUrl, {
          format: selectedFormat,
          width: size,
          quality: selectedFormat === 'jpeg' ? 0.92 : undefined,
          backgroundColor: selectedFormat === 'jpeg' 
            ? (backgroundMode === 'dark' ? '#1a1d23' : '#FFFFFF')
            : undefined
        });
      } else {
        // Handle non-SVG assets
        const response = await fetch(asset.url);
        blob = await response.blob();
      }
      
      // Download the blob
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

  // Helper function to convert PNG to JPEG
  const convertImageToJpeg = async (imageUrl: string, size: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        canvas.width = size;
        canvas.height = size;
        
        // White background for JPEG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Draw the image
        ctx.drawImage(img, 0, 0, size, size);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to convert to JPEG'));
            }
          },
          'image/jpeg',
          0.92
        );
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 backdrop-blur-[2px] backdrop-filter"
        style={{ backgroundColor: 'rgba(19, 22, 27, 0.65)' }}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-[var(--quantic-bg-primary)] rounded-lg shadow-xl border border-[var(--quantic-border-primary)] p-6 w-[480px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: 'var(--quantic-text-primary)' }}>
            {asset.displayName || asset.title}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-[var(--quantic-color-gray-dark-mode-800)] transition-colors"
            style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview Section - Compact 1:1 aspect ratio */}
        <div className="mb-4">
          <div className="text-sm font-medium mb-2" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            Preview
          </div>
          <div 
            className="w-20 h-20 mx-auto rounded-lg border border-[var(--quantic-border-primary)] flex items-center justify-center p-2"
            style={{ 
              backgroundColor: backgroundMode === 'dark' ? '#1a1d23' : '#FFFFFF',
              transition: 'background-color 0.2s ease'
            }}
          >
            <img 
              src={previewDataUrl || asset.thumbnailUrl || asset.url}
              alt={asset.title}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="text-xs mt-1 text-center" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            <span className="opacity-75">{LOGO_VARIANTS[selectedVariant]?.label} • {backgroundMode === 'dark' ? 'Dark' : 'Light'} • Download: {selectedFormat !== 'svg' ? `${getSizeInPixels()}px` : 'vector'}</span>
          </div>
        </div>

        {/* Step 1: Variant Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            1. Choose Layout
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(LOGO_VARIANTS) as [LogoVariant, typeof LOGO_VARIANTS[LogoVariant]][]).map(([variant, { label, desc }]) => (
              <button
                key={variant}
                onClick={() => setSelectedVariant(variant)}
                className={`p-2 rounded-[8px] border border-solid transition-all cursor-pointer text-center ${
                  selectedVariant === variant 
                    ? 'border-[#097049] bg-[#097049]/10' 
                    : 'border-[#373a41] hover:border-[#535862] bg-[#1a1d23]'
                }`}
              >
                <Monitor size={20} className={`mx-auto mb-1 ${
                  selectedVariant === variant ? 'text-[#097049]' : 'text-[#85888e]'
                }`} />
                <div className={`text-sm font-medium ${
                  selectedVariant === variant ? 'text-[#097049]' : 'text-[#cecfd2]'
                }`}>
                  {label}
                </div>
                <div className="text-xs text-[#85888e]">
                  {desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Background Mode */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            2. Background Usage
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setBackgroundMode('light')}
              className={`p-2 rounded-[8px] border border-solid transition-all cursor-pointer text-center ${
                backgroundMode === 'light' 
                  ? 'border-[#097049] bg-[#097049]/10' 
                  : 'border-[#373a41] hover:border-[#535862] bg-[#1a1d23]'
              }`}
            >
              <Sun size={20} className={`mx-auto mb-1 ${
                backgroundMode === 'light' ? 'text-[#097049]' : 'text-[#85888e]'
              }`} />
              <div className={`text-sm font-medium ${
                backgroundMode === 'light' ? 'text-[#097049]' : 'text-[#cecfd2]'
              }`}>
                Light Background
              </div>
              <div className="text-xs text-[#85888e]">
                White/light surfaces
              </div>
            </button>
            <button
              onClick={() => setBackgroundMode('dark')}
              className={`p-2 rounded-[8px] border border-solid transition-all cursor-pointer text-center ${
                backgroundMode === 'dark' 
                  ? 'border-[#097049] bg-[#097049]/10' 
                  : 'border-[#373a41] hover:border-[#535862] bg-[#1a1d23]'
              }`}
            >
              <Moon size={20} className={`mx-auto mb-1 ${
                backgroundMode === 'dark' ? 'text-[#097049]' : 'text-[#85888e]'
              }`} />
              <div className={`text-sm font-medium ${
                backgroundMode === 'dark' ? 'text-[#097049]' : 'text-[#cecfd2]'
              }`}>
                Dark Background
              </div>
              <div className="text-xs text-[#85888e]">
                Dark/colored surfaces
              </div>
            </button>
          </div>
        </div>

        {/* Step 3: Color Mode */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            3. Logo Style
          </label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            <button
              onClick={() => setColorMode('1-color')}
              className={`p-2 rounded-[8px] border border-solid transition-all cursor-pointer text-center ${
                colorMode === '1-color' 
                  ? 'border-[#097049] bg-[#097049]/10' 
                  : 'border-[#373a41] hover:border-[#535862] bg-[#1a1d23]'
              }`}
            >
              <div className={`w-6 h-6 rounded-full mx-auto mb-1 ${
                colorMode === '1-color' ? 'bg-[#097049]' : 'bg-[#85888e]'
              }`} />
              <div className={`text-sm font-medium ${
                colorMode === '1-color' ? 'text-[#097049]' : 'text-[#cecfd2]'
              }`}>
                Single Color
              </div>
              <div className="text-xs text-[#85888e]">
                Standard choice
              </div>
            </button>
            <button
              onClick={() => setColorMode('2-color')}
              className={`p-2 rounded-[8px] border border-solid transition-all cursor-pointer text-center ${
                colorMode === '2-color' 
                  ? 'border-[#097049] bg-[#097049]/10' 
                  : 'border-[#373a41] hover:border-[#535862] bg-[#1a1d23]'
              }`}
            >
              <div className="w-6 h-6 rounded-full mx-auto mb-1" style={{
                background: colorMode === '2-color' 
                  ? 'linear-gradient(45deg, #000 50%, #097049 50%)' 
                  : '#85888e'
              }} />
              <div className={`text-sm font-medium ${
                colorMode === '2-color' ? 'text-[#097049]' : 'text-[#cecfd2]'
              }`}>
                Original Colors
              </div>
              <div className="text-xs text-[#85888e]">
                Hero use only
              </div>
            </button>
          </div>
          
          {/* Color Selection for 1-color mode */}
          {colorMode === '1-color' && (
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(COLOR_OPTIONS['1-color']).map(([color, { label, value, preview }]) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color as any)}
                  className={`p-2 rounded-[8px] border border-solid transition-all cursor-pointer text-center ${
                    selectedColor === color 
                      ? 'border-[#097049] bg-[#097049]/10' 
                      : 'border-[#373a41] hover:border-[#535862] bg-[#1a1d23]'
                  }`}
                >
                  <div 
                    className="w-4 h-4 rounded mx-auto mb-1 border border-[#373a41]"
                    style={{ backgroundColor: preview }}
                  />
                  <div className={`text-xs font-medium ${
                    selectedColor === color ? 'text-[#097049]' : 'text-[#cecfd2]'
                  }`}>
                    {label}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 4: Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            4. File Format
          </label>
          <div className={`grid gap-2 ${isOriginalSvg ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {[
              ...(isOriginalSvg ? [{ format: 'svg' as FormatType, label: 'SVG', icon: FileText, desc: 'Vector', bg: 'Transparent' }] : []),
              { format: 'png' as FormatType, label: 'PNG', icon: FileImage, desc: 'Raster', bg: 'Transparent' },
              { format: 'jpeg' as FormatType, label: 'JPEG', icon: FileImage, desc: 'Photo', bg: backgroundMode === 'dark' ? 'Dark' : 'White' }
            ].map(({ format, label, icon: Icon, desc, bg }) => (
              <button
                key={format}
                onClick={() => handleFormatSelect(format)}
                className={`p-2 rounded-[8px] border border-solid transition-all cursor-pointer text-center ${
                  selectedFormat === format 
                    ? 'border-[#097049] bg-[#097049]/10' 
                    : 'border-[#373a41] hover:border-[#535862] bg-[#1a1d23]'
                }`}
              >
                <Icon size={20} className={`mx-auto mb-1 ${
                  selectedFormat === format ? 'text-[#097049]' : 'text-[#85888e]'
                }`} />
                <div className={`text-sm font-medium ${
                  selectedFormat === format ? 'text-[#097049]' : 'text-[#cecfd2]'
                }`}>
                  {label}
                </div>
                <div className="text-xs text-[#85888e]">
                  {desc} • {bg} bg
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Size Selection (only for PNG/JPEG) */}
        {selectedFormat !== 'svg' && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
              Size
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {(['S', 'M', 'L', 'custom width'] as SizePreset[]).map((size) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`p-2 rounded-[8px] border border-solid text-sm font-medium font-['Inter:Medium',_sans-serif] transition-colors cursor-pointer ${
                    selectedSize === size 
                      ? 'bg-[#097049] text-white border-[#097049]' 
                      : 'bg-[#1a1d23] text-[#cecfd2] border-[#373a41] hover:border-[#535862] hover:bg-[#2a2d33]'
                  }`}
                  style={{
                    boxShadow: '0px 1px 2px 0px rgba(10,13,18,0.05)'
                  }}
                >
                  {size}
                  <div className="text-xs opacity-75">
                    {SIZE_PRESETS[size as keyof typeof SIZE_PRESETS]}px
                  </div>
                </button>
              ))}
              <button
                onClick={() => setSelectedSize('custom')}
                className={`p-2 rounded-[8px] border border-solid text-sm font-medium font-['Inter:Medium',_sans-serif] transition-colors cursor-pointer ${
                  selectedSize === 'custom' 
                    ? 'bg-[#097049] text-white border-[#097049]' 
                    : 'bg-[#1a1d23] text-[#cecfd2] border-[#373a41] hover:border-[#535862] hover:bg-[#2a2d33]'
                }`}
                style={{
                  boxShadow: '0px 1px 2px 0px rgba(10,13,18,0.05)'
                }}
              >
                Custom
              </button>
            </div>
            
            {selectedSize === 'custom width' && (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="number"
                  value={customSize}
                  onChange={(e) => setCustomSize(e.target.value)}
                  className="flex-1 px-2 py-1 rounded-[8px] border border-solid border-[#373a41] bg-[#1a1d23] text-[#cecfd2] text-sm font-['Inter:Regular',_sans-serif] focus:border-[#097049] focus:outline-none transition-colors"
                  style={{
                    boxShadow: '0px 1px 2px 0px rgba(10,13,18,0.05)'
                  }}
                  placeholder="512"
                  min="1"
                  max="4096"
                />
                <span className="text-sm" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>px</span>
              </div>
            )}
          </div>
        )}

        {/* Download Summary & Button */}
        <div className="border-t border-[var(--quantic-border-primary)] pt-3">
          <div className="mb-2 text-sm" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            <div className="flex justify-between items-center mb-1">
              <span>File will be:</span>
              <code className="text-xs px-2 py-1 rounded bg-[#1a1d23] text-[#cecfd2]">
                {generateFileName()}
              </code>
            </div>
            <div className="text-xs space-y-0.5 mt-1">
              <div>• {LOGO_VARIANTS[selectedVariant]?.label} layout</div>
              <div>• Optimized for {backgroundMode} backgrounds</div>
              <div>• {colorMode === '1-color' ? `${COLOR_OPTIONS['1-color'][selectedColor as keyof typeof COLOR_OPTIONS['1-color']]?.label} color` : 'Original 2-color design'}</div>
              <div>• {selectedFormat.toUpperCase()} format{selectedFormat === 'jpeg' ? ` with ${backgroundMode} background` : ' with transparent background'}</div>
              {selectedFormat !== 'svg' && <div>• {getSizeInPixels()}px size</div>}
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full py-2 px-4 rounded-[8px] border border-solid border-[#097049] bg-[#097049] text-white font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-[#075a37] hover:border-[#075a37] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download size={16} />
            {isDownloading ? 'Preparing download...' : 'Download Logo'}
          </button>
        </div>
      </div>
    </div>
  );
}