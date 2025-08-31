#!/usr/bin/env python3
"""Quick local testing for brand assets server"""

import json
from server import AssetMatcher, ResponseFormatter

def test_requests():
    """Test common requests locally"""
    
    # Load metadata
    with open('metadata/asset-inventory.json', 'r') as f:
        data = json.load(f)
    
    matcher = AssetMatcher(data)
    formatter = ResponseFormatter()
    
    test_cases = [
        "CIQ logo",
        "Apptainer logo", 
        "CIQ logo for light background",
        "Fuzzball vertical logo",
        "Bridge logo for dark background",
        "Warewulf icon"
    ]
    
    print("🧪 Testing brand assets server locally...\n")
    
    for i, request in enumerate(test_cases, 1):
        print(f"{'='*50}")
        print(f"Test {i}: '{request}'")
        print(f"{'='*50}")
        
        try:
            # Get the match result
            result = matcher.match_assets(request)
            
            # Format the response
            response = formatter.format_response(result)
            print(response)
            
        except Exception as e:
            print(f"❌ Error: {e}")
        
        print(f"\n{'='*50}\n")

if __name__ == '__main__':
    test_requests()