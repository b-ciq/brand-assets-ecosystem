#!/usr/bin/env python3
"""
Process color-dark.css file to extract color palette information
"""
import re
import json
from typing import Dict, List, Any

def parse_css_colors(css_content: str) -> Dict[str, Any]:
    """Parse CSS color variables from color-dark.css content"""
    colors = {}
    
    # Pattern to match CSS custom properties
    pattern = r'--([^:]+):\s*([^;]+);'
    
    matches = re.findall(pattern, css_content)
    
    for property_name, value in matches:
        # Clean up the property name and value
        prop_clean = property_name.strip()
        val_clean = value.strip()
        
        # Skip if it's referencing another variable (starts with var())
        if val_clean.startswith('var('):
            # Extract the referenced variable
            ref_match = re.search(r'var\(--([^)]+)\)', val_clean)
            if ref_match:
                colors[prop_clean] = {
                    'type': 'reference',
                    'reference': ref_match.group(1),
                    'raw_value': val_clean
                }
        else:
            # Direct color value (hex, rgb, etc.)
            colors[prop_clean] = {
                'type': 'color',
                'value': val_clean,
                'raw_value': val_clean
            }
    
    return colors

def categorize_colors(colors: Dict[str, Any]) -> Dict[str, Any]:
    """Categorize colors by function and type"""
    categories = {
        'semantic': {  # Semantic color tokens (text, bg, etc.)
            'text': {},
            'background': {},
            'border': {},
            'foreground': {},
        },
        'brand': {},      # Brand colors
        'utility': {},    # Utility color palette
        'functional': {   # Functional colors
            'error': {},
            'warning': {},
            'success': {},
        },
        'alpha': {},      # Alpha/transparency values
        'shadows': {},    # Shadow colors
        'uncategorized': {}
    }
    
    for prop_name, color_data in colors.items():
        categorized = False
        
        # Brand colors
        if 'brand' in prop_name:
            categories['brand'][prop_name] = color_data
            categorized = True
        
        # Utility colors
        elif prop_name.startswith('utility-'):
            categories['utility'][prop_name] = color_data
            categorized = True
        
        # Functional colors
        elif any(func in prop_name for func in ['error', 'warning', 'success']):
            for func_type in ['error', 'warning', 'success']:
                if func_type in prop_name:
                    categories['functional'][func_type][prop_name] = color_data
                    categorized = True
                    break
        
        # Alpha/transparency
        elif 'alpha' in prop_name:
            categories['alpha'][prop_name] = color_data
            categorized = True
        
        # Shadows
        elif 'shadow' in prop_name:
            categories['shadows'][prop_name] = color_data
            categorized = True
        
        # Semantic tokens
        elif any(semantic in prop_name for semantic in ['text-', 'bg-', 'border-', 'fg-']):
            if prop_name.startswith('text-'):
                categories['semantic']['text'][prop_name] = color_data
            elif prop_name.startswith('bg-'):
                categories['semantic']['background'][prop_name] = color_data
            elif prop_name.startswith('border-'):
                categories['semantic']['border'][prop_name] = color_data
            elif prop_name.startswith('fg-'):
                categories['semantic']['foreground'][prop_name] = color_data
            categorized = True
        
        # Uncategorized
        if not categorized:
            categories['uncategorized'][prop_name] = color_data
    
    return categories

def extract_color_families(utility_colors: Dict[str, Any]) -> Dict[str, List[str]]:
    """Extract color families from utility colors (brand, gray, blue, etc.)"""
    families = {}
    
    for prop_name, color_data in utility_colors.items():
        # Parse utility color names like "utility-brand-600", "utility-blue-light-400"
        if prop_name.startswith('utility-'):
            parts = prop_name.split('-')[1:]  # Remove 'utility-' prefix
            
            if len(parts) >= 2:
                # Handle compound names like "blue-light", "orange-dark"
                if len(parts) >= 3 and parts[1] in ['light', 'dark']:
                    family_name = f"{parts[0]}-{parts[1]}"
                    shade = parts[2]
                else:
                    family_name = parts[0]
                    shade = parts[1] if len(parts) > 1 else '500'
                
                if family_name not in families:
                    families[family_name] = []
                
                families[family_name].append({
                    'shade': shade,
                    'property': prop_name,
                    'value': color_data.get('value', color_data.get('reference', ''))
                })
    
    # Sort by shade number
    for family in families.values():
        family.sort(key=lambda x: int(re.findall(r'\d+', x['shade'])[0]) if re.findall(r'\d+', x['shade']) else 500)
    
    return families

def create_color_palette_data(css_file_path: str) -> Dict[str, Any]:
    """Create comprehensive color palette data from CSS file"""
    with open(css_file_path, 'r') as f:
        css_content = f.read()
    
    # Parse colors
    colors = parse_css_colors(css_content)
    
    # Categorize
    categorized = categorize_colors(colors)
    
    # Extract color families
    families = extract_color_families(categorized['utility'])
    
    # Create summary
    summary = {
        'total_properties': len(colors),
        'categories': {
            'brand': len(categorized['brand']),
            'utility': len(categorized['utility']),
            'semantic': sum(len(cat) for cat in categorized['semantic'].values()),
            'functional': sum(len(cat) for cat in categorized['functional'].values()),
            'alpha': len(categorized['alpha']),
            'shadows': len(categorized['shadows']),
            'uncategorized': len(categorized['uncategorized'])
        },
        'color_families': list(families.keys()),
        'family_count': len(families)
    }
    
    return {
        'summary': summary,
        'colors': colors,
        'categories': categorized,
        'families': families,
        'source_file': css_file_path
    }

if __name__ == "__main__":
    # Process the color file
    css_path = '/Users/bchristensen/Downloads/color-dark.css'
    color_data = create_color_palette_data(css_path)
    
    # Save to colors directory
    colors_dir = '/Users/bchristensen/Documents/GitHub/brand-assets/assets/global/colors'
    import os
    os.makedirs(colors_dir, exist_ok=True)
    
    with open(f'{colors_dir}/color-palette-dark.json', 'w') as f:
        json.dump(color_data, f, indent=2)
    
    print(f"✅ Processed {color_data['summary']['total_properties']} color properties")
    print(f"✅ Found {color_data['summary']['family_count']} color families: {', '.join(color_data['summary']['color_families'])}")
    print(f"✅ Saved to {colors_dir}/color-palette-dark.json")