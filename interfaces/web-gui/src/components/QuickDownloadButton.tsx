import React, { useState } from 'react';
import { Download, Zap } from 'lucide-react';
import { Asset } from '@/types/asset';
import { useQuickDownload } from '@/hooks/useQuickDownload';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';

interface QuickDownloadButtonProps {
  asset: Asset;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
  onDownloadStart?: () => void;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

export function QuickDownloadButton({
  asset,
  variant = 'primary',
  size = 'md',
  showIcon = true,
  className = '',
  onDownloadStart,
  onDownloadComplete,
  onError
}: QuickDownloadButtonProps) {
  const [isHovering, setIsHovering] = useState(false);
  
  const { quickDownload, isDownloading, error, clearError } = useQuickDownload();
  const { userContext, smartDefaults, isLoading } = useSmartDefaults(asset);

  const handleQuickDownload = async () => {
    if (!userContext || isDownloading) return;

    try {
      clearError();
      onDownloadStart?.();
      
      await quickDownload(asset, userContext, {
        trackAnalytics: true,
        skipSmartDefaults: false
      });
      
      onDownloadComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      onError?.(errorMessage);
    }
  };

  // Show preview of what will be downloaded on hover
  const previewText = smartDefaults 
    ? `${smartDefaults.format.toUpperCase()} • ${smartDefaults.variant} • ${smartDefaults.size !== 512 ? `${smartDefaults.size}px • ` : ''}${smartDefaults.colorMode} • ${smartDefaults.backgroundMode} bg`
    : 'Loading smart defaults...';

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: 'bg-brand-green text-white hover:bg-brand-green-dark disabled:bg-gray-300',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300 disabled:bg-gray-50 disabled:text-gray-400'
  };

  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;

  return (
    <div className="relative group">
      <button
        onClick={handleQuickDownload}
        disabled={isDownloading || isLoading || !userContext}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`
          inline-flex items-center gap-2 font-medium rounded-lg
          transition-all duration-200 ease-in-out
          disabled:cursor-not-allowed
          relative overflow-hidden
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${className}
        `}
        title={smartDefaults ? `Quick download: ${previewText}` : 'Preparing smart download...'}
      >
        {/* Loading state overlay */}
        {isDownloading && (
          <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        {showIcon && (
          <Zap 
            size={iconSize} 
            className={`transition-transform duration-200 ${isDownloading ? 'scale-110' : ''}`}
          />
        )}
        
        <span className={isDownloading ? 'opacity-50' : ''}>
          {isDownloading ? 'Downloading...' : 'Quick Download'}
        </span>
      </button>

      {/* Hover preview tooltip */}
      {isHovering && smartDefaults && !isDownloading && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
            <div className="font-medium mb-1">Smart Download Preview:</div>
            <div className="text-gray-300">{previewText}</div>
            
            {/* Confidence indicator */}
            <div className="flex items-center gap-1 mt-1">
              <div className="text-xs text-gray-400">Confidence:</div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((dot) => (
                  <div
                    key={dot}
                    className={`w-1 h-1 rounded-full ${
                      dot <= Math.round(smartDefaults.confidence * 5)
                        ? 'bg-brand-green'
                        : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <div className="text-xs text-gray-400">
                ({Math.round(smartDefaults.confidence * 100)}%)
              </div>
            </div>
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute top-full left-0 mt-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}

// Simplified version for minimal contexts
export function QuickDownloadIcon({ 
  asset, 
  className = '',
  size = 16 
}: { 
  asset: Asset; 
  className?: string; 
  size?: number; 
}) {
  const { quickDownload, isDownloading } = useQuickDownload();
  const { userContext } = useSmartDefaults(asset);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!userContext || isDownloading) return;

    try {
      await quickDownload(asset, userContext, { trackAnalytics: true });
    } catch (err) {
      console.error('Quick download failed:', err);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={isDownloading || !userContext}
      className={`
        p-1 rounded hover:bg-gray-100 transition-colors
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title="Quick download with smart defaults"
    >
      {isDownloading ? (
        <div className="animate-spin">
          <Download size={size} className="opacity-50" />
        </div>
      ) : (
        <Zap size={size} className="text-brand-green hover:text-brand-green-dark" />
      )}
    </button>
  );
}