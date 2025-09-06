#!/usr/bin/env python3
"""
Comprehensive test suite for Smart Search MCP integration
Tests all components without requiring FastMCP server to be running
"""

import json
import sys
import os
from smart_search import SmartSearchEngine

def test_smart_search_engine():
    """Test the core smart search engine functionality"""
    print("=== Testing Smart Search Engine ===\n")
    
    engine = SmartSearchEngine()
    
    test_cases = [
        {
            'query': 'I need a fuzzball icon in PNG dark mode',
            'expected_action': 'direct_modal',
            'expected_confidence': 1.0,
            'description': 'High-specificity request should generate direct modal'
        },
        {
            'query': 'Find warewulf logos',
            'expected_action': 'filtered_search',
            'expected_confidence': 0.5,
            'description': 'Medium-specificity request should generate filtered search'
        },
        {
            'query': 'Show me assets',
            'expected_action': 'generic_search',
            'expected_confidence': 0.3,
            'description': 'Low-specificity request should generate generic search'
        },
        {
            'query': 'CIQ horizontal logo for light backgrounds in SVG',
            'expected_action': 'direct_modal',
            'expected_confidence': 1.0,
            'description': 'Complete specification should generate direct modal'
        }
    ]
    
    passed = 0
    total = len(test_cases)
    
    for i, test in enumerate(test_cases, 1):
        print(f"{i}. {test['description']}")
        print(f"   Query: '{test['query']}'")
        
        try:
            result = engine.analyze_query(test['query'])
            
            # Check action
            if result['action'] == test['expected_action']:
                print(f"   ✅ Action: {result['action']} (expected)")
            else:
                print(f"   ❌ Action: {result['action']} (expected {test['expected_action']})")
            
            # Check confidence (allow some tolerance)
            confidence_diff = abs(result['confidence'] - test['expected_confidence'])
            if confidence_diff <= 0.2:
                print(f"   ✅ Confidence: {result['confidence']} (within range)")
            else:
                print(f"   ❌ Confidence: {result['confidence']} (expected ~{test['expected_confidence']})")
            
            print(f"   📍 URL: {result['url']}")
            print(f"   🎯 Parameters: {result['parameters']}")
            
            if (result['action'] == test['expected_action'] and confidence_diff <= 0.2):
                passed += 1
                print(f"   🎉 PASS")
            else:
                print(f"   💥 FAIL")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
        
        print()
    
    print(f"Smart Search Engine: {passed}/{total} tests passed\n")
    return passed == total

def test_url_generation_patterns():
    """Test URL generation patterns"""
    print("=== Testing URL Generation Patterns ===\n")
    
    engine = SmartSearchEngine()
    
    url_tests = [
        {
            'query': 'fuzzball icon dark PNG',
            'should_contain': ['modal=fuzzball-icon-dark', 'format=png'],
            'description': 'Direct modal URL should contain asset ID and format'
        },
        {
            'query': 'warewulf logos',
            'should_contain': ['query=warewulf', 'assetType=logo'],
            'description': 'Filtered search should include query and asset type filters'
        },
        {
            'query': 'show me stuff',
            'should_contain': ['localhost:3002'],
            'description': 'Generic search should at least contain base URL'
        }
    ]
    
    passed = 0
    total = len(url_tests)
    
    for i, test in enumerate(url_tests, 1):
        print(f"{i}. {test['description']}")
        print(f"   Query: '{test['query']}'")
        
        try:
            result = engine.analyze_query(test['query'])
            url = result['url']
            print(f"   Generated URL: {url}")
            
            all_found = True
            for pattern in test['should_contain']:
                if pattern in url:
                    print(f"   ✅ Contains: '{pattern}'")
                else:
                    print(f"   ❌ Missing: '{pattern}'")
                    all_found = False
            
            if all_found:
                passed += 1
                print(f"   🎉 PASS")
            else:
                print(f"   💥 FAIL")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
        
        print()
    
    print(f"URL Generation: {passed}/{total} tests passed\n")
    return passed == total

