#!/usr/bin/env python3
"""
CLI wrapper for the brand assets MCP to be called from Node.js
"""
import json
import sys
import requests
from typing import Optional, Dict, Any, List

# Copy the core functionality without FastMCP dependency
METADATA_URL = 'https://raw.githubusercontent.com/b-ciq/brand-assets-ecosystem/main/core-mcp-dev/metadata/asset-inventory.json'
import os
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
LOCAL_METADATA_PATH = os.path.join(SCRIPT_DIR, 'metadata', 'asset-inventory.json')
SEARCH_PATTERNS_PATH = os.path.join(SCRIPT_DIR, 'metadata', 'search-patterns.json')

def load_asset_data():
    """Load asset metadata from local file first, fallback to GitHub"""
    import os
    
    # Try local file first for development
    if os.path.exists(LOCAL_METADATA_PATH):
        try:
            with open(LOCAL_METADATA_PATH, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading local metadata: {e}", file=sys.stderr)
    
    # Fallback to GitHub
    try:
        response = requests.get(METADATA_URL, timeout=10)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        return None

def load_search_patterns():
    """Load search patterns for product name resolution"""
    try:
        with open(SEARCH_PATTERNS_PATH, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Warning: Could not load search patterns: {e}", file=sys.stderr)
        return None

def resolve_product_from_query(query: str, patterns: Dict) -> Optional[str]:
    """Resolve a query to actual product name using patterns"""
    if not patterns or 'product_patterns' not in patterns:
        return None
    
    query_lower = query.lower().strip()
    
    # Direct product name match
    if query_lower in patterns['product_patterns']:
        return query_lower
    
    # Pattern matching
    for product, aliases in patterns['product_patterns'].items():
        if query_lower in [alias.lower() for alias in aliases]:
            return product
    
    return None

def enhanced_search(query: str, asset_data: Dict, patterns: Dict, show_all_variants: bool = False, asset_type_filter: Optional[str] = None) -> Dict[str, Any]:
    """Enhanced search with pattern matching and unified logic"""
    if not asset_data or 'assets' not in asset_data:
        return {"error": "No asset data available"}
    
    query_lower = query.lower().strip()
    results = {}
    total_found = 0
    
    # STEP 1: Try to resolve query to specific product using patterns
    resolved_product = resolve_product_from_query(query, patterns) if patterns else None
    
    if resolved_product:
        # Specific product search - return only that product
        print(f"🎯 Resolved '{query}' → '{resolved_product}'", file=sys.stderr)
        if resolved_product == 'ciq':
            # Special handling for CIQ - it's not in asset data but we have the logos
            print(f"🎯 Including CIQ company logos for specific CIQ search", file=sys.stderr)
            # CIQ logos will be added below in the CIQ inclusion logic
        elif resolved_product in asset_data['assets']:
            if asset_type_filter:
                # Apply asset type filtering to specific product results
                filtered_assets = {}
                for asset_key, asset_info in asset_data['assets'][resolved_product].items():
                    asset_asset_type = 'document' if asset_info.get('type') == 'document' else 'logo'
                    if asset_asset_type == asset_type_filter:
                        filtered_assets[asset_key] = asset_info
                results[resolved_product] = filtered_assets
                total_found = len(filtered_assets)
            else:
                results[resolved_product] = asset_data['assets'][resolved_product]
                total_found = len(asset_data['assets'][resolved_product])
        else:
            print(f"⚠️  Product '{resolved_product}' not found in asset data", file=sys.stderr)
    else:
        # General search - fallback to keyword matching
        print(f"🔍 General search for '{query}'", file=sys.stderr)
        for product, assets in asset_data['assets'].items():
            product_matches = {}
            
            for asset_key, asset_info in assets.items():
                # Check if query matches product name, asset key, filename, tags, or searchable content
                matches = (
                    query_lower in product.lower() or
                    query_lower in asset_key.lower() or
                    query_lower in asset_info.get('filename', '').lower() or
                    any(query_lower in tag.lower() for tag in asset_info.get('tags', [])) or
                    # For PDFs, also search in searchable content
                    any(query_lower in content.lower() for content in asset_info.get('searchable_content', [])) or
                    # Search in content summary for PDFs
                    query_lower in asset_info.get('content_summary', '').lower() or
                    # Search in document type
                    query_lower in asset_info.get('document_type', '').replace('-', ' ').lower()
                )
                
                if matches:
                    # Apply asset type filtering if specified
                    if asset_type_filter:
                        asset_asset_type = 'document' if asset_info.get('type') == 'document' else 'logo'
                        if asset_asset_type != asset_type_filter:
                            continue  # Skip this asset

                    product_matches[asset_key] = asset_info
                    total_found += 1
            
            if product_matches:
                results[product] = product_matches
    
    # Check if CIQ company logos should be included
    should_include_ciq = False
    if not resolved_product:  # General search
        ciq_rules = patterns.get('search_rules', {}).get('ciq_inclusion', {}).get('rules', {})
        general_keywords = ciq_rules.get('general_search_keywords', ['logo', 'brand', 'company', 'all', ''])
        
        if query_lower in [kw.lower() for kw in general_keywords] or query_lower == '':
            should_include_ciq = True
            print(f"🎯 Including CIQ company logos for general search: '{query}'", file=sys.stderr)
    elif resolved_product == 'ciq':  # Specific CIQ search
        should_include_ciq = True
        print(f"🎯 Including CIQ company logos for specific CIQ search", file=sys.stderr)
    
    # Add CIQ company logos if criteria met
    if should_include_ciq:
        ciq_logos = {
            "1color_light": {
                "url": "/assets/global/CIQ_logos/CIQ_logo_1clr_lightmode.svg",
                "filename": "CIQ_logo_1clr_lightmode.svg",
                "background": "light",
                "color": "black",
                "layout": "horizontal",
                "colorVariant": "1-color",
                "type": "logo",
                "size": "large",
                "tags": ["company", "primary", "general-use"]
            },
            "1color_dark": {
                "url": "/assets/global/CIQ_logos/CIQ_logo_1clr_darkmode.svg",
                "filename": "CIQ_logo_1clr_darkmode.svg",
                "background": "dark",
                "color": "white",
                "layout": "horizontal",
                "colorVariant": "1-color",
                "type": "logo",
                "size": "large",
                "tags": ["company", "dark-mode"]
            }
        }
        results['ciq'] = ciq_logos
        total_found += len(ciq_logos)
    
    # Filter to primary variants only unless show_all_variants is True
    if not show_all_variants and results:
        filtered_results = {}
        filtered_total = 0

        for product, product_assets in results.items():
            filtered_assets = {}

            # Always include documents (they are not variants of each other)
            documents = {k: v for k, v in product_assets.items() if v.get('type') == 'document'}
            filtered_assets.update(documents)

            # For logos, find primary variant (horizontal layout preferred)
            logos = {k: v for k, v in product_assets.items() if v.get('type') != 'document'}
            if logos:
                primary_logo_key = None
                for asset_key, asset_info in logos.items():
                    if asset_info.get('layout') == 'horizontal':
                        primary_logo_key = asset_key
                        break

                # Fallback to first logo if no horizontal found
                if not primary_logo_key:
                    primary_logo_key = list(logos.keys())[0]

                if primary_logo_key:
                    filtered_assets[primary_logo_key] = logos[primary_logo_key]

            if filtered_assets:
                filtered_results[product] = filtered_assets
                filtered_total += len(filtered_assets)

        results = filtered_results
        total_found = filtered_total
    
    return {
        'status': 'success',
        'total_found': total_found,
        'assets': results,
        'confidence': 'medium' if total_found > 0 else 'none',
        'recommendation': f"Found {total_found} assets matching '{query}'" + (" (primary variants)" if not show_all_variants else " (all variants)")
    }

def main():
    # Parse command line arguments
    import argparse
    parser = argparse.ArgumentParser(description='Brand Assets Search CLI')
    parser.add_argument('query', help='Search query')
    parser.add_argument('--show-all-variants', action='store_true',
                       help='Show all asset variants instead of just primary variants')
    parser.add_argument('--asset-type', choices=['logo', 'document', 'all'], default='all',
                       help='Filter by asset type (logo, document, or all)')

    try:
        args = parser.parse_args()
        query = args.query
        show_all_variants = args.show_all_variants
        asset_type_filter = args.asset_type if args.asset_type != 'all' else None
    except SystemExit:
        # Fallback to old behavior for backward compatibility
        if len(sys.argv) == 2:
            query = sys.argv[1]
            show_all_variants = False
            asset_type_filter = None
        else:
            print(json.dumps({"error": "Usage: python cli_wrapper.py '<query>' [--show-all-variants] [--asset-type {logo,document,all}]"}))
            sys.exit(1)
    
    # V2 API proxy disabled for performance - go straight to fast local search
    
    # Use unified search with patterns
    print(f"🔄 CLI: Using unified search for '{query}'", file=sys.stderr)
    asset_data = load_asset_data()
    if not asset_data:
        print(json.dumps({"error": "Failed to load asset data"}))
        sys.exit(1)
    
    # Load search patterns for enhanced matching
    search_patterns = load_search_patterns()
    
    # Search using enhanced logic with patterns
    result = enhanced_search(query, asset_data, search_patterns, show_all_variants, asset_type_filter)
    result['_source'] = 'cli_unified_search'
    print(json.dumps(result))

if __name__ == "__main__":
    main()