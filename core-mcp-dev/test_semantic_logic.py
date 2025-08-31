#!/usr/bin/env python3
"""
Test the semantic asset matching logic locally
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from server import SemanticAssetMatcher
import json

# Load test metadata
with open('metadata/asset-inventory.json', 'r') as f:
    test_asset_data = json.load(f)

# Create matcher instance
matcher = SemanticAssetMatcher()

def test_query(query_text, expected_intent=None):
    """Test a query and show results"""
    print(f"\n🧪 Testing: '{query_text}'")
    print("=" * 50)
    
    # Parse the request
    parsed = matcher._parse_request(query_text)
    
    print(f"Detected product: {parsed['product']}")
    print(f"Primary intent: {parsed['primary_intent']}")
    print(f"Confidence: {parsed['confidence']:.2f}")
    
    # Show intent scores
    print("\nIntent scores:")
    for intent, data in parsed['intent_scores'].items():
        if data['score'] > 0:
            print(f"  {intent}: {data['score']:.2f} (patterns: {data['patterns']})")
    
    if expected_intent:
        result = "✅" if parsed['primary_intent'] == expected_intent else "❌"
        print(f"\nExpected intent: {expected_intent} {result}")
    
    return parsed

# Test cases
print("🚀 Testing Semantic Asset Matching Logic")
print("=" * 60)

# Test comprehensive requests
test_query("show me everything for RLC-LTS", "all_assets")
test_query("RLC-LTS complete set", "all_assets")

# Test document requests  
test_query("RLC-LTS solution brief", "sales_materials")
test_query("I need Rocky Linux LTS docs", "documents")
test_query("any RLC materials available?", "documents")

# Test logo requests (should fall back to legacy or visual_assets)
test_query("RLC-LTS logo for dark backgrounds", None)  # Should be legacy
test_query("RLC-LTS logos", "visual_assets")

# Test edge cases
test_query("CIQ product logos", None)  # Should trigger disambiguation

print(f"\n🏁 Testing complete!")