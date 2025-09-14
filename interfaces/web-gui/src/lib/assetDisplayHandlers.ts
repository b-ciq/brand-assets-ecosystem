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
  getCardText(asset: Asset): CardText;
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

  getCardText(asset: Asset): CardText {
    return {
      title: `${asset.brand || 'Brand'} logo`,
      subtitle: 'Medium PNG • dark mode'
    };
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

  getCardText(asset: Asset): CardText {
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