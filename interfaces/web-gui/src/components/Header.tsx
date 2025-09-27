'use client';

import React, { useState, useEffect } from 'react';
import { CircleX, Search, Grid3X3, List } from 'lucide-react';
import { SearchFilters } from '@/types/asset';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";

interface HeaderProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
  initialQuery?: string;
  initialAssetType?: string;
  showAllVariants?: boolean;
  onToggleShowAllVariants?: (show: boolean) => void;
}

export default function Header({
  onSearch,
  isLoading = false,
  initialQuery = '',
  initialAssetType = 'logo',
  showAllVariants = false,
  onToggleShowAllVariants
}: HeaderProps) {
  const [query, setQuery] = useState(initialQuery);
  const [assetType, setAssetType] = useState(initialAssetType);

  // Update state when initial values change (e.g., from URL parameters)
  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setAssetType(initialAssetType);
  }, [initialAssetType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Map "all" to empty string for API
    const apiAssetType = assetType === 'all' ? '' : assetType;
    onSearch({
      query: query.trim(),
      assetType: apiAssetType || undefined,
    });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    // Auto-search after typing stops
    if (value.length > 2) {
      const timeoutId = setTimeout(() => {
        // Map "all" to empty string for API
        const apiAssetType = assetType === 'all' ? '' : assetType;
        onSearch({
          query: value.trim(),
          assetType: apiAssetType || undefined,
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  // Simplified asset type change - no more complex logic for show-all-variants
  const handleAssetTypeChange = (value: string) => {
    setAssetType(value);
    // Map "all" to empty string for API
    const apiAssetType = value === 'all' ? '' : value;
    onSearch({
      query: query.trim(),
      assetType: apiAssetType || undefined,
    });
  };

  // Separate handler for display mode toggle
  const handleDisplayModeToggle = (pressed: boolean) => {
    onToggleShowAllVariants?.(pressed);
  };

  const handleClearSearch = () => {
    setQuery('');
    // Map "all" to empty string for API
    const apiAssetType = assetType === 'all' ? '' : assetType;
    onSearch({
      query: '',
      assetType: apiAssetType || undefined,
    });
  };

  // Get display label for asset type
  const getAssetTypeLabel = (value: string) => {
    switch (value) {
      case '': return 'ALL TYPES';
      case 'logo': return 'LOGOS';
      case 'document': return 'SOLUTION BRIEF';
      default: return 'ALL TYPES';
    }
  };

  return (
    <div className="bg-[#13161b] relative w-full h-[134px]" data-name="header">
      <div className="absolute content-stretch flex items-center justify-between left-4 sm:left-8 lg:left-[51px] right-4 sm:right-8 lg:right-[51px] top-[47px]">
        <div className="content-stretch flex gap-3 sm:gap-4 lg:gap-6 items-center justify-start relative shrink-0">
          <div className="h-[37px] relative shrink-0 w-[90px] flex items-center">
            <img
              src="/assets/global/CIQ_logos/CIQ_logo_2clr_darkmode.svg"
              alt="CIQ Logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#85888e] text-base sm:text-lg text-nowrap hidden sm:block">
            <p className="leading-[28px] whitespace-pre">Brand asset finder (Beta)</p>
          </div>
        </div>

        <div className="content-stretch flex gap-2 sm:gap-4 lg:gap-6 items-center justify-start relative shrink-0">
          {/* Asset Type Filter - Pure filtering, no display mode mixing */}
          <Select
            value={assetType}
            onValueChange={handleAssetTypeChange}
            disabled={isLoading}
          >
            <SelectTrigger
              className="backdrop-blur-[2px] backdrop-filter bg-[rgba(19,22,27,0.65)] h-10 w-[140px] border-[#373a41] text-[#cecfd2] text-[14px] font-['Inter:Semibold',_sans-serif] uppercase hover:bg-[rgba(19,22,27,0.85)] focus:ring-[#373a41]"
              data-name="asset-type-filter"
            >
              <SelectValue placeholder="ALL TYPES" />
            </SelectTrigger>
            <SelectContent className="bg-[rgba(19,22,27,0.95)] border-[#373a41] backdrop-blur-md">
              <SelectItem value="all" className="text-[#cecfd2] uppercase hover:bg-[#373a41] focus:bg-[#373a41]">
                ALL TYPES
              </SelectItem>
              <SelectItem value="logo" className="text-[#cecfd2] uppercase hover:bg-[#373a41] focus:bg-[#373a41]">
                LOGOS
              </SelectItem>
              <SelectItem value="document" className="text-[#cecfd2] uppercase hover:bg-[#373a41] focus:bg-[#373a41]">
                SOLUTION BRIEF
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Display Mode Toggle - Separate control for variants */}
          <Toggle
            pressed={showAllVariants}
            onPressedChange={handleDisplayModeToggle}
            disabled={isLoading}
            className="h-10 px-3 bg-[rgba(19,22,27,0.65)] border border-[#373a41] text-[#cecfd2] hover:bg-[rgba(19,22,27,0.85)] data-[state=on]:bg-[#373a41] data-[state=on]:text-[#ffffff]"
            aria-label="Toggle display mode"
          >
            {showAllVariants ? (
              <>
                <Grid3X3 className="h-4 w-4 mr-2" />
                <span className="text-[12px] font-['Inter:Semibold',_sans-serif] uppercase">ALL VARIANTS</span>
              </>
            ) : (
              <>
                <List className="h-4 w-4 mr-2" />
                <span className="text-[12px] font-['Inter:Semibold',_sans-serif] uppercase">PRIMARY</span>
              </>
            )}
          </Toggle>

          {/* Search Input - Unchanged */}
          <div className="relative rounded-[8px] shrink-0 w-48 sm:w-64 lg:w-80 h-10 flex items-center" style={{ backgroundColor: 'var(--quantic-bg-primary)' }}>
            <div className="box-border content-stretch flex gap-2 items-center justify-start overflow-clip px-3 py-2 relative w-full h-full">
              <div className="basis-0 content-stretch flex gap-2 grow items-center justify-start min-h-px min-w-px relative shrink-0">
                <div className="overflow-clip relative shrink-0 size-5">
                  <Search size={20} className="text-[#717680]" />
                </div>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => handleQueryChange(e.target.value)}
                  placeholder="Search"
                  disabled={isLoading}
                  className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[24px] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#717680] text-[16px] bg-transparent border-none outline-none h-6"
                  style={{ "--placeholder-color": "#717680" } as React.CSSProperties}
                />
                {query && (
                  <button
                    onClick={handleClearSearch}
                    className="flex items-center justify-center shrink-0 w-5 h-5 text-[#717680] hover:text-[#cecfd2] transition-colors"
                    aria-label="Clear search"
                  >
                    <CircleX size={20} />
                  </button>
                )}
              </div>
            </div>
            <div aria-hidden="true" className="absolute border border-[#373a41] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
          </div>
        </div>
      </div>
    </div>
  );
}