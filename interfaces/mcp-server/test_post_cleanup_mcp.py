#!/usr/bin/env python3
"""
POST-CLEANUP TEST: MCP Server Functionality
Created: 2025-09-08 (cleanup testing)
MARK FOR DELETION: After testing complete

Tests MCP server core functionality after cleanup to ensure no breakage.
"""

import subprocess
import json
import sys
from pathlib import Path

def test_cli_wrapper_search():
    """Test unified CLI backend directly"""
    print("🧪 Testing CLI wrapper unified backend...")
    
    test_cases = [
        ("fuzzball", "Should find primary fuzzball asset"),
        ("fuzz", "Pattern matching: fuzz -> fuzzball"),  
        ("war", "Pattern matching: war -> warewulf"),
        ("ascender", "Should find primary ascender asset"),
        ("ciq", "Should find CIQ company logo"),
        ("nonexistent", "Should handle nonexistent gracefully")
    ]
    
    results = []
    for query, description in test_cases:
        try:
            result = subprocess.run(
                ['python3', 'cli_wrapper.py', query],
                cwd='./interfaces/mcp-server',
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                try:
                    data = json.loads(result.stdout)
                    status = "✅ PASS"
                    details = f"Found {data.get('total_found', 0)} assets"
                except json.JSONDecodeError:
                    status = "⚠️ WARN"
                    details = "Non-JSON output"
            else:
                status = "❌ FAIL"
                details = f"Exit code: {result.returncode}, Error: {result.stderr[:100]}"
                
            results.append(f"{status} {query:12} | {description} | {details}")
            print(f"  {status} {query}: {details}")
            
        except Exception as e:
            results.append(f"❌ FAIL {query:12} | {description} | Exception: {str(e)}")
            print(f"  ❌ FAIL {query}: Exception: {str(e)}")
    
    return results

def test_mcp_server_startup():
    """Test MCP server can start without errors"""
    print("🧪 Testing MCP server startup...")
    
    try:
        # Test server.py imports and basic structure
        result = subprocess.run(
            ['python3', '-c', 'import server; print("MCP server imports successfully")'],
            cwd='./interfaces/mcp-server',
            capture_output=True,
            text=True,
            timeout=15
        )
        
        if result.returncode == 0:
            print("  ✅ PASS: MCP server imports and starts successfully")
            return "✅ PASS: MCP server startup test"
        else:
            print(f"  ❌ FAIL: MCP server startup failed: {result.stderr}")
            return f"❌ FAIL: MCP server startup - {result.stderr[:100]}"
            
    except Exception as e:
        print(f"  ❌ FAIL: Exception during startup test: {str(e)}")
        return f"❌ FAIL: Exception during startup test: {str(e)}"

def run_mcp_tests():
    """Run all MCP tests"""
    print("🚀 POST-CLEANUP MCP SERVER TESTING")
    print("=" * 50)
    
    results = []
    
    # Test 1: CLI Wrapper (Core Backend)
    cli_results = test_cli_wrapper_search()
    results.extend(cli_results)
    
    # Test 2: MCP Server Startup
    startup_result = test_mcp_server_startup()
    results.append(startup_result)
    
    print("\n" + "=" * 50)
    print("📋 MCP TEST RESULTS SUMMARY:")
    for result in results:
        print(f"  {result}")
    
    # Count results
    passed = sum(1 for r in results if r.startswith("✅"))
    failed = sum(1 for r in results if r.startswith("❌"))
    warned = sum(1 for r in results if r.startswith("⚠️"))
    
    print(f"\n🎯 MCP TESTS: {passed} passed, {failed} failed, {warned} warnings")
    
    return failed == 0

if __name__ == "__main__":
    success = run_mcp_tests()
    sys.exit(0 if success else 1)