#!/usr/bin/env python3
"""
Test the JSON export fixes to ensure HTML with double quotes is properly handled.
"""

import sys
import os
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from builder_to_subjects import legacy_json_dumps, clean_html_for_export

def test_html_attribute_quotes():
    """Test that HTML attributes with double quotes are converted to single quotes."""
    print("Testing clean_html_for_export...")

    test_cases = [
        # (input, expected_output)
        ('<img src="../images/test.png">', '<img src=\'../images/test.png\'>'),
        ('<p class="title">Test</p>', '<p class=\'title\'>Test</p>'),
        ('<ul class="sub-list"><li>Item</li></ul>', '<ul class=\'sub-list\'><li>Item</li></ul>'),
        ('<div style="color: red;">Text</div>', '<div style=\'color: red;\'>Text</div>'),
    ]

    all_passed = True
    for i, (input_html, expected) in enumerate(test_cases, 1):
        result = clean_html_for_export(input_html)
        if result == expected:
            print(f"  ✅ Test {i} passed")
        else:
            print(f"  ❌ Test {i} failed")
            print(f"     Input:    {input_html}")
            print(f"     Expected: {expected}")
            print(f"     Got:      {result}")
            all_passed = False

    return all_passed

def test_json_serialization():
    """Test that JSON serialization properly escapes HTML with attributes."""
    print("\nTesting legacy_json_dumps...")

    test_data = {
        "theorem": [
            "<p class='title'>Test Title</p>",
            "<ul class='sub-list'><li>Item 1</li><li>Item 2</li></ul>",
            "<img src='../images/test.png' alt='' />"
        ]
    }

    try:
        json_str = legacy_json_dumps(test_data)
        print("  ✅ JSON serialization successful")

        # Verify it's valid JSON
        parsed = json.loads(json_str)
        print("  ✅ JSON parsing successful")

        # Verify data integrity
        if parsed["theorem"] == test_data["theorem"]:
            print("  ✅ Data integrity preserved")
            return True
        else:
            print("  ❌ Data integrity check failed")
            return False

    except Exception as e:
        print(f"  ❌ JSON serialization failed: {e}")
        return False

def test_round_trip():
    """Test that data can be serialized and deserialized without corruption."""
    print("\nTesting round-trip conversion...")

    original_html = '<p class="title">Extended ACL</p><ul><li>Test item</li></ul>'

    # Step 1: Clean HTML (convert double to single quotes)
    cleaned = clean_html_for_export(original_html)
    expected_cleaned = '<p class=\'title\'>Extended ACL</p><ul><li>Test item</li></ul>'

    if cleaned != expected_cleaned:
        print(f"  ❌ HTML cleaning failed")
        print(f"     Expected: {expected_cleaned}")
        print(f"     Got:      {cleaned}")
        return False
    print(f"  ✅ HTML cleaned: {cleaned}")

    # Step 2: Serialize to JSON
    data = {"content": [cleaned]}
    json_str = legacy_json_dumps(data)
    print(f"  ✅ JSON serialized")

    # Step 3: Parse JSON
    try:
        parsed = json.loads(json_str)
        if parsed["content"][0] == cleaned:
            print(f"  ✅ Round-trip successful!")
            return True
        else:
            print(f"  ❌ Data mismatch after round-trip")
            return False
    except json.JSONDecodeError as e:
        print(f"  ❌ JSON parsing failed: {e}")
        return False

def main():
    print("=" * 60)
    print("Testing JSON Export Fixes")
    print("=" * 60)

    results = []
    results.append(("HTML Attribute Quotes", test_html_attribute_quotes()))
    results.append(("JSON Serialization", test_json_serialization()))
    results.append(("Round-trip Conversion", test_round_trip()))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    all_passed = all(result for _, result in results)
    print("\n" + ("✅ All tests passed!" if all_passed else "❌ Some tests failed"))
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
