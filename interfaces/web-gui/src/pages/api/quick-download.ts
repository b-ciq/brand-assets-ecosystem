import type { NextApiRequest, NextApiResponse } from 'next';
import { QuickDownloadService } from '@/lib/download/quick-download';
import { ContextDetector } from '@/lib/smart-defaults/context';
import { UserContext, DownloadConfig } from '@/lib/smart-defaults/types';
import { SlackIntegration } from '@/lib/deep-linking/slack-integration';

interface QuickDownloadApiResponse {
  success: boolean;
  error?: string;
  downloadUrl?: string;
  filename?: string;
}

/**
 * API endpoint for quick downloads with smart defaults
 * Supports both web UI and Slack deep linking
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<QuickDownloadApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const {
      assetId,
      variant,
      format,
      size,
      colorMode,
      backgroundMode,
      source = 'web',
      userRole,
      channel,
      user: userId,
      teamId,
      action = 'preview'
    } = req.query;

    if (!assetId || typeof assetId !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Asset ID is required'
      });
    }

    // Build user context from request parameters
    const userContext: UserContext = {
      source: source as 'web' | 'slack' | 'api',
      sessionId: `${source}_${Date.now()}_${Math.random()}`,
      timeOfDay: new Date().getHours(),
      userAgent: req.headers['user-agent'],
      userRole: (userRole as any) || 'unknown',
    };

    // Add team context for Slack requests
    if (source === 'slack' && teamId) {
      userContext.teamUsagePatterns = {
        teamId: teamId as string,
        commonVariants: {},
        rolePatterns: {},
        recentDownloads: []
      };
    }

    // Enhance context with detected values if not provided
    if (!userContext.deviceTheme) {
      userContext.deviceTheme = ContextDetector.detectDeviceTheme();
    }

    if (!userContext.userRole || userContext.userRole === 'unknown') {
      userContext.userRole = ContextDetector.detectUserRole({
        userAgent: userContext.userAgent,
        timeOfDay: userContext.timeOfDay,
        source: userContext.source
      });
    }

    // TODO: Fetch asset from database/storage
    // For now, create a mock asset for testing
    const mockAsset = {
      id: assetId,
      title: 'Fuzzball Logo',
      conciseDescription: 'Primary brand logo',
      fileType: 'svg',
      url: '/fuzzball/fuzzball-horizontal.svg',
      thumbnailUrl: '/fuzzball/fuzzball-horizontal.svg',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Create download configuration from parameters
    const configOverrides: Partial<DownloadConfig> = {};
    if (variant) configOverrides.variant = variant as any;
    if (format) configOverrides.format = format as any;
    if (size) configOverrides.size = parseInt(size as string);
    if (colorMode) configOverrides.colorMode = colorMode as any;
    if (backgroundMode) configOverrides.backgroundMode = backgroundMode as any;

    // Initialize quick download service
    const quickDownloadService = new QuickDownloadService();

    if (action === 'download') {
      // Perform the actual download and return file blob
      const result = await quickDownloadService.quickDownload(
        mockAsset,
        userContext,
        {
          overrideConfig: configOverrides,
          trackAnalytics: true
        }
      );

      // Set response headers for file download
      res.setHeader('Content-Type', result.blob.type);
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.blob.size);
      
      // Convert blob to buffer and send
      const arrayBuffer = await result.blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      return res.send(buffer);

    } else {
      // Preview mode - return metadata and smart defaults
      const smartDefaults = await quickDownloadService.previewSmartDefaults(
        mockAsset,
        userContext
      );

      // Generate actual download URL
      const downloadParams = new URLSearchParams({
        assetId: assetId,
        action: 'download',
        source: source as string,
        ...(variant && { variant: variant as string }),
        ...(format && { format: format as string }),
        ...(size && { size: size as string }),
        ...(colorMode && { colorMode: colorMode as string }),
        ...(backgroundMode && { backgroundMode: backgroundMode as string }),
        ...(userRole && { userRole: userRole as string }),
        ...(teamId && { teamId: teamId as string })
      });

      const downloadUrl = `${req.headers.origin || 'http://localhost:3000'}/api/quick-download?${downloadParams.toString()}`;

      return res.status(200).json({
        success: true,
        downloadUrl,
        filename: `${mockAsset.title.toLowerCase().replace(/\s+/g, '-')}-${smartDefaults.variant}.${smartDefaults.format}`
      });
    }

  } catch (error) {
    console.error('Quick download API error:', error);
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

// Helper function to determine MIME type from format
function getMimeType(format: string): string {
  switch (format.toLowerCase()) {
    case 'svg':
      return 'image/svg+xml';
    case 'png':
      return 'image/png';
    case 'jpeg':
    case 'jpg':
      return 'image/jpeg';
    default:
      return 'application/octet-stream';
  }
}