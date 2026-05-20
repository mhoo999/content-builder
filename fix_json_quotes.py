#!/usr/bin/env python3
"""
Fix JSON parsing errors caused by unescaped double quotes in HTML attributes.
Converts HTML attribute quotes from double to single quotes.
"""

import re
import json
import sys
from pathlib import Path

def fix_json_quotes(file_path):
    """
    Fix JSON by converting HTML attribute double quotes to single quotes.
    """
    print(f"Processing: {file_path}")

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f"❌ File not found: {file_path}")
        return False

    original_content = content

    # Pattern to match HTML attributes with double quotes inside JSON strings
    # Use a more comprehensive pattern to catch all attributes
    # Pattern: attribute="value" -> attribute='value'
    # This handles class, style, id, src, href, alt, data-*, etc.

    # Replace all HTML attribute double quotes with single quotes
    # Match: attribute="value" where attribute is any word or data-word
    content = re.sub(
        r'(<[^>]*?)\s+([a-zA-Z-]+)="([^"]*?)"',
        r"\1 \2='\3'",
        content
    )

    if content == original_content:
        print(f"ℹ️  No changes needed for {file_path}")
        return True

    # Validate JSON before saving
    try:
        json.loads(content)
        print(f"✅ JSON is valid after fixes")
    except json.JSONDecodeError as e:
        print(f"❌ JSON still invalid after fixes: {e}")
        return False

    # Save fixed content
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"✅ Fixed and saved: {file_path}")
    return True

def main():
    files_to_fix = [
        "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/18itnet1/01/assets/data/data.json",
        "/Users/mz01-badjyonin/IdeaProjects/contents_it/subjects/18itnet1/22/assets/data/data.json",
    ]

    results = []
    for file_path in files_to_fix:
        result = fix_json_quotes(file_path)
        results.append((file_path, result))
        print()

    # Summary
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for file_path, success in results:
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status}: {Path(file_path).name}")

    all_success = all(result for _, result in results)
    sys.exit(0 if all_success else 1)

if __name__ == "__main__":
    main()
