# Files Marked for Deletion

These files will be deleted once the unified Python search engine is implemented and tested.

## 🗑️ Over-Engineered Architecture (Not Used)

### Complex Core API System
- `shared/core-api/search-engine.ts` - Complex search engine with multiple layers
- `shared/core-api/asset-source.ts` - Abstract data source layer  
- `shared/core-api/brand-assets-core.ts` - Core business logic layer
- `shared/core-api/types.ts` - Complex type definitions
- `shared/dist/core-api/*` - All generated build files

**Why**: Over-engineered solution. Simple Python CLI is faster and easier to maintain.

### Channel Adapter System  
- `shared/channels/web-channel.ts` - Web interface adapter
- `shared/channels/mcp-channel.ts` - MCP interface adapter
- `shared/channels/test-*.ts` - Channel testing files
- `shared/channels/index.ts` - Channel exports
- `shared/dist/channels/*` - Generated build files

**Why**: Unnecessary abstraction layer. Direct Python CLI calls are simpler.

## 🗑️ Obsolete Service Layers

### Complex MCP Wrapper
- `interfaces/web-gui/src/lib/brandAssetsMCP.ts` - 410+ lines of complex transformation logic

**Why**: Replaced by direct CLI calls with unified search patterns.

### Redundant Services
- `interfaces/web-gui/src/lib/brandAssetsService-v2.ts` - V2 service layer

**Why**: Will be replaced by enhanced V1 service calling unified Python search.

### Old Search Logic  
- `interfaces/mcp-server/smart_search.py` - Complex search with URL generation

**Why**: Logic moved to unified cli_wrapper.py with pattern matching.

---

## ✅ Files to Keep

### Core Data & Search
- `interfaces/mcp-server/metadata/asset-inventory.json` - Asset data source
- `interfaces/mcp-server/cli_wrapper.py` - Unified search engine (to be enhanced)
- `interfaces/mcp-server/metadata/search-patterns.json` - NEW: Product pattern mapping

### Simple Service Layer
- `interfaces/web-gui/src/lib/brandAssetsService.ts` - Simple service (to be simplified)

### UI & API
- `interfaces/web-gui/src/components/SearchBar.tsx` - Search UI component
- `interfaces/web-gui/src/app/api/search/route.ts` - Main search API endpoint  
- `interfaces/web-gui/src/app/api/search-v2/route.ts` - Will redirect to V1 eventually

---

## Deletion Strategy

1. **Phase 1**: Implement unified Python search with patterns
2. **Phase 2**: Update services to use simplified calls  
3. **Phase 3**: Comment out imports from deprecated files
4. **Phase 4**: Delete files once system is proven stable
5. **Phase 5**: Remove unused dependencies from package.json

**Goal**: Reduce from ~2000+ lines of complex search logic to ~200 lines of simple, fast, unified search.