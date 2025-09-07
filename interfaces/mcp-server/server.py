#!/usr/bin/env python3
"""
CIQ Brand Assets MCP Server - Unified Architecture
Clean, simple server using centralized CLI backend for all search operations
"""

from fastmcp import FastMCP
import json
import requests
from typing import Optional, Dict, Any, List, Tuple
import re
import os
import subprocess
from pathlib import Path
# Uses unified CLI architecture - no duplicate search logic needed

# Load environment variables from root .env file
try:
    from dotenv import load_dotenv
    # Load from root directory (two levels up from interfaces/mcp-server)
    root_env_path = Path(__file__).parent.parent.parent / '.env'
    load_dotenv(root_env_path)
    print(f"Loaded environment from: {root_env_path}")
except ImportError:
    print("python-dotenv not available, using system environment variables")

# Initialize FastMCP server
mcp = FastMCP("CIQ Brand Assets")

def call_unified_cli(query: str) -> dict:
    """Call unified CLI backend - same as Web GUI approach"""
    try:
        cli_path = os.path.join(os.path.dirname(__file__), 'cli_wrapper.py')
        result = subprocess.run(['python3', cli_path, query], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            return {"error": f"CLI search failed: {result.stderr}"}
        
        # Parse JSON output (last line)
        lines = result.stdout.strip().split('\n')
        json_output = lines[-1]
        return json.loads(json_output)
    
    except Exception as e:
        return {"error": f"Failed to call unified CLI: {e}"}

@mcp.tool()
def get_brand_assets(request: str = "CIQ logo") -> Dict[str, Any]:
    """
    Find CIQ brand assets, logos, documents, and colors.
    
    Uses unified search architecture with centralized CLI backend.
    """
    
    print(f"🔄 MCP search for: '{request}' (using unified backend)")
    
    try:
        # Call unified CLI backend - same as Web GUI
        result = call_unified_cli(request)
        
        # Add source indicator for MCP
        if isinstance(result, dict):
            result['_source'] = 'mcp_unified_search'
            
        return result
        
    except Exception as e:
        return {
            "error": f"Error processing request: {e}",
            "_source": "mcp_unified_search_error"
        }

@mcp.tool()
def search_with_url(request: str = "CIQ logo") -> Dict[str, Any]:
    """
    Generate search URLs for brand assets based on user queries.
    Uses unified search architecture for consistent results.
    """
    
    # Get asset search results using unified backend
    search_results = call_unified_cli(request)
    
    # Generate basic web GUI URL
    import os
    base_url = os.getenv('WEB_GUI_URL', 'http://localhost:3000')
    url = f"{base_url}?query={request.replace(' ', '+')}"
    
    return {
        'url': url,
        'search_results': search_results,
        'query': request,
        'message': f'Search URL generated for: {request}',
        'confidence': 'medium',
        '_source': 'mcp_unified_url_search'
    }

@mcp.tool()
def generate_asset_link(product: str, layout: Optional[str] = None, theme: Optional[str] = None, format: Optional[str] = None) -> Dict[str, Any]:
    """
    Generate direct link to specific asset modal.
    """
    
    import os
    base_url = os.getenv('WEB_GUI_URL', 'http://localhost:3000')
    
    # Build query parameters
    query_parts = [product]
    if layout:
        query_parts.append(layout)
    if theme:
        query_parts.append(theme)
    if format:
        query_parts.append(format)
    
    query = ' '.join(query_parts)
    url = f"{base_url}?query={query.replace(' ', '+')}"
    
    if theme and layout:
        confidence = 'high'
        message = f"Direct link to {product} {layout} logo for {theme} backgrounds"
    elif product:
        confidence = 'medium'
        message = f"Search for {product} assets"
    else:
        confidence = 'low'
        message = "Generic asset browser"
    
    return {
        'url': url,
        'configuration': {
            'product': product,
            'layout': layout,
            'theme': theme,
            'format': format
        },
        'confidence': confidence,
        'message': message,
        'type': 'direct_generation',
        '_source': 'mcp_direct_link'
    }

# Server startup
print("🚀 Starting CIQ Brand Assets MCP Server (Unified Architecture)...")
print("✅ Using centralized CLI backend for all searches")

if __name__ == "__main__":
    mcp.run()