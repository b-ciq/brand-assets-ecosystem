# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

The Brand Assets Ecosystem is a unified web-based brand asset management system that provides search, browsing, and download capabilities for CIQ product logos and documents. The system uses a centralized Python CLI backend for consistent search results across multiple interfaces.

## functional structure

- unified search provides a reliable, accurate and consistent result regardless of interaction point (web, MCP, slack, etc). We have strctured this with a unified approach so it is easy to maintain and improve upon.

- Asset renderer- some assets may be provided in a limited number of forms but then rendered by the system according to how the user configures the asset. one example of this is that I currently only provide 3 orientation variants in SVG format for each product logo but the system can render these into many colors, sizes and formats for the user to download. this keeps maintenance simple but allows a ton of flexibility for th user. Another example will be in the future when we add PDFs to the type of available assets and the system will render a visual thumbnail of the first page of the pdf to show in the search results view (this functionmality is on the roadmpa but does not exist yet)

## use cases
user uses claude desktop with the mcp installed and asks: "find me a fuzzball logo" the chat UI responds with: "here is a link to the fuzzball logo" and provide the url to link directly to the web UI showing the preferred fuzzball logo as a search result tile. In the web UI the user can click the download button to get the default version of the asset immediately or can continue to configure the asset manually in the modal window by selecting things like: dark mode, Vertical variant, jpeg, large size and then downloading it.

user uses claude desktop with the mcp installed and asks: "find me a fuzzball logo for dark mode in PNG format" the chat UI responds with: "here is a link to the fuzzball logo you requested" and provides the url to link directly to the web UI showing the fuzzball modal with the requested configuration. The users sees the modal set to dark mode and PNG format. they can download immediately from this screen or can continue to modify the asset configuration further.


## Unified Search Architecture (Implemented Sept 2025)

The project successfully implemented a **unified search architecture** (commit 6c12b38) that consolidates all search logic into a single backend, eliminating inconsistencies between interfaces.

```
📁 brand-assets-ecosystem/
├── 📁 interfaces/
│   ├── 📁 web-gui/           # Next.js web interface (PRIMARY)
│   │   ├── src/app/api/search/      # Web API endpoint 
│   │   └── src/lib/brandAssetsService.ts # Calls unified CLI backend
│   └── 📁 mcp-server/        # Python MCP server
│       ├── server.py         # FastMCP server (needs completion)
│       ├── cli_wrapper.py    # UNIFIED SEARCH BACKEND
│       └── metadata/         # Centralized search patterns & asset data
│           ├── asset-inventory.json    # Asset metadata
│           └── search-patterns.json   # Product name patterns
└── 📁 assets/                # Static asset files
```

## Key Architectural Achievement

### ✅ **Unified Search Backend**
- **Single Source of Truth**: `cli_wrapper.py` contains all search logic
- **Consistent Patterns**: `search-patterns.json` defines product name resolution
- **Shared Data**: Both interfaces use same `asset-inventory.json`
- **Performance**: Improved from 17+ seconds to ~400ms
- **Maintainability**: Reduced from 2000+ lines to ~200 lines of core logic

### ✅ **Web GUI Implementation** 
- **Fully Unified**: Calls `cli_wrapper.py` directly via child process
- **Working Perfectly**: All searches use centralized backend
- **No Dependencies**: Self-contained, no external services needed

### ✅ **MCP Server Status** (COMPLETED)
- **Fully Unified**: Now uses centralized `cli_wrapper.py` backend
- **Code Reduction**: Reduced from 1298→147 lines (92% reduction)  
- **Working Perfectly**: All acceptance criteria met and validated

## Development Commands

### Web GUI (Recommended - Fully Unified)
```bash
cd interfaces/web-gui

# Start development server (uses unified backend)
npm run dev                    # http://localhost:3000

# Production build
npm run build && npm start

# Linting
npm run lint
```

### Test Unified Search Backend
```bash
cd interfaces/mcp-server

# Test unified search directly (this is what both interfaces should use)
python3 cli_wrapper.py "fuzzball"     # Returns 1 primary fuzzball asset (horizontal)
python3 cli_wrapper.py "fuzz"         # Same results (pattern matching)
python3 cli_wrapper.py "war"          # Returns 1 primary warewulf asset
python3 cli_wrapper.py "asc"          # Returns 1 primary ascender asset

# Test with all variants flag for comprehensive results
python3 cli_wrapper.py "fuzzball" --show-all-variants  # Returns all 3 fuzzball variants
```

