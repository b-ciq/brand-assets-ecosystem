#!/usr/bin/env python3
"""
PDF Processing Script for Brand Assets Ecosystem
Processes PDFs to extract metadata, generate thumbnails, and update asset inventory
"""

import os
import sys
import json
from pathlib import Path
from typing import Dict, Any, Optional, List

# PDF processing imports
try:
    from pypdf import PdfReader
    from PIL import Image
    from pdf2image import convert_from_path
    PDF_LIBS_AVAILABLE = True
except ImportError as e:
    print(f"Warning: PDF processing libraries not available: {e}")
    PDF_LIBS_AVAILABLE = False

def detect_document_type(pdf_path: str) -> str:
    """Detect if PDF is solution-brief or brand-guidelines based on file location"""
    path = Path(pdf_path)
    
    # Check if in general/documents/ - should be brand-guidelines
    if 'general' in path.parts and 'documents' in path.parts:
        return 'brand-guidelines'
    
    # Check if in products/[product]/documents/ - should be solution-brief
    if 'products' in path.parts and 'documents' in path.parts:
        return 'solution-brief'
    
    # Fallback - guess from filename
    filename_lower = path.name.lower()
    if 'brand' in filename_lower or 'guideline' in filename_lower:
        return 'brand-guidelines'
    elif 'brief' in filename_lower or 'solution' in filename_lower:
        return 'solution-brief'
    
    return 'solution-brief'  # Default

def extract_product_from_path(pdf_path: str) -> Optional[str]:
    """Extract product name from PDF path if it's a product-specific document"""
    path = Path(pdf_path)
    
    # Look for products/[product]/ pattern
    parts = path.parts
    for i, part in enumerate(parts):
        if part == 'products' and i + 1 < len(parts):
            return parts[i + 1]
    
    return None

def extract_pdf_text(pdf_path: str) -> tuple[str, int]:
    """Extract text content and page count from PDF"""
    if not PDF_LIBS_AVAILABLE:
        return "PDF processing not available", 1
    
    try:
        reader = PdfReader(pdf_path)
        page_count = len(reader.pages)
        
        # Extract text from first few pages for content summary
        text_parts = []
        max_pages_to_extract = min(3, page_count)  # Extract from first 3 pages max
        
        for i in range(max_pages_to_extract):
            page = reader.pages[i]
            text = page.extract_text()
            if text.strip():
                text_parts.append(text.strip())
        
        full_text = "\n".join(text_parts)
        return full_text, page_count
    
    except Exception as e:
        print(f"Error extracting PDF text: {e}")
        return f"Error extracting text: {str(e)}", 1

