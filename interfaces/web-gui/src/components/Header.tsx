'use client';

import React, { useState, useEffect } from 'react';
import { CircleX, Search } from 'lucide-react';
import { SearchFilters } from '@/types/asset';

// Image assets from Figma
const img = "http://localhost:3845/assets/14bf26523770e5291987e68114b2e06c0710d4de.svg";
const img1 = "http://localhost:3845/assets/a76d0da4237b43b795599d404520f19e4784a22f.svg";
const imgCiqLogo = "http://localhost:3845/assets/43840fe1b0ad0aff099b98fa01cf64d9603df415.svg";
const img2 = "http://localhost:3845/assets/85225e690f04b0dbca4b76efef7e014175dc6d0a.svg";
const img3 = "http://localhost:3845/assets/2cb663b62a41c96528d046bfb134e9271854e741.svg";

interface SelectProps {
  label?: boolean;
  hintText?: boolean;
  supportingText?: boolean;
  scrollBar?: boolean;
  iconSwap?: React.ReactNode | null;
  required?: boolean;
  helpIcon?: boolean;
  shortcut?: boolean;
  size?: "sm" | "md";
  type?: "Default" | "Icon leading" | "Avatar leading" | "Dot leading" | "Search" | "Tags";
  state?: "Placeholder" | "Default" | "Focused" | "Open" | "Disabled";
}

