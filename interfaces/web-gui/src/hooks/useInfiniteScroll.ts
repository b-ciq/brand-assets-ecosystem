'use client';

import { useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions {
  onLoadMore: () => void;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number; // Distance from bottom in pixels to trigger load
}

export function useInfiniteScroll({ 
  onLoadMore, 
  hasMore, 
  isLoading, 
  threshold = 200 
}: UseInfiniteScrollOptions) {
  const loadMoreRef = useRef<() => void>();
  
  // Update the ref to always have the latest onLoadMore function
  loadMoreRef.current = onLoadMore;

  const handleScroll = useCallback(() => {
    // Don't trigger if already loading or no more items
    if (isLoading || !hasMore) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Check if user is near the bottom
    const distanceToBottom = documentHeight - (scrollTop + windowHeight);
    
    if (distanceToBottom <= threshold) {
      loadMoreRef.current?.();
    }
  }, [isLoading, hasMore, threshold]);

  useEffect(() => {
    // Throttle scroll events for performance
    let timeoutId: NodeJS.Timeout;
    
    const throttledHandleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledHandleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', throttledHandleScroll);
      clearTimeout(timeoutId);
    };
  }, [handleScroll]);

  return {
    // Expose any utilities if needed
    isNearBottom: () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const distanceToBottom = documentHeight - (scrollTop + windowHeight);
      return distanceToBottom <= threshold;
    }
  };
}