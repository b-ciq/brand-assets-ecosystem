# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Brand Assets Ecosystem is an integrated multi-interface brand asset management system with enhanced search, metadata, and deployment capabilities. It consists of a Next.js web interface, Python MCP server, and shared TypeScript packages.

## Architecture

```
📁 brand-assets-ecosystem/
├── 📁 interfaces/
│   ├── 📁 web-gui/           # Next.js 15.5.2 web browser interface
│   │   ├── src/app/api/search/        # Legacy V1 search API
│   │   ├── src/app/api/search-v2/     # Channel adapter V2 API
│   │   └── src/lib/brandAssetsService-v2.ts # Channel adapter service
│   └── 📁 mcp-server/        # Python MCP (Model Context Protocol) server
├── 📁 shared/                # Centralized TypeScript core and channel adapters
│   ├── 📁 core-api/          # Core search engine and business logic
│   │   ├── search-engine.ts  # CoreSearchEngine - single source of truth
│   │   ├── asset-source.ts   # MCPAssetDataSource
│   │   ├── brand-assets-core.ts # Main core API
│   │   └── types.ts          # Core interfaces
│   └── 📁 channels/          # Channel adapters for different interfaces
│       ├── web-channel.ts    # Web GUI adapter
│       ├── mcp-channel.ts    # MCP server adapter
│       └── test-*.ts         # Channel testing utilities
├── 📁 scripts/               # Utility scripts
└── 📁 docs/                  # Documentation
```

## Development Commands

### Web GUI (Primary Interface)
```bash
cd interfaces/web-gui

# Legacy V1 Development server (Turbopack) - http://localhost:3002
npm run dev

# Channel Adapter V2 Development server - http://localhost:3003
USE_CHANNEL_ADAPTER=true npm run dev

# Production build
npm run build && npm start

# Linting
npm run lint
```

### MCP Server
```bash
# Start local development server
cd interfaces/mcp-server && python3 server.py

# Test MCP queries directly
python3 interfaces/mcp-server/cli_wrapper.py "CIQ logo"

# FastMCP Cloud Deployment
# Production: https://brand-asset-server.fastmcp.app
# Entrypoint: interfaces/mcp-server/server.py
# Dependencies: fastmcp, requests (see requirements.txt)
```

### Shared Packages
```bash
cd shared && npm run build  # Build TypeScript types
```

## Technology Stack

- **Frontend:** Next.js 15.5.2, React 19.1.0, TypeScript, Tailwind CSS v4
- **Backend:** Python with FastMCP framework
- **Testing:** Puppeteer for browser automation
- **Deployment:** Local dev vs FastMCP cloud endpoint (`brand-asset-server.fastmcp.app`)

## Centralized Search Architecture (New)

The project now implements a **channel adapter pattern** with centralized search logic to ensure consistent behavior across all interfaces:

### Core Components:
- **CoreSearchEngine** (`shared/core-api/search-engine.ts`) - Single source of truth for product resolution and search intelligence
- **BrandAssetsCore** (`shared/core-api/brand-assets-core.ts`) - Main business logic API
- **MCPAssetDataSource** (`shared/core-api/asset-source.ts`) - Data layer abstraction
- **Channel Adapters** (`shared/channels/`) - Interface-specific adapters (Web, MCP)

### Key Features:
- **Centralized Product Resolution**: `CoreSearchEngine.resolveProductsFromQuery()` handles all product matching
- **Strict Object Boundaries**: Prevents cross-product contamination in search results
- **Intent Classification**: Classifies user queries as specific_product, general_search, color_query, etc.
- **Smart Defaults**: Applies context-aware filtering and presentation logic

### Product Pattern Mapping:
```typescript
// Partial patterns support fuzzy matching:
'fuz' | 'fuzz' → 'fuzzball'
'war' | 'ware' → 'warewulf' 
'asc' → 'ascender'
'rlc' | 'roc' | 'rock' | 'rocky' → 'rlc-hardened'
```

### API Endpoints:
- **V1 Legacy**: `/api/search` (port 3002) - Original implementation
- **V2 Channel Adapter**: `/api/search-v2` (port 3003) - New centralized architecture

