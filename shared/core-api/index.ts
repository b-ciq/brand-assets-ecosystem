/**
 * Brand Assets Core API - Public Interface
 * 
 * This is the main entry point for the shared business logic layer.
 * All channels (MCP, Web, Slack) should use this core API.
 */

// Core types
export * from './types';

// Core search engine
export { CoreSearchEngine } from './search-engine';

// Data source abstraction
export { AssetDataSource, MCPAssetDataSource } from './asset-source';

// Main core service
export { BrandAssetsCore, createBrandAssetsCore } from './brand-assets-core';

// Version info
export const CORE_API_VERSION = '1.0.0';