'use client';

import { Asset } from '@/types/asset';
import AssetCard from './AssetCard';

interface AssetGridProps {
  assets: Asset[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onAssetClick?: (asset: Asset) => void;
}

export default function AssetGrid({ assets, isLoading = false, isLoadingMore = false, hasMore = false, onAssetClick }: AssetGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {/* Loading skeleton */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-square rounded-lg mb-3" style={{ backgroundColor: 'var(--quantic-color-gray-dark-mode-800)' }}></div>
            <div className="h-4 rounded mb-2" style={{ backgroundColor: 'var(--quantic-color-gray-dark-mode-800)' }}></div>
            <div className="h-3 rounded w-2/3" style={{ backgroundColor: 'var(--quantic-color-gray-dark-mode-800)' }}></div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4" style={{ color: 'var(--quantic-color-gray-dark-mode-600)' }}>🔍</div>
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--quantic-text-primary)' }}>No assets found</h3>
        <p style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {assets.map((asset) => (
          <AssetCard
            key={asset.id}
            asset={asset}
            onClick={() => onAssetClick?.(asset)}
          />
        ))}
      </div>
      
      {/* Loading more indicator */}
      {isLoadingMore && (
        <div className="mt-8 flex justify-center">
          <div className="flex items-center space-x-2 text-sm" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
            <span>Loading more assets...</span>
          </div>
        </div>
      )}
      
      {/* End of results indicator */}
      {!hasMore && assets.length > 0 && !isLoadingMore && (
        <div className="mt-8 text-center">
          <p className="text-sm" style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>
            You've reached the end of all available assets
          </p>
        </div>
      )}
    </div>
  );
}