'use client';

export default function DemoBanner() {
  // Only show in demo mode
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  
  if (!isDemoMode) return null;
  
  return (
    <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
      <div className="max-w-7xl mx-auto">
        <p className="text-sm text-blue-800">
          <span className="font-semibold">🎭 Demo Version</span> - 
          This is a static demonstration of the Brand Assets app. 
          Full features including MCP integration available in local development.
        </p>
      </div>
    </div>
  );
}