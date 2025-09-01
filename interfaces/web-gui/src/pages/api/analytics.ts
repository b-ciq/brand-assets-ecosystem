import type { NextApiRequest, NextApiResponse } from 'next';
import { AnalyticsEvent, DownloadConfig, UserContext } from '@/lib/smart-defaults/types';

interface AnalyticsRequest {
  events?: AnalyticsEvent[];
  event?: AnalyticsEvent; // Single event support
}

interface AnalyticsResponse {
  success: boolean;
  message?: string;
  error?: string;
}

// In-memory storage for development (replace with database in production)
const analyticsStore: AnalyticsEvent[] = [];

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AnalyticsResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  try {
    const { events, event }: AnalyticsRequest = req.body;
    
    // Support both single event and batch events
    const eventsToProcess = events || (event ? [event] : []);
    
    if (eventsToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No events provided'
      });
    }

    // Validate and process each event
    const processedEvents: AnalyticsEvent[] = [];
    
    for (const analyticsEvent of eventsToProcess) {
      // Validate required fields
      if (!analyticsEvent.eventType || !analyticsEvent.assetId || !analyticsEvent.timestamp) {
        return res.status(400).json({
          success: false,
          error: 'Missing required event fields (eventType, assetId, timestamp)'
        });
      }

      // Enrich event data with server-side information
      const enrichedEvent: AnalyticsEvent = {
        ...analyticsEvent,
        serverTimestamp: Date.now(),
        userAgent: req.headers['user-agent'],
        ipAddress: getClientIP(req),
        sessionId: analyticsEvent.sessionId || `api_${Date.now()}_${Math.random()}`
      };

      processedEvents.push(enrichedEvent);
    }

    // Store events (replace with database write in production)
    analyticsStore.push(...processedEvents);

    // Log for debugging
    console.log(`Tracked ${processedEvents.length} analytics events:`, 
      processedEvents.map(e => `${e.eventType} for asset ${e.assetId}`).join(', ')
    );

    // Process events for immediate insights (optional)
    await processAnalyticsEvents(processedEvents);

    res.status(200).json({
      success: true,
      message: `Successfully tracked ${processedEvents.length} events`
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}

/**
 * Get client IP address from request
 */
function getClientIP(req: NextApiRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' 
    ? forwarded.split(',')[0].trim()
    : req.socket.remoteAddress;
  
  return ip || 'unknown';
}

/**
 * Process analytics events for immediate insights and pattern detection
 */
async function processAnalyticsEvents(events: AnalyticsEvent[]): Promise<void> {
  try {
    for (const event of events) {
      // Update usage patterns based on event type
      switch (event.eventType) {
        case 'quick_download':
          await updateQuickDownloadPatterns(event);
          break;
        
        case 'advanced_download':
          await updateAdvancedDownloadPatterns(event);
          break;
        
        case 'smart_defaults_generated':
          await updateSmartDefaultsAccuracy(event);
          break;
        
        case 'format_conversion':
          await updateFormatPreferences(event);
          break;
        
        case 'variant_selection':
          await updateVariantPreferences(event);
          break;
      }
    }
  } catch (error) {
    console.error('Error processing analytics events:', error);
    // Don't throw - analytics processing shouldn't fail the main request
  }
}

/**
 * Update quick download usage patterns
 */
async function updateQuickDownloadPatterns(event: AnalyticsEvent): Promise<void> {
  // Track quick download success rate and popular configurations
  const config = event.downloadConfig;
  if (config) {
    // Store popular format/variant combinations
    console.log(`Quick download: ${config.format} ${config.variant} for ${event.userContext?.userRole}`);
  }
}

/**
 * Update advanced download patterns  
 */
async function updateAdvancedDownloadPatterns(event: AnalyticsEvent): Promise<void> {
  // Track when users bypass smart defaults
  console.log(`Advanced download for ${event.assetId} by ${event.userContext?.userRole}`);
}

/**
 * Update smart defaults accuracy metrics
 */
async function updateSmartDefaultsAccuracy(event: AnalyticsEvent): Promise<void> {
  // Track confidence scores and user acceptance
  const smartDefaults = event.smartDefaultsUsed;
  if (smartDefaults) {
    console.log(`Smart defaults generated with ${smartDefaults.confidence} confidence`);
  }
}

/**
 * Update format conversion preferences
 */
async function updateFormatPreferences(event: AnalyticsEvent): Promise<void> {
  // Track popular format conversions by user role
  const config = event.downloadConfig;
  const role = event.userContext?.userRole;
  if (config && role) {
    console.log(`${role} preferred ${config.format} format`);
  }
}

/**
 * Update variant selection preferences
 */
async function updateVariantPreferences(event: AnalyticsEvent): Promise<void> {
  // Track popular variant selections
  const config = event.downloadConfig;
  if (config) {
    console.log(`Variant ${config.variant} selected for ${event.assetId}`);
  }
}

// Helper API endpoints for analytics queries (GET endpoints)
export async function getAnalytics(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      assetId, 
      eventType, 
      userRole,
      startDate,
      endDate,
      limit = 100 
    } = req.query;

    // Filter events based on query parameters
    let filteredEvents = [...analyticsStore];

    if (assetId) {
      filteredEvents = filteredEvents.filter(e => e.assetId === assetId);
    }

    if (eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === eventType);
    }

    if (userRole) {
      filteredEvents = filteredEvents.filter(e => e.userContext?.userRole === userRole);
    }

    if (startDate) {
      const start = new Date(startDate as string).getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string).getTime();
      filteredEvents = filteredEvents.filter(e => e.timestamp <= end);
    }

    // Sort by timestamp (most recent first) and limit results
    filteredEvents = filteredEvents
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, parseInt(limit as string));

    res.status(200).json({
      success: true,
      events: filteredEvents,
      total: filteredEvents.length
    });

  } catch (error) {
    console.error('Analytics query error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    });
  }
}