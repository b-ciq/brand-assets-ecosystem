'use client';

import { useState, useRef, useEffect } from 'react';
import { Asset } from '@/types/asset';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}

export default function AssetCard({ asset, onClick }: AssetCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoadImage(true);
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1,
      }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Determine background color based on asset name/usage context
  const getImageBackground = () => {
    const assetName = asset.title.toLowerCase();
    const url = asset.url.toLowerCase();
    
    // Check metadata first if available
    if (asset.metadata?.background) {
      // If metadata says "light", it means dark logo for light background
      // If metadata says "dark", it means light logo for dark background  
      return asset.metadata.background === 'light' 
        ? 'var(--quantic-color-gray-light-mode-200)'
        : 'var(--quantic-color-gray-dark-mode-800)';
    }
    
    // Fallback to checking title and URL for light/dark keywords
    const hasLight = assetName.includes('light') || url.includes('light');
    const hasDark = assetName.includes('dark') || url.includes('dark');
    
    if (hasLight) {
      // Light logos should be on dark backgrounds
      return 'var(--quantic-color-gray-dark-mode-800)';
    } else if (hasDark) {
      // Dark logos should be on light backgrounds  
      return 'var(--quantic-color-gray-light-mode-200)';
    }
    
    // Default to current dark background
    return 'var(--quantic-color-gray-dark-mode-800)';
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // TODO: Implement download functionality
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = asset.title || 'asset';
    link.click();
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)}KB`;
    return `${(kb / 1024).toFixed(1)}MB`;
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      className="group cursor-pointer rounded-lg overflow-hidden hover:shadow-lg transition-all duration-200"
      style={{
        backgroundColor: 'var(--quantic-color-gray-dark-mode-850)',
        border: `1px solid var(--quantic-border-primary)`,
        ':hover': { borderColor: 'var(--quantic-color-gray-dark-mode-600)' }
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--quantic-color-gray-dark-mode-600)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--quantic-border-primary)';
      }}
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden p-8 flex items-center justify-center" style={{ backgroundColor: getImageBackground() }}>
        {!imageError && shouldLoadImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-8 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: 'var(--quantic-color-brand-600)' }}></div>
              </div>
            )}
            <img
              src={asset.thumbnailUrl || asset.url}
              alt={asset.title}
              className={`max-w-full object-contain transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ maxHeight: '100px' }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : !shouldLoadImage ? (
          <div className="absolute inset-8 flex items-center justify-center">
            <div className="text-center" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm">{asset.fileType.toUpperCase()}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">📄</div>
              <div className="text-sm">{asset.fileType.toUpperCase()}</div>
            </div>
          </div>
        )}
        
        {/* Hover overlay */}
        <div className="absolute inset-8 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded-md">
          <button
            onClick={handleDownload}
            className="px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
            style={{
              backgroundColor: 'var(--quantic-color-brand-600)',
              color: 'white'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--quantic-color-brand-700)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--quantic-color-brand-600)';
            }}
          >
            Download
          </button>
        </div>
      </div>

      {/* Asset info */}
      <div className="p-4">
        <h3 className="font-medium truncate mb-1" style={{ color: 'var(--quantic-text-primary)' }} title={asset.title}>
          {asset.title}
        </h3>
        
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
          <span className="uppercase font-medium">{asset.fileType}</span>
          {asset.fileSize && (
            <span>{formatFileSize(asset.fileSize)}</span>
          )}
        </div>
        
        {asset.dimensions && (
          <div className="text-xs mt-1" style={{ color: 'var(--quantic-color-gray-dark-mode-500)' }}>
            {asset.dimensions.width} × {asset.dimensions.height}
          </div>
        )}
        
        {asset.tags && asset.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {asset.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-block text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--quantic-color-gray-dark-mode-800)',
                  color: 'var(--quantic-color-gray-dark-mode-300)'
                }}
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="text-xs" style={{ color: 'var(--quantic-color-gray-dark-mode-500)' }}>+{asset.tags.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}