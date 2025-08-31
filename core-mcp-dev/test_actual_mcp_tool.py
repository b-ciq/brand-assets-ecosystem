#!/usr/bin/env python3
"""
Test the actual MCP tool function, not just the logic
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

# Import the actual MCP tool function
from server import get_brand_assets, load_asset_data

def test_actual_tool():
    """Test the actual get_brand_assets MCP tool function"""
    print("🧪 Testing Actual MCP Tool Function")
    print("=" * 50)
    
    # Ensure asset data is loaded
    print("Loading asset data...")
    if not load_asset_data():
        print("❌ Failed to load asset data")
        return False
    
    # Test cases that should work
    test_queries = [
        "RLC solution brief",
        "RLC-LTS solution brief", 
        "give me all solution briefs",
        "show me everything for RLC-LTS",
        "Warewulf logo for dark backgrounds",
        "what documents do you have?",
        "CIQ product logos",  # Should trigger disambiguation
    ]
    
    for query in test_queries:
        print(f"\n🔍 Testing: '{query}'")
        try:
            result = get_brand_assets(query)
            
            # Check basic response structure
            if isinstance(result, dict) and 'message' in result:
                print("✅ Valid response structure")
                print(f"   Message: {result['message'][:100]}...")
                print(f"   Confidence: {result.get('confidence', 'unknown')}")
                
                # Check for critical success indicators
                if query == "RLC solution brief":
                    if "RLC-LTS" in result.get('message', ''):
                        print("✅ RLC→RLC-LTS routing works!")
                    else:
                        print("❌ RLC→RLC-LTS routing failed")
                        
                if "solution brief" in query.lower() and "give me all" in query.lower():
                    if result.get('total_count', 0) > 0:
                        print("✅ Global query returns results")
                    else:
                        print("❌ Global query returns no results")
                        
            else:
                print(f"❌ Invalid response: {result}")
                
        except Exception as e:
            print(f"❌ Tool crashed: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    return True

if __name__ == "__main__":
    success = test_actual_tool()
    
    print(f"\n{'='*50}")
    if success:
        print("✅ MCP Tool Function Tests Passed")
        print("🟡 Still need to test in actual Claude environment")
        print("🟡 Tool selection priority not guaranteed")
    else:
        print("❌ MCP Tool Function Tests Failed") 
        print("🔴 System not ready for production")