'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { X, Download, ChevronRight, ChevronDown } from 'lucide-react';
import { convertSvgToRaster, isSvgUrl, getFileExtension } from '@/lib/svgConverter';
import { manipulateSvgColors, BRAND_COLORS } from '@/lib/svgColorTest';

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

const SIZE_MAP = {
  S: 256,
  M: 512,
  L: 1024
};

const VARIANTS = [
  { id: 'horizontal', aspectRatio: 'aspect-[4/3]', logoPath: '/assets/products/fuzzball/logos/Fuzzball_logo_h-blk.svg' },
  { id: 'vertical', aspectRatio: 'aspect-square', logoPath: '/assets/products/fuzzball/logos/Fuzzball_logo_logo_v-blk.svg' }, 
  { id: 'symbol', aspectRatio: 'aspect-square', logoPath: '/assets/products/fuzzball/logos/Fuzzball_logo_symbol-blk.svg' }
] as const;

export default function DownloadModalNew({ asset, isOpen, onClose }: DownloadModalProps) {
  // Smart defaults
  const [colorMode, setColorMode] = useState<ColorMode>('light');
  const [selectedVariant, setSelectedVariant] = useState<LogoVariant>('horizontal');
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Advanced options
  const [colorChoice, setColorChoice] = useState<ColorChoice>('neutral');
  const [assetType, setAssetType] = useState<AssetType>('png');
  const [sizeChoice, setSizeChoice] = useState<SizeChoice>('M');
  const [customSize, setCustomSize] = useState<string>('512');
  
  // State
  const [isDownloading, setIsDownloading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>('');

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

  const getSizeInPixels = () => {
    if (sizeChoice === 'Custom') {
      return parseInt(customSize) || 512;
    }
    return SIZE_MAP[sizeChoice];
  };

  const generateFileName = () => {
    const baseName = 'fuzzball-logo';
    const variant = selectedVariant !== 'horizontal' ? `-${selectedVariant}` : '';
    const color = colorChoice === 'green' ? '-green' : '';
    const mode = colorMode === 'dark' ? '-dark' : '';
    const size = assetType !== 'svg' ? `-${getSizeInPixels()}px` : '';
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
        // Raster conversion
        const size = getSizeInPixels();
        
        let sourceUrl = asset.url;
        if (colorChoice === 'green') {
          const response = await fetch(asset.url);
          const svgContent = await response.text();
          const coloredSvg = manipulateSvgColors(svgContent, BRAND_COLORS['brand-green']);
          const encodedSvg = btoa(unescape(encodeURIComponent(coloredSvg)));
          sourceUrl = `data:image/svg+xml;base64,${encodedSvg}`;
        }
        
        blob = await convertSvgToRaster(sourceUrl, {
          format: assetType === 'jpg' ? 'jpeg' : 'png',
          width: size,
          quality: assetType === 'jpg' ? 0.92 : undefined,
          backgroundColor: assetType === 'jpg' 
            ? (colorMode === 'dark' ? '#1a1d23' : '#FFFFFF')
            : undefined
        });
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
        className="relative bg-[#2a2d33] rounded-lg shadow-xl p-6 w-[420px] max-w-[90vw] max-h-[90vh] overflow-y-auto"
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
            {VARIANTS.map(({ id, aspectRatio, logoPath }) => {
              // Get the actual logo variant with proper coloring
              const getVariantContent = () => {
                // Determine logo styling based on mode and choice
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
                <button
                  key={id}
                  onClick={() => setSelectedVariant(id as LogoVariant)}
                  className={`aspect-square rounded-lg border-2 transition-all p-4 flex items-center justify-center`}
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