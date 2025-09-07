#!/usr/bin/env python3
"""
Smart Search Integration for Brand Assets MCP Server
Provides intelligent query analysis and URL generation for both generic and specific asset searches
"""

import re
from typing import Dict, Any, List, Optional, Tuple
from urllib.parse import urlencode


class SmartSearchEngine:
    """Engine for analyzing user queries and generating appropriate URLs"""
    
    def __init__(self):
        # Query intent classification patterns
        self.intent_patterns = {
            'specific_asset': [
                r'i need a? (.+?) (logo|icon) (in|as) (\w+)',
                r'i need a? (.+?) (logo|icon) for (.+?) (background|theme)',
                r'get me the (.+?) (logo|icon) in (\w+) (\w+)',
                r'find a (.+?) (\w+) (logo|icon) for (.+)',
                r'(.+?) (logo|icon) (\w+) (\w+) mode'
            ],
            'generic_search': [
                r'(.+?) (logos|icons|assets)',
                r'show me (.+?) (stuff|materials|assets)',
                r'what (.+?) (do you have|are available)',
                r'find (.+?) (brand|product) (assets|materials)'
            ],
            'browse_category': [
                r'all (.+?) (logos|icons|assets)',
                r'everything for (.+)',
                r'complete (.+?) (set|package|collection)'
            ]
        }
        
        # Parameter extraction patterns
        self.param_patterns = {
            'product': {
                'ciq': ['ciq', 'company', 'brand', 'main'],
                'fuzzball': ['fuzzball', 'fuzz ball', 'fuzz', 'fuz', 'workload', 'hpc'],
                'warewulf': ['warewulf', 'ware', 'war', 'cluster', 'provisioning'],
                'apptainer': ['apptainer', 'app', 'container', 'scientific'],
                'ascender': ['ascender', 'asc', 'automation', 'ansible'],
                'bridge': ['bridge', 'bri', 'centos', 'migration'],
                'support': ['support', 'sup', 'ciq support'],
                'rlc': ['rlc', 'rocky linux commercial', 'rocky linux'],
                'rlc-ai': ['rlc-ai', 'rlc ai', 'rocky linux ai'],
                'rlc-hardened': ['rlc-hardened', 'rlc hardened', 'rocky linux hardened', 'rlc', 'rocky linux commercial', 'rock', 'rocky', 'rocky linux', 'roc'],
                'rlc-lts': ['rlc-lts', 'rlc lts', 'rocky linux lts', 'long term support', 'lts']
            },
            'format': {
                'svg': ['svg', 'vector'],
                'png': ['png', 'raster', 'bitmap'],
                'pdf': ['pdf', 'document']
            },
            'theme': {
                'light': ['light', 'white', 'light background', 'light mode'],
                'dark': ['dark', 'black', 'dark background', 'dark mode', 'dark theme']
            },
            'layout': {
                'icon': ['symbol', 'icon', 'favicon', 'app icon', 'square'],
                'horizontal': ['horizontal', 'wide', 'header', 'lockup'],
                'vertical': ['vertical', 'tall', 'stacked'],
                'onecolor': ['1-color', '1 color', 'one color', 'onecolor'],
                'twocolor': ['2-color', '2 color', 'two color', 'twocolor'],
                'green': ['green', 'accent']
            },
            'size': {
                'small': ['small', 'tiny', 'thumbnail'],
                'medium': ['medium', 'normal', 'standard'],
                'large': ['large', 'big', 'high-res', 'high resolution']
            }
        }
        
        # Confidence thresholds for different actions
        self.confidence_thresholds = {
            'direct_modal': 0.8,     # High confidence = direct modal URL
            'filtered_search': 0.5,  # Medium confidence = search with filters
            'generic_search': 0.3    # Low confidence = basic search
        }
    
    def analyze_query(self, query: str) -> Dict[str, Any]:
        """
        Analyze user query and extract intent, parameters, and confidence
        
        Returns:
        {
            'intent': 'specific_asset' | 'generic_search' | 'browse_category',
            'confidence': 0.0-1.0,
            'parameters': {
                'product': str | None,
                'format': str | None,
                'theme': str | None,
                'layout': str | None,
                'size': str | None
            },
            'action': 'direct_modal' | 'filtered_search' | 'generic_search',
            'url': str,
            'explanation': str
        }
        """
        query_lower = query.lower().strip()
        
        # Classify intent
        intent = self._classify_intent(query_lower)
        
        # Extract parameters
        parameters = self._extract_parameters(query_lower)
        
        # Calculate confidence based on specificity
        confidence = self._calculate_confidence(intent, parameters, query_lower)
        
        # Determine action based on confidence
        action = self._determine_action(confidence, parameters)
        
        # Generate appropriate URL
        url = self._generate_url(action, parameters, query_lower)
        
        # Generate explanation
        explanation = self._generate_explanation(intent, action, parameters, confidence)
        
        return {
            'intent': intent,
            'confidence': confidence,
            'parameters': parameters,
            'action': action,
            'url': url,
            'explanation': explanation,
            'raw_query': query
        }
    
    def _classify_intent(self, query: str) -> str:
        """Classify the query intent based on patterns"""
        
        # Check for specific asset patterns (highest priority)
        for pattern in self.intent_patterns['specific_asset']:
            if re.search(pattern, query, re.IGNORECASE):
                return 'specific_asset'
        
        # Check for browse category patterns
        for pattern in self.intent_patterns['browse_category']:
            if re.search(pattern, query, re.IGNORECASE):
                return 'browse_category'
        
        # Check for generic search patterns  
        for pattern in self.intent_patterns['generic_search']:
            if re.search(pattern, query, re.IGNORECASE):
                return 'generic_search'
        
        # Default to generic search
        return 'generic_search'
    
    def _extract_parameters(self, query: str) -> Dict[str, Optional[str]]:
        """Extract specific parameters from the query"""
        parameters = {
            'product': None,
            'format': None,
            'theme': None,
            'layout': None,
            'size': None
        }
        
        # Extract each parameter type
        for param_type, param_map in self.param_patterns.items():
            best_match = None
            best_score = 0
            
            for param_value, patterns in param_map.items():
                for pattern in patterns:
                    if pattern in query:
                        # Score based on pattern length (longer = more specific)
                        score = len(pattern)
                        if score > best_score:
                            best_score = score
                            best_match = param_value
            
            parameters[param_type] = best_match
        
        return parameters
    
    def _calculate_confidence(self, intent: str, parameters: Dict[str, Optional[str]], query: str) -> float:
        """Calculate confidence score based on intent and parameter extraction"""
        base_confidence = 0.3
        
        # Intent-based confidence
        if intent == 'specific_asset':
            base_confidence = 0.7
        elif intent == 'browse_category':
            base_confidence = 0.6
        else:  # generic_search
            base_confidence = 0.4
        
        # Parameter-based confidence boost
        param_count = sum(1 for v in parameters.values() if v is not None)
        confidence_boost = param_count * 0.1
        
        # Special combinations give extra confidence
        if parameters['product'] and parameters['format']:
            confidence_boost += 0.1
        if parameters['product'] and parameters['theme']:
            confidence_boost += 0.15
        if parameters['layout'] and parameters['theme']:
            confidence_boost += 0.1
        
        # High-specificity queries get maximum confidence
        specific_phrases = [
            'i need', 'get me', 'find me', 'download',
            'png', 'svg', 'dark mode', 'light mode'
        ]
        specificity_bonus = sum(0.05 for phrase in specific_phrases if phrase in query)
        
        final_confidence = min(base_confidence + confidence_boost + specificity_bonus, 1.0)
        return round(final_confidence, 2)
    
    def _determine_action(self, confidence: float, parameters: Dict[str, Optional[str]]) -> str:
        """Determine the appropriate action based on confidence and parameters"""
        
        # High confidence with specific parameters = direct modal
        if (confidence >= self.confidence_thresholds['direct_modal'] and 
            parameters['product'] and 
            (parameters['theme'] or parameters['format'] or parameters['layout'])):
            return 'direct_modal'
        
        # Medium confidence with some parameters = filtered search
        elif (confidence >= self.confidence_thresholds['filtered_search'] and 
              parameters['product']):
            return 'filtered_search'
        
        # Low confidence or no specific product = generic search
        else:
            return 'generic_search'
    
    def _generate_url(self, action: str, parameters: Dict[str, Optional[str]], query: str) -> str:
        """Generate the appropriate URL based on action and parameters"""
        # Use environment variable or default to localhost for development
        import os
        base_url = os.getenv('WEB_GUI_URL', 'http://localhost:3003')
        
        if action == 'direct_modal':
            return self._generate_modal_url(base_url, parameters)
        elif action == 'filtered_search':
            return self._generate_search_url(base_url, parameters, query)
        else:  # generic_search
            return self._generate_generic_url(base_url, query)
    
    def _generate_modal_url(self, base_url: str, parameters: Dict[str, Optional[str]]) -> str:
        """Generate URL that opens directly to a specific asset modal"""
        
        # Build asset identifier from parameters
        product = parameters.get('product', '')
        layout = parameters.get('layout') or 'horizontal'  # Default layout
        theme = parameters.get('theme') or 'light'  # Default theme
        
        # Create asset ID pattern (this should match your actual asset naming)
        asset_id = f"{product}-{layout}-{theme}"
        
        # Build modal URL with query parameters
        params = {
            'modal': asset_id,
        }
        
        # Add additional configuration parameters
        if parameters.get('format'):
            params['format'] = parameters['format']
        if parameters.get('size'):
            params['size'] = parameters['size']
        
        query_string = urlencode(params)
        return f"{base_url}/?{query_string}"
    
    def _generate_search_url(self, base_url: str, parameters: Dict[str, Optional[str]], query: str) -> str:
        """Generate URL for filtered search results"""
        
        params = {}
        
        # Add search query
        if parameters.get('product'):
            params['query'] = parameters['product']
        else:
            # Extract key terms from original query
            key_terms = self._extract_search_terms(query)
            if key_terms:
                params['query'] = ' '.join(key_terms)
        
        # Add filters
        if parameters.get('format'):
            params['fileType'] = parameters['format'].upper()
        
        # Add asset type filter based on what user is looking for
        if any(term in query.lower() for term in ['logo', 'icon']):
            params['assetType'] = 'logo'
        elif any(term in query.lower() for term in ['document', 'pdf', 'brief']):
            params['assetType'] = 'document'
        
        query_string = urlencode(params)
        return f"{base_url}/?{query_string}"
    
    def _generate_generic_url(self, base_url: str, query: str) -> str:
        """Generate URL for basic search"""
        
        # Extract meaningful search terms
        search_terms = self._extract_search_terms(query)
        
        if search_terms:
            params = {'query': ' '.join(search_terms)}
            query_string = urlencode(params)
            return f"{base_url}/?{query_string}"
        
        # Fallback to home page
        return base_url
    
    def _extract_search_terms(self, query: str) -> List[str]:
        """Extract meaningful search terms from query"""
        
        # Remove common stop words and filler
        stop_words = {
            'i', 'need', 'want', 'get', 'find', 'show', 'me', 'the', 'a', 'an',
            'for', 'in', 'on', 'with', 'of', 'and', 'or', 'but', 'can', 'you',
            'do', 'have', 'are', 'available', 'please', 'help', 'looking'
        }
        
        # Extract words, convert to lowercase
        words = re.findall(r'\b\w+\b', query.lower())
        
        # Filter out stop words and keep meaningful terms
        meaningful_terms = []
        for word in words:
            if word not in stop_words and len(word) > 2:
                meaningful_terms.append(word)
        
        return meaningful_terms[:3]  # Limit to top 3 terms
    
    def _generate_explanation(self, intent: str, action: str, parameters: Dict[str, Optional[str]], confidence: float) -> str:
        """Generate human-readable explanation of the analysis"""
        
        explanations = []
        
        # Intent explanation
        intent_msgs = {
            'specific_asset': 'This looks like a request for a specific asset',
            'browse_category': 'This looks like a request to browse a category',
            'generic_search': 'This looks like a general search request'
        }
        explanations.append(intent_msgs.get(intent, 'General query'))
        
        # Parameter extraction
        found_params = [k for k, v in parameters.items() if v is not None]
        if found_params:
            param_str = ', '.join([f"{k}={v}" for k, v in parameters.items() if v is not None])
            explanations.append(f"Detected parameters: {param_str}")
        
        # Action explanation
        action_msgs = {
            'direct_modal': 'Opening specific asset modal with pre-configured options',
            'filtered_search': 'Showing filtered search results based on your criteria',
            'generic_search': 'Performing broad search across all assets'
        }
        explanations.append(action_msgs.get(action, 'Basic search'))
        
        # Confidence note
        if confidence >= 0.8:
            explanations.append("High confidence - directing you to exactly what you need")
        elif confidence >= 0.5:
            explanations.append("Medium confidence - showing relevant filtered results")
        else:
            explanations.append("Lower confidence - showing broad search results")
        
        return '. '.join(explanations) + '.'


def test_smart_search():
    """Test the smart search engine with example queries"""
    engine = SmartSearchEngine()
    
    test_queries = [
        "I need a fuzzball icon in PNG dark mode",
        "Get me the CIQ logo in SVG for light backgrounds", 
        "Find warewulf logos",
        "Show me RLC assets",
        "All apptainer materials",
        "CIQ product icons"
    ]
    
    print("=== Smart Search Engine Test ===\n")
    
    for query in test_queries:
        result = engine.analyze_query(query)
        print(f"Query: '{query}'")
        print(f"  Intent: {result['intent']}")
        print(f"  Action: {result['action']}")
        print(f"  Confidence: {result['confidence']}")
        print(f"  Parameters: {result['parameters']}")
        print(f"  URL: {result['url']}")
        print(f"  Explanation: {result['explanation']}")
        print()


if __name__ == "__main__":
    test_smart_search()