### MCP Server (Fully Unified)
```bash
cd interfaces/mcp-server

# Start MCP server (requires Python 3.10+)
python3 server.py              # Now uses unified cli_wrapper.py backend

# Note: MCP server now uses same centralized backend as Web GUI
```

## Unified Search Patterns

All product name resolution uses `interfaces/mcp-server/metadata/search-patterns.json`:

```json
{
  "product_patterns": {
    "fuzzball": ["fuzz", "fuzzy", "fuzzball"],
    "ascender": ["asc", "ascend", "ascender", "ascenderpro"],
    "warewulf": ["war", "ware", "warewulf", "werewulf", "wulf"],
    "rlc-hardened": ["rlc", "roc", "rock", "rocky", "rlc-hardened", "hardened"],
    "ciq": ["ciq", "company", "corporate"]
  }
}
```

## How the Unified Architecture Works

### Web GUI Data Flow (Fully Implemented):
1. **User searches** via web interface (http://localhost:3000)
2. **Frontend** sends request to `/api/search`
3. **API route** calls `brandAssetsService.ts`
4. **Service** spawns `cli_wrapper.py` with query
5. **Unified backend** reads `search-patterns.json` for product resolution
6. **Backend** reads `asset-inventory.json` for asset data
7. **Results** returned through the chain back to user

### MCP Server Data Flow (Fully Implemented):
1. **External MCP client** connects to server
2. **FastMCP server** handles MCP protocol
3. **Calls** `cli_wrapper.py` via unified backend helper
4. **Results** returned via MCP protocol

## Major Architectural Improvements Completed

Based on commit history:

### ✅ **Unified Search Architecture** (commit 6c12b38):
- Deleted complex `shared/core-api/` and `shared/channels/` architecture (2419 lines removed)
- Implemented centralized `cli_wrapper.py` with pattern matching
- Added `search-patterns.json` for consistent product resolution
- Fixed CIQ contamination in product searches
- Enhanced pattern matching: `fuz→fuzzball`, `war→warewulf`, etc.

### ✅ **Performance & Consistency** (commits 414c120, 7434fe7):
- Single source of truth eliminates inconsistencies
- Performance improved from 17+ seconds to ~400ms
- Consistent primary variant display (1 per product by default)

### ✅ **Local File Support** (commit 1609786):
- Both interfaces use local metadata files
- No GitHub URL dependencies for development
- Reliable asset data loading

## Current Status

### ✅ **What's Working (Unified)**:
- **Web GUI**: Fully unified, uses centralized backend
- **Search Patterns**: Consistent across system
- **Asset Data**: Single source of truth
- **Performance**: Fast, reliable search results
- **Pattern Matching**: "fuzz" → "fuzzball" works perfectly

### ✅ **Completed Unification**:
- **MCP Server**: Successfully calls `cli_wrapper.py` unified backend
- **Code Reduction**: 92% reduction (1298→147 lines) completed
- **Full Unification**: Both interfaces now use identical search backend
- **Comprehensive Testing**: All acceptance criteria validated and passing

## Testing the Unified Architecture

### Test Web GUI (Fully Unified):
```bash
# Test web interface
curl "http://localhost:3000/api/search?query=fuzzball" | jq '.assets[0].brand'
# Should return: "FUZZBALL"

# Test pattern matching
curl "http://localhost:3000/api/search?query=fuzz" | jq '.assets | length'
# Should return same results as "fuzzball"
```

### Test Unified Backend Directly:
```bash
cd interfaces/mcp-server

# Test exact matching (primary variants only)
python3 cli_wrapper.py "fuzzball"
# Should return: {"status": "success", "total_found": 1, ...}

# Test pattern matching
python3 cli_wrapper.py "fuzz"
# Should return identical results (proves patterns work)

# Test all variants flag
python3 cli_wrapper.py "fuzzball" --show-all-variants
# Should return: {"status": "success", "total_found": 3, ...}

# Test other products
python3 cli_wrapper.py "war"    # → warewulf
python3 cli_wrapper.py "asc"    # → ascender
python3 cli_wrapper.py "roc"    # → rlc-hardened
```

## Key Files for Development

### **Unified Search Architecture**:
- `interfaces/mcp-server/cli_wrapper.py` - **CENTRALIZED BACKEND** (single source of truth)
- `interfaces/mcp-server/metadata/search-patterns.json` - Product name patterns
- `interfaces/mcp-server/metadata/asset-inventory.json` - Asset data (8.3KB)

### **Web GUI Integration**:
- `interfaces/web-gui/src/lib/brandAssetsService.ts` - Calls unified backend
- `interfaces/web-gui/src/app/api/search/route.ts` - API endpoint

### **MCP Server** (Fully Unified):
- `interfaces/mcp-server/server.py` - Uses `cli_wrapper.py` unified backend
- `interfaces/mcp-server/requirements.txt` - Python dependencies

## Troubleshooting

### Web GUI Issues:
- **Check**: `interfaces/mcp-server/metadata/asset-inventory.json` exists
- **Verify**: `cli_wrapper.py` is executable
- **Debug**: Check Next.js console for spawn errors

### MCP Server Issues:
- **Python Version**: Requires Python 3.10+ for FastMCP
- **Unification**: Should call `cli_wrapper.py` instead of hardcoded logic
- **Dependencies**: Install requirements.txt with compatible Python

### Search Inconsistencies:
- **Status**: ✅ RESOLVED - Both interfaces now fully unified
- **Result**: MCP server successfully transitioned to call `cli_wrapper.py`
- **Validated**: Results between Web GUI and MCP server are now identical

## Quick Start for Development

1. **Start Web GUI** (fully unified):
   ```bash
   cd interfaces/web-gui && npm run dev
   ```
   
2. **Test unified search**:
   - Go to http://localhost:3000
   - Search for "fuzz" - should show FUZZBALL logos
   - Search for "war" - should show WAREWULF logos
   
3. **Verify unification**:
   ```bash
   cd interfaces/mcp-server
   python3 cli_wrapper.py "fuzz"  # Should match web GUI results
   ```

## Important Notes

- **Unified Architecture is Complete**: Initial work in commit 6c12b38, completed with MCP server unification
- **Both Interfaces Fully Unified**: Web GUI and MCP server use identical centralized backend
- **MCP Server Unification Complete**: Successfully transitioned to use unified backend
- **Single Source of Truth**: All search logic centralized in `cli_wrapper.py`
- **Performance is Excellent**: ~165ms average response times validated
- **Patterns Work**: Fuzzy matching like "fuzz"→"fuzzball" validated working across both interfaces

## ✅ COMPLETED: Systematic MCP Server Unification

### **COMPLETED State:**
- **MCP Server**: ✅ Reduced from 1298→147 lines (92% reduction)
- **Web GUI**: ✅ Successfully uses `spawn('python3', [CLI_WRAPPER_PATH, query])` 
- **Gap RESOLVED**: ✅ MCP server now uses unified backend via `call_unified_cli()` helper

### **✅ ALL PHASES COMPLETED SUCCESSFULLY**

1. **✅ PHASE 1: Preparation & Safety** 
   - Backup created (`server.py.backup-pre-unification`)
   - Unified backend tested and working

2. **✅ PHASE 2: Create Unified MCP Helper**
   - `call_unified_cli()` function added to server.py
   - Uses same subprocess pattern as Web GUI
   - Tested and validated working

3. **✅ PHASE 3: Systematic Tool Migration**
   - `get_brand_assets()` migrated to unified backend
   - `search_with_url()` migrated to unified backend  
   - `generate_asset_link()` updated for consistency
   - All MCP tools now use centralized search logic

4. **✅ PHASE 4: Remove Duplicate Logic**
   - `SemanticAssetMatcher` class removed (~1100 lines)
   - Duplicate data loading functions removed
   - Unused imports cleaned up
   - **Result**: 92% code reduction (1298→147 lines)

5. **✅ PHASE 5: Testing & Validation**
   - **All Acceptance Criteria Met:**
     - ✅ Same Results: CLI vs Web GUI consistency (6/6 tests passed)
     - ✅ Pattern Matching: "fuzz"→"fuzzball", "war"→"warewulf" (4/4 tests passed)
     - ✅ Performance: ~165ms average (3/3 tests under 1s)
     - ✅ Error Handling: Graceful failure validated
     - ✅ Consistency: All MCP tools use unified backend

6. **✅ PHASE 6: Final Integration**
   - Python version handling implemented
   - Environment variables aligned with Web GUI
   - Documentation updated to reflect completion

### **✅ UNIFICATION COMPLETE - RESULTS:**

- **Code Reduction**: 92% reduction achieved (1298→147 lines)
- **Performance**: Excellent (~165ms average response time)
- **Consistency**: 100% - Both interfaces use identical search backend
- **Pattern Matching**: All fuzzy patterns working perfectly
- **Validation**: Comprehensive testing passed all acceptance criteria

## ✅ **CENTRALIZED BUSINESS LOGIC PRINCIPLE** (Updated Sept 2025)

### **Single Source of Truth Architecture Enhanced**

**Business Logic Centralization**: All filtering, ranking, and result processing logic now lives in the CLI backend (`cli_wrapper.py`), not in interface layers.

#### **Primary Variant Filtering (Implemented)**:
- **CLI Backend**: Returns primary variants by default (horizontal layout preferred)
- **Flag Support**: `--show-all-variants` flag for comprehensive results when needed
- **Consistent Results**: All interfaces automatically get the same filtered results

#### **Updated Test Commands**:
```bash
# Test primary variant filtering (default behavior)
python3 cli_wrapper.py "fuzzball"                    # Returns 1 primary variant
python3 cli_wrapper.py "fuzzball" --show-all-variants # Returns all 3 variants

# Both interfaces now return consistent results
curl "http://localhost:3000/api/search?query=fuzzball" | jq '.total'  # Returns: 1
# MCP server would also return: total_found: 1
```

#### **Interface Layer Responsibilities**:
- **Web GUI**: Minimal transformation, calls CLI backend directly
- **MCP Server**: Returns CLI results with MCP formatting only  
- **Future Interfaces**: Automatically consistent without duplicate logic

#### **Benefits Achieved**:
- ✅ **Consistency**: All interfaces return identical results (1 primary variant)
- ✅ **Maintainability**: Business rules in one location only
- ✅ **Scalability**: New interfaces work correctly out of the box
- ✅ **Single Source of Truth**: CLI backend is authoritative for all search logic

**🎉 The unified architecture now ensures perfect consistency across all interfaces with centralized business logic!**

## ⚠️ **MCP SERVER REWRITE REQUIRED** (Sept 2025)

### **Current MCP Server Issues Identified**:
1. **Misleading Tool Descriptions**: Claims to have "documents and colors" that don't exist
2. **MCP Client Hallucination**: Claude generates responses about non-existent "color palettes, brand guidelines"
3. **Overly Complex Response Format**: Returns technical JSON instead of simple user-friendly responses
4. **Multiple Confusing Tools**: 3 different tools confuse MCP client about which to use

### **MCP Server Rewrite Requirements**:

#### **What We Actually Have**:
- **Product Logos Only**: fuzzball, warewulf, ascender, rlc-hardened, ciq
- **Single Format**: SVG files (horizontal layout primary)
- **Web UI Integration**: Direct links to http://localhost:3000?query={product}

#### **Required MCP Server Architecture**:
- **Single Tool**: `find_logo(product_name: str)` only
- **Simple Responses**: Return plain strings like "Here's the fuzzball logo: [URL]"
- **Accurate Descriptions**: Only mention logos, not non-existent assets
- **Direct Web GUI Links**: Point users to web interface for logo download/configuration
- **Pattern Matching**: Use existing CLI backend for "fuzz"→"fuzzball" etc.

#### **Success Criteria**:
- User asks "find me a fuzzball logo" → Returns "Here's the fuzzball logo: http://localhost:3000?query=fuzzball"
- User asks "warewulf" → Returns warewulf logo link
- User asks "color palette" → Returns "Only logos available. Available products: fuzzball, warewulf, ascender, rlc-hardened, ciq"
- No hallucination of non-existent assets
- Simple, direct responses only

### **Implementation Notes**:
- **Reuse CLI Backend**: Call existing `cli_wrapper.py` (working perfectly)
- **Keep It Simple**: Single tool, string responses, no complex JSON
- **Focus on Use Case**: Direct logo links for immediate web UI access
- **No Feature Creep**: Only logos, nothing else