import React, { useState, useEffect } from 'react';
import { Eye, Zap, Settings } from 'lucide-react';
import { Asset } from '@/types/asset';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';
import { manipulateSvgColors, BRAND_COLORS } from '@/lib/svgColorTest';

interface SmartAssetPreviewProps {
  asset: Asset;
  variant?: 'horizontal' | 'vertical' | 'symbol';
  colorMode?: 'neutral' | 'green';
  backgroundMode?: 'light' | 'dark';
  size?: number;
  showTooltip?: boolean;
  showConfidence?: boolean;
  className?: string;
}

export function SmartAssetPreview({
  asset,
  variant,
  colorMode,
  backgroundMode,
  size = 64,
  showTooltip = true,
  showConfidence = false,
  className = ''
}: SmartAssetPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { smartDefaults, userContext } = useSmartDefaults(asset);

  // Use provided props or fall back to smart defaults
  const effectiveVariant = variant || smartDefaults?.variant || 'horizontal';
  const effectiveColorMode = colorMode || smartDefaults?.colorMode || 'neutral';
  const effectiveBackgroundMode = backgroundMode || smartDefaults?.backgroundMode || 'light';

  // Generate preview URL based on current settings
  useEffect(() => {
    const generatePreview = async () => {
      if (!asset) return;

      setIsLoading(true);
      setError(null);

      try {
        // Construct the expected file path based on variant using consistent naming pattern
        let assetPath: string;
        
        if (effectiveVariant === 'horizontal') {
          assetPath = asset.url; // Default horizontal logo
        } else if (effectiveVariant === 'symbol') {
          // Replace _h-blk with _symbol-blk (works for both Fuzzball and AscenderPro)
          assetPath = asset.url.replace('_h-blk.svg', '_symbol-blk.svg');
        } else if (effectiveVariant === 'vertical') {
          // Replace _h-blk with _v-blk (works for both Fuzzball and AscenderPro)  
          assetPath = asset.url.replace('_h-blk.svg', '_v-blk.svg');
        } else {
          assetPath = asset.url;
        }

        // For SVG files, apply color manipulation
        if (assetPath.toLowerCase().includes('.svg')) {
          const response = await fetch(assetPath);
          let svgContent = await response.text();

          // Apply color manipulation based on mode
          if (effectiveColorMode === 'green') {
            svgContent = manipulateSvgColors(svgContent, BRAND_COLORS['brand-green']);
          } else if (effectiveBackgroundMode === 'dark') {
            svgContent = manipulateSvgColors(svgContent, '#FFFFFF');
          }

          // Create blob URL for the modified SVG
          const blob = new Blob([svgContent], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          setPreviewUrl(url);
        } else {
          // For non-SVG assets, use direct path
          setPreviewUrl(assetPath);
        }
      } catch (err) {
        console.error('Failed to generate asset preview:', err);
        setError('Preview unavailable');
        setPreviewUrl(asset.url); // Fallback to original
      } finally {
        setIsLoading(false);
      }
    };

    generatePreview();

    // Cleanup blob URLs on unmount
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [asset, effectiveVariant, effectiveColorMode, effectiveBackgroundMode]);

  const backgroundClass = effectiveBackgroundMode === 'dark' 
    ? 'bg-gray-800' 
    : 'bg-gray-100';

  const confidenceColor = smartDefaults
    ? smartDefaults.confidence >= 0.8 ? 'text-green-500'
    : smartDefaults.confidence >= 0.6 ? 'text-yellow-500'
    : 'text-red-500'
    : 'text-gray-400';

  return (
    <div className={`relative group ${className}`}>
      {/* Preview container */}
      <div 
        className={`
          relative rounded-lg overflow-hidden border-2 border-transparent
          ${backgroundClass}
          transition-all duration-200 ease-in-out
          group-hover:border-brand-green/50
        `}
        style={{ width: size, height: size }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-xs text-gray-500">
            <Eye size={16} />
          </div>
        ) : (
          <img
            src={previewUrl}
            alt={`${asset.title} - ${effectiveVariant} variant`}
            className="w-full h-full object-contain p-2"
            onError={() => setError('Failed to load')}
          />
        )}

        {/* Smart indicator overlay */}
        {smartDefaults && (
          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-brand-green text-white p-1 rounded shadow-sm">
              <Zap size={10} />
            </div>
          </div>
        )}

        {/* Confidence indicator */}
        {showConfidence && smartDefaults && (
          <div className="absolute bottom-1 right-1">
            <div className={`text-xs font-bold ${confidenceColor}`}>
              {Math.round(smartDefaults.confidence * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Smart tooltip */}
      {showTooltip && smartDefaults && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="font-medium mb-1">Smart Preview:</div>
            <div className="text-gray-300">
              {effectiveVariant} • {effectiveColorMode} • {effectiveBackgroundMode} bg
            </div>
            
            {smartDefaults.reasoning.length > 0 && (
              <div className="text-gray-400 text-xs mt-1 max-w-48">
                {smartDefaults.reasoning[0]}
              </div>
            )}

            {/* Confidence bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="text-xs text-gray-400">Confidence:</div>
              <div className="flex-1 bg-gray-700 rounded-full h-1">
                <div 
                  className="bg-brand-green h-1 rounded-full transition-all"
                  style={{ width: `${smartDefaults.confidence * 100}%` }}
                />
              </div>
              <div className="text-xs text-gray-400">
                {Math.round(smartDefaults.confidence * 100)}%
              </div>
            </div>
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Grid of smart previews for variant selection
export function SmartAssetVariantGrid({
  asset,
  selectedVariant,
  onVariantSelect,
  className = ''
}: {
  asset: Asset;
  selectedVariant?: string;
  onVariantSelect?: (variant: 'horizontal' | 'vertical' | 'symbol') => void;
  className?: string;
}) {
  const variants: Array<{ key: 'horizontal' | 'vertical' | 'symbol'; label: string }> = [
    { key: 'horizontal', label: 'Horizontal' },
    { key: 'vertical', label: 'Vertical' },
    { key: 'symbol', label: 'Symbol' }
  ];

  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {variants.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onVariantSelect?.(key)}
          className={`
            group relative rounded-lg border-2 transition-all duration-200
            ${selectedVariant === key 
              ? 'border-brand-green bg-brand-green/5' 
              : 'border-gray-200 hover:border-brand-green/50'
            }
          `}
        >
          <div className="p-3">
            <SmartAssetPreview
              asset={asset}
              variant={key}
              size={80}
              showTooltip={false}
              showConfidence={true}
              className={selectedVariant === key ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}
            />
            <div className="mt-2 text-xs font-medium text-gray-600 group-hover:text-gray-900">
              {label}
            </div>
          </div>

          {selectedVariant === key && (
            <div className="absolute -top-1 -right-1 bg-brand-green text-white rounded-full p-1">
              <Zap size={12} />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// Compact preview for asset cards
export function SmartAssetPreviewCompact({
  asset,
  size = 32,
  className = ''
}: {
  asset: Asset;
  size?: number;
  className?: string;
}) {
  return (
    <SmartAssetPreview
      asset={asset}
      size={size}
      showTooltip={false}
      showConfidence={false}
      className={className}
    />
  );
}