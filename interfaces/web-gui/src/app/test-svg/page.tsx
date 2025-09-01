'use client';

import { useState, useEffect } from 'react';
import { manipulateSvgColors, BRAND_COLORS, BrandColor } from '@/lib/svgColorTest';

const SVG_ASSETS = [
  {
    name: 'Horizontal Logo',
    path: '/assets/products/fuzzball/logos/Fuzzball_logo_logo_h-wht.svg'
  },
  {
    name: 'Vertical Logo', 
    path: '/assets/products/fuzzball/logos/Fuzzball_logo_logo_v-blk.svg'
  }
];

export default function TestSvgPage() {
  const [svgContents, setSvgContents] = useState<Record<string, string>>({});
  const [selectedColor, setSelectedColor] = useState<BrandColor>('black');

  useEffect(() => {
    // Load all SVG contents
    Promise.all(
      SVG_ASSETS.map(async (asset) => {
        try {
          const response = await fetch(asset.path);
          const content = await response.text();
          return { path: asset.path, content };
        } catch (error) {
          console.error(`Failed to load ${asset.path}:`, error);
          return { path: asset.path, content: '' };
        }
      })
    ).then((results) => {
      const contents: Record<string, string> = {};
      results.forEach(({ path, content }) => {
        contents[path] = content;
      });
      setSvgContents(contents);
    });
  }, []);

  const getColoredSvgDataUrl = (svgContent: string, color: string) => {
    if (!svgContent) return '';
    const coloredSvg = manipulateSvgColors(svgContent, color);
    const encodedSvg = btoa(unescape(encodeURIComponent(coloredSvg)));
    return `data:image/svg+xml;base64,${encodedSvg}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Fuzzball Logo Set - SVG Color Test
        </h1>
        
        {/* Color Selector */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Select Color:</h2>
          <div className="flex flex-wrap gap-3">
            {Object.entries(BRAND_COLORS).map(([colorName, colorValue]) => (
              <button
                key={colorName}
                onClick={() => setSelectedColor(colorName as BrandColor)}
                className={`px-4 py-2 rounded-md border-2 transition-all ${
                  selectedColor === colorName
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded border"
                    style={{ backgroundColor: colorValue }}
                  />
                  <span className="capitalize">{colorName.replace('-', ' ')}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Logo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SVG_ASSETS.map((asset) => {
            const svgContent = svgContents[asset.path];
            const coloredDataUrl = getColoredSvgDataUrl(svgContent, BRAND_COLORS[selectedColor]);
            
            return (
              <div key={asset.path} className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-medium mb-4 text-center">{asset.name}</h3>
                <div className="aspect-square flex items-center justify-center bg-gray-100 rounded-lg p-4">
                  {coloredDataUrl ? (
                    <img
                      src={coloredDataUrl}
                      alt={asset.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <div className="text-gray-500">Loading...</div>
                  )}
                </div>
                <div className="mt-4 text-sm text-gray-600">
                  <div>Color: {selectedColor.replace('-', ' ')}</div>
                  <div>Value: {BRAND_COLORS[selectedColor]}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Technical Details */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Technical Details</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <div>• SVG files loaded from: <code>/assets/products/fuzzball/logos/</code></div>
            <div>• Color manipulation via DOM string replacement</div>
            <div>• Base64 data URL encoding for browser display</div>
            <div>• Available variants: Horizontal, Vertical</div>
          </div>
        </div>
      </div>
    </div>
  );
}