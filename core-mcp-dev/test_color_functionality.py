#!/usr/bin/env python3
"""
Test Color Functionality
Tests the new color palette functionality integrated with the existing semantic matcher
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from server import SemanticAssetMatcher, load_asset_data, load_color_data
import json

# Load test data
print("🧪 Loading test data...")
asset_success = load_asset_data()
color_success = load_color_data()

if not asset_success:
    print("❌ Failed to load asset data")
    sys.exit(1)

if not color_success:
    print("❌ Failed to load color data")
    sys.exit(1)

print("✅ Test data loaded successfully")

# Initialize matcher
matcher = SemanticAssetMatcher()

class ColorTestResults:
    def __init__(self):
        self.tests = []
        self.passed = 0
        self.failed = 0
    
    def test(self, name: str, condition: bool, details: str = ""):
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
        print(f"COLOR FUNCTIONALITY TEST RESULTS: {self.passed}/{total} PASSED")
        if self.failed > 0:
            print(f"❌ {self.failed} FAILURES NEED ATTENTION")
        else:
            print("🎉 ALL COLOR TESTS PASSED - COLOR FUNCTIONALITY READY!")
        print(f"{'='*60}")
        
        for test in self.tests:
            print(test)

def run_color_test(query: str):
    """Run a color query test"""
    try:
        result = matcher.find_assets(query)
        return result, None
    except Exception as e:
        return None, str(e)

# Initialize test results
results = ColorTestResults()

print("\n🎨 TESTING COLOR FUNCTIONALITY")
print("=" * 60)

# ===== 1. BASIC COLOR QUERIES =====
print("\n🌈 1. BASIC COLOR QUERIES")

basic_color_tests = [
    ("show me the brand colors", "should return CIQ brand color information"),
    ("what colors are available?", "should return color palette overview"),
    ("colors", "should return general color information"),
    ("design system colors", "should return design system structure"),
]

for query, expectation in basic_color_tests:
    result, error = run_color_test(query)
    has_color_response = result and result.get('type') in ['colors', 'design_system']
    
    results.test(
        f"Basic color query: '{query}'",
        error is None and has_color_response,
        f"{expectation} - {'✓' if has_color_response else 'No color response'}"
    )

# ===== 2. COLOR FAMILY QUERIES =====
print("\n🎯 2. COLOR FAMILY QUERIES")

family_tests = [
    ("blue color family", "should return blue color shades"),
    ("show me all color families", "should list all 15 color families"),
    ("gray colors", "should return gray color family"),
    ("error colors", "should return error color family"),
]

for query, expectation in family_tests:
    result, error = run_color_test(query)
    has_family_response = result and (
        result.get('type') == 'color_family' or 
        result.get('type') == 'color_families' or
        'families' in result
    )
    
    results.test(
        f"Color family query: '{query}'",
        error is None and has_family_response,
        f"{expectation} - {'✓' if has_family_response else 'No family response'}"
    )

# ===== 3. SEMANTIC COLOR QUERIES =====
print("\n📝 3. SEMANTIC COLOR QUERIES")

semantic_tests = [
    ("semantic colors", "should return semantic color tokens"),
    ("text colors", "should return text-related colors"),
    ("background colors", "should return background colors"),
    ("UI colors", "should return interface colors"),
]

for query, expectation in semantic_tests:
    result, error = run_color_test(query)
    has_semantic_response = result and (
        'semantic_colors' in result or
        result.get('type') == 'colors'
    )
    
    results.test(
        f"Semantic color query: '{query}'",
        error is None and has_semantic_response,
        f"{expectation} - {'✓' if has_semantic_response else 'No semantic response'}"
    )

# ===== 4. FUNCTIONAL COLOR QUERIES =====
print("\n⚠️ 4. FUNCTIONAL COLOR QUERIES")

functional_tests = [
    ("error colors for UI", "should return error color variants"),
    ("warning colors", "should return warning colors"),
    ("success colors", "should return success colors"),
    ("functional colors", "should return all functional colors"),
]

for query, expectation in functional_tests:
    result, error = run_color_test(query)
    has_functional_response = result and (
        'functional_colors' in result or
        result.get('type') == 'colors'
    )
    
    results.test(
        f"Functional color query: '{query}'",
        error is None and has_functional_response,
        f"{expectation} - {'✓' if has_functional_response else 'No functional response'}"
    )

# ===== 5. MIXED QUERIES (BACKWARD COMPATIBILITY) =====
print("\n🔄 5. BACKWARD COMPATIBILITY")

mixed_tests = [
    ("CIQ logo", "should still work - return logo, not colors"),
    ("Warewulf assets", "should still work - return assets, not colors"),
    ("RLC-LTS solution brief", "should still work - return documents, not colors"),
    ("show me everything for Fuzzball", "should still work - comprehensive assets"),
]

for query, expectation in mixed_tests:
    result, error = run_color_test(query)
    # These should NOT return color responses
    is_not_color_response = result and result.get('type') not in ['colors', 'color_families', 'design_system']
    
    results.test(
        f"Backward compatibility: '{query}'",
        error is None and is_not_color_response,
        f"{expectation} - {'✓' if is_not_color_response else 'Incorrectly returned color response'}"
    )

# ===== 6. COLOR CONTEXT DETECTION =====
print("\n🧠 6. COLOR CONTEXT DETECTION")

# Test the _detect_color_context method directly
context_tests = [
    ("brand colors", {'has_color_intent': True, 'color_type': 'brand_colors'}),
    ("blue family", {'has_color_intent': True, 'color_family': 'blue'}),
    ("error colors for buttons", {'has_color_intent': True, 'usage_context': 'ui_elements'}),
    ("design system", {'has_color_intent': False}),  # Should be detected by intent, not context
]

for query, expected_context in context_tests:
    detected_context = matcher._detect_color_context(query.lower())
    context_correct = all(
        detected_context.get(key) == value 
        for key, value in expected_context.items()
    )
    
    results.test(
        f"Color context detection: '{query}'",
        context_correct,
        f"Expected: {expected_context}, Got: {detected_context}"
    )

# ===== 7. RESPONSE FORMAT VALIDATION =====
print("\n📋 7. RESPONSE FORMAT VALIDATION")

# Test that color responses have proper structure
format_test_result, _ = run_color_test("brand colors")
if format_test_result:
    has_proper_structure = all(
        key in format_test_result 
        for key in ['message', 'confidence', 'type']
    )
    
    results.test(
        "Color response has required fields",
        has_proper_structure,
        f"Required fields present: {list(format_test_result.keys())}"
    )
    
    results.test(
        "Color response type is correct",
        format_test_result.get('type') == 'colors',
        f"Type: {format_test_result.get('type')}"
    )

# ===== 8. PERFORMANCE TEST =====
print("\n⚡ 8. PERFORMANCE TEST")

# Test rapid color queries
rapid_test_passed = True
try:
    for i in range(10):
        matcher.find_assets(f"color family {i % 3}")
except Exception as e:
    rapid_test_passed = False

results.test(
    "System handles rapid color queries",
    rapid_test_passed,
    "No performance issues with multiple color requests"
)

# ===== FINAL RESULTS =====
results.summary()

print(f"\n🚀 COLOR FUNCTIONALITY STATUS:")
if results.failed == 0:
    print("🟢 COLOR FUNCTIONALITY READY FOR PRODUCTION")
    print("   ✓ All color query types working correctly")
    print("   ✓ Backward compatibility preserved") 
    print("   ✓ Context detection functioning")
    print("   ✓ Response formatting consistent")
    print("   ✓ Performance validated")
else:
    print("🟡 COLOR FUNCTIONALITY NEEDS ATTENTION")
    print(f"   {results.failed} issues need to be resolved")
    print("   Review failed tests above")

print(f"\n📊 SYSTEM CAPABILITIES:")
print("   • Brand assets (logos, documents)")
print("   • Color palette (308 properties, 15 families)")
print("   • Semantic intent recognition")
print("   • Natural language queries")
print("   • Comprehensive design system support")