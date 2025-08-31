#!/usr/bin/env python3
"""
Declarative Asset Metadata Generator
Creates clean, rule-based metadata for scalable asset management
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Any
import argparse
from datetime import datetime

# Base GitHub raw URL for assets
BASE_URL = "https://raw.githubusercontent.com/b-ciq/brand-assets/main"

def parse_filename(filename: str) -> Dict[str, str]:
    """
    Parse consistent filename: {Product}_{type}_{layout}_{color}_{size}.{ext}
    Returns: {product, type, layout, color, size, ext}
    """
    name_without_ext = filename.rsplit('.', 1)[0]
    ext = filename.rsplit('.', 1)[1] if '.' in filename else 'png'
    
    parts = name_without_ext.split('_')
    if len(parts) < 5:
        return None
    
    return {
        'product': parts[0].lower(),
        'type': parts[1], 
        'layout': parts[2],
        'color': parts[3],
        'size': parts[4],
        'ext': ext
    }

def parse_document_filename(filename: str) -> Dict[str, str]:
    """
    Parse document filename: {Product}_{Document_Type}.{ext}
    Returns: {product, doc_type, ext}
    """
    name_without_ext = filename.rsplit('.', 1)[0]
    ext = filename.rsplit('.', 1)[1] if '.' in filename else 'pdf'
    
    parts = name_without_ext.split('_')
    if len(parts) < 2:
        return None
    
    # Join remaining parts as document type (e.g., "Solution_Brief")
    doc_type = '_'.join(parts[1:]).lower().replace('_', ' ')
    
    return {
        'product': parts[0].lower(),
        'doc_type': doc_type,
        'ext': ext
    }

def generate_asset_key(parsed: Dict[str, str]) -> str:
    """Generate consistent asset key"""
    if parsed['layout'] in ['onecolor', 'twocolor', 'green']:
        # CIQ special variants
        return f"{parsed['layout']}_{parsed['color']}"
    elif parsed['layout'] == 'square':
        # Icons
        return f"icon_{parsed['color']}"
    else:
        # Regular logos
        return f"{parsed['layout']}_{parsed['color']}"

def determine_background(color: str) -> str:
    """Determine optimal background for color"""
    if color.lower() == 'black':
        return 'light'  # black logo on light background
    elif color.lower() == 'white': 
        return 'dark'   # white logo on dark background
    else:
        return 'any'    # color logos work on various backgrounds

def get_asset_tags(layout: str, type_: str) -> List[str]:
    """Get semantic tags for asset matching"""
    tags = []
    
    if layout == 'square' or type_ == 'icon':
        tags.extend(['favicon', 'app_icon', 'compact', 'small_space', 'avatar'])
    elif layout == 'horizontal':
        tags.extend(['business_card', 'header', 'email_signature', 'letterhead', 'wide_format'])
    elif layout == 'vertical':
        tags.extend(['mobile', 'social_profile', 'tall_banner', 'poster', 'stacked'])
    elif layout in ['onecolor', 'twocolor', 'green']:
        if layout == 'onecolor':
            tags.extend(['supporting', 'footer', 'watermark', 'minimal', 'professional'])
        elif layout == 'twocolor':
            tags.extend(['hero', 'primary', 'homepage', 'presentation', 'main_branding'])
        elif layout == 'green':
            tags.extend(['accent', 'highlight', 'call_to_action', 'brand_pop'])
    
    return tags

def get_document_tags(doc_type: str) -> List[str]:
    """Get semantic tags for document matching"""
    tags = ['document', 'pdf']
    
    if 'solution brief' in doc_type:
        tags.extend(['sales', 'overview', 'features', 'benefits', 'summary'])
    elif 'datasheet' in doc_type:
        tags.extend(['technical', 'specifications', 'details', 'reference'])
    elif 'white paper' in doc_type or 'whitepaper' in doc_type:
        tags.extend(['research', 'deep_dive', 'analysis', 'thought_leadership'])
    elif 'case study' in doc_type:
        tags.extend(['customer', 'success_story', 'implementation', 'results'])
    elif 'user guide' in doc_type or 'manual' in doc_type:
        tags.extend(['documentation', 'how_to', 'instructions', 'guide'])
    
    return tags

def scan_assets_directory(assets_path: Path) -> Dict[str, Any]:
    """Scan and catalog all assets"""
    assets = {}
    
    # Scan global assets (CIQ)
    global_logos = assets_path / "global" / "logos"
    if global_logos.exists():
        ciq_assets = {}
        for file_path in global_logos.glob("*.png"):
            parsed = parse_filename(file_path.name)
            if parsed:
                key = generate_asset_key(parsed)
                ciq_assets[key] = {
                    "url": f"{BASE_URL}/assets/global/logos/{file_path.name}",
                    "filename": file_path.name,
                    "background": determine_background(parsed['color']),
                    "color": parsed['color'],
                    "layout": parsed['layout'],
                    "type": parsed['type'],
                    "size": parsed['size'],
                    "tags": get_asset_tags(parsed['layout'], parsed['type'])
                }
        if ciq_assets:
            assets['ciq'] = ciq_assets
    
    # Scan product assets
    products_path = assets_path / "products"
    if products_path.exists():
        for product_dir in products_path.iterdir():
            if product_dir.is_dir():
                product_name = product_dir.name
                product_assets = {}
                
                # Scan logos
                logos_path = product_dir / "logos"
                if logos_path.exists():
                    for file_path in logos_path.glob("*.png"):
                        parsed = parse_filename(file_path.name)
                        if parsed:
                            key = generate_asset_key(parsed)
                            product_assets[key] = {
                                "url": f"{BASE_URL}/assets/products/{product_name}/logos/{file_path.name}",
                                "filename": file_path.name,
                                "background": determine_background(parsed['color']),
                                "color": parsed['color'],
                                "layout": "icon" if parsed['layout'] == 'square' else parsed['layout'],
                                "type": parsed['type'],
                                "size": parsed['size'],
                                "tags": get_asset_tags(parsed['layout'], parsed['type'])
                            }
                
                # Scan documents
                documents_path = product_dir / "documents"
                if documents_path.exists():
                    for file_path in documents_path.glob("*.pdf"):
                        parsed = parse_document_filename(file_path.name)
                        if parsed:
                            key = f"doc_{parsed['doc_type'].replace(' ', '_')}"
                            product_assets[key] = {
                                "url": f"{BASE_URL}/assets/products/{product_name}/documents/{file_path.name}",
                                "filename": file_path.name,
                                "type": "document",
                                "doc_type": parsed['doc_type'],
                                "ext": parsed['ext'],
                                "tags": get_document_tags(parsed['doc_type'])
                            }
                
                if product_assets:
                    assets[product_name] = product_assets
    
    return assets

def generate_rules() -> Dict[str, Any]:
    """Generate declarative matching rules"""
    return {
        "use_case_matching": {
            "favicon": {
                "prefer_layout": "icon",
                "prefer_size": "large",
                "description": "Small square icon for browser tabs"
            },
            "app_icon": {
                "prefer_layout": "icon", 
                "prefer_size": "large",
                "description": "Application icon for software"
            },
            "business_card": {
                "prefer_layout": "horizontal",
                "prefer_size": "large",
                "description": "Logo for business cards and professional materials"
            },
            "email_signature": {
                "prefer_layout": "horizontal",
                "prefer_size": "large", 
                "description": "Logo for email signatures"
            },
            "letterhead": {
                "prefer_layout": "horizontal",
                "prefer_size": "large",
                "description": "Logo for official letterhead"
            },
            "website_header": {
                "prefer_layout": "horizontal",
                "prefer_size": "large",
                "description": "Logo for website headers"
            },
            "mobile_app": {
                "prefer_layout": "vertical",
                "prefer_size": "large",
                "description": "Logo optimized for mobile layouts"
            },
            "social_media": {
                "prefer_layout": "vertical", 
                "prefer_size": "large",
                "description": "Logo for social media profiles"
            },
            "presentation": {
                "prefer_layout": "horizontal",
                "prefer_size": "large",
                "description": "Logo for presentations and slides"
            }
        },
        "background_matching": {
            "light": {
                "prefer_color": "black",
                "description": "Dark logos on light backgrounds"
            },
            "dark": {
                "prefer_color": "white", 
                "description": "Light logos on dark backgrounds"
            },
            "any": {
                "prefer_color": "color",
                "fallback_color": "black",
                "description": "Color logos that work on various backgrounds"
            }
        },
        "ciq_variant_rules": {
            "main_branding": {
                "prefer_variant": "twocolor",
                "description": "Most recognizable CIQ branding - use when logo is the star"
            },
            "supporting": {
                "prefer_variant": "onecolor",
                "description": "Clean, professional - won't compete with other elements"
            },
            "accent": {
                "prefer_variant": "green", 
                "description": "Use when you need the logo to pop in neutral designs"
            }
        },
        "confidence_scoring": {
            "exact_match": 1.0,
            "layout_match": 0.8,
            "background_match": 0.7,
            "tag_match": 0.6,
            "fallback": 0.3
        }
    }

def generate_index(assets: Dict[str, Any]) -> Dict[str, Any]:
    """Generate index for fast lookups"""
    products = list(assets.keys())
    
    all_layouts = set()
    all_colors = set()
    all_backgrounds = set() 
    all_tags = set()
    all_doc_types = set()
    
    for product_assets in assets.values():
        for asset in product_assets.values():
            # Handle logos
            if asset['type'] != 'document':
                all_layouts.add(asset['layout'])
                all_colors.add(asset['color'])
                all_backgrounds.add(asset['background'])
            else:
                # Handle documents
                all_doc_types.add(asset['doc_type'])
            
            all_tags.update(asset['tags'])
    
    return {
        "products": sorted(products),
        "layouts": sorted(all_layouts),
        "colors": sorted(all_colors),
        "backgrounds": sorted(all_backgrounds),
        "doc_types": sorted(all_doc_types),
        "tags": sorted(all_tags),
        "total_assets": sum(len(assets_dict) for assets_dict in assets.values())
    }

def load_color_palette_info(assets_path: Path) -> Dict[str, Any]:
    """Load color palette information if available"""
    color_file = assets_path / "global" / "colors" / "color-palette-dark.json"
    if color_file.exists():
        try:
            with open(color_file, 'r') as f:
                color_data = json.load(f)
            return {
                'available': True,
                'summary': color_data.get('summary', {}),
                'last_updated': datetime.now().isoformat(),
                'file_path': str(color_file.relative_to(assets_path.parent))
            }
        except Exception as e:
            print(f"⚠️  Warning: Could not load color palette data: {e}")
            return {'available': False, 'error': str(e)}
    else:
        return {'available': False, 'reason': 'Color palette file not found'}

def main():
    parser = argparse.ArgumentParser(description='Generate declarative asset metadata')
    parser.add_argument('--base-path', default='.', help='Base path to scan (default: current directory)')
    parser.add_argument('--output', default='metadata/asset-inventory.json', help='Output JSON file')
    
    args = parser.parse_args()
    assets_path = Path(args.base_path) / "assets"
    
    print(f"🔍 Scanning assets for declarative metadata generation...")
    
    # Scan all assets
    assets = scan_assets_directory(assets_path)
    
    # Load color palette info
    color_info = load_color_palette_info(assets_path)
    
    # Build metadata structure
    metadata = {
        "assets": assets,
        "rules": generate_rules(),
        "index": generate_index(assets),
        "colors": color_info
    }
    
    # Create output directory
    output_path = Path(args.output)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Write metadata
    with open(output_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    # Print summary
    total_assets = metadata["index"]["total_assets"]
    products = len(metadata["index"]["products"])
    
    print(f"\n✅ Generated declarative metadata: {args.output}")
    print(f"   📊 {total_assets} assets across {products} products")
    print(f"   🏷️  {len(metadata['index']['tags'])} semantic tags")
    print(f"   📐 {len(metadata['index']['layouts'])} layouts")
    print(f"   🎨 {len(metadata['index']['backgrounds'])} background types")
    
    if color_info['available']:
        color_summary = color_info['summary']
        print(f"   🌈 {color_summary.get('total_properties', 'N/A')} color properties")
        print(f"   🎭 {color_summary.get('family_count', 'N/A')} color families")
    else:
        print(f"   ⚠️  Color palette: {color_info.get('reason', 'unavailable')}")
    
    print(f"\n🎯 Benefits:")
    print(f"   • Declarative rules for consistent matching")
    print(f"   • Semantic tags for intelligent recommendations")
    print(f"   • Confidence scoring for quality results")
    print(f"   • Easy debugging and troubleshooting")
    
    print(f"\n🚀 Ready for FastMCP integration!")

if __name__ == "__main__":
    main()