#!/usr/bin/env python3
"""
Test the core functionality that the MCP tool calls
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from server import matcher, asset_data, load_asset_data

def test_core_functionality():
    """Test the core logic that the MCP tool uses"""
    print("🧪 Testing Core MCP Tool Logic")
    print("=" * 50)
    
    # Ensure asset data is loaded
    if not asset_data:
        if not load_asset_data():
            print("❌ Failed to load asset data")
            return False
    
    critical_tests = [
        ("RLC solution brief", "Should route to RLC-LTS and find documents"),
        ("give me all solution briefs", "Should find global solution briefs"),
        ("show me everything for RLC-LTS", "Should show comprehensive assets"),
    ]
    
    all_passed = True
    
    for query, expectation in critical_tests:
        print(f"\n🔍 Testing: '{query}'")
        print(f"Expected: {expectation}")
        
        try:
            # This is what the MCP tool actually calls
            result = matcher.find_assets(query)
            
            if isinstance(result, dict):
                print("✅ Valid response structure")
                
                # Critical test: RLC solution brief routing
                if query == "RLC solution brief":
                    message = result.get('message', '')
                    if 'RLC-LTS' in message and result.get('confidence') == 'high':
                        print("✅ CRITICAL: RLC→RLC-LTS routing works")
                    else:
                        print("❌ CRITICAL: RLC→RLC-LTS routing failed")
                        print(f"   Message: {message}")
                        all_passed = False
                
                # Global query test
                if "give me all" in query:
                    if 'by_product' in result and result.get('total_count', 0) > 0:
                        print("✅ CRITICAL: Global query works")
                    else:
                        print("❌ CRITICAL: Global query failed")
                        all_passed = False
                
                # Comprehensive test  
                if "everything for" in query:
                    if 'summary' in result:
                        print("✅ CRITICAL: Comprehensive query works")
                    else:
                        print("❌ CRITICAL: Comprehensive query failed")
                        all_passed = False
                        
            else:
                print(f"❌ Invalid response type: {type(result)}")
                all_passed = False
                
        except Exception as e:
            print(f"❌ CRITICAL ERROR: {e}")
            import traceback
            traceback.print_exc()
            all_passed = False
    
    return all_passed

def test_production_readiness():
    """Additional production readiness checks"""
    print(f"\n🚀 Production Readiness Checks")
    print("=" * 30)
    
    # Test rapid queries don't crash
    try:
        for i in range(50):
            matcher.find_assets("test query")
        print("✅ Handles rapid queries")
    except:
        print("❌ Crashes on rapid queries")
        return False
    
    # Test memory doesn't explode
    import psutil
    import os
    process = psutil.Process(os.getpid())
    initial_memory = process.memory_info().rss / 1024 / 1024  # MB
    
    for i in range(100):
        matcher.find_assets(f"memory test {i}")
    
    final_memory = process.memory_info().rss / 1024 / 1024  # MB
    memory_increase = final_memory - initial_memory
    
    if memory_increase < 50:  # Less than 50MB increase
        print(f"✅ Memory stable ({memory_increase:.1f}MB increase)")
    else:
        print(f"❌ Memory leak detected ({memory_increase:.1f}MB increase)")
        return False
    
    return True

if __name__ == "__main__":
    print("🔬 CRITICAL SYSTEM VALIDATION")
    print("=" * 60)
    
    core_passed = test_core_functionality()
    prod_passed = test_production_readiness()
    
    print(f"\n{'='*60}")
    
    if core_passed and prod_passed:
        print("✅ SYSTEM VALIDATION PASSED")
        print("🟢 Core functionality working correctly")
        print("🟢 Production readiness confirmed") 
        print("\n⚠️  STILL NEED TO VERIFY:")
        print("   • Claude will choose this tool over Google Drive")
        print("   • FastMCP deployment works correctly")
        print("   • Network access to GitHub raw URLs")
    else:
        print("❌ SYSTEM VALIDATION FAILED")
        print("🔴 Critical issues found - NOT READY")
        
        if not core_passed:
            print("   Core functionality broken")
        if not prod_passed:
            print("   Production issues detected")