import { Asset } from '@/types/asset';
import { ComponentType } from 'react';

export interface ImageConstraints {
  maxHeight: string;
  maxWidth: string;
  objectFit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

export interface CardText {
  title: string;
  subtitle: string;
}

export interface AssetDisplayHandler {
  getImageConstraints(): ImageConstraints;
  getCardText(asset: Asset, variantConfig?: any): CardText;
  getModalComponent(): string; // Component name to import
}

class LogoAssetHandler implements AssetDisplayHandler {
  getImageConstraints(): ImageConstraints {
    return {
      maxHeight: '100px',
      maxWidth: '100%',
      objectFit: 'contain'
    };
  }

  getCardText(asset: Asset, variantConfig?: any): CardText {
    // Determine the actual configuration from asset data
    const actualFormat = this.getActualFormat(asset, variantConfig);
    const actualColorMode = this.getActualColorMode(asset, variantConfig);
    const actualSize = this.getActualSize(asset, variantConfig);

    return {
      title: `${asset.brand || 'Brand'} logo`,
      subtitle: `${actualSize} ${actualFormat} • ${actualColorMode} mode`
    };
  }

  private getActualFormat(asset: Asset, variantConfig?: any): string {
    // Priority: variantConfig format > modal default (PNG)
    // Note: We ignore asset.fileType because hover should show current modal config, not source format
    if (variantConfig?.format) {
      return variantConfig.format.toUpperCase();
    }
    return 'PNG'; // Default for logos (matches modal default)
  }

  private getActualColorMode(asset: Asset, variantConfig?: any): string {
    // Priority: variantConfig > asset variantMetadata > asset metadata > default
    if (variantConfig?.colorMode) {
      return variantConfig.colorMode;
    }
    if (asset.variantMetadata?.colorMode) {
      return asset.variantMetadata.colorMode;
    }
    if (asset.metadata?.backgroundMode) {
      return asset.metadata.backgroundMode;
    }
    return 'light'; // Default assumption for most logos
  }

  private getActualSize(asset: Asset, variantConfig?: any): string {
    // Priority: variantConfig size > asset metadata size > default
    if (variantConfig?.size) {
      return this.formatSize(variantConfig.size);
    }
    if (asset.metadata?.size) {
      return this.formatSize(asset.metadata.size);
    }
    return 'Medium'; // Default size
  }

  private formatSize(size: string): string {
    // Capitalize first letter
    return size.charAt(0).toUpperCase() + size.slice(1).toLowerCase();
  }

  getModalComponent(): string {
    return 'DownloadModalNew';
  }
}

class DocumentAssetHandler implements AssetDisplayHandler {
  getImageConstraints(): ImageConstraints {
    return {
      maxHeight: '100%', // Fill available container space (within padding)
      maxWidth: '100%',
      objectFit: 'contain'
    };
  }

  getCardText(asset: Asset, variantConfig?: any): CardText {
    const pages = asset.metadata?.pages || 1;
    const fileSize = asset.metadata?.fileSize || '';

    return {
      title: asset.displayName || 'Document',
      subtitle: `${pages} page${pages !== 1 ? 's' : ''} • ${fileSize}`
    };
  }

  getModalComponent(): string {
    return 'DocumentPreviewModal';
  }
}

// Factory function
export const getAssetHandler = (assetType: string): AssetDisplayHandler => {
  switch (assetType) {
    case 'document':
      return new DocumentAssetHandler();
    case 'logo':
    default:
      return new LogoAssetHandler();
  }
};

// Export handlers for direct use if needed
export { LogoAssetHandler, DocumentAssetHandler };