## MCP Server Architecture

The MCP server provides intelligent brand asset discovery with:

- **Smart Search Engine** (`smart_search.py`) - Query analysis and URL generation
- **Semantic Asset Matcher** - Intent-based asset matching with confidence scoring
- **Color Palette Support** - Complete CIQ design system (308 color properties, 15 families)
- **Document Support** - Solution briefs, technical docs, sales materials
- **Logo Support** - All products in multiple formats/themes

### MCP Tools Available:
- `get_brand_assets(request)` - Main asset/color search
- `search_with_url(request)` - Smart search with URL generation  
- `generate_asset_link(product, layout, theme, format)` - Direct asset links

## Key Integration Points

### V1 Legacy Integration:
- Web GUI connects to MCP server via `brandAssetsService.ts` in `interfaces/web-gui/src/services/`
- Uses `/api/search` endpoint (port 3002)

### V2 Channel Adapter Integration:
- Web GUI uses centralized architecture via `brandAssetsService-v2.ts`
- Uses `/api/search-v2` endpoint (port 3003) 
- WebChannelAdapter → BrandAssetsCore → MCPAssetDataSource → MCP Server
- Consistent search behavior across Web GUI and MCP interfaces

### Data Sources:
- MCP server runs locally OR on FastMCP cloud (`USE_CLOUD_ENDPOINT` environment variable)
- Asset metadata: GitHub-hosted at brand-assets-ecosystem repository  
- Color data: GitHub-hosted design system
- Shared TypeScript interfaces in `shared/core-api/types.ts` ensure type consistency

## Current Architecture Focus

The project has **recently transitioned to a centralized search architecture** with strict object boundaries and consistent multi-interface behavior. Key focus areas:

### **Latest Changes (Current Branch: feature/channel-adapter-architecture)**:
- ✅ **Fixed Search Logic**: Resolved CIQ logo contamination issues ("fuz", "war", "asc" searches)
- ✅ **Centralized Product Resolution**: Single source of truth in CoreSearchEngine
- ✅ **Strict Object Boundaries**: Prevents cross-product search contamination
- ✅ **Channel Adapter Pattern**: Consistent behavior across Web GUI and MCP interfaces
- ✅ **Enhanced Pattern Matching**: Support for partial patterns (fuz→fuzzball, war→warewulf, etc.)

### **Core Capabilities**:
- Theme-aware asset downloads with JPEG background color support
- Modal-based asset previews with preserved logo aspect ratios
- Advanced search/filtering with intent classification
- Comprehensive brand asset browsing across multiple interfaces
- Real-time debug logging for search behavior analysis

### **Development Status**:
- **V2 Channel Adapter**: Production-ready (port 3003)
- **V1 Legacy**: Maintained for compatibility (port 3002)  
- **Search Quality**: All reported search issues resolved
- **Testing**: Comprehensive manual testing completed

## Key Files for Development

### **Core Search Logic**:
- `shared/core-api/search-engine.ts` - **MOST IMPORTANT**: Product patterns and search intelligence
- `shared/core-api/asset-source.ts` - Data layer with CIQ decision logic  
- `shared/core-api/brand-assets-core.ts` - Main business logic API

### **Channel Adapters**:
- `shared/channels/web-channel.ts` - Web GUI adapter with filtering logic
- `shared/channels/mcp-channel.ts` - MCP server adapter
- `interfaces/web-gui/src/app/api/search-v2/route.ts` - V2 API endpoint

### **Debug & Testing**:
- `debug-resolution.js` - Test product resolution patterns directly
- `shared/channels/test-web-channel.ts` - Web channel testing utilities
- Server logs show real-time debug output with 🎯 and 🔍 indicators

### **Important Notes**:
- Always run `cd shared && npm run build` after changing core files
- Restart web server to pick up shared package changes
- Use `USE_CHANNEL_ADAPTER=true npm run dev` for V2 architecture testing
- Search behavior is centralized - modify patterns in `search-engine.ts` only