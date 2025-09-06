/**
 * Channel Adapters - Public Interface
 * 
 * These adapters convert the core search results to formats expected by different UI channels
 */

// MCP Channel (for chat interfaces)
export { MCPChannelAdapter } from './mcp-channel';

// Web Channel (for web GUI)
export { WebChannelAdapter } from './web-channel';

// Export channel-specific types
export type { MCPChannelResponse } from '../core-api/types';
export type { WebAsset, WebSearchFilters, WebChannelResponse } from './web-channel';

// Version info
export const CHANNEL_ADAPTERS_VERSION = '1.0.0';