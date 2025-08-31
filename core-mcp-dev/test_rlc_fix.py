#!/usr/bin/env python3
"""
Test the RLC vs RLC-LTS fix
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

def test_rlc_query(query):
    parsed = matcher._parse_request(query)
    print(f"'{query}' → Product: '{parsed['product']}', Intent: '{parsed['primary_intent']}'")

print("🧪 Testing RLC vs RLC-LTS Priority Fix")
print("=" * 50)

# These should now prefer RLC-LTS for document queries
test_rlc_query("RLC solution brief")
test_rlc_query("RLC documentation") 
test_rlc_query("I need RLC docs")
test_rlc_query("RLC materials")

print("\n--- Non-document queries (should still match RLC) ---")
test_rlc_query("RLC logo")
test_rlc_query("RLC horizontal logo")
test_rlc_query("show me RLC assets")