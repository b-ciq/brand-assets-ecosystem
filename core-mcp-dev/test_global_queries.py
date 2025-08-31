#!/usr/bin/env python3
"""
Test global queries across all products
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

def test_global_query(query_text):
    """Test global queries that don't specify a product"""
    print(f"\n🧪 Testing: '{query_text}'")
    print("=" * 50)
    
    # Parse the request first
    parsed = matcher._parse_request(query_text)
    print(f"Detected product: {parsed['product']}")
    print(f"Primary intent: {parsed['primary_intent']}")
    
    try:
        result = matcher.find_assets(query_text)
        print(f"Message: {result.get('message', 'No message')}")
        return result
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

print("🚀 Testing Global Cross-Product Queries")
print("=" * 60)

# Test global queries
test_global_query("give me all the solution briefs")
test_global_query("show me all available documents")  
test_global_query("what solution briefs do you have?")
test_global_query("list all docs")