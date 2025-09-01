import { useState, useEffect, useCallback, useMemo } from 'react';
import { Asset } from '@/types/asset';
import { UserContext, SmartDefaults } from '@/lib/smart-defaults/types';
import { SmartDefaultsEngine } from '@/lib/smart-defaults/engine';
import { ContextDetector } from '@/lib/smart-defaults/context';

interface UseSmartDefaultsOptions {
  enableAutoDetection?: boolean;
  cacheResults?: boolean;
  confidenceThreshold?: number;
}

interface UseSmartDefaultsResult {
  smartDefaults: SmartDefaults | null;
  userContext: UserContext;
  isLoading: boolean;
  error: string | null;
  confidence: number;
  reasoning: string[];
  refresh: () => Promise<void>;
  updateContext: (updates: Partial<UserContext>) => void;
}

export function useSmartDefaults(
  asset: Asset | null,
  options: UseSmartDefaultsOptions = {}
): UseSmartDefaultsResult {
  const {
    enableAutoDetection = true,
    cacheResults = true,
    confidenceThreshold = 0.6
  } = options;

  // State
  const [smartDefaults, setSmartDefaults] = useState<SmartDefaults | null>(null);
  const [userContext, setUserContext] = useState<UserContext | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize smart defaults engine
  const engine = useMemo(() => new SmartDefaultsEngine({
    confidenceThreshold,
    useTeamPatterns: true,
    fallbackToMostPopular: true
  }), [confidenceThreshold]);

  // Detect user context on mount
  useEffect(() => {
    if (!enableAutoDetection) return;

    const context = ContextDetector.detectUserContext({
      source: 'web',
      searchParams: typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
    });

    setUserContext(context);
  }, [enableAutoDetection]);

  // Generate smart defaults when asset or context changes
  useEffect(() => {
    if (!asset || !userContext) return;

    let isCancelled = false;

    const generateDefaults = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Check cache first
        const cacheKey = `smart-defaults-${asset.id}-${JSON.stringify(userContext)}`;
        
        if (cacheResults && typeof localStorage !== 'undefined') {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            const cachedDefaults = JSON.parse(cached);
            // Check if cache is less than 1 hour old
            if (Date.now() - cachedDefaults.timestamp < 3600000) {
              setSmartDefaults(cachedDefaults.data);
              setIsLoading(false);
              return;
            }
          }
        }

        // Generate new defaults
        const defaults = await engine.generateDefaults(asset, userContext);
        
        if (isCancelled) return;

        // Validate confidence threshold
        if (defaults.confidence < confidenceThreshold) {
          console.warn(`Smart defaults confidence (${defaults.confidence}) below threshold (${confidenceThreshold})`);
          // Still set the defaults but with a warning
        }

        setSmartDefaults(defaults);

        // Cache the results
        if (cacheResults && typeof localStorage !== 'undefined') {
          const cacheData = {
            data: defaults,
            timestamp: Date.now()
          };
          localStorage.setItem(cacheKey, JSON.stringify(cacheData));
        }

      } catch (err) {
        if (!isCancelled) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to generate smart defaults';
          setError(errorMessage);
          console.error('Smart defaults generation failed:', err);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    generateDefaults();

    return () => {
      isCancelled = true;
    };
  }, [asset, userContext, engine, confidenceThreshold, cacheResults]);

  // Refresh function
  const refresh = useCallback(async () => {
    if (!asset || !userContext) return;

    // Clear cache
    if (cacheResults && typeof localStorage !== 'undefined') {
      const cacheKey = `smart-defaults-${asset.id}-${JSON.stringify(userContext)}`;
      localStorage.removeItem(cacheKey);
    }

    // Regenerate
    setIsLoading(true);
    try {
      const defaults = await engine.generateDefaults(asset, userContext);
      setSmartDefaults(defaults);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh smart defaults';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [asset, userContext, engine, cacheResults]);

  // Update context function
  const updateContext = useCallback((updates: Partial<UserContext>) => {
    setUserContext(prev => prev ? { ...prev, ...updates } : null);
  }, []);

  // Derived values
  const confidence = smartDefaults?.confidence ?? 0;
  const reasoning = smartDefaults?.reasoning ?? [];

  return {
    smartDefaults,
    userContext: userContext!,
    isLoading,
    error,
    confidence,
    reasoning,
    refresh,
    updateContext
  };
}