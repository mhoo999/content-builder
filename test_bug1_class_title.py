#!/usr/bin/env python3
"""
Test Bug 1: class='title' preservation in theorem items
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from exporters.base_exporter import clean_html_for_export

# 실제 데이터에서 가져온 theorem 항목들
theorem_items = [
    "<p class='title'>자료구조의 개요와 정의</p><ul><li>자료구조는 다양한 자료를 효율적으로 표현하고 저장하여 처리하고 사용할 수 있도록 하는 것이다.</li></ul>",
    "<p class='title'>자료구조의 분류</p><ul><li>자료를 형태에 따라 분류하면 프로그래밍 언어에서 제공하는 정수, 실수, 문자, 문자열 등과 같은 데이터 타입에 해당하는 단순구조가 있고, 자료들 사이의 관계가 1:1인 선형 구조, 1:다 또는 다:다의 관계인 비선형 구조 그리고 파일구조가 있다.</li></ul>",
    "<p>디지털 표현 방법 - 수치 자료표현</p><ul><li><p>10진수를 표현하는 방법은 존과 팩 형식이 있다.</p></li><li><p>2진수 정수를 표현하는 방법에는 부호와 절대값, 1의 보수형식, 2의 보수 형식이 있다.</p></li><li><p>2진수 정수 음수를 표현하는 방법은 3가지 모두 다르지만 현재 컴퓨터에서는 2의 보수형태를 사용한다.</p></li><li><p>2의 보수가 하나 더 음수 표현방법이 있다.</p></li></ul><p></p>"
]

print("=" * 60)
print("Testing Bug 1: class='title' preservation")
print("=" * 60)

all_passed = True

for i, item in enumerate(theorem_items, 1):
    print(f"\nTest {i}: theorem[{i-1}]")
    print(f"Original starts with: {item[:50]}...")
    
    result = clean_html_for_export(item)
    print(f"After clean: {result[:50]}...")
    
    # Check if class='title' is preserved (if it existed)
    had_class_title = "class='title'" in item or 'class="title"' in item
    has_class_title = "class='title'" in result
    
    if had_class_title:
        if has_class_title:
            print(f"  ✅ class='title' preserved")
        else:
            print(f"  ❌ class='title' was LOST!")
            all_passed = False
    else:
        # 이 케이스: 원본에 class='title'이 없음 - 이것이 Bug 1
        print(f"  ⚠️  Original missing class='title' - This is the bug!")
        print(f"     Expected: <p class='title'>")
        print(f"     Got:      <p>")
        all_passed = False

print("\n" + "=" * 60)
if all_passed:
    print("✅ All theorem items have class='title'")
else:
    print("❌ Bug confirmed: Last theorem item missing class='title'")
    print("\nThis is an INPUT DATA issue, not a conversion bug.")
    print("The original data.json already has inconsistent formatting.")

sys.exit(0 if all_passed else 1)
