'use client';

import { useState, useRef, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { FileText, Settings } from 'lucide-react';
import DownloadModalNew from './DownloadModalNew';
import { QuickDownloadButton, QuickDownloadIcon } from './QuickDownloadButton';
import { SmartAssetPreviewCompact } from './SmartAssetPreview';
import { useSmartDefaults } from '@/hooks/useSmartDefaults';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}

export default function AssetCard({ asset, onClick }: AssetCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Smart defaults for this asset with safety check
  const { smartDefaults, isLoading: smartLoading } = useSmartDefaults(asset?.id ? asset : null);

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

  const handleAdvancedDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDownloadModal(true);
  };

  const handleQuickDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Quick download is handled by the QuickDownloadButton component
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
      {/* Image container with smart preview overlay */}
      <div className="relative aspect-square overflow-hidden p-8 flex items-center justify-center group/image" style={{ backgroundColor: getImageBackground() }}>
        
        {/* Smart indicator */}
        {smartDefaults && (
          <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-brand-green text-white p-1 rounded shadow-sm" title="Smart defaults available">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            </div>
          </div>
        )}
        
        {/* Quick actions overlay */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1">
          <QuickDownloadIcon 
            asset={asset} 
            size={16} 
            className="bg-white/90 backdrop-blur-sm hover:bg-white" 
          />
        </div>
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
              <FileText size={32} className="mx-auto mb-2" />
              <div className="text-sm">{asset.fileType.toUpperCase()}</div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <FileText size={32} className="mx-auto mb-2" />
              <div className="text-sm">{asset.fileType.toUpperCase()}</div>
            </div>
          </div>
        )}
        
      </div>

      {/* Asset info */}
      <div className="p-4 relative">
        <h3 className="font-medium truncate mb-1" style={{ color: 'var(--quantic-text-primary)' }} title={asset.title}>
          {asset.title}
        </h3>
        
        <div className="flex items-center justify-between text-sm" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
          <span className="font-medium">{asset.conciseDescription || asset.fileType?.toUpperCase()}</span>
          {asset.fileSize && (
            <span>{formatFileSize(asset.fileSize)}</span>
          )}
        </div>
        
        {/* Dual-path download overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-90 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 rounded">
          <div className="flex flex-col gap-2 items-center">
            {/* Quick Download - Primary action */}
            <QuickDownloadButton
              asset={asset}
              variant="primary"
              size="md"
              onDownloadStart={() => console.log('Quick download started')}
              onDownloadComplete={() => console.log('Quick download completed')}
              onError={(error) => console.error('Quick download error:', error)}
            />
            
            {/* Advanced Options - Secondary action */}
            <button
              onClick={handleAdvancedDownload}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg font-medium transition-colors duration-200 bg-gray-100 text-gray-900 hover:bg-gray-200"
            >
              <Settings size={12} />
              Advanced
            </button>
            
            {/* Smart preview hint */}
            {smartDefaults && (
              <div className="text-xs text-gray-300 text-center max-w-32">
                Smart: {smartDefaults.format.toUpperCase()} • {smartDefaults.variant}
              </div>
            )}
          </div>
        </div>
        
      </div>

      {/* Download Modal */}
      <DownloadModalNew 
        asset={asset}
        isOpen={showDownloadModal}
        onClose={() => setShowDownloadModal(false)}
      />
    </div>
  );
}