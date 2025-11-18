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
def find_logo(product_name: str, variant: str = "", color_mode: str = "", format: str = "", size: str = "") -> str:
    """
    Find a product logo with optional specific variant configuration.

    Args:
        product_name: Product name (fuzzball, warewulf, ascender, rlc-hardened, ciq, etc.)
        variant: Logo variant (horizontal, vertical, symbol) - CIQ logos only available in 1-color
        color_mode: Color mode (light, dark)
        format: File format (svg, png, jpg)
        size: Size (S, M, L or custom like "1024px")

    Available products: apptainer, fuzzball, warewulf, ascender, rlc-hardened, rlc-ai, ciq
    Also accepts: app, fuzz, war, asc, roc, ai (will be resolved to full product names)

    Returns a direct link to the web interface with specific variant configuration.
    """

    # Search using unified CLI backend to validate product
    result = call_unified_cli(product_name)

    if "error" in result:
        return f"Sorry, I couldn't find any logos for '{product_name}'. Available products: apptainer, fuzzball, warewulf, ascender, rlc-hardened, rlc-ai, ciq"

    if result.get("total_found", 0) == 0:
        return f"No logos found for '{product_name}'. Available products: apptainer, fuzzball, warewulf, ascender, rlc-hardened, rlc-ai, ciq"

    # Extract resolved product name from results
    first_product = list(result["assets"].keys())[0]

    # Generate web GUI URL - use environment variable or default to production
    base_url = os.getenv('WEB_GUI_URL', 'https://lighthearted-fenglisu-f8b66c.netlify.app')

    # Build variant URL parameters
    url_params = [f"product={first_product.lower()}"]

    if variant:
        url_params.append(f"variant={variant}")
    if color_mode:
        url_params.append(f"colorMode={color_mode}")
    if format:
        url_params.append(f"format={format}")
    if size:
        url_params.append(f"size={size}")

    # Always add openModal=true if any specific variant is requested
    if variant or color_mode or format or size:
        url_params.append("openModal=true")
        web_url = f"{base_url}?{'&'.join(url_params)}"

        # Generate descriptive response for specific variant
        variant_desc = []
        if variant:
            variant_desc.append(variant)
        if color_mode:
            variant_desc.append(f"{color_mode} mode")
        if format:
            variant_desc.append(format.upper())
        if size:
            variant_desc.append(f"{size} size" if size in ['S', 'M', 'L'] else size)

        desc = " ".join(variant_desc) if variant_desc else "configured"
        return f"Here's the {first_product.upper()} logo ({desc}): {web_url}"

    else:
        # Default search URL
        web_url = f"{base_url}?query={product_name.replace(' ', '+')}"
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