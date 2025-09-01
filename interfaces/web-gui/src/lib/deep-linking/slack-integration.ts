import { Asset } from '@/types/asset';
import { UserContext, DownloadConfig } from '@/lib/smart-defaults/types';

export interface SlackDeepLinkOptions {
  assetId: string;
  variant?: string;
  format?: string;
  size?: number;
  colorMode?: string;
  backgroundMode?: string;
  channel?: string;
  user?: string;
  teamId?: string;
}

export interface SlackQuickDownloadParams {
  asset: Asset;
  context: UserContext;
  config?: Partial<DownloadConfig>;
}

/**
 * Deep linking utilities for Slack integration
 * Enables direct asset access and download from Slack commands
 */
export class SlackIntegration {
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  private static readonly SLACK_APP_ID = process.env.SLACK_APP_ID;

  /**
   * Generate a deep link URL for accessing an asset from Slack
   */
  static generateDeepLink(options: SlackDeepLinkOptions): string {
    const params = new URLSearchParams();
    
    // Add asset identification
    params.set('assetId', options.assetId);
    
    // Add optional configuration
    if (options.variant) params.set('variant', options.variant);
    if (options.format) params.set('format', options.format);
    if (options.size) params.set('size', options.size.toString());
    if (options.colorMode) params.set('colorMode', options.colorMode);
    if (options.backgroundMode) params.set('backgroundMode', options.backgroundMode);
    
    // Add Slack context
    if (options.channel) params.set('channel', options.channel);
    if (options.user) params.set('user', options.user);
    if (options.teamId) params.set('teamId', options.teamId);
    
    // Add source tracking
    params.set('source', 'slack');
    params.set('timestamp', Date.now().toString());
    
    return `${this.BASE_URL}/quick-download?${params.toString()}`;
  }

  /**
   * Parse deep link parameters from URL
   */
  static parseDeepLink(url: string): SlackDeepLinkOptions | null {
    try {
      const urlObj = new URL(url);
      const params = urlObj.searchParams;
      
      const assetId = params.get('assetId');
      if (!assetId) return null;
      
      return {
        assetId,
        variant: params.get('variant') || undefined,
        format: params.get('format') || undefined,
        size: params.get('size') ? parseInt(params.get('size')!) : undefined,
        colorMode: params.get('colorMode') || undefined,
        backgroundMode: params.get('backgroundMode') || undefined,
        channel: params.get('channel') || undefined,
        user: params.get('user') || undefined,
        teamId: params.get('teamId') || undefined,
      };
    } catch (error) {
      console.error('Failed to parse deep link:', error);
      return null;
    }
  }

  /**
   * Generate quick download URL for immediate file download
   */
  static generateQuickDownloadUrl(params: SlackQuickDownloadParams): string {
    const searchParams = new URLSearchParams();
    
    searchParams.set('assetId', params.asset.id);
    searchParams.set('source', 'slack');
    searchParams.set('action', 'download');
    
    // Add context information
    if (params.context.userRole) {
      searchParams.set('userRole', params.context.userRole);
    }
    if (params.context.teamUsagePatterns?.teamId) {
      searchParams.set('teamId', params.context.teamUsagePatterns.teamId);
    }
    
    // Add configuration overrides
    if (params.config) {
      if (params.config.variant) searchParams.set('variant', params.config.variant);
      if (params.config.format) searchParams.set('format', params.config.format);
      if (params.config.size) searchParams.set('size', params.config.size.toString());
      if (params.config.colorMode) searchParams.set('colorMode', params.config.colorMode);
      if (params.config.backgroundMode) searchParams.set('backgroundMode', params.config.backgroundMode);
    }
    
    return `${this.BASE_URL}/api/quick-download?${searchParams.toString()}`;
  }

