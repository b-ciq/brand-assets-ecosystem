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

def simple_search(query: str, asset_data: Dict) -> Dict[str, Any]:
    """Simple search implementation"""
    if not asset_data or 'assets' not in asset_data:
        return {"error": "No asset data available"}
    
    query_lower = query.lower()
    results = {}
    total_found = 0
    
    # Simple keyword matching
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
    
    # Fallback to legacy local search
    print(f"🔄 CLI: Using legacy search for '{query}'", file=sys.stderr)
    asset_data = load_asset_data()
    if not asset_data:
        print(json.dumps({"error": "Failed to load asset data"}))
        sys.exit(1)
    
    # Search
    result = simple_search(query, asset_data)
    result['_source'] = 'cli_legacy_search'
    print(json.dumps(result))

if __name__ == "__main__":
    main()