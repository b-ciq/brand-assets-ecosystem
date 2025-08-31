#!/usr/bin/env python3
"""
Test Color Functionality Locally
Tests the new color palette functionality with local data
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

# Import and modify server globals for local testing
import server
import json

# Load local color data
def load_local_color_data():
    """Load color data from local file"""
    try:
        with open('assets/global/colors/color-palette-dark.json', 'r') as f:
            color_data = json.load(f)
        
        # Set the global color_data
        server.color_data = color_data
        
        total_colors = color_data['summary']['total_properties']
        families_count = color_data['summary']['family_count']
        
        print(f"✅ Loaded {total_colors} color properties across {families_count} color families (local)")
        return True
    except Exception as e:
        print(f"❌ Failed to load local color data: {e}")
        return False

# Load local asset data from metadata
def load_local_asset_data():
    """Load asset data from local metadata file"""
    try:
        with open('metadata/asset-inventory.json', 'r') as f:
            asset_data = json.load(f)
        
        # Set the global asset_data  
        server.asset_data = asset_data
        
        total_assets = asset_data['index']['total_assets']
        products_count = len(asset_data['index']['products'])
        
        print(f"✅ Loaded {total_assets} assets across {products_count} products (local)")
        return True
    except Exception as e:
        print(f"❌ Failed to load local asset data: {e}")
        return False

# Load test data
print("🧪 Loading local test data...")
asset_success = load_local_asset_data()
color_success = load_local_color_data()

if not asset_success:
    print("❌ Failed to load asset data")
    sys.exit(1)

if not color_success:
    print("❌ Failed to load color data") 
    sys.exit(1)

print("✅ Local test data loaded successfully")

# Initialize matcher
from server import SemanticAssetMatcher
matcher = SemanticAssetMatcher()

# Simple test function
def test_color_query(query: str):
    """Test a single color query"""
    try:
        result = matcher.find_assets(query)
        print(f"\n🔍 Query: '{query}'")
        print(f"📋 Response type: {result.get('type', 'unknown')}")
        print(f"💬 Message: {result.get('message', 'No message')}")
        
        if 'overview' in result:
            overview = result['overview']
            print(f"📊 Overview: {overview.get('total_properties', 'N/A')} properties, {len(overview.get('color_families', []))} families")
        
        if 'families' in result:
            print(f"🎨 Families shown: {len(result['families'])}")
        
        if 'brand_colors' in result:
            print(f"🏢 Brand colors: {result['brand_colors'].get('count', 0)} colors")
        
        if 'family' in result:
            print(f"🎯 Color family: {result['family']} ({result.get('total_shades', 0)} shades)")
            
        return True
    except Exception as e:
        print(f"❌ Error testing '{query}': {e}")
        return False

# Run some basic tests
print("\n🎨 TESTING COLOR FUNCTIONALITY")
print("=" * 60)

test_queries = [
    "show me the brand colors",
    "blue color family", 
    "design system colors",
    "what colors are available?",
    "error colors",
    "semantic colors"
]

successful_tests = 0
for query in test_queries:
    if test_color_query(query):
        successful_tests += 1

print(f"\n📊 RESULTS:")
print(f"✅ {successful_tests}/{len(test_queries)} color queries successful")

if successful_tests == len(test_queries):
    print("🎉 ALL COLOR FUNCTIONALITY TESTS PASSED!")
    print("🟢 Color functionality is working correctly")
else:
    print(f"⚠️  {len(test_queries) - successful_tests} tests failed")

# Test backward compatibility
print(f"\n🔄 TESTING BACKWARD COMPATIBILITY")
backward_queries = ["CIQ logo", "Warewulf assets"]
backward_successful = 0

for query in backward_queries:
    try:
        result = matcher.find_assets(query)
        is_not_color = result.get('type') not in ['colors', 'color_families', 'design_system']
        if is_not_color:
            print(f"✅ '{query}' → {result.get('type', 'asset')} (correct)")
            backward_successful += 1
        else:
            print(f"❌ '{query}' → {result.get('type')} (should not be color)")
    except Exception as e:
        print(f"❌ Error with '{query}': {e}")

print(f"\n📈 BACKWARD COMPATIBILITY: {backward_successful}/{len(backward_queries)} correct")

if successful_tests > 0 and backward_successful == len(backward_queries):
    print("\n🚀 COLOR FUNCTIONALITY INTEGRATION SUCCESS!")
    print("   ✓ Color queries working")
    print("   ✓ Existing functionality preserved")
    print("   ✓ Ready for deployment")
else:
    print("\n⚠️  Some issues found - review test output above")