def generate_thumbnail(pdf_path: str, thumbnail_path: str, size: tuple = (300, 400)) -> bool:
    """Generate thumbnail image from first page of PDF"""
    if not PDF_LIBS_AVAILABLE:
        print("PDF processing libraries not available, creating placeholder thumbnail")
        # Create a simple placeholder image
        try:
            from PIL import ImageDraw
            img = Image.new('RGB', size, color='white')
            draw = ImageDraw.Draw(img)
            
            # Draw a simple PDF placeholder
            draw.rectangle([20, 20, size[0]-20, size[1]-20], outline='gray', width=2)
            draw.text((size[0]//2-20, size[1]//2-10), "PDF", fill='gray', anchor="mm")
            
            img.save(thumbnail_path)
            return True
        except Exception as e:
            print(f"Error creating placeholder thumbnail: {e}")
            return False
    
    try:
        # Convert first page to image
        images = convert_from_path(pdf_path, first_page=1, last_page=1, dpi=150)
        
        if images:
            # Resize and save thumbnail
            thumbnail = images[0]
            thumbnail.thumbnail(size, Image.Resampling.LANCZOS)
            
            # Create white background and center the thumbnail
            final_img = Image.new('RGB', size, 'white')
            thumb_w, thumb_h = thumbnail.size
            x = (size[0] - thumb_w) // 2
            y = (size[1] - thumb_h) // 2
            final_img.paste(thumbnail, (x, y))
            
            final_img.save(thumbnail_path)
            print(f"Generated thumbnail: {thumbnail_path}")
            return True
        else:
            print("No images generated from PDF")
            return False
            
    except Exception as e:
        print(f"Error generating thumbnail: {e}")
        return False

def extract_searchable_keywords(text: str, document_type: str, product: Optional[str] = None) -> List[str]:
    """Extract relevant keywords from PDF text for search indexing"""
    keywords = [document_type.replace('-', ' ')]
    
    if product:
        keywords.extend([product, f'{product} {document_type.replace("-", " ")}'])
    
    # Extract key phrases from text
    if text and len(text.strip()) > 10:
        text_lower = text.lower()
        
        # Common business/technical terms that might be relevant
        business_terms = [
            'solution', 'enterprise', 'cloud', 'security', 'performance', 
            'scalability', 'management', 'automation', 'integration', 'platform',
            'container', 'kubernetes', 'docker', 'linux', 'open source'
        ]
        
        for term in business_terms:
            if term in text_lower:
                keywords.append(term)
        
        # Add first meaningful words from text (limit to avoid bloat)
        words = text.split()[:100]  # First 100 words
        meaningful_words = [w.strip('.,!?;:').lower() for w in words 
                          if len(w) > 3 and w.isalpha()]
        keywords.extend(meaningful_words[:20])  # Limit to 20 words
    
    # Remove duplicates while preserving order
    seen = set()
    unique_keywords = []
    for keyword in keywords:
        if keyword not in seen:
            seen.add(keyword)
            unique_keywords.append(keyword)
    
    return unique_keywords

def get_pdf_info(pdf_path: str) -> Dict[str, Any]:
    """Extract comprehensive PDF information"""
    path = Path(pdf_path)
    
    if not path.exists():
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    
    # Get file size
    file_size_bytes = path.stat().st_size
    if file_size_bytes < 1024:
        file_size = f"{file_size_bytes} B"
    elif file_size_bytes < 1024 * 1024:
        file_size = f"{file_size_bytes / 1024:.1f} KB"
    else:
        file_size = f"{file_size_bytes / (1024 * 1024):.1f} MB"
    
    # Extract text and page count
    text_content, page_count = extract_pdf_text(pdf_path)
    
    # Create content summary (first 200 chars)
    content_summary = text_content[:200].strip()
    if len(text_content) > 200:
        content_summary += "..."
    
    return {
        'filename': path.name,
        'file_size': file_size,
        'file_size_bytes': file_size_bytes,
        'pages': page_count,
        'text_content': text_content,
        'content_summary': content_summary
    }

def generate_asset_key(document_type: str, product: Optional[str] = None) -> str:
    """Generate consistent asset key for PDF"""
    if document_type == 'brand-guidelines':
        return 'brand_guidelines_pdf'
    elif document_type == 'solution-brief' and product:
        return f'{product}_solution_brief_pdf'
    else:
        return 'document_pdf'

def create_pdf_asset_entry(pdf_path: str, thumbnail_path: str) -> Dict[str, Any]:
    """Create asset inventory entry for PDF"""
    document_type = detect_document_type(pdf_path)
    product = extract_product_from_path(pdf_path)
    pdf_info = get_pdf_info(pdf_path)
    
    # Generate relative URLs for web access (starting from web-gui/public)
    pdf_path_obj = Path(pdf_path)
    thumbnail_path_obj = Path(thumbnail_path)
    
    # Find the public directory in the path
    pdf_parts = pdf_path_obj.parts
    thumbnail_parts = thumbnail_path_obj.parts
    
    try:
        public_idx = pdf_parts.index('public')
        pdf_relative_url = '/' + '/'.join(pdf_parts[public_idx + 1:])
    except ValueError:
        pdf_relative_url = '/' + str(pdf_path_obj.relative_to(Path.cwd()))
    
    try:
        public_idx = thumbnail_parts.index('public')
        thumbnail_relative_url = '/' + '/'.join(thumbnail_parts[public_idx + 1:])
    except ValueError:
        thumbnail_relative_url = '/' + str(thumbnail_path_obj.relative_to(Path.cwd()))
    
    # Extract searchable keywords from content
    searchable_keywords = extract_searchable_keywords(
        pdf_info['text_content'], document_type, product
    )
    
    asset_entry = {
        'url': pdf_relative_url,
        'filename': pdf_info['filename'],
        'thumbnail_url': thumbnail_relative_url,
        'type': 'document',
        'document_type': document_type,
        'file_size': pdf_info['file_size'],
        'pages': pdf_info['pages'],
        'content_summary': pdf_info['content_summary'],
        'searchable_content': searchable_keywords,
        'tags': [document_type.replace('-', '_')]
    }
    
    if product:
        asset_entry['tags'].append(product)
    
    return asset_entry

def process_pdf(pdf_path: str) -> Dict[str, Any]:
    """Process a PDF file and return asset entry"""
    print(f"Processing PDF: {pdf_path}")
    
    # Validate PDF exists
    if not os.path.exists(pdf_path):
        raise FileNotFoundError(f"PDF not found: {pdf_path}")
    
    document_type = detect_document_type(pdf_path)
    product = extract_product_from_path(pdf_path)
    
    print(f"Detected: {document_type}" + (f" for product: {product}" if product else " (general)"))
    
    # Generate thumbnail path
    pdf_dir = Path(pdf_path).parent
    thumbnail_dir = pdf_dir / 'thumbnails'
    thumbnail_dir.mkdir(exist_ok=True)
    
    thumbnail_filename = Path(pdf_path).stem + '.png'
    thumbnail_path = thumbnail_dir / thumbnail_filename
    
    # Generate thumbnail from PDF
    print(f"Generating thumbnail...")
    success = generate_thumbnail(pdf_path, str(thumbnail_path))
    
    if not success:
        print(f"Failed to generate thumbnail, but continuing...")
    
    # Create asset entry with extracted content
    asset_entry = create_pdf_asset_entry(pdf_path, str(thumbnail_path))
    
    print(f"Asset entry created: {generate_asset_key(document_type, product)}")
    print(f"Pages: {asset_entry['pages']}")
    print(f"Size: {asset_entry['file_size']}")
    print(f"Content summary: {asset_entry['content_summary'][:100]}...")
    
    return asset_entry

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 pdf_processor.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    try:
        asset_entry = process_pdf(pdf_path)
        print("PDF processed successfully!")
        print("Asset entry:")
        print(json.dumps(asset_entry, indent=2))
        
        print("\nNext steps:")
        print("1. Add PDF processing libraries to generate actual thumbnail")
        print("2. Update asset-inventory.json with this entry")
        print("3. Test search functionality")
        
    except Exception as e:
        print(f"Error processing PDF: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()