def test_parameter_extraction():
    """Test parameter extraction accuracy"""
    print("=== Testing Parameter Extraction ===\n")
    
    engine = SmartSearchEngine()
    
    param_tests = [
        {
            'query': 'I need a CIQ twocolor logo for dark backgrounds in SVG format',
            'expected': {
                'product': 'ciq',
                'layout': 'twocolor', 
                'theme': 'dark',
                'format': 'svg'
            },
            'description': 'Complex query with all major parameters'
        },
        {
            'query': 'fuzzball horizontal icon',
            'expected': {
                'product': 'fuzzball',
                'layout': 'horizontal'
            },
            'description': 'Simple product and layout extraction'
        },
        {
            'query': 'warewulf PNG light mode',
            'expected': {
                'product': 'warewulf',
                'format': 'png',
                'theme': 'light'
            },
            'description': 'Product, format, and theme extraction'
        }
    ]
    
    passed = 0
    total = len(param_tests)
    
    for i, test in enumerate(param_tests, 1):
        print(f"{i}. {test['description']}")
        print(f"   Query: '{test['query']}'")
        
        try:
            result = engine.analyze_query(test['query'])
            params = result['parameters']
            
            all_correct = True
            for expected_key, expected_value in test['expected'].items():
                actual_value = params.get(expected_key)
                if actual_value == expected_value:
                    print(f"   ✅ {expected_key}: '{actual_value}' (correct)")
                else:
                    print(f"   ❌ {expected_key}: '{actual_value}' (expected '{expected_value}')")
                    all_correct = False
            
            # Check for unexpected parameters
            for key, value in params.items():
                if value is not None and key not in test['expected']:
                    print(f"   ℹ️  Extra: {key}='{value}'")
            
            if all_correct:
                passed += 1
                print(f"   🎉 PASS")
            else:
                print(f"   💥 FAIL")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
        
        print()
    
    print(f"Parameter Extraction: {passed}/{total} tests passed\n")
    return passed == total

def test_confidence_calculation():
    """Test confidence score calculation logic"""
    print("=== Testing Confidence Calculation ===\n")
    
    engine = SmartSearchEngine()
    
    confidence_tests = [
        {
            'query': 'I need the fuzzball horizontal logo in PNG format for dark backgrounds',
            'min_confidence': 0.9,
            'description': 'Very specific query should have very high confidence'
        },
        {
            'query': 'warewulf logo',
            'min_confidence': 0.4,
            'max_confidence': 0.7,
            'description': 'Moderately specific query should have medium confidence'
        },
        {
            'query': 'show me stuff',
            'max_confidence': 0.4,
            'description': 'Vague query should have low confidence'
        }
    ]
    
    passed = 0
    total = len(confidence_tests)
    
    for i, test in enumerate(confidence_tests, 1):
        print(f"{i}. {test['description']}")
        print(f"   Query: '{test['query']}'")
        
        try:
            result = engine.analyze_query(test['query'])
            confidence = result['confidence']
            
            passed_test = True
            
            if 'min_confidence' in test:
                if confidence >= test['min_confidence']:
                    print(f"   ✅ Confidence {confidence} >= {test['min_confidence']} (minimum met)")
                else:
                    print(f"   ❌ Confidence {confidence} < {test['min_confidence']} (minimum not met)")
                    passed_test = False
            
            if 'max_confidence' in test:
                if confidence <= test['max_confidence']:
                    print(f"   ✅ Confidence {confidence} <= {test['max_confidence']} (maximum not exceeded)")
                else:
                    print(f"   ❌ Confidence {confidence} > {test['max_confidence']} (maximum exceeded)")
                    passed_test = False
            
            if 'min_confidence' in test and 'max_confidence' in test:
                if test['min_confidence'] <= confidence <= test['max_confidence']:
                    print(f"   ✅ Confidence {confidence} in range [{test['min_confidence']}, {test['max_confidence']}]")
                else:
                    print(f"   ❌ Confidence {confidence} outside range")
                    passed_test = False
            
            if passed_test:
                passed += 1
                print(f"   🎉 PASS")
            else:
                print(f"   💥 FAIL")
                
        except Exception as e:
            print(f"   ❌ ERROR: {e}")
        
        print()
    
    print(f"Confidence Calculation: {passed}/{total} tests passed\n")
    return passed == total

def main():
    """Run all tests"""
    print("🚀 Starting Comprehensive Smart Search Test Suite\n")
    
    test_results = []
    
    # Run all test suites
    test_results.append(test_smart_search_engine())
    test_results.append(test_url_generation_patterns())
    test_results.append(test_parameter_extraction())
    test_results.append(test_confidence_calculation())
    
    # Summary
    passed_suites = sum(test_results)
    total_suites = len(test_results)
    
    print("=" * 50)
    print("🏁 TEST SUITE SUMMARY")
    print("=" * 50)
    print(f"Test Suites Passed: {passed_suites}/{total_suites}")
    
    if passed_suites == total_suites:
        print("🎉 ALL TESTS PASSED! Smart Search system is ready for production.")
        return 0
    else:
        print("💥 SOME TESTS FAILED. Please review and fix issues before deploying.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)