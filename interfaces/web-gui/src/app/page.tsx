'use client';

import { useState, useEffect, useCallback } from 'react';
import { Asset, SearchFilters, SearchResponse } from '@/types/asset';
import Header from '@/components/Header';
import AssetGrid from '@/components/AssetGrid';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { demoSearchAssets } from '@/lib/demoSearchService';

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({ query: '', assetType: 'logo' });
  const [initialFilters, setInitialFilters] = useState<SearchFilters>({ query: '', assetType: 'logo' });
  const [showAllVariants, setShowAllVariants] = useState(false);

  const handleSearch = async (filters: SearchFilters, page: number = 1, append: boolean = false, useShowAllVariants?: boolean) => {
    if (page === 1) {
      setIsLoading(true);
      setHasSearched(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      // Check if we're in demo mode (static export)
      const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
      
      let data: SearchResponse;
      
      if (isDemoMode) {
        // Use client-side search for demo mode
        console.log('🎭 Using demo mode client-side search');
        const demoResult = await demoSearchAssets(filters.query || '', useShowAllVariants ?? showAllVariants, filters.assetType);
        data = {
          assets: demoResult.assets,
          total: demoResult.total,
          page: page,
          hasMore: false
        };
      } else {
        // Use API route for local development
        const params = new URLSearchParams();
        if (filters.query) params.set('query', filters.query);
        if (filters.fileType) params.set('fileType', filters.fileType);
        if (filters.assetType) params.set('assetType', filters.assetType);
        if (useShowAllVariants ?? showAllVariants) params.set('showAllVariants', 'true');
        params.set('page', page.toString());

        const response = await fetch(`/api/search?${params.toString()}`);
        if (!response.ok) throw new Error('Search failed');
        data = await response.json();
      }
      
      if (append && page > 1) {
        // Append new assets to existing ones
        setAssets(prev => [...prev, ...data.assets]);
      } else {
        // Replace assets (new search)
        setAssets(data.assets);
        setCurrentPage(1);
      }
      
      setHasMore(data.hasMore);
      setCurrentFilters(filters);
      
    } catch (error) {
      console.error('Search error:', error);
      if (!append) setAssets([]);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  // Check for URL parameters and load assets
  useEffect(() => {
    // Parse URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('query');
    const fileType = urlParams.get('fileType');
    const assetType = urlParams.get('assetType');
    
    // Build initial filters from URL parameters (with logo as default)
    const initialFilters: SearchFilters = {
      query: query || '',
      fileType: fileType || undefined,
      assetType: assetType || 'logo',
    };
    
    
    // Execute search (empty query will show all assets)
    handleSearch(initialFilters);
    
    // Update current filters state to match URL
    setCurrentFilters(initialFilters);
    // Store initial filters for Header component
    setInitialFilters(initialFilters);
  }, []);

  // Load more function for infinite scroll
  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      handleSearch(currentFilters, nextPage, true);
    }
  }, [currentFilters, currentPage, hasMore, isLoadingMore]);

  // Initialize infinite scroll
  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading: isLoadingMore,
    threshold: 300
  });

  const handleAssetClick = (asset: Asset) => {
    // TODO: Open asset preview modal
    console.log('Asset clicked:', asset);
  };

  // Handle new search (reset pagination)
  const handleNewSearch = useCallback((filters: SearchFilters) => {
    setCurrentPage(1);
    handleSearch(filters, 1, false);
  }, []);

  // Handle show all variants toggle
  const handleToggleShowAllVariants = useCallback((show: boolean) => {
    setShowAllVariants(show);
    // Re-run current search with new setting immediately, passing the new value explicitly
    setCurrentPage(1);
    handleSearch(currentFilters, 1, false, show);
  }, [currentFilters]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--quantic-bg-primary)' }}>
      {/* Header */}
      <Header 
        onSearch={handleNewSearch} 
        isLoading={isLoading}
        initialQuery={initialFilters.query || ''}
        initialAssetType={initialFilters.assetType || ''}
        showAllVariants={showAllVariants}
        onToggleShowAllVariants={handleToggleShowAllVariants}
      />

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {hasSearched && (
          <div className="mt-8">
            <AssetGrid 
              assets={assets} 
              isLoading={isLoading}
              isLoadingMore={isLoadingMore}
              hasMore={hasMore}
              onAssetClick={handleAssetClick}
            />
          </div>
        )}

      </main>
    </div>
  );
}
