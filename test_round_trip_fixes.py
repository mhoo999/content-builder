#!/usr/bin/env python3
"""
Test round-trip compatibility fixes for Bug 2 and Bug 4.
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from exporters.base_exporter import clean_html_for_export


def test_practice_list_p_tag_removal():
    """
    Bug 2: Test that all <p> tags are removed from <li> items in practice lists.
    """
    print("Testing practice list <p> tag removal (Bug 2)...")

    test_cases = [
        # Single <p> tag
        (
            "<ul class='practice'><li><p>Item 1</p></li><li><p>Item 2</p></li></ul>",
            "<div class='practice'><ul><li>Item 1</li><li>Item 2</li></ul></div>"
        ),
        # Multiple <p> tags
        (
            "<ul class='practice'><li><p>First paragraph</p><p>Second paragraph</p></li></ul>",
            "<div class='practice'><ul><li>First paragraphSecond paragraph</li></ul></div>"
        ),
        # Nested <p> tags (edge case)
        (
            "<ul class='practice'><li><p><p>Nested</p></p></li></ul>",
            "<div class='practice'><ul><li>Nested</li></ul></div>"
        ),
        # Empty <p></p> tags
        (
            "<ul class='practice'><li><p></p><p>Content</p><p></p></li></ul>",
            "<div class='practice'><ul><li>Content</li></ul></div>"
        ),
        # Mixed content with <p> tags
        (
            "<ul class='practice'><li><p>Part 1</p> Middle <p>Part 2</p></li></ul>",
            "<div class='practice'><ul><li>Part 1 Middle Part 2</li></ul></div>"
        ),
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


def test_h1_to_p_conversion():
    """
    Bug 1: Test that H1 tags are converted to <p class='main-title'><strong>...</strong></p>
    """
    print("\nTesting H1 to P conversion (Bug 1)...")

    test_cases = [
        # Simple H1
        (
            "<h1>Title Text</h1>",
            "<p class='main-title'><strong>Title Text</strong></p>"
        ),
        # H1 with attributes
        (
            "<h1 id='test'>Another Title</h1>",
            "<p class='main-title'><strong>Another Title</strong></p>"
        ),
        # Multiple H1 tags
        (
            "<h1>First</h1><p>Content</p><h1>Second</h1>",
            "<p class='main-title'><strong>First</strong></p><p>Content</p><p class='main-title'><strong>Second</strong></p>"
        ),
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


def test_h3_to_ol_conversion():
    """
    Test that H3 tags are converted to <ol> with automatic numbering.
    """
    print("\nTesting H3 to OL conversion...")

    test_cases = [
        # Simple H3
        (
            "<h3>Item</h3>",
            "<ol style='color:#000;margin-bottom: 4px;'>1) Item</ol>"
        ),
        # H3 with existing number
        (
            "<h3>2) Already numbered</h3>",
            "<ol style='color:#000;margin-bottom: 4px;'>2) Already numbered</ol>"
        ),
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


def main():
    print("=" * 60)
    print("Testing Round-Trip Compatibility Fixes")
    print("=" * 60)

    results = []
    results.append(("Bug 2: Practice List <p> Tag Removal", test_practice_list_p_tag_removal()))
    results.append(("Bug 1: H1 to P Conversion", test_h1_to_p_conversion()))
    results.append(("H3 to OL Conversion", test_h3_to_ol_conversion()))

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    for test_name, passed in results:
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status}: {test_name}")

    all_passed = all(result for _, result in results)
    print("\n" + ("✅ All tests passed!" if all_passed else "❌ Some tests failed"))

    # Additional notes for manual testing
    print("\n" + "=" * 60)
    print("MANUAL TESTING REQUIRED")
    print("=" * 60)
    print("Bug 4: Numbering preservation requires full import/export cycle:")
    print("  1. Import a template with numbered objectives")
    print("  2. Export without editing")
    print("  3. Compare original and exported JSON")
    print("  4. Verify numbering format is preserved")

    sys.exit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
