"""
Base Exporter - Common export utilities for all template exporters

This module provides shared functionality used by specific template family exporters.
"""

import re
import os
import base64
import hashlib
from pathlib import Path


def clean_html_for_export(html_content):
    """
    HTML에서 에디터 관련 속성 정리 (data-original-src를 src로 변환, notion-image 클래스 등)
    주의: class="check-bullet"은 체크 불릿 표시를 위해 보존해야 함

    Args:
        html_content: HTML 문자열

    Returns:
        정리된 HTML 문자열
    """
    if not html_content:
        return html_content

    # data-original-src가 있으면 src를 data-original-src로 교체하고 data-original-src 제거
    # <img src="base64..." data-original-src="../images/file.png">
    # → <img src="../images/file.png">
    def replace_with_original_src(match):
        full_tag = match.group(0)
        original_src_match = re.search(r'data-original-src=["\']([^"\']+)["\']', full_tag)
        if original_src_match:
            original_src = original_src_match.group(1)
            # src를 data-original-src로 교체
            full_tag = re.sub(r'src=["\'][^"\']+["\']', f'src="{original_src}"', full_tag)
            # data-original-src 제거
            full_tag = re.sub(r'\s*data-original-src=["\'][^"\']*["\']', '', full_tag)
            return full_tag
        return full_tag

    html_content = re.sub(r'<img[^>]*data-original-src=["\'][^"\']+["\'][^>]*>', replace_with_original_src, html_content)

    # class="notion-image" 제거 및 alt='' 추가, 태그 형식 정리
    # <img class="notion-image" src="..."> → <img src='...' alt='' />
    # 주의: class="check-bullet"은 ul 태그에 사용되므로 보존해야 함
    def fix_img_tag(match):
        full_tag = match.group(0)
        # src 추출
        src_match = re.search(r'src=["\']([^"\']*)["\']', full_tag)
        if src_match:
            src = src_match.group(1)
            return f"<img src='{src}' alt='' />"
        return full_tag

    html_content = re.sub(r'<img[^>]*class=["\']notion-image["\'][^>]*>', fix_img_tag, html_content)

    # 실습 항목 변환: <ul class='practice'><li><p>...</p></li></ul>
    # → <div class='practice'><ul><li>...</li></ul></div>
    def convert_practice_list(match):
        ul_tag = match.group(0)
        # <li><p>내용</p></li> → <li>내용</li> (p 태그 제거)
        def remove_p_from_li(li_match):
            li_content = li_match.group(1)
            # <p>내용</p> 형식이면 p 태그 제거
            li_content = re.sub(r'^\s*<p>(.*?)</p>\s*$', r'\1', li_content, flags=re.DOTALL)
            return f'<li>{li_content}</li>'

        ul_content = re.sub(r'<li[^>]*>(.*?)</li>', remove_p_from_li, ul_tag, flags=re.DOTALL)

        # <ul class='practice'>...</ul> → <div class='practice'><ul>...</ul></div>
        ul_content = re.sub(r"<ul[^>]*class=['\"]practice['\"][^>]*>", "<div class='practice'><ul>", ul_content)
        ul_content = ul_content.replace('</ul>', '</ul></div>', 1)

        return ul_content

    # class='practice' 또는 class="practice"가 있는 ul 태그를 찾아서 변환
    html_content = re.sub(
        r"<ul[^>]*class=['\"]practice['\"][^>]*>.*?</ul>",
        convert_practice_list,
        html_content,
        flags=re.DOTALL
    )

    # 체크 불릿 리스트를 <p>✓ 텍스트</p> 형태로 변환
    # <ul class="check-bullet"><li>항목1</li><li>항목2</li></ul>
    # → <p>✓ 항목1</p><p>✓ 항목2</p>
    def convert_check_bullet(match):
        ul_tag = match.group(0)
        # li 태그들을 찾아서 변환
        li_pattern = r'<li[^>]*>(.*?)</li>'
        li_matches = re.findall(li_pattern, ul_tag, re.DOTALL)

        if not li_matches:
            return ul_tag

        # 각 li를 <p>✓ 내용</p> 형태로 변환
        p_tags = []
        for li_content in li_matches:
            # li 내용에서 앞뒤 공백 제거
            content = li_content.strip()

            # <p>내용</p> 형식이면 p 태그 내부 텍스트만 추출
            content = re.sub(r'^\s*<p>(.*?)</p>\s*$', r'\1', content, flags=re.DOTALL)

            # 이미 ✓가 있으면 중복 방지
            if content.startswith('✓'):
                content = f'<p>{content}</p>'
            else:
                content = f'<p>✓ {content}</p>'

            p_tags.append(content)

        return ''.join(p_tags)

    # class="check-bullet"이 있는 ul 태그를 찾아서 변환
    html_content = re.sub(
        r'<ul[^>]*class=["\']check-bullet["\'][^>]*>.*?</ul>',
        convert_check_bullet,
        html_content,
        flags=re.DOTALL
    )

    # H3 태그를 ol 태그로 변환
    # <h3>텍스트</h3> → <ol style='color:#000;margin-bottom: 4px;'>1) 텍스트</ol>
    h3_counter = {'count': 0}

    def convert_h3_to_ol(match):
        h3_content = match.group(1).strip()
        # 이미 "1)", "2)" 같은 번호가 있는지 확인
        if re.match(r'^\d+\)\s', h3_content):
            return f"<ol style='color:#000;margin-bottom: 4px;'>{h3_content}</ol>"
        else:
            h3_counter['count'] += 1
            return f"<ol style='color:#000;margin-bottom: 4px;'>{h3_counter['count']}) {h3_content}</ol>"

    html_content = re.sub(r'<h3[^>]*>(.*?)</h3>', convert_h3_to_ol, html_content)

    # H1 태그를 <p class='main-title'><strong>텍스트</strong></p> 형태로 변환
    # <h1>텍스트</h1> → <p class='main-title'><strong>텍스트</strong></p>
    html_content = re.sub(
        r'<h1[^>]*>(.*?)</h1>',
        r"<p class='main-title'><strong>\1</strong></p>",
        html_content
    )

    return html_content


