#!/usr/bin/env python3.10
"""
CIQ Brand Assets MCP Server - Clean, Simple Architecture

Simple MCP server that provides direct logo links using unified CLI backend.
NO complex JSON responses, NO fake asset claims, NO multiple confusing tools.
"""

from fastmcp import FastMCP
import json
import os
import subprocess

# Initialize FastMCP server
mcp = FastMCP("CIQ Brand Assets")

def call_unified_cli(query: str) -> dict:
    """Call unified CLI backend - same approach as Web GUI"""
    try:
        cli_path = os.path.join(os.path.dirname(__file__), 'cli_wrapper.py')
        result = subprocess.run(['python3', cli_path, query], 
                              capture_output=True, text=True, timeout=10)
        
        if result.returncode != 0:
            return {"error": f"Search failed: {result.stderr}"}
        
        # Parse JSON output (last line)
        lines = result.stdout.strip().split('\n')
        json_output = lines[-1]
        return json.loads(json_output)
    
    except Exception as e:
        return {"error": f"Failed to search: {e}"}

@mcp.tool()
def find_logo(product_name: str) -> str:
    """
    Find a product logo and return a direct link to the web interface.
    
    Available products: apptainer, fuzzball, warewulf, ascender, rlc-hardened, rlc-ai, ciq
    Also accepts: app, fuzz, war, asc, roc, ai (will be resolved to full product names)
    
    Returns a simple message with a direct web interface link for logo download.
    """
    
    # Search using unified CLI backend
    result = call_unified_cli(product_name)
    
    if "error" in result:
        return f"Sorry, I couldn't find any logos for '{product_name}'. Available products: apptainer, fuzzball, warewulf, ascender, rlc-hardened, rlc-ai, ciq"
    
    if result.get("total_found", 0) == 0:
        return f"No logos found for '{product_name}'. Available products: apptainer, fuzzball, warewulf, ascender, rlc-hardened, rlc-ai, ciq"
    
    # Generate web GUI URL - use public deployment by default
    base_url = os.getenv('WEB_GUI_URL', 'https://lighthearted-fenglisu-f8b66c.netlify.app')
    web_url = f"{base_url}?query={product_name.replace(' ', '+')}"
    
    # Extract first product name for response
    first_product = list(result["assets"].keys())[0]
    total = result["total_found"]
    
    if total == 1:
        return f"Here's the {first_product.upper()} logo: {web_url}"
    else:
        return f"Found {total} {first_product.upper()} logo variants: {web_url}"

# Server startup
if __name__ == "__main__":
    print("🚀 Starting CIQ Brand Assets MCP Server...")
    print("✅ Single tool: find_logo(product_name)")
    print("✅ Uses unified CLI backend for consistency")
    mcp.run()