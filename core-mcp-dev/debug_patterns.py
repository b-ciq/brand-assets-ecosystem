#!/usr/bin/env python3
"""
Debug pattern matching
"""
import sys
import os
sys.path.append(os.path.dirname(__file__))

from server import SemanticAssetMatcher

matcher = SemanticAssetMatcher()

def debug_patterns(query):
    request_lower = query.lower()
    print(f"\n🔍 Debug: '{query}'")
    print("-" * 30)
    
    # Check what patterns match
    all_matches = []
    for prod, patterns in matcher.product_patterns.items():
        for pattern in patterns:
            if pattern in request_lower:
                print(f"  {prod}: '{pattern}' matches")
                all_matches.append((prod, pattern))
    
    print(f"Total matches: {len(all_matches)}")

debug_patterns("RLC solution brief")
debug_patterns("RLC-LTS solution brief")