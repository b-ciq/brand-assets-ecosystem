import { GetServerSideProps } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Download, ExternalLink, Settings, Zap } from 'lucide-react';
import { SlackIntegration, SlackDeepLinkOptions } from '@/lib/deep-linking/slack-integration';
import { SmartAssetPreview } from '@/components/SmartAssetPreview';
import { QuickDownloadButton } from '@/components/QuickDownloadButton';

interface QuickDownloadPageProps {
  deepLinkOptions: SlackDeepLinkOptions | null;
  assetId: string;
  source: string;
}

/**
 * Quick download page for deep linking from Slack and other integrations
 */
export default function QuickDownloadPage({ 
  deepLinkOptions, 
  assetId, 
  source 
}: QuickDownloadPageProps) {
  const router = useRouter();
  const [asset, setAsset] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Mock asset data (replace with actual API call)
  useEffect(() => {
    const loadAsset = async () => {
      try {
        // TODO: Replace with actual asset API call
        const mockAssets: Record<string, any> = {
          'fuzzball': {
            id: 'fuzzball',
            title: 'Fuzzball Logo',
            conciseDescription: 'Primary brand logo with smart defaults',
            fileType: 'svg',
            url: '/assets/products/fuzzball/logos/Fuzzball_logo_h-blk.svg',
            thumbnailUrl: '/assets/products/fuzzball/logos/Fuzzball_logo_h-blk.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          'ascender': {
            id: 'ascender',
            title: 'AscenderPro Logo', 
            conciseDescription: 'Ascender product logo with smart defaults',
            fileType: 'svg',
            url: '/assets/products/ascender/logos/AscenderPro_logo_h-blk.svg',
            thumbnailUrl: '/assets/products/ascender/logos/AscenderPro_logo_h-blk.svg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        };
        
        const mockAsset = mockAssets[assetId] || mockAssets['fuzzball'];
        
        setAsset(mockAsset);
      } catch (err) {
        setError('Failed to load asset');
      } finally {
        setIsLoading(false);
      }
    };

    loadAsset();
  }, [assetId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading asset...</p>
        </div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 mb-4">
            <Download size={48} className="mx-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Asset Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'The requested asset could not be found.'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-brand-green text-white px-6 py-2 rounded-lg hover:bg-brand-green-dark transition-colors"
          >
            Browse Assets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Zap className="text-brand-green" size={24} />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Quick Download</h1>
                <p className="text-sm text-gray-500">
                  {source === 'slack' ? 'From Slack' : 'Smart defaults applied'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ExternalLink size={16} />
              Browse All Assets
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Asset Preview */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              
              {/* Preview Image */}
              <div className="flex-shrink-0">
                <SmartAssetPreview
                  asset={asset}
                  variant={deepLinkOptions?.variant as any}
                  colorMode={deepLinkOptions?.colorMode as any}
                  backgroundMode={deepLinkOptions?.backgroundMode as any}
                  size={160}
                  showTooltip={true}
                  showConfidence={true}
                />
              </div>

              {/* Asset Info */}
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{asset.title}</h2>
                <p className="text-gray-600 mb-4">{asset.conciseDescription}</p>
                
                {/* Configuration Preview */}
                {deepLinkOptions && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Configuration</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {deepLinkOptions.variant && (
                        <div>
                          <span className="text-gray-500">Variant:</span>
                          <span className="ml-1 font-medium">{deepLinkOptions.variant}</span>
                        </div>
                      )}
                      {deepLinkOptions.format && (
                        <div>
                          <span className="text-gray-500">Format:</span>
                          <span className="ml-1 font-medium">{deepLinkOptions.format.toUpperCase()}</span>
                        </div>
                      )}
                      {deepLinkOptions.size && (
                        <div>
                          <span className="text-gray-500">Size:</span>
                          <span className="ml-1 font-medium">{deepLinkOptions.size}px</span>
                        </div>
                      )}
                      {deepLinkOptions.colorMode && (
                        <div>
                          <span className="text-gray-500">Color:</span>
                          <span className="ml-1 font-medium">{deepLinkOptions.colorMode}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              
              {/* Quick Download - Primary Action */}
              <QuickDownloadButton
                asset={asset}
                variant="primary"
                size="lg"
                className="flex-1 sm:flex-initial"
                onDownloadStart={() => {
                  // Track Slack download if from Slack
                  if (source === 'slack') {
                    console.log('Slack quick download started');
                  }
                }}
                onDownloadComplete={() => {
                  // Show success message
                  alert('Download completed!');
                }}
                onError={(error) => {
                  alert(`Download failed: ${error}`);
                }}
              />

              {/* Advanced Options - Secondary Action */}
              <button
                onClick={() => router.push(`/?asset=${assetId}`)}
                className="flex items-center justify-center gap-2 px-6 py-3 text-base font-medium rounded-lg transition-colors bg-gray-100 text-gray-900 hover:bg-gray-200 flex-1 sm:flex-initial"
              >
                <Settings size={18} />
                Advanced Options
              </button>
            </div>

            {/* Additional Info for Slack Users */}
            {source === 'slack' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                  <div className="text-blue-600 mt-0.5">
                    <ExternalLink size={16} />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-blue-900 mb-1">
                      Opened from Slack
                    </h3>
                    <p className="text-sm text-blue-700">
                      This download uses smart defaults based on your team's usage patterns. 
                      Need different options? Use the "Advanced Options" button above.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Assets (Future Enhancement) */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-brand-green hover:text-brand-green-dark font-medium transition-colors"
          >
            Browse more assets →
          </button>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { query } = context;
  
  try {
    // Parse deep link parameters
    const url = `${context.req.headers.host}${context.req.url}`;
    const fullUrl = `https://${url}`; // Assume HTTPS in production
    const deepLinkOptions = SlackIntegration.parseDeepLink(fullUrl);
    
    const assetId = query.assetId as string;
    const source = query.source as string || 'web';
    
    if (!assetId) {
      return {
        notFound: true
      };
    }
    
    return {
      props: {
        deepLinkOptions: deepLinkOptions || null,
        assetId,
        source
      }
    };
    
  } catch (error) {
    console.error('Quick download page error:', error);
    return {
      notFound: true
    };
  }
};