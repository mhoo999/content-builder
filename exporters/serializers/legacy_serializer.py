"""
Legacy JSON Serializer (2018 Template Format)

Special serialization for 2018 templates:
- Whitespace separator: ' : ' (space-colon-space) instead of ': '
- Single-line sections array: ["인트로", "준비하기", "학습하기", "정리하기"]
- Tab indentation
"""


def legacy_json_dumps(obj, indent='\t'):
    """
    레거시 템플릿용 커스텀 JSON 직렬화 (2018)
    - sections 배열은 한 줄로 유지
    - 탭 들여쓰기
    - ' : ' (공백 포함) separator 사용

    Args:
        obj: Serialization할 객체
        indent: 들여쓰기 문자 (기본값: '\t')

    Returns:
        JSON 문자열
    """
    separator = ' : '  # 2018 format: space-colon-space

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
            if all(isinstance(item, str) for item in value) and len(value) <= 4:
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
