#!/usr/bin/env python3
"""
Comprehensive System Test Suite
Tests all critical functionality to ensure production readiness
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from server import SemanticAssetMatcher
import json

# Load test metadata  
with open('metadata/asset-inventory.json', 'r') as f:
    test_asset_data = json.load(f)

# Mock the global asset_data for testing
import server
server.asset_data = test_asset_data

matcher = SemanticAssetMatcher()

class TestResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.tests = []
    
    def test(self, name, condition, details=""):
        if condition:
            self.passed += 1
            self.tests.append(f"✅ {name}")
            if details:
                self.tests.append(f"   {details}")
        else:
            self.failed += 1
            self.tests.append(f"❌ {name}")
            if details:
                self.tests.append(f"   {details}")
    
    def summary(self):
        total = self.passed + self.failed
        print(f"\n{'='*60}")
        print(f"TEST RESULTS: {self.passed}/{total} PASSED")
        if self.failed > 0:
            print(f"❌ {self.failed} FAILURES NEED ATTENTION")
        else:
            print("🎉 ALL TESTS PASSED - SYSTEM READY FOR PRODUCTION")
        print(f"{'='*60}")
        
        for test in self.tests:
            print(test)

def run_query_test(query, expected_conditions):
    """Run a query and check multiple conditions"""
    try:
        result = matcher.find_assets(query)
        return result, None
    except Exception as e:
        return None, str(e)

def count_assets_in_response(result):
    """Count total assets in response"""
    total = 0
    
    if 'documents' in result:
        if isinstance(result['documents'], dict):
            total += result['documents'].get('count', 0)
        elif isinstance(result['documents'], list):
            total += len(result['documents'])
    
    if 'logos' in result:
        if isinstance(result['logos'], dict):
            total += result['logos'].get('count', 0)
        elif isinstance(result['logos'], list):
            total += len(result['logos'])
    
    if 'by_product' in result:
        total = result.get('total_count', 0)
    
    return total

# Initialize test suite
results = TestResult()

print("🚀 COMPREHENSIVE SYSTEM TEST SUITE")
print("=" * 60)
print("Testing all critical functionality for production readiness...")

# ===== 1. METADATA AND INITIALIZATION =====
print("\n📊 1. METADATA AND INITIALIZATION")

results.test(
    "Asset data loaded successfully", 
    server.asset_data is not None,
    f"Loaded {server.asset_data['index']['total_assets']} assets"
)

results.test(
    "RLC-LTS has solution brief documents",
    'rlc-lts' in server.asset_data['assets'] and 
    any(asset['type'] == 'document' for asset in server.asset_data['assets']['rlc-lts'].values()),
    "RLC-LTS documents found in metadata"
)

results.test(
    "Metadata contains expected structure",
    all(key in server.asset_data for key in ['assets', 'rules', 'index']),
    "All required metadata sections present"
)

# ===== 2. PRODUCT PATTERN MATCHING =====
print("\n🎯 2. PRODUCT PATTERN MATCHING")

# Test basic product detection
test_cases = [
    ("RLC-LTS solution brief", "rlc-lts"),
    ("Rocky Linux LTS docs", "rlc-lts"),
    ("RLC solution brief", "rlc-lts"),  # Should route to RLC-LTS for docs
    ("RLC logo", "rlc"),  # Should stay RLC for logos
    ("Warewulf horizontal logo", "warewulf"),
    ("Fuzzball documentation", "fuzzball"),
    ("CIQ twocolor logo", "ciq"),
]

for query, expected_product in test_cases:
    parsed = matcher._parse_request(query)
    results.test(
        f"'{query}' → {expected_product}",
        parsed['product'] == expected_product,
        f"Detected: {parsed['product']}"
    )

# ===== 3. SEMANTIC INTENT RECOGNITION =====
print("\n🧠 3. SEMANTIC INTENT RECOGNITION")

intent_tests = [
    ("show me everything for RLC-LTS", "all_assets"),
    ("RLC-LTS solution brief", "sales_materials"),
    ("I need documentation", "documents"),
    ("give me all solution briefs", "sales_materials"),
    ("show me logos", "visual_assets"),
    ("what materials do you have?", "documents"),
]

for query, expected_intent in intent_tests:
    parsed = matcher._parse_request(query)
    results.test(
        f"'{query}' → {expected_intent} intent",
        parsed['primary_intent'] == expected_intent,
        f"Detected: {parsed['primary_intent']}"
    )

# ===== 4. DOCUMENT QUERIES =====
print("\n📄 4. DOCUMENT QUERIES")

# Test specific document queries
result, error = run_query_test("RLC-LTS solution brief", {})
results.test(
    "RLC-LTS solution brief query works",
    error is None,
    f"Error: {error}" if error else "Query executed successfully"
)

if result:
    doc_count = count_assets_in_response(result)
    results.test(
        "RLC-LTS solution brief returns documents",
        doc_count > 0,
        f"Found {doc_count} documents"
    )

# Test the fixed "RLC solution brief" query
result, error = run_query_test("RLC solution brief", {})
results.test(
    "RLC solution brief routes to RLC-LTS",
    error is None and result and 'RLC-LTS' in result.get('message', ''),
    "Should find RLC-LTS documents, not say 'no documents available'"
)

# ===== 5. GLOBAL QUERIES =====
print("\n🌍 5. GLOBAL QUERIES")

global_tests = [
    ("give me all solution briefs", "should find solution briefs across products"),
    ("show me all documents", "should find all documents globally"), 
    ("what solution briefs do you have?", "should list available solution briefs"),
]

for query, expectation in global_tests:
    result, error = run_query_test(query, {})
    has_global_response = result and 'by_product' in result
    
    results.test(
        f"Global query: '{query}'",
        error is None and has_global_response,
        f"{expectation} - {'✓' if has_global_response else 'No global response format'}"
    )

# ===== 6. COMPREHENSIVE QUERIES =====
print("\n🔍 6. COMPREHENSIVE QUERIES")

comprehensive_tests = [
    ("show me everything for RLC-LTS", "should show logos AND documents"),
    ("what do you have for Warewulf?", "should show logos (no docs available)"),
    ("give me all Fuzzball assets", "should show all Fuzzball assets"),
]

for query, expectation in comprehensive_tests:
    result, error = run_query_test(query, {})
    has_summary = result and 'summary' in result
    
    results.test(
        f"Comprehensive: '{query}'",
        error is None and has_summary,
        f"{expectation} - {'✓' if has_summary else 'No comprehensive format'}"
    )

# ===== 7. LOGO QUERIES (LEGACY COMPATIBILITY) =====
print("\n🎨 7. LOGO QUERIES (LEGACY COMPATIBILITY)")

logo_tests = [
    ("RLC-LTS logo for dark backgrounds", "should handle background preference"),
    ("Warewulf horizontal logo", "should handle layout preference"),
    ("CIQ green logo", "should handle CIQ variants"),
    ("Apptainer icon", "should find icon/symbol"),
]

for query, expectation in logo_tests:
    result, error = run_query_test(query, {})
    
    results.test(
        f"Logo query: '{query}'",
        error is None and result and 'message' in result,
        f"{expectation} - {'✓' if result else 'Failed'}"
    )

# ===== 8. EDGE CASES AND ERROR HANDLING =====
print("\n🤔 8. EDGE CASES AND ERROR HANDLING")

edge_cases = [
    ("nonexistent product solution brief", "should handle gracefully"),
    ("", "should handle empty query"),
    ("xyz123", "should provide helpful fallback"),
    ("solution brief", "should handle generic query"),
]

for query, expectation in edge_cases:
    result, error = run_query_test(query, {})
    handled_gracefully = result and ('message' in result or 'help' in result)
    
    results.test(
        f"Edge case: '{query}'",
        handled_gracefully,
        f"{expectation} - {'✓' if handled_gracefully else 'Poor error handling'}"
    )

# ===== 9. CIQ DISAMBIGUATION =====
print("\n🔀 9. CIQ DISAMBIGUATION")

result, error = run_query_test("CIQ product logos", {})
has_disambiguation = result and ('options' in result or 'question' in result)

results.test(
    "CIQ product disambiguation triggers",
    has_disambiguation,
    "Should ask user to clarify company vs product logos"
)

# ===== 10. RESPONSE FORMAT CONSISTENCY =====
print("\n📋 10. RESPONSE FORMAT CONSISTENCY")

format_tests = [
    ("RLC-LTS solution brief", ["message", "confidence"]),
    ("show me everything for RLC-LTS", ["message", "summary"]),
    ("give me all solution briefs", ["message", "by_product"]),
]

for query, required_fields in format_tests:
    result, error = run_query_test(query, {})
    has_required_fields = result and all(field in result for field in required_fields)
    
    results.test(
        f"Format consistency: '{query}'",
        has_required_fields,
        f"Required fields: {required_fields}"
    )

# ===== 11. PERFORMANCE AND RELIABILITY =====
print("\n⚡ 11. PERFORMANCE AND RELIABILITY")

# Test that system doesn't crash on rapid queries
rapid_test_passed = True
try:
    for i in range(10):
        matcher.find_assets(f"test query {i}")
except Exception as e:
    rapid_test_passed = False

results.test(
    "System handles rapid queries without crashing",
    rapid_test_passed,
    "No crashes during stress test"
)

# ===== FINAL RESULTS =====
results.summary()

print(f"\n🚀 SYSTEM STATUS:")
if results.failed == 0:
    print("🟢 READY FOR PRODUCTION DEPLOYMENT")
    print("   All critical functionality working correctly")
    print("   Document queries fixed and working")
    print("   Global queries implemented and functional")
    print("   Legacy logo queries preserved")
else:
    print("🟡 NEEDS ATTENTION BEFORE DEPLOYMENT")
    print(f"   {results.failed} issues need to be resolved")
    print("   Review failed tests above")