'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/types/asset';
import { X, Download, FileText } from 'lucide-react';
import { MODAL_CLASSES } from '@/lib/modalStyles';

interface DocumentPreviewModalProps {
  asset: Asset;
  isOpen: boolean;
  onClose: () => void;
}

export default function DocumentPreviewModal({ asset, isOpen, onClose }: DocumentPreviewModalProps) {
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);
  const [thumbnailError, setThumbnailError] = useState(false);
  
  // Handle escape key and scroll lock
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);
  
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = asset.url;
    link.download = `${asset.title}.${asset.fileType}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={MODAL_CLASSES.backdrop} onClick={handleBackdropClick}>
      <div className={MODAL_CLASSES.container} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={MODAL_CLASSES.header}>
          <h2 className={MODAL_CLASSES.title}>
            {asset.displayName || asset.title}
          </h2>
          <button onClick={onClose} className={MODAL_CLASSES.closeButton}>
            <X size={20} />
          </button>
        </div>

        {/* Preview Thumbnail */}
        <div className="mb-6 flex justify-center">
          <div className="w-[225px] bg-white rounded-lg border border-gray-600 flex items-center justify-center p-4">
            {!thumbnailError ? (
              <div className="relative w-full">
                {!thumbnailLoaded && (
                  <div className="flex items-center justify-center py-16">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                  </div>
                )}
                <img
                  src={asset.thumbnailUrl || asset.url}
                  alt={`Preview of ${asset.title}`}
                  className={`w-full object-contain rounded transition-opacity duration-200 ${
                    thumbnailLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ maxWidth: '225px' }}
                  onLoad={() => setThumbnailLoaded(true)}
                  onError={() => setThumbnailError(true)}
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16">
                <FileText size={48} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Preview not available</p>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {asset.description && (
          <div className="mb-6">
            <p className="text-sm text-gray-300 leading-relaxed">
              {asset.description}
            </p>
          </div>
        )}

        {/* Download Button */}
        <button onClick={handleDownload} className={MODAL_CLASSES.downloadButton}>
          <Download size={16} />
          DOWNLOAD
        </button>
      </div>
    </div>
  );
}