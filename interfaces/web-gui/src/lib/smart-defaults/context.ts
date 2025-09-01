import { UserContext, UserRole, BackgroundMode, SourceType, UsageContext } from './types';

export class ContextDetector {
  /**
   * Detect user context from browser environment and available data
   */
  static detectUserContext(options: {
    source?: SourceType;
    searchParams?: URLSearchParams;
    userAgent?: string;
    sessionData?: any;
  } = {}): UserContext {
    const context: UserContext = {
      source: options.source || 'web',
      sessionId: this.generateSessionId(),
      timeOfDay: new Date().getHours(),
      userAgent: options.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : undefined)
    };

    // Detect device theme preference
    context.deviceTheme = this.detectDeviceTheme();

    // Extract context from URL parameters (for deep linking)
    if (options.searchParams) {
      context.userRole = this.parseUserRole(options.searchParams.get('role'));
      context.purposeHint = this.parseUsageContext(options.searchParams.get('usage'));
      context.slackChannel = options.searchParams.get('channel') || undefined;
    }

    // Detect user role from various signals
    if (!context.userRole) {
      context.userRole = this.detectUserRole({
        userAgent: context.userAgent,
        timeOfDay: context.timeOfDay,
        source: context.source
      });
    }

    return context;
  }

  /**
   * Detect if user prefers light or dark theme
   */
  static detectDeviceTheme(): BackgroundMode {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      return darkModeQuery.matches ? 'dark' : 'light';
    }
    return 'light'; // Default fallback
  }

  /**
   * Attempt to detect user role from available signals
   */
  static detectUserRole(signals: {
    userAgent?: string;
    timeOfDay?: number;
    source?: SourceType;
    slackChannel?: string;
  }): UserRole {
    const { userAgent, timeOfDay, source, slackChannel } = signals;

    // Slack channel-based detection
    if (source === 'slack' && slackChannel) {
      if (slackChannel.includes('marketing') || slackChannel.includes('brand')) {
        return 'marketer';
      }
      if (slackChannel.includes('engineering') || slackChannel.includes('dev')) {
        return 'engineer';
      }
      if (slackChannel.includes('sales') || slackChannel.includes('business')) {
        return 'sales';
      }
      if (slackChannel.includes('design') || slackChannel.includes('creative')) {
        return 'designer';
      }
    }

    // User agent-based hints (very rough)
    if (userAgent) {
      // Design tools in user agent
      if (userAgent.includes('Figma') || userAgent.includes('Adobe') || userAgent.includes('Sketch')) {
        return 'designer';
      }
      
      // Development tools
      if (userAgent.includes('VS Code') || userAgent.includes('Developer')) {
        return 'engineer';
      }
    }

    // Time-based very rough heuristics (designers often work late, engineers early)
    if (timeOfDay !== undefined) {
      if (timeOfDay >= 22 || timeOfDay <= 2) {
        return 'designer'; // Designers burning the midnight oil
      }
      if (timeOfDay >= 6 && timeOfDay <= 8) {
        return 'engineer'; // Early bird engineers
      }
    }

    return 'unknown';
  }

  /**
   * Parse user role from string parameter
   */
  static parseUserRole(roleStr: string | null): UserRole | undefined {
    if (!roleStr) return undefined;
    
    const normalized = roleStr.toLowerCase();
    const validRoles: UserRole[] = ['designer', 'marketer', 'engineer', 'sales'];
    
    return validRoles.find(role => role === normalized) || 'unknown';
  }

  /**
   * Parse usage context from string parameter
   */
  static parseUsageContext(usageStr: string | null): UsageContext | undefined {
    if (!usageStr) return undefined;
    
    const normalized = usageStr.toLowerCase();
    const validContexts: UsageContext[] = [
      'presentation', 'website', 'email', 'social', 'print', 'app', 'documentation'
    ];
    
    return validContexts.find(context => context === normalized);
  }

  /**
   * Detect likely usage context from various signals
   */
  static detectUsageContext(signals: {
    timeOfDay?: number;
    userRole?: UserRole;
    slackChannel?: string;
    referrer?: string;
  }): UsageContext | undefined {
    const { timeOfDay, userRole, slackChannel, referrer } = signals;

    // Role-based defaults
    switch (userRole) {
      case 'marketer':
        return timeOfDay && timeOfDay >= 9 && timeOfDay <= 17 ? 'presentation' : 'social';
      case 'engineer':
        return 'documentation';
      case 'sales':
        return 'presentation';
      case 'designer':
        return 'website';
    }

    // Channel-based detection
    if (slackChannel) {
      if (slackChannel.includes('social') || slackChannel.includes('twitter')) return 'social';
      if (slackChannel.includes('web') || slackChannel.includes('site')) return 'website';
      if (slackChannel.includes('docs')) return 'documentation';
      if (slackChannel.includes('email')) return 'email';
    }

    // Referrer-based detection
    if (referrer) {
      if (referrer.includes('docs.')) return 'documentation';
      if (referrer.includes('slides.') || referrer.includes('deck.')) return 'presentation';
    }

    return undefined;
  }

  /**
   * Generate a session ID for analytics tracking
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Detect optimal background mode based on context
   */
  static detectOptimalBackgroundMode(context: UserContext): BackgroundMode {
    // If we have device theme, use it as primary signal
    if (context.deviceTheme) {
      return context.deviceTheme;
    }

    // Time-based heuristic (night = more likely dark mode usage)
    if (context.timeOfDay !== undefined) {
      if (context.timeOfDay >= 20 || context.timeOfDay <= 6) {
        return 'dark';
      }
    }

    // Usage context hints
    switch (context.purposeHint) {
      case 'app':
      case 'website':
        // Web/app usage more likely to be dark mode aware
        return context.deviceTheme || 'light';
      case 'presentation':
      case 'print':
        // Presentations and print usually light backgrounds
        return 'light';
      case 'social':
        // Social media varies, but dark mode common
        return 'dark';
      default:
        return 'light'; // Safe default
    }
  }

  /**
   * Update context with team usage patterns
   */
  static enrichWithTeamPatterns(context: UserContext, teamPatterns?: any): UserContext {
    if (!teamPatterns) return context;

    return {
      ...context,
      teamUsagePatterns: teamPatterns
    };
  }
}