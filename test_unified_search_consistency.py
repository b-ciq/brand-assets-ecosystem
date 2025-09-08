#!/usr/bin/env python3
"""
POST-CLEANUP TEST: Unified Search Logic Consistency
Created: 2025-09-08 (cleanup testing)
MARK FOR DELETION: After testing complete

Tests consistency between all search interfaces after cleanup.
"""

import subprocess
import json
import sys
import http.client
from pathlib import Path

class UnifiedSearchTester:
    def __init__(self):
        self.results = []
        
    def log(self, message):
        print(f"  {message}")
        
    def test_cli_backend(self, query):
        """Test the CLI backend directly"""
        try:
            result = subprocess.run(
                ['python3', 'cli_wrapper.py', query],
                cwd='interfaces/mcp-server',
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                data = json.loads(result.stdout)
                return {
                    'success': True,
                    'total': data.get('total_found', 0),
                    'assets': data.get('assets', []),
                    'status': data.get('status', 'unknown')
                }
            else:
                return {
                    'success': False,
                    'error': result.stderr,
                    'total': 0
                }
                
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'total': 0
            }
    
    def test_web_api(self, query, port=3000):
        """Test web API endpoint"""
        try:
            conn = http.client.HTTPConnection('localhost', port, timeout=10)
            conn.request('GET', f'/api/search?query={query}')
            response = conn.getresponse()
            
            if response.status == 200:
                data = json.loads(response.read().decode())
                return {
                    'success': True,
                    'total': data.get('total', 0),
                    'assets': data.get('assets', []),
                    'status': 'success'
                }
            else:
                return {
                    'success': False,
                    'error': f'HTTP {response.status}',
                    'total': 0
                }
                
        except Exception as e:
            return {
                'success': False, 
                'error': str(e),
                'total': 0
            }
            
    def compare_results(self, query, cli_result, web_result):
        """Compare CLI and Web API results"""
        status = "✅ PASS"
        details = []
        
        if not cli_result['success']:
            status = "❌ FAIL"
            details.append(f"CLI failed: {cli_result['error']}")
            
        if not web_result['success']:
            status = "❌ FAIL"
            details.append(f"Web failed: {web_result['error']}")
            
        if cli_result['success'] and web_result['success']:
            if cli_result['total'] != web_result['total']:
                status = "⚠️ WARN"
                details.append(f"Count mismatch: CLI={cli_result['total']}, Web={web_result['total']}")
            else:
                details.append(f"Both found {cli_result['total']} assets")
                
        details_str = " | ".join(details) if details else "Results consistent"
        
        return f"{status} {query:12} | {details_str}"
        
    def test_search_consistency(self):
        """Test consistency across interfaces"""
        print("🧪 Testing unified search consistency...")
        
        test_queries = [
            ("fuzzball", "Primary fuzzball search"),
            ("fuzz", "Pattern matching: fuzz -> fuzzball"), 
            ("war", "Pattern matching: war -> warewulf"),
            ("ascender", "Primary ascender search"),
            ("ciq", "CIQ company logo"),
            ("nonexistent", "Nonexistent asset")
        ]
        
        # Test if web server is running
        web_available = False
        try:
            conn = http.client.HTTPConnection('localhost', 3000, timeout=5)
            conn.request('GET', '/api/search?query=test')
            response = conn.getresponse()
            web_available = True
            self.log("✅ Web server detected at localhost:3000")
        except:
            self.log("⚠️ Web server not running - testing CLI only")
            
        for query, description in test_queries:
            self.log(f"Testing '{query}'...")
            
            # Test CLI backend
            cli_result = self.test_cli_backend(query)
            
            if web_available:
                # Test web API
                web_result = self.test_web_api(query)
                
                # Compare results
                comparison = self.compare_results(query, cli_result, web_result)
                self.results.append(comparison)
            else:
                # CLI only
                if cli_result['success']:
                    self.results.append(f"✅ PASS {query:12} | CLI found {cli_result['total']} assets")
                else:
                    self.results.append(f"❌ FAIL {query:12} | CLI failed: {cli_result['error']}")
    
    def test_pattern_matching(self):
        """Test specific pattern matching scenarios"""
        print("🧪 Testing search pattern matching...")
        
        pattern_tests = [
            ("fuzz", "fuzzball", "Fuzzy pattern should match fuzzball"),
            ("war", "warewulf", "War pattern should match warewulf"), 
            ("asc", "ascender", "Asc pattern should match ascender"),
            ("roc", "rlc-hardened", "Roc pattern should match rlc-hardened")
        ]
        
        for pattern, expected, description in pattern_tests:
            cli_result = self.test_cli_backend(pattern)
            
            if cli_result['success'] and cli_result['total'] > 0:
                # Check if any asset matches expected product
                found_expected = any(
                    expected.lower() in asset.get('brand', '').lower() or
                    expected.lower() in asset.get('id', '').lower()
                    for asset in cli_result['assets']
                )
                
                if found_expected:
                    self.results.append(f"✅ PASS {pattern:12} | Pattern matching works: {pattern} -> {expected}")
                else:
                    self.results.append(f"⚠️ WARN {pattern:12} | Found assets but not expected {expected}")
            else:
                self.results.append(f"❌ FAIL {pattern:12} | Pattern matching failed: {description}")
    
    def run_tests(self):
        """Run all consistency tests"""
        print("🚀 POST-CLEANUP UNIFIED SEARCH CONSISTENCY TESTING")
        print("=" * 60)
        
        self.test_search_consistency()
        self.test_pattern_matching()
        
        # Results summary
        print("\n" + "=" * 60)
        print("📋 SEARCH CONSISTENCY TEST RESULTS:")
        for result in self.results:
            print(f"  {result}")
            
        passed = sum(1 for r in self.results if r.startswith("✅"))
        failed = sum(1 for r in self.results if r.startswith("❌"))
        warned = sum(1 for r in self.results if r.startswith("⚠️"))
        
        print(f"\n🎯 CONSISTENCY TESTS: {passed} passed, {failed} failed, {warned} warnings")
        
        return failed == 0

if __name__ == "__main__":
    tester = UnifiedSearchTester()
    success = tester.run_tests()
    sys.exit(0 if success else 1)