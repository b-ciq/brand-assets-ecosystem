# Smart Search Integration Examples

This document shows how to use the new smart search functionality in the Brand Assets MCP Server.

## New MCP Tools

### 1. `search_with_url` - Advanced Search with URL Generation

Analyzes natural language queries and provides smart URLs for the web interface.

**Examples:**

```python
# High-confidence specific request → Direct modal URL
search_with_url("I need a fuzzball icon in PNG dark mode")
# Returns: http://localhost:3002/?modal=fuzzball-icon-dark&format=png

# Medium-confidence filtered search → Search page with filters
search_with_url("Find warewulf logos")  
# Returns: http://localhost:3002/?query=warewulf&assetType=logo

# Low-confidence generic search → Basic search page
search_with_url("Show me CIQ assets")
# Returns: http://localhost:3002/?query=ciq
```

### 2. `generate_asset_link` - Direct Asset Link Generation

Creates direct links when you know the exact asset parameters.

**Examples:**

```python
# Direct modal for specific configuration
generate_asset_link("fuzzball", "icon", "dark", "png")
# Returns: http://localhost:3002/?modal=fuzzball-icon-dark&format=png

# Filtered search for product
generate_asset_link("warewulf")
# Returns: http://localhost:3002/?query=warewulf
```

## Claude Code Integration Examples

These tools are perfect for Claude Code users who want specific asset configurations:

### Specific Asset Requests

**User:** "I need a fuzzball icon in PNG dark mode"
**Claude Code:** Uses `search_with_url()` → Gets direct modal URL → User clicks and gets exactly what they need

### Product Exploration  

**User:** "Show me all warewulf assets"
**Claude Code:** Uses `search_with_url()` → Gets filtered search URL → User sees relevant results

### Configuration Assistance

**User:** "Help me find the right CIQ logo for my dark theme website"
**Claude Code:** Uses `generate_asset_link("ciq", layout="horizontal", theme="dark")` → Provides direct link

## URL Patterns Generated

### Direct Modal URLs (High Confidence)
- `http://localhost:3002/?modal=product-layout-theme&format=format`
- Example: `/?modal=fuzzball-icon-dark&format=png`

### Filtered Search URLs (Medium Confidence)  
- `http://localhost:3002/?query=product&assetType=type`
- Example: `/?query=warewulf&assetType=logo`

### Generic Search URLs (Low Confidence)
- `http://localhost:3002/?query=terms`
- Example: `/?query=ciq%20assets`

## Query Analysis Features

The system analyzes queries for:

- **Intent Classification:** specific_asset, generic_search, browse_category
- **Parameter Extraction:** product, format, theme, layout, size  
- **Confidence Scoring:** 0.0-1.0 based on query specificity
- **Action Determination:** direct_modal, filtered_search, generic_search

## Testing

Run the comprehensive test suite:

```bash
cd interfaces/mcp-server
python3 test_smart_search_complete.py
```

The test suite validates:
- Query analysis accuracy
- URL generation patterns
- Parameter extraction
- Confidence calculation logic

## Integration Notes

- URLs default to `http://localhost:3002` for development
- Modal asset IDs follow pattern: `product-layout-theme`
- Search parameters use standard query string format
- System falls back gracefully from specific to generic searches