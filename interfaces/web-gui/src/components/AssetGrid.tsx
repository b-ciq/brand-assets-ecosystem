'use client';

import { Asset } from '@/types/asset';
import AssetCard from './AssetCard';
import { Search } from 'lucide-react';
import { getVariantMetadata, getCIQVariantMetadata, isCIQCompanyLogo } from '@/lib/productDefaults';

// Variant configuration interface
interface VariantConfig {
  product: string;
  variant?: 'horizontal' | 'vertical' | 'symbol' | '1-color';
  colorMode?: 'light' | 'dark';
  format?: 'svg' | 'png' | 'jpg';
  size?: string;
  openModal?: boolean;
}

interface AssetGridProps {
  assets: Asset[];
  isLoading?: boolean;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  onAssetClick?: (asset: Asset, variantConfig?: VariantConfig) => void;
  showVariantGrid?: boolean;
  variantConfig?: VariantConfig | null;
  autoOpenModal?: boolean;
  onModalClose?: () => void;
}

export default function AssetGrid({
  assets,
  isLoading = false,
  isLoadingMore = false,
  hasMore = false,
  onAssetClick,
  showVariantGrid = false,
  variantConfig,
  autoOpenModal = false,
  onModalClose
}: AssetGridProps) {
  // Generate expanded variants for grid display when showVariantGrid is enabled
  const generateVariantAssets = (baseAssets: Asset[]): Asset[] => {
    if (!showVariantGrid) return baseAssets;

    const expandedAssets: Asset[] = [];
    const processedAssets = new Set<string>(); // Deduplication

    baseAssets.forEach(asset => {
      // Skip if already processed (deduplication)
      if (processedAssets.has(asset.id)) {
        return;
      }
      processedAssets.add(asset.id);

      if (asset.assetType !== 'logo') {
        // Documents don't have variants, keep as-is
        expandedAssets.push(asset);
        return;
      }

      const productName = asset.brand?.toLowerCase() || asset.id.split('-')[0];
      const colorModes: ('light' | 'dark')[] = ['light', 'dark'];

      if (isCIQCompanyLogo(productName)) {
        // CIQ: CLI backend now provides only 1-color variants
        // Use them directly instead of expanding from single asset
        const colorVariant = asset.metadata?.colorVariant || '1-color';
        const backgroundMode = asset.metadata?.background || (asset.id.includes('dark') ? 'dark' : 'light');

        // Generate proper display name for 1-color variants only
        const displayName = `CIQ Standard ${backgroundMode === 'light' ? 'Light' : 'Dark'} Mode`;
        const usageContext = backgroundMode === 'light'
          ? 'general business use, presentations'
          : 'dark backgrounds, headers';

        expandedAssets.push({
          ...asset,
          id: `${asset.id}-variant`,
          displayName: displayName,
          description: usageContext,
          // Store variant config for click handling
          variantMetadata: {
            product: productName,
            variant: colorVariant,
            colorMode: backgroundMode
          }
        });
      } else {
        // Product logos: Backend already provides orientation variants,
        // we just need to multiply each by color modes (light/dark)
        // Each backend asset × 2 color modes = 2 variants per asset

        colorModes.forEach(colorMode => {
          // Get the actual orientation from the asset's existing metadata or ID
          const assetVariant = asset.metadata?.variant || asset.id.split('-')[1] || 'horizontal';

          // Get display name from variant metadata for better labeling
          const variantMeta = getVariantMetadata(productName);
          const matchingVariant = variantMeta.find(v => v.variant === assetVariant);
          const baseDisplayName = matchingVariant?.displayName || asset.displayName || `${productName.toUpperCase()} Logo`;

          expandedAssets.push({
            ...asset,
            id: `${asset.id}-${colorMode}`,
            displayName: `${baseDisplayName} (${colorMode === 'light' ? 'Light' : 'Dark'})`,
            description: matchingVariant?.usageContext || asset.description,
            // Store variant config for click handling
            variantMetadata: {
              product: productName,
              variant: assetVariant,
              colorMode: colorMode
            }
          });
        });
      }
    });

    return expandedAssets;
  };

  const displayAssets = generateVariantAssets(assets);

  // Debug: Log what assets are being rendered
  console.log('AssetGrid rendering', displayAssets.length, 'assets');
  console.log('ShowVariantGrid:', showVariantGrid);
  if (showVariantGrid) {
    console.log('Variant assets generated:', displayAssets.map(a => `${a.displayName} (${a.id})`));
  }

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

  if (displayAssets.length === 0) {
    return (
      <div className="text-center py-16">
        <Search size={48} className="mx-auto mb-4" style={{ color: 'var(--quantic-color-gray-dark-mode-600)' }} />
        <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--quantic-text-primary)' }}>No assets found</h3>
        <p style={{ color: 'var(--quantic-color-gray-dark-mode-400)' }}>Try adjusting your search terms or filters</p>
      </div>
    );
  }

  return (
    <div>
      {/* Unified Asset Grid - All assets together */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
        {displayAssets.map((asset) => {
          const handleClick = () => {
            // If this is a variant asset (has variantMetadata), pass it to the click handler
            if (asset.variantMetadata) {
              const variantConfig: VariantConfig = {
                product: asset.variantMetadata.product,
                variant: asset.variantMetadata.variant as any,
                colorMode: asset.variantMetadata.colorMode as any
              };
              onAssetClick?.(asset, variantConfig);
            } else {
              onAssetClick?.(asset);
            }
          };

          // Check if this asset should auto-open modal (only first matching asset)
          const shouldAutoOpen = autoOpenModal && variantConfig &&
            variantConfig.product.toLowerCase() === (asset.brand?.toLowerCase() || asset.id.split('-')[0]) &&
            // Only the first matching asset should auto-open
            displayAssets.findIndex(a =>
              variantConfig.product.toLowerCase() === (a.brand?.toLowerCase() || a.id.split('-')[0])
            ) === displayAssets.indexOf(asset);

          // For URL-based variant config, pass the URL config to the matching asset
          const configForAsset = shouldAutoOpen ? variantConfig : asset.variantMetadata;

          return (
            <AssetCard
              key={asset.id}
              asset={asset}
              onClick={handleClick}
              variantConfig={configForAsset}
              autoOpenModal={shouldAutoOpen}
              onModalClose={onModalClose}
            />
          );
        })}
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
            You have reached the end of all available assets
          </p>
        </div>
      )}
    </div>
  );
}