import { useState, useCallback } from 'react';
import { Asset } from '@/types/asset';
import { UserContext, DownloadConfig } from '@/lib/smart-defaults/types';
import { QuickDownloadService, QuickDownloadOptions, QuickDownloadResult } from '@/lib/download/quick-download';

interface UseQuickDownloadState {
  isDownloading: boolean;
  error: string | null;
  lastDownload: QuickDownloadResult | null;
  downloadCount: number;
}

interface UseQuickDownloadResult extends UseQuickDownloadState {
  quickDownload: (
    asset: Asset,
    context: UserContext,
    options?: QuickDownloadOptions
  ) => Promise<void>;
  downloadWithDefaults: (asset: Asset, context: UserContext) => Promise<void>;
  previewDefaults: (asset: Asset, context: UserContext) => Promise<any>;
  clearError: () => void;
  reset: () => void;
}

export function useQuickDownload(): UseQuickDownloadResult {
  const [state, setState] = useState<UseQuickDownloadState>({
    isDownloading: false,
    error: null,
    lastDownload: null,
    downloadCount: 0
  });

  const quickDownloadService = new QuickDownloadService();

  // Main quick download function
  const quickDownload = useCallback(async (
    asset: Asset,
    context: UserContext,
    options: QuickDownloadOptions = {}
  ) => {
    setState(prev => ({
      ...prev,
      isDownloading: true,
      error: null
    }));

    try {
      const result = await quickDownloadService.quickDownload(
        asset,
        context,
        { trackAnalytics: true, ...options }
      );

      // Trigger the browser download
      QuickDownloadService.triggerDownload(result.blob, result.filename);

      setState(prev => ({
        ...prev,
        isDownloading: false,
        lastDownload: result,
        downloadCount: prev.downloadCount + 1,
        error: null
      }));

      // Log success for debugging
      console.log(`Quick download completed: ${result.filename} (${result.downloadTime.toFixed(1)}ms)`);
      
      if (result.smartDefaults) {
        console.log('Smart defaults used:', result.smartDefaults.reasoning);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Download failed';
      
      setState(prev => ({
        ...prev,
        isDownloading: false,
        error: errorMessage
      }));

      console.error('Quick download failed:', error);
      
      // Optionally show user-friendly error notification
      // This could be integrated with a toast/notification system
      throw error; // Re-throw so component can handle it
    }
  }, [quickDownloadService]);

  // Simplified download with smart defaults (most common use case)
  const downloadWithDefaults = useCallback(async (
    asset: Asset,
    context: UserContext
  ) => {
    return quickDownload(asset, context, {
      trackAnalytics: true,
      skipSmartDefaults: false
    });
  }, [quickDownload]);

  // Preview what the smart defaults would be
  const previewDefaults = useCallback(async (
    asset: Asset,
    context: UserContext
  ) => {
    try {
      return await quickDownloadService.previewSmartDefaults(asset, context);
    } catch (error) {
      console.error('Failed to preview smart defaults:', error);
      throw error;
    }
  }, [quickDownloadService]);

  // Clear error state
  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      error: null
    }));
  }, []);

  // Reset all state
  const reset = useCallback(() => {
    setState({
      isDownloading: false,
      error: null,
      lastDownload: null,
      downloadCount: 0
    });
  }, []);

  return {
    ...state,
    quickDownload,
    downloadWithDefaults,
    previewDefaults,
    clearError,
    reset
  };
}

// Utility hook for download analytics
export function useDownloadAnalytics() {
  const [analytics, setAnalytics] = useState({
    totalDownloads: 0,
    quickDownloads: 0,
    advancedDownloads: 0,
    averageTime: 0,
    topFormats: {} as Record<string, number>,
    topVariants: {} as Record<string, number>
  });

  const trackDownload = useCallback((result: QuickDownloadResult, type: 'quick' | 'advanced') => {
    setAnalytics(prev => {
      const newAnalytics = {
        ...prev,
        totalDownloads: prev.totalDownloads + 1,
        averageTime: (prev.averageTime * prev.totalDownloads + result.downloadTime) / (prev.totalDownloads + 1)
      };

      if (type === 'quick') {
        newAnalytics.quickDownloads += 1;
      } else {
        newAnalytics.advancedDownloads += 1;
      }

      // Track format popularity
      const format = result.config.format;
      newAnalytics.topFormats = {
        ...prev.topFormats,
        [format]: (prev.topFormats[format] || 0) + 1
      };

      // Track variant popularity
      const variant = result.config.variant;
      newAnalytics.topVariants = {
        ...prev.topVariants,
        [variant]: (prev.topVariants[variant] || 0) + 1
      };

      return newAnalytics;
    });
  }, []);

  return {
    analytics,
    trackDownload
  };
}