"""
Modern JSON Serializer (2019+ Template Format)

Standard JSON serialization for 2019+ templates:
- Standard separator: ': ' (colon-space)
- Proper indentation
- Standard JSON formatting
"""

import json


def modern_json_dumps(obj, indent='\t'):
    """
    모던 템플릿용 JSON 직렬화 (2019+)
    - 표준 JSON 포맷
    - ': ' (colon-space) separator 사용
    - 탭 들여쓰기

    Args:
        obj: Serialization할 객체
        indent: 들여쓰기 문자 (기본값: '\t')

    Returns:
        JSON 문자열
    """
    separator = ': '  # Modern format: colon-space

    def serialize_value(value, level=0):
        indent_str = indent * level
        next_indent = indent * (level + 1)

        if value is None:
            return 'null'
        elif isinstance(value, bool):
            return 'true' if value else 'false'
        elif isinstance(value, (int, float)):
            return str(value)
        elif isinstance(value, str):
            # JSON 이스케이프
            escaped = (value
                      .replace('\\', '\\\\')
                      .replace('"', '\\"')
                      .replace('\n', '\\n')
                      .replace('\r', '\\r')
                      .replace('\t', '\\t'))
            return f'"{escaped}"'
        elif isinstance(value, list):
            # sections 배열은 한 줄로 (문자열 배열이고 4개 이하인 경우)
            if all(isinstance(item, str) for item in value) and len(value) <= 6:
                items = ', '.join(f'"{item}"' for item in value)
                return f'[{items}]'
            # 다른 배열은 여러 줄로
            if not value:
                return '[]'
            items = []
            for item in value:
                items.append(f'{next_indent}{serialize_value(item, level + 1)}')
            return '[\n' + ',\n'.join(items) + f'\n{indent_str}]'
        elif isinstance(value, dict):
            if not value:
                return '{}'
            items = []
            for key, val in value.items():
                serialized_val = serialize_value(val, level + 1)
                items.append(f'{next_indent}"{key}"{separator}{serialized_val}')
            return '{\n' + ',\n'.join(items) + f'\n{indent_str}}}'
        else:
            return 'null'

    return serialize_value(obj)
