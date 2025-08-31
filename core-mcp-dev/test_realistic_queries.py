#!/usr/bin/env python3
"""
Test realistic query variations that users might actually try
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

def test_query_variation(query_text, expected_behavior):
    """Test a query and show key results"""
    print(f"\n🧪 '{query_text}'")
    print(f"Expected: {expected_behavior}")
    print("-" * 60)
    
    try:
        result = matcher.find_assets(query_text)
        
        # Show key response info
        message = result.get('message', 'No message')[:100] + "..." if len(result.get('message', '')) > 100 else result.get('message', 'No message')
        print(f"Response: {message}")
        print(f"Confidence: {result.get('confidence', 'unknown')}")
        
        # Count results
        total_docs = 0
        total_logos = 0
        
        if 'documents' in result:
            if isinstance(result['documents'], dict):
                total_docs = result['documents'].get('count', 0)
            elif isinstance(result['documents'], list):
                total_docs = len(result['documents'])
        
        if 'logos' in result:
            if isinstance(result['logos'], dict):
                total_logos = result['logos'].get('count', 0)
            elif isinstance(result['logos'], list):
                total_logos = len(result['logos'])
        
        if 'by_product' in result:
            total_products = len(result['by_product'])
            total_assets = result.get('total_count', 0)
            print(f"Global: {total_assets} assets across {total_products} products")
        else:
            print(f"Assets: {total_docs} docs, {total_logos} logos")
        
        return "✅ Success"
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return "❌ Failed"

print("🚀 Testing Realistic User Query Variations")
print("=" * 80)

# Global document queries
print("\n📄 GLOBAL DOCUMENT QUERIES")
test_query_variation("give me all the solution briefs", "Show all solution briefs across products")
test_query_variation("what solution briefs do you have?", "List all solution briefs available")
test_query_variation("show me all solution briefs", "Display all solution briefs")
test_query_variation("do you have any solution briefs?", "Check for solution brief availability")
test_query_variation("list all solution briefs", "Enumerate all solution briefs")
test_query_variation("I need all your solution briefs", "Provide all solution briefs")

# Global document variations
print("\n📋 DOCUMENT VARIATIONS")
test_query_variation("show me all docs", "Show all documents globally")
test_query_variation("what documents are available?", "List available documents")
test_query_variation("give me all the documentation", "Provide all documentation")
test_query_variation("show me all PDFs", "List all PDF documents")
test_query_variation("what materials do you have?", "Show available materials")
test_query_variation("list all sales materials", "Show sales-focused documents")

# Product-specific queries
print("\n🎯 PRODUCT-SPECIFIC QUERIES")  
test_query_variation("RLC-LTS solution brief", "Find RLC-LTS solution brief")
test_query_variation("Rocky Linux LTS documentation", "Find RLC-LTS docs")
test_query_variation("I need the RLC LTS brief", "Get RLC-LTS brief")
test_query_variation("Warewulf solution brief", "Find Warewulf brief (none exists)")
test_query_variation("Fuzzball docs", "Find Fuzzball documentation")
test_query_variation("CIQ solution brief", "Find CIQ solution brief")

# Comprehensive queries
print("\n🔍 COMPREHENSIVE QUERIES")
test_query_variation("show me everything for RLC-LTS", "All RLC-LTS assets")
test_query_variation("what do you have for Warewulf?", "All Warewulf assets")  
test_query_variation("RLC-LTS materials", "All RLC-LTS materials")
test_query_variation("give me all Fuzzball assets", "All Fuzzball assets")

# Logo-specific queries (should still work)
print("\n🎨 LOGO QUERIES")
test_query_variation("RLC-LTS logo for dark backgrounds", "RLC-LTS dark logo")
test_query_variation("Warewulf horizontal logo", "Warewulf horizontal layout")
test_query_variation("CIQ green logo", "CIQ green variant")
test_query_variation("Apptainer icon", "Apptainer icon/symbol")

# Edge cases and unclear queries
print("\n🤔 EDGE CASES")
test_query_variation("solution brief", "Generic brief query - unclear")
test_query_variation("documentation", "Generic doc query - unclear")
test_query_variation("show me assets", "Very generic query")
test_query_variation("what do you have?", "Extremely generic query")
test_query_variation("RLC brief", "Ambiguous RLC query")

print(f"\n🏁 All query variations tested!")