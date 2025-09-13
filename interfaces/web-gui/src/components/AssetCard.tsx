'use client';

import { useState, useRef, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { FileText, Settings, Zap } from 'lucide-react';
import DownloadModalNew from './DownloadModalNew';
import DocumentPreviewModal from './DocumentPreviewModal';
import { QuickDownloadService } from '@/lib/quickDownload';
import { getProductDefaults, getQuickDownloadDescription } from '@/lib/productDefaults';
import { getAssetHandler } from '@/lib/assetDisplayHandlers';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}

export default function AssetCard({ asset, onClick }: AssetCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [isQuickDownloading, setIsQuickDownloading] = useState(false);
  const [quickDownloadError, setQuickDownloadError] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Get asset-specific display handler
  const handler = getAssetHandler(asset.assetType || 'logo');
  const imageConstraints = handler.getImageConstraints();
  const cardText = handler.getCardText(asset);
  
  // Simple product defaults - no complexity
  const productDefaults = getProductDefaults(asset.id);
  const quickDescription = getQuickDownloadDescription(asset.id);

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

  // Theme observer for background updates
  useEffect(() => {
    const checkTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };

    // Initial check
    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // Determine background color based on asset type and theme
  const getImageBackground = () => {
    if (asset.fileType.toLowerCase() === 'jpeg' || asset.fileType.toLowerCase() === 'jpg') {
      // For JPEG assets: white background for light mode, dark background for dark mode
      // Use actual Quantic colors directly to avoid CSS variable resolution issues
      return isDarkMode ? '#13161b' : 'white'; // dark-mode-900 : white
    }
    // Non-JPEG assets use white background for preview
    return 'white';
  };

  const handleCustomizeDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDownloadModal(true);
  };

  const handleQuickDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    setIsQuickDownloading(true);
    setQuickDownloadError(null);
    
    try {
      const quickService = new QuickDownloadService();
      const result = await quickService.generateQuickDownload(asset);
      
      // Trigger browser download
      QuickDownloadService.triggerDownload(result.blob, result.filename);
      
      console.log(`Quick download: ${result.filename} (${result.description})`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      setQuickDownloadError(errorMessage);
      console.error('Quick download error:', error);
    } finally {
      setIsQuickDownloading(false);
    }
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
      onClick={handleCustomizeDownload}
      className="group cursor-pointer rounded-lg hover:shadow-lg transition-all duration-200 aspect-[3/4] relative overflow-hidden"
      style={{
        backgroundColor: 'var(--quantic-color-gray-dark-mode-850)',
        border: `1px solid var(--quantic-border-primary)`
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--quantic-color-gray-dark-mode-600)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--quantic-border-primary)';
      }}
    >
      {/* Image container - 3x3 area */}
      <div className="relative h-full overflow-hidden p-4 flex items-center justify-center group/image rounded-lg" style={{ backgroundColor: getImageBackground() }}>
        
        {!imageError && shouldLoadImage ? (
          <>
            {!imageLoaded && (
              <div className="absolute inset-4 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: 'var(--quantic-color-brand-600)' }}></div>
              </div>
            )}
            <img
              src={asset.thumbnailUrl || asset.url}
              alt={asset.title}
              className={`max-w-full transition-opacity duration-200 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              } ${
(asset.assetType || 'logo') === 'document' ? 'shadow-md' : ''
              }`}
              style={{
                maxHeight: imageConstraints.maxHeight,
                maxWidth: imageConstraints.maxWidth,
                objectFit: imageConstraints.objectFit,
                ...(asset.assetType === 'document' && {
                  filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.15))',
                  borderRadius: '4px'
                })
              }}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
            />
          </>
        ) : !shouldLoadImage ? (
          <div className="absolute inset-4 flex items-center justify-center">
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

      {/* Sliding Panel - slides up from bottom on hover */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/90 backdrop-blur-md rounded-b-lg transform translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out">
        <div className="px-4 py-3 space-y-2">
          {/* Title */}
          <div className="text-white font-medium text-center text-sm">
            {cardText.title}
          </div>
          
          {/* Subtitle */}
          <div className="text-xs text-white/80 text-center">
            {cardText.subtitle}
          </div>
          
          {/* Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleQuickDownload}
              disabled={isQuickDownloading}
              className="flex items-center gap-2 px-4 py-2 rounded-md font-semibold text-sm transition-all duration-200 disabled:opacity-50"
              style={{
                backgroundColor: 'var(--quantic-color-brand-600)',
                color: 'white'
              }}
            >
              {isQuickDownloading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Download
                </>
              )}
            </button>
            
            {/* Only show customize button for logos, not documents */}
            {asset.assetType !== 'document' && (
              <button
                onClick={handleCustomizeDownload}
                className="flex items-center justify-center aspect-square h-full rounded-md transition-all duration-200 border px-2"
                style={{
                  backgroundColor: 'var(--quantic-color-gray-dark-mode-700)',
                  borderColor: 'var(--quantic-color-gray-dark-mode-600)',
                  color: 'var(--quantic-color-gray-dark-mode-300)'
                }}
                title="Customize"
              >
                <Settings size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Download Modal - Asset type specific */}
      {asset.assetType === 'document' ? (
        <DocumentPreviewModal 
          asset={asset}
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
        />
      ) : (
        <DownloadModalNew 
          asset={asset}
          isOpen={showDownloadModal}
          onClose={() => setShowDownloadModal(false)}
        />
      )}
    </div>
  );
}