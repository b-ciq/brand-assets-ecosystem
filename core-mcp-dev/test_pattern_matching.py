#!/usr/bin/env python3
"""
Test specific pattern matching edge cases
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from server import SemanticAssetMatcher

matcher = SemanticAssetMatcher()

def test_product_detection(query):
    parsed = matcher._parse_request(query)
    print(f"Query: '{query}' → Product: '{parsed['product']}'")

print("🧪 Testing Product Pattern Matching")
print("=" * 40)

test_product_detection("Rocky Linux LTS docs")
test_product_detection("RLC-LTS solution brief") 
test_product_detection("Rocky Linux Commercial LTS")
test_product_detection("I need LTS documentation")
test_product_detection("Rocky Linux docs")
test_product_detection("RLC documentation")