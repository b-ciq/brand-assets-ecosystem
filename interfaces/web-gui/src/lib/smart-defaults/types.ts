export type UserRole = 'designer' | 'marketer' | 'engineer' | 'sales' | 'unknown';
export type SourceType = 'web' | 'slack' | 'api';
export type BackgroundMode = 'light' | 'dark';
export type LogoVariant = 'horizontal' | 'vertical' | 'symbol';
export type ColorChoice = 'neutral' | 'green';
export type FormatChoice = 'svg' | 'png' | 'jpeg';
export type UsageContext = 'presentation' | 'website' | 'email' | 'social' | 'print' | 'app' | 'documentation';

export interface UserContext {
  source: SourceType;
  userRole?: UserRole;
  deviceTheme?: BackgroundMode;
  previousDownloads?: DownloadHistory[];
  teamUsagePatterns?: TeamAnalytics;
  slackChannel?: string;
  timeOfDay?: number; // 0-23
  purposeHint?: UsageContext;
  userAgent?: string;
  sessionId?: string;
}

export interface DownloadConfig {
  variant: LogoVariant;
  format: FormatChoice;
  size: number;
  backgroundMode: BackgroundMode;
  colorMode: ColorChoice;
  quality?: number; // For JPEG
}

export interface SmartDefaults extends DownloadConfig {
  confidence: number; // 0-1, how confident we are in these defaults
  reasoning: string[]; // Human-readable explanation of choices
  alternatives: Partial<DownloadConfig>[]; // Other good options
}

export interface DownloadHistory {
  assetId: string;
  config: DownloadConfig;
  timestamp: number;
  satisfaction?: number; // 1-5 user rating
  modified: boolean; // Did user change the smart defaults?
}

export interface TeamAnalytics {
  teamId: string;
  commonVariants: Record<string, number>; // variant -> usage count
  commonFormats: Record<string, number>; // format -> usage count
  commonSizes: Record<number, number>; // size -> usage count
  backgroundModeUsage: Record<BackgroundMode, number>;
  rolePatterns: Record<UserRole, DownloadConfig>;
  updatedAt: number;
}

export interface AssetUsageMetrics {
  assetId: string;
  totalDownloads: number;
  variantPopularity: Record<LogoVariant, number>;
  formatPopularity: Record<FormatChoice, number>;
  averageSize: number;
  backgroundModeDistribution: Record<BackgroundMode, number>;
  rolePreferences: Record<UserRole, DownloadConfig>;
  timeBasedPatterns: Record<string, number>; // hour -> download count
  channelPatterns?: Record<string, DownloadConfig>; // Slack channel patterns
}

export interface SmartDefaultsOptions {
  enableMachineLearning?: boolean;
  useTeamPatterns?: boolean;
  useTimeBasedHeuristics?: boolean;
  confidenceThreshold?: number; // Don't apply if confidence < threshold
  fallbackToMostPopular?: boolean;
}

export interface AnalyticsEvent {
  eventType: 'smart_download' | 'quick_download' | 'advanced_download' | 'smart_default_rejected';
  assetId: string;
  userId?: string;
  userContext: UserContext;
  downloadConfig: DownloadConfig;
  wasSmartDefault: boolean;
  smartDefaultsUsed?: SmartDefaults;
  userModifications?: Partial<DownloadConfig>;
  satisfaction?: number;
  timestamp: number;
  sessionId: string;
}