  /**
   * Create Slack message blocks for asset selection
   */
  static createAssetMessageBlocks(
    assets: Asset[], 
    channelId: string,
    userId: string
  ): any[] {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🎨 Brand Assets'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `Found ${assets.length} assets. Click to download with smart defaults:`
        }
      }
    ];

    // Add asset options (limit to 10 for Slack message limits)
    const displayAssets = assets.slice(0, 10);
    
    for (const asset of displayAssets) {
      const quickLink = this.generateDeepLink({
        assetId: asset.id,
        channel: channelId,
        user: userId
      });

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${asset.title}*\n${asset.conciseDescription || asset.fileType.toUpperCase()}`
        },
        accessory: {
          type: 'button',
          text: {
            type: 'plain_text',
            text: 'Quick Download'
          },
          url: quickLink,
          action_id: `quick_download_${asset.id}`
        }
      });
    }

    if (assets.length > 10) {
      blocks.push({
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `_Showing first 10 of ${assets.length} assets. Use filters to narrow down results._`
          }
        ]
      });
    }

    return blocks;
  }

  /**
   * Create Slack message for asset preview with options
   */
  static createAssetPreviewBlocks(
    asset: Asset,
    downloadOptions: {
      variant: string;
      format: string;
      size?: number;
      colorMode?: string;
    }[],
    channelId: string,
    userId: string
  ): any[] {
    return [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `🎨 ${asset.title}`
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*${asset.conciseDescription || 'Brand Asset'}*\nChoose your download option:`
        },
        accessory: {
          type: 'image',
          image_url: asset.thumbnailUrl || asset.url,
          alt_text: asset.title
        }
      },
      {
        type: 'actions',
        elements: downloadOptions.map((option, index) => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: `${option.variant} ${option.format.toUpperCase()}${option.size ? ` (${option.size}px)` : ''}`
          },
          url: this.generateDeepLink({
            assetId: asset.id,
            variant: option.variant,
            format: option.format,
            size: option.size,
            colorMode: option.colorMode,
            channel: channelId,
            user: userId
          }),
          action_id: `download_option_${index}`
        }))
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: '_Links will open in your browser for immediate download_'
          }
        ]
      }
    ];
  }

  /**
   * Extract user context from Slack request
   */
  static extractUserContextFromSlack(slackPayload: any): UserContext {
    const context: UserContext = {
      source: 'slack',
      sessionId: `slack_${slackPayload.team_id}_${slackPayload.user_id}_${Date.now()}`,
      timeOfDay: new Date().getHours(),
      userAgent: 'Slack',
    };

    // Try to determine user role from Slack profile or channel
    if (slackPayload.channel_name) {
      const channelName = slackPayload.channel_name.toLowerCase();
      
      if (channelName.includes('design') || channelName.includes('creative')) {
        context.userRole = 'designer';
      } else if (channelName.includes('market') || channelName.includes('brand')) {
        context.userRole = 'marketer';
      } else if (channelName.includes('eng') || channelName.includes('dev')) {
        context.userRole = 'engineer';
      } else if (channelName.includes('sales') || channelName.includes('business')) {
        context.userRole = 'sales';
      } else {
        context.userRole = 'unknown';
      }
    }

    // Add team context if available
    if (slackPayload.team_id) {
      context.teamUsagePatterns = {
        teamId: slackPayload.team_id,
        commonVariants: {},
        rolePatterns: {},
        recentDownloads: []
      };
    }

    return context;
  }

  /**
   * Generate response for Slack slash command
   */
  static generateSlashCommandResponse(
    command: string,
    assets: Asset[],
    channelId: string,
    userId: string
  ): any {
    if (assets.length === 0) {
      return {
        response_type: 'ephemeral',
        text: `No assets found for "${command}". Try a different search term.`,
      };
    }

    if (assets.length === 1) {
      // Single asset - show preview with download options
      const asset = assets[0];
      return {
        response_type: 'ephemeral',
        blocks: this.createAssetPreviewBlocks(
          asset,
          [
            { variant: 'horizontal', format: 'png', size: 512 },
            { variant: 'symbol', format: 'svg' },
            { variant: 'horizontal', format: 'svg' }
          ],
          channelId,
          userId
        )
      };
    } else {
      // Multiple assets - show list
      return {
        response_type: 'ephemeral',
        blocks: this.createAssetMessageBlocks(assets, channelId, userId)
      };
    }
  }
}

/**
 * Utility functions for Slack webhook handling
 */
export class SlackWebhookHandler {
  /**
   * Handle incoming Slack slash command
   */
  static async handleSlashCommand(payload: any): Promise<any> {
    try {
      const { text, channel_id, user_id, team_id } = payload;
      
      // Search for assets based on command text
      const assets = await this.searchAssets(text);
      
      return SlackIntegration.generateSlashCommandResponse(
        text,
        assets,
        channel_id,
        user_id
      );
      
    } catch (error) {
      console.error('Slack slash command error:', error);
      return {
        response_type: 'ephemeral',
        text: 'Sorry, there was an error processing your request. Please try again.',
      };
    }
  }

  /**
   * Search assets based on query text
   */
  private static async searchAssets(query: string): Promise<Asset[]> {
    // This would integrate with your asset search/database
    // For now, return empty array as placeholder
    return [];
  }

  /**
   * Handle Slack interactive component (button clicks, etc.)
   */
  static async handleInteractiveComponent(payload: any): Promise<any> {
    try {
      const { actions, channel, user } = payload;
      
      if (actions && actions.length > 0) {
        const action = actions[0];
        
        if (action.action_id?.startsWith('quick_download_')) {
          const assetId = action.action_id.replace('quick_download_', '');
          
          return {
            response_type: 'ephemeral',
            text: `⚡ Quick download initiated for asset ${assetId}. Check your browser for the download.`,
          };
        }
      }
      
      return {
        response_type: 'ephemeral',
        text: 'Action completed successfully.',
      };
      
    } catch (error) {
      console.error('Slack interactive component error:', error);
      return {
        response_type: 'ephemeral',
        text: 'Sorry, there was an error processing your action.',
      };
    }
  }
}