# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is a **brand assets delivery system** that provides intelligent logo recommendations through an MCP (Model Context Protocol) server. The system serves CIQ company and product brand assets to design teams through natural language conversation with Claude.

## Core Architecture

### Dual Server Implementation
- **Production Server**: `server.py` - FastMCP-based server hosted on FastMCP Cloud
- **Development Server**: `ciq_brand_assets_fastmcp.py` - Local development version
- **Node.js Interface**: `src/index.js` - Alternative Node.js MCP server implementation

### Asset Discovery System
The system uses **automatic asset discovery** via `generate_metadata.py`:
- Scans asset directories following naming conventions
- Generates `metadata/asset-inventory.json` with structured asset data
- Parses filenames to extract product, variant (symbol/horizontal/vertical), background color
- Creates GitHub URLs for asset delivery

### Brand Structure
- **CIQ Company Brand**: Special handling with 1-color, 2-color, and green variants
- **Product Brands**: Standard structure with symbol, horizontal lockup, and vertical lockup variants
- **Asset Organization**: Each product has its own directory (e.g., `Fuzzball-logos/`, `Warewulf-Pro-logos/`)

## Development Commands

### Python Environment
```bash
# Install dependencies (requires Python 3.10+)
python3.11 -m pip install fastmcp>=2.0 requests>=2.25.0

# Run local development server
python3.11 ciq_brand_assets_fastmcp.py

# Generate/update asset metadata (CRITICAL after adding assets)
python3.11 generate_metadata.py

# Test server functionality
python3.11 test_server.py
```

### Node.js Environment
```bash
# Install dependencies
npm install

# Run Node.js server
npm start

# Development with auto-reload
npm run dev
```

### Asset Management
```bash
# Adding new assets is now AUTOMATIC! 🎉
# 1. Add logo files to appropriate *-logos/ directory  
# 2. Commit and push - GitHub Actions will auto-update metadata
git add . && git commit -m "Add new assets" && git push

# Manual metadata generation (if needed):
python3.11 generate_metadata.py
```

## Key Components

### Asset Metadata Generation (`generate_metadata.py`)
- **Purpose**: Scans directories and creates structured metadata
- **Critical**: Must be run after adding/changing assets
- **Output**: `metadata/asset-inventory.json`
- **Parsing Logic**: Extracts product, variant, background, and format from filenames

### Intelligent Attribute Detection (`server.py`)
- Uses pattern matching to identify products from natural language
- Confidence scoring system for attribute detection
- Smart recommendations based on use case and background color

### Brand Guidelines Integration
- CIQ company logos have specific usage guidelines (1-color vs 2-color)
- Product logos follow standard symbol/horizontal/vertical pattern
- Background-specific variants (light/dark) automatically selected

## File Structure Conventions

### Asset Directory Naming
- Company: `CIQ-logos/`
- Products: `{Product}-logos/` (e.g., `Fuzzball-logos/`, `Apptainer-logos/`)

### Asset File Naming
- **CIQ**: `CIQ-Logo-{variant}-{background}.{ext}` (e.g., `CIQ-Logo-2color-light.png`)
- **Products**: `{Product}_{type}_{background}_{size}.{ext}` (e.g., `Fuzzball_logo_h-blk_L.png`)

### Variant Types
- **symbol/icon**: Symbol-only version
- **horizontal (h)**: Horizontal lockup with text
- **vertical (v)**: Vertical lockup with text

## Cloud Deployment

The system is deployed on **FastMCP Cloud** at `https://brand-asset-server.fastmcp.app/mcp`:
- Auto-deploys from main branch
- Team members connect via `npx mcp-remote` (no local installation needed)
- Asset URLs point to GitHub raw content for direct download

## Critical Operations

1. **Adding New Assets**: Always run `python generate_metadata.py` after changes
2. **Adding New Products**: Create `{Product}-logos/` directory with standard naming
3. **Testing Changes**: Use local server before pushing to production
4. **Team Access**: Configuration in `TEAM_SETUP.md` provides zero-install team access

## Dependencies

### Python
- `mcp-server-fastmcp>=0.2.0` - MCP server framework
- `requests>=2.25.0` - HTTP requests for metadata loading

### Node.js
- `@modelcontextprotocol/sdk` - MCP SDK
- `node-fetch` - HTTP requests
- Requires Node.js 18+