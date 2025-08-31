#!/usr/bin/env python3
"""
Test full asset matching with the semantic system
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

# Create matcher instance
matcher = SemanticAssetMatcher()

def test_full_query(query_text):
    """Test a complete query end-to-end"""
    print(f"\n🧪 Full test: '{query_text}'")
    print("=" * 60)
    
    try:
        result = matcher.find_assets(query_text)
        
        # Show key response fields
        print(f"Message: {result.get('message', 'No message')}")
        print(f"Confidence: {result.get('confidence', 'unknown')}")
        
        # Show assets if present
        if 'documents' in result:
            print(f"\nDocuments found: {len(result['documents'].get('assets', []))}")
            for doc in result['documents'].get('assets', [])[:2]:  # Show first 2
                print(f"  - {doc['filename']} ({doc['doc_type']})")
        
        if 'logos' in result:
            logo_count = result['logos'].get('count', len(result.get('logos', [])))
            print(f"\nLogos found: {logo_count}")
        
        if 'summary' in result:
            print(f"\nSummary: {result['summary']}")
            
        return True
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

print("🚀 Testing Full Asset Matching")
print("=" * 60)

# Test the key scenarios
success_count = 0
total_tests = 0

test_cases = [
    "show me everything for RLC-LTS",
    "RLC-LTS solution brief", 
    "I need Rocky Linux LTS docs",
    "RLC-LTS logo for dark backgrounds",
    "any Warewulf materials?"
]

for query in test_cases:
    total_tests += 1
    if test_full_query(query):
        success_count += 1

print(f"\n🏁 Results: {success_count}/{total_tests} tests passed")