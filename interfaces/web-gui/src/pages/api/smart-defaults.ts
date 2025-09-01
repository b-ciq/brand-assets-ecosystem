import type { NextApiRequest, NextApiResponse } from 'next';
import { SmartDefaultsEngine } from '@/lib/smart-defaults/engine';
import { ContextDetector } from '@/lib/smart-defaults/context';
import { UserContext, SmartDefaults } from '@/lib/smart-defaults/types';
import { Asset } from '@/types/asset';

interface SmartDefaultsRequest {
  asset: Asset;
  context?: Partial<UserContext>;
  options?: {
    confidenceThreshold?: number;
    useTeamPatterns?: boolean;
  };
}

interface SmartDefaultsResponse {
  success: boolean;
  data?: SmartDefaults;
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SmartDefaultsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { asset, context: partialContext, options = {} }: SmartDefaultsRequest = req.body;

    if (!asset || !asset.id) {
      return res.status(400).json({
        success: false,
        error: 'Asset is required'
      });
    }

    // Build complete user context
    const userContext: UserContext = {
      source: 'web',
      sessionId: `api_${Date.now()}`,
      timeOfDay: new Date().getHours(),
      ...partialContext,
      // Extract from request headers if available
      userAgent: req.headers['user-agent'],
    };

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

    // Initialize smart defaults engine
    const engine = new SmartDefaultsEngine({
      confidenceThreshold: options.confidenceThreshold || 0.6,
      useTeamPatterns: options.useTeamPatterns !== false,
      fallbackToMostPopular: true
    });

    // Generate smart defaults
    const smartDefaults = await engine.generateDefaults(asset, userContext);

    // Validate results
    if (!engine.validateDefaults(smartDefaults)) {
      return res.status(422).json({
        success: false,
        error: 'Generated defaults failed validation'
      });
    }

    res.status(200).json({
      success: true,
      data: smartDefaults
    });

  } catch (error) {
    console.error('Smart defaults API error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}