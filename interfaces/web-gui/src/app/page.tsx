'use client';

import { useState, useEffect, useCallback } from 'react';
import { Asset, SearchFilters, SearchResponse } from '@/types/asset';
import Header from '@/components/Header';
import AssetGrid from '@/components/AssetGrid';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';

export default function Home() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilters, setCurrentFilters] = useState<SearchFilters>({ query: '' });
  const [initialFilters, setInitialFilters] = useState<SearchFilters>({ query: '' });

  const handleSearch = async (filters: SearchFilters, page: number = 1, append: boolean = false) => {
    if (page === 1) {
      setIsLoading(true);
      setHasSearched(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const params = new URLSearchParams();
      if (filters.query) params.set('query', filters.query);
      if (filters.fileType) params.set('fileType', filters.fileType);
      if (filters.assetType) params.set('assetType', filters.assetType);
      params.set('page', page.toString());

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Search failed');

      const data: SearchResponse = await response.json();
      console.log('Search response:', data);
      console.log('Assets count:', data.assets?.length);
      console.log('Asset brands:', data.assets?.map(a => `${a.brand} (${a.id})`));
      
      // Debug: Check for CIQ logos specifically
      const ciqAssets = data.assets?.filter(a => a.brand === 'CIQ');
      console.log('CIQ assets found:', ciqAssets?.length, ciqAssets?.map(a => a.id));
      
      if (append && page > 1) {
        // Append new assets to existing ones
        setAssets(prev => [...prev, ...data.assets]);
        console.log('Appended assets, new total:', assets.length + data.assets.length);
      } else {
        // Replace assets (new search)
        setAssets(data.assets);
        setCurrentPage(1);
        console.log('Set assets:', data.assets.length);
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
    
    // Build initial filters from URL parameters
    const initialFilters: SearchFilters = {
      query: query || '',
      fileType: fileType || undefined,
      assetType: assetType || undefined,
    };
    
    console.log('Initial load with filters:', initialFilters);
    
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--quantic-bg-primary)' }}>
      {/* Header */}
      <Header 
        onSearch={handleNewSearch} 
        isLoading={isLoading}
        initialQuery={initialFilters.query || ''}
        initialAssetType={initialFilters.assetType || ''}
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