function Select({ label = true, hintText = true, supportingText = true, scrollBar = true, iconSwap = null, required = true, helpIcon = true, shortcut = true, size = "sm", type = "Default", state = "Placeholder" }: SelectProps) {
  if (size === "sm" && type === "Search" && state === "Placeholder") {
    return (
      <button className="box-border content-stretch cursor-pointer flex flex-col gap-1.5 items-start justify-start p-0 relative size-full" data-name="Size=sm, Type=Search, State=Placeholder" data-node-id="1:7871">
        <div className="content-stretch flex flex-col gap-1.5 items-start justify-start relative shrink-0 w-full" data-name="Input with label" data-node-id="1:7872">
          {label && (
            <div className="content-stretch flex gap-0.5 items-center justify-start relative shrink-0" data-name="Label wrapper" data-node-id="1:7873">
              <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#414651] text-[14px] text-nowrap" data-node-id="1:7874">
                <p className="leading-[20px] whitespace-pre">Search</p>
              </div>
              {required && (
                <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#097049] text-[14px] text-nowrap" data-node-id="1:7875">
                  <p className="leading-[20px] whitespace-pre">*</p>
                </div>
              )}
              {helpIcon && (
                <div className="relative shrink-0 size-4" data-name="Help icon" data-node-id="1:7876">
                  <div className="absolute inset-0 overflow-clip" data-name="help-circle" id="node-I1_7876-1054_3">
                    <div className="absolute inset-[8.333%]" data-name="Icon" id="node-I1_7876-1054_3-3463_405412">
                      <div className="absolute inset-[-5%]" style={{ "--stroke-0": "rgba(164, 167, 174, 1)" } as React.CSSProperties}>
                        <img alt="" className="block max-w-none size-full" src={img} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          <div className="bg-[#e9eaeb] relative rounded-[8px] shrink-0 w-full" data-name="Input" data-node-id="1:7877">
            <div className="box-border content-stretch flex gap-2 items-center justify-start overflow-clip px-3 py-2 relative w-full">
              <div className="basis-0 content-stretch flex gap-2 grow items-center justify-start min-h-px min-w-px relative shrink-0" data-name="Content" data-node-id="1:7878">
                <div className="overflow-clip relative shrink-0 size-5" data-name="search-lg" data-node-id="1:7879">
                  <div className="absolute inset-[12.5%]" data-name="Icon" id="node-I1_7879-3463_405301">
                    <div className="absolute inset-[-5.56%]" style={{ "--stroke-0": "rgba(164, 167, 174, 1)" } as React.CSSProperties}>
                      <img alt="" className="block max-w-none size-full" src={img1} />
                    </div>
                  </div>
                </div>
                <div className="basis-0 font-['Inter:Regular',_sans-serif] font-normal grow leading-[0] min-h-px min-w-px not-italic overflow-ellipsis overflow-hidden relative shrink-0 text-[#717680] text-[16px] text-nowrap" data-node-id="1:7880">
                  <p className="[text-overflow:inherit] [text-wrap-mode:inherit]\' [white-space-collapse:inherit] leading-[24px] overflow-inherit">Search</p>
                </div>
              </div>
              {shortcut && (
                <div className="box-border content-stretch flex items-start justify-start px-1 py-px relative rounded-[4px] shrink-0" data-name="Shortcut wrapper" data-node-id="1:7881">
                  <div aria-hidden="true" className="absolute border border-[#e9eaeb] border-solid inset-0 pointer-events-none rounded-[4px]" />
                  <div className="font-['Inter:Medium',_sans-serif] font-medium leading-[0] not-italic relative shrink-0 text-[#717680] text-[12px] text-nowrap" data-node-id="1:7882">
                    <p className="leading-[18px] whitespace-pre">⌘K</p>
                  </div>
                </div>
              )}
            </div>
            <div aria-hidden="true" className="absolute border border-[#d5d7da] border-solid inset-0 pointer-events-none rounded-[8px] shadow-[0px_1px_2px_0px_rgba(10,13,18,0.05)]" />
          </div>
        </div>
        {hintText && (
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#535862] text-[14px] w-full" data-node-id="1:7883">
            <p className="leading-[20px]">This is a hint text to help user.</p>
          </div>
        )}
      </button>
    );
  }
}

interface HeaderProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
  initialQuery?: string;
  initialAssetType?: string;
}

export default function Header({ onSearch, isLoading = false, initialQuery = '', initialAssetType = '' }: HeaderProps) {
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
    onSearch({
      query: query.trim(),
      assetType: assetType || undefined,
    });
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    // Auto-search after typing stops
    if (value.length > 2) {
      const timeoutId = setTimeout(() => {
        onSearch({
          query: value.trim(),
          assetType: assetType || undefined,
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  const handleAssetTypeChange = (value: string) => {
    setAssetType(value);
    onSearch({
      query: query.trim(),
      assetType: value || undefined,
    });
  };

  const handleClearSearch = () => {
    setQuery('');
    onSearch({
      query: '',
      assetType: assetType || undefined,
    });
  };
  return (
    <div className="bg-[#13161b] relative w-full h-[134px]" data-name="header" data-node-id="1:6508">
      <div className="absolute content-stretch flex items-center justify-between left-4 sm:left-8 lg:left-[51px] right-4 sm:right-8 lg:right-[51px] top-[47px]" data-node-id="1:10635">
        <div className="content-stretch flex gap-3 sm:gap-4 lg:gap-6 items-center justify-start relative shrink-0" data-node-id="1:10638">
          <div className="h-[37px] relative shrink-0 w-[90px] flex items-center" data-name="CIQ-Logo" data-node-id="1:6527">
            <img 
              src="/assets/global/CIQ_logos/CIQ_logo_2clr_darkmode.svg"
              alt="CIQ Logo"
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="font-['Inter:Regular',_sans-serif] font-normal leading-[0] not-italic relative shrink-0 text-[#85888e] text-base sm:text-lg text-nowrap hidden sm:block" data-node-id="1:10636">
            <p className="leading-[28px] whitespace-pre">Brand asset finder</p>
          </div>
        </div>
        <div className="content-stretch flex gap-2 sm:gap-4 lg:gap-6 items-center justify-start relative shrink-0" data-node-id="1:8979">
          <select
            value={assetType}
            onChange={(e) => handleAssetTypeChange(e.target.value)}
            disabled={isLoading}
            className="backdrop-blur-[2px] backdrop-filter bg-[rgba(19,22,27,0.65)] h-10 relative rounded-[8px] shrink-0 w-[140px] border border-[#373a41] border-solid text-[#cecfd2] text-[14px] font-['Inter:Semibold',_sans-serif] uppercase appearance-none cursor-pointer flex items-center"
            data-name="filter menu" 
            data-node-id="1:10761"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 0.5rem center',
              backgroundRepeat: 'no-repeat',
              backgroundSize: '1.5em 1.5em',
              paddingLeft: '0.75rem',
              paddingRight: '2.5rem'
            }}
          >
            <option value="">ALL TYPES</option>
            <option value="logo">LOGOS</option>
            <option value="document">SOLUTION BRIEF</option>
          </select>
          <div className="relative rounded-[8px] shrink-0 w-48 sm:w-64 lg:w-80 h-10 flex items-center" data-name="Input" data-node-id="1:7877" style={{ backgroundColor: 'var(--quantic-bg-primary)' }}>
            <div className="box-border content-stretch flex gap-2 items-center justify-start overflow-clip px-3 py-2 relative w-full h-full">
              <div className="basis-0 content-stretch flex gap-2 grow items-center justify-start min-h-px min-w-px relative shrink-0" data-name="Content" data-node-id="1:7878">
                <div className="overflow-clip relative shrink-0 size-5" data-name="search-lg" data-node-id="1:7879">
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