def encode_html_entities(text):
    """
    HTML 엔티티 인코딩 (JSON 저장 전 처리)
    < > & " ' 등을 HTML 엔티티로 변환
    """
    if not isinstance(text, str):
        return text

    return (text
            .replace('&', '&amp;')
            .replace('<', '&lt;')
            .replace('>', '&gt;')
            .replace('"', '&quot;')
            .replace("'", '&#39;'))


def save_base64_image(base64_data, output_dir, filename=None):
    """
    Base64 이미지를 파일로 저장

    Args:
        base64_data: base64 인코딩된 이미지 데이터
        output_dir: 저장할 디렉토리
        filename: 저장할 파일명 (없으면 해시로 생성)

    Returns:
        저장된 파일의 상대 경로
    """
    # base64 데이터에서 실제 데이터 추출
    if ',' in base64_data:
        base64_data = base64_data.split(',', 1)[1]

    # 이미지 데이터 디코딩
    try:
        image_data = base64.b64decode(base64_data)
    except Exception as e:
        print(f"Warning: Failed to decode base64 image: {e}")
        return None

    # 파일명이 없으면 해시로 생성
    if not filename:
        image_hash = hashlib.md5(image_data).hexdigest()
        filename = f"{image_hash}.png"

    # 파일 저장
    output_path = Path(output_dir) / filename
    output_path.parent.mkdir(parents=True, exist_ok=True)

    with open(output_path, 'wb') as f:
        f.write(image_data)

    return str(output_path.relative_to(Path(output_dir).parent.parent))


class BaseExporter:
    """
    Base Exporter class that all specific exporters should extend
    """

    def __init__(self):
        self.name = "BaseExporter"

    def can_export(self, content_model):
        """
        Check if this exporter can handle the given content model

        Args:
            content_model: Content model with _meta field

        Returns:
            True if this exporter can handle the content
        """
        raise NotImplementedError("can_export() must be implemented by subclass")

    def export(self, content_model, output_dir):
        """
        Export the content model to the output directory

        Args:
            content_model: Content model to export
            output_dir: Output directory path

        Returns:
            Dictionary with export results
        """
        raise NotImplementedError("export() must be implemented by subclass")

    def get_template_id(self):
        """
        Get template ID that this exporter handles

        Returns:
            Template ID string
        """
        raise NotImplementedError("getTemplateId() must be implemented by subclass")

    def _clean_content_for_export(self, content):
        """
        Clean content for export (remove editor-specific attributes)

        Args:
            content: Content to clean (string, list, or dict)

        Returns:
            Cleaned content
        """
        if isinstance(content, str):
            return clean_html_for_export(content)
        elif isinstance(content, list):
            return [self._clean_content_for_export(item) for item in content]
        elif isinstance(content, dict):
            return {key: self._clean_content_for_export(value) for key, value in content.items()}
        else:
            return content
