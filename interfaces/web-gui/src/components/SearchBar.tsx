'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { SearchFilters } from '@/types/asset';
import { Button } from '@/components/ui/Button';

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void;
  isLoading?: boolean;
}

export default function SearchBar({ onSearch, isLoading = false }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [fileType, setFileType] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch({
      query: query.trim(),
      fileType: fileType || undefined,
    });
  };

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    // Auto-search after typing stops
    if (e.target.value.length > 2) {
      const timeoutId = setTimeout(() => {
        onSearch({
          query: e.target.value.trim(),
          fileType: fileType || undefined,
        });
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            value={query}
            onChange={handleQueryChange}
            placeholder="Search for logos, icons, brand assets..."
            className="w-full px-4 py-3 text-lg rounded-lg focus:outline-none"
            style={{
              border: `1px solid var(--quantic-border-primary)`,
              backgroundColor: 'var(--quantic-color-gray-dark-mode-800)',
              color: 'var(--quantic-text-primary)'
            }}
            disabled={isLoading}
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="px-4 py-3 rounded-lg focus:outline-none"
            style={{
              border: `1px solid var(--quantic-border-primary)`,
              backgroundColor: 'var(--quantic-color-gray-dark-mode-800)',
              color: 'var(--quantic-text-primary)'
            }}
            disabled={isLoading}
          >
            <option value="">All Types</option>
            <option value="svg">SVG</option>
            <option value="png">PNG</option>
            <option value="jpg">JPG</option>
            <option value="gif">GIF</option>
          </select>
          
          <Button
            type="submit"
            variant="primary"
            size="44"
            disabled={isLoading}
            icon={<Search />}
            iconPosition="left"
          >
            {isLoading ? 'Searching...' : 'Search'}
          </Button>
        </div>
      </form>
    </div>
  );
}