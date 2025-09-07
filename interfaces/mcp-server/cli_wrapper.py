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

def enhanced_search(query: str, asset_data: Dict, patterns: Dict) -> Dict[str, Any]:
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
                # Check if query matches product name, asset key, filename, or tags
                matches = (
                    query_lower in product.lower() or
                    query_lower in asset_key.lower() or
                    query_lower in asset_info.get('filename', '').lower() or
                    any(query_lower in tag.lower() for tag in asset_info.get('tags', []))
                )
                
                if matches:
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
            "horizontal_black": {
                "url": "http://localhost:3000/assets/global/CIQ_logos/CIQ_logo_1clr_lightmode.svg",
                "filename": "CIQ_logo_1clr_lightmode.svg",
                "background": "light",
                "color": "black",
                "layout": "horizontal",
                "type": "logo",
                "size": "large",
                "tags": ["company", "primary", "general-use"]
            }
        }
        results['ciq'] = ciq_logos
        total_found += len(ciq_logos)
    
    return {
        'status': 'success',
        'total_found': total_found,
        'assets': results,
        'confidence': 'medium' if total_found > 0 else 'none',
        'recommendation': f"Found {total_found} assets matching '{query}'"
    }

def main():
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python cli_wrapper.py '<query>'"}))
        sys.exit(1)
    
    query = sys.argv[1]
    
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
    result = enhanced_search(query, asset_data, search_patterns)
    result['_source'] = 'cli_unified_search'
    print(json.dumps(result))

if __name__ == "__main__":
    main()