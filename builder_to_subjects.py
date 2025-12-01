#!/usr/bin/env python3
"""
Content Builder JSON을 subjects 폴더 구조로 변환

Usage:
    python3 builder_to_subjects.py <builder_json_file> [output_dir]
"""

import json
import sys
import os
import re
import base64
from pathlib import Path
from urllib.parse import unquote

# 수식과 표는 브라우저에서 이미 이미지로 변환되어 base64로 들어옴
# Python 스크립트는 base64 이미지를 파일로 저장하는 역할만 수행

# Windows 인코딩 문제 해결 (UTF-8 강제)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')


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
            full_tag = re.sub(r'src=["\'][^"\']+["\']', f'src=\"{original_src}\"', full_tag)
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
            
            # 이미 ✓가 있으면 중복 방지
            if content.startswith('✓'):
                # 이미 ✓가 있으면 그대로 사용
                # 하지만 <p> 태그가 없으면 추가
                if not content.startswith('<p>'):
                    content = f'<p>{content}</p>'
            elif content.startswith('<p>'):
                # 이미 <p> 태그가 있으면 첫 번째 <p> 태그 뒤에 ✓ 추가
                # <p>내용</p> → <p>✓ 내용</p>
                content = re.sub(r'<p>', '<p>✓ ', content, count=1)
            else:
                # <p> 태그가 없으면 <p>✓ 내용</p> 형태로 감싸기
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

    return html_content


def save_base64_image(base64_data_url, images_dir, course_code, image_counter):
    """
    base64 이미지 데이터 URL을 파일로 저장하고 상대경로 반환
    
    Args:
        base64_data_url: data:image/...;base64,... 형식의 문자열
        images_dir: 이미지 저장 디렉토리
        course_code: 과목 코드
        image_counter: 이미지 카운터 (dict, {'count': int})
    
    Returns:
        상대경로 문자열 (예: ../images/25itinse_img_001.png)
    """
    if not base64_data_url or not base64_data_url.startswith("data:image/"):
        return base64_data_url
    
    try:
        # data:image/png;base64,xxxxx 형식에서 타입과 데이터 추출
        header, data = base64_data_url.split(',', 1)
        image_type_match = re.search(r'data:image/([^;]+)', header)
        if not image_type_match:
            return base64_data_url
        
        image_type = image_type_match.group(1)
        base64_data = data
        
        # 이미지 카운터 증가
        image_counter['count'] += 1
        image_num = image_counter['count']
        
        # 파일명 생성: {과목코드}_img_{번호}.{확장자}
        ext = 'png' if image_type == 'png' else ('jpg' if image_type in ['jpeg', 'jpg'] else image_type)
        filename = f"{course_code}_img_{image_num:03d}.{ext}"
        image_path = images_dir / filename
        
        # base64 디코딩하여 파일로 저장
        image_data = base64.b64decode(base64_data)
        with open(image_path, 'wb') as f:
            f.write(image_data)
        
        # 상대경로 반환
        return f"../images/{filename}"
    except Exception as e:
        print(f"⚠️ 이미지 저장 실패: {e}")
        return base64_data_url  # 실패 시 원본 반환


def extract_and_save_images(html_content, images_dir, course_code, image_counter):
    """
    HTML에서 base64 이미지를 추출하여 파일로 저장하고 상대경로로 교체
    수식과 표를 이미지로 변환

    Args:
        html_content: HTML 문자열 (base64 이미지 포함)
        images_dir: 이미지 저장 디렉토리
        course_code: 과목 코드
        image_counter: 이미지 카운터 (dict, {'count': int})

    Returns:
        이미지 경로가 교체된 HTML 문자열
    """
    if not html_content:
        return html_content

    # 먼저 에디터 관련 속성 정리
    html_content = clean_html_for_export(html_content)
    
    # 수식과 표는 브라우저에서 이미 이미지로 변환되어 base64로 들어옴
    # extract_and_save_images 함수가 base64 이미지를 자동으로 처리함

    # base64 이미지 패턴 찾기: <img src="data:image/...;base64,..." />
    # base64 데이터는 매우 길 수 있으므로 non-greedy가 아닌 greedy로 매칭
    # 하지만 닫는 따옴표까지 매칭해야 하므로 더 정확한 패턴 사용
    pattern = r'<img\s+([^>]*?)src=["\'](data:image/([^;]+);base64,([^"\']+))["\']([^>]*?)>'

    def replace_image(match):
        before_src = match.group(1)  # src 이전 속성들
        full_data_url = match.group(2)  # 전체 data URL
        image_type = match.group(3)  # png, jpeg, jpg, gif 등
        base64_data = match.group(4)  # base64 데이터
        after_src = match.group(5)  # src 이후 속성들

        # 이미지 카운터 증가 (각 이미지마다 고유 번호 부여)
        image_counter['count'] += 1
        image_num = image_counter['count']
        
        print(f"📷 이미지 {image_num} 처리 중: {image_type} ({len(base64_data)} bytes)")

        # 파일명 생성: {과목코드}_img_{번호}.{확장자}
        ext = 'png' if image_type == 'png' else ('jpg' if image_type in ['jpeg', 'jpg'] else image_type)
        filename = f"{course_code}_img_{image_num:03d}.{ext}"
        image_path = images_dir / filename

        try:
            # base64 디코딩하여 파일로 저장
            image_data = base64.b64decode(base64_data)
            with open(image_path, 'wb') as f:
                f.write(image_data)

            # 상대경로로 교체 (data.json에서 images 폴더로의 경로: ../images/)
            relative_path = f"../images/{filename}"
            # img 태그의 src 속성만 교체 (다른 속성은 유지)
            new_tag = f'<img {before_src}src="{relative_path}"{after_src}>'
            print(f"✅ 이미지 저장 완료: {filename}")
            return new_tag
        except Exception as e:
            print(f"⚠️ 이미지 저장 실패: {e}")
            # 실패 시 원본 태그 유지
            return match.group(0)

    # 모든 base64 이미지를 찾아서 교체 (순차적으로 처리)
    # re.sub는 모든 매치를 순차적으로 처리하므로 각 이미지마다 카운터가 증가함
    result = re.sub(pattern, replace_image, html_content)
    return result


def create_intro_page(professor, processed_photo=None, lesson_title=None):
    """인트로 페이지 생성
    
    Args:
        professor: 교수 정보 딕셔너리
        processed_photo: 이미 처리된 교수 사진 경로 (None이면 professor.photo 사용)
        lesson_title: 차시 타이틀 (선택사항)
    """
    photo = processed_photo if processed_photo is not None else professor.get("photo", "")
    
    # 인트로 media 경로: 원본이 있으면 사용, 없으면 기본값
    intro_media = professor.get("introMedia", "")
    if not intro_media:
        intro_media = "../../../resources/media/common_start.mp4"
    
    # 경력 변환: [{ period: '', description: '' }] → ['<b>period</b><br />description']
    career_content = []
    if isinstance(professor.get("career"), list):
        for career_item in professor.get("career", []):
            if isinstance(career_item, dict):
                period = career_item.get("period", "").strip()
                description = career_item.get("description", "").strip()
                if period or description:
                    if period and description:
                        career_content.append(f"<b>{period}</b><br />{description}")
                    elif period:
                        career_content.append(f"<b>{period}</b>")
                    elif description:
                        career_content.append(description)
            elif isinstance(career_item, str) and career_item.strip():
                # 기존 형식 호환 (문자열인 경우 그대로 사용)
                career_content.append(career_item)
    
    intro_data = {
        "professor": {
            "name": professor["name"],
            "photo": photo,
            "profile": [
                {
                    "title": "학　력",
                    "content": professor.get("education", [])
                },
                {
                    "title": "경　력",
                    "content": career_content
                }
            ]
        }
    }
    
    # 차시 타이틀이 있으면 추가
    if lesson_title:
        intro_data["lessonTitle"] = lesson_title
    
    return {
        "path": "",
        "section": 0,
        "title": "인트로",
        "component": "intro",
        "media": intro_media,
        "data": intro_data
    }


def create_orientation_page(orientation, course_code=None, year=None):
    """오리엔테이션 페이지 생성
    
    Args:
        orientation: 오리엔테이션 정보 딕셔너리
        course_code: 과목 코드 (자동 생성용)
        year: 연도 (자동 생성용)
    """
    # videoUrl이 비어있고 course_code와 year가 있으면 자동 생성
    video_url = orientation.get("videoUrl", "")
    if not video_url and course_code and year:
        video_url = f"https://cdn-it.livestudy.com/mov/{year}/{course_code}/{course_code}_ot.mp4"
    
    # subtitlePath가 비어있고 course_code가 있으면 자동 생성
    subtitle_path = orientation.get("subtitlePath", "")
    if not subtitle_path and course_code:
        subtitle_path = f"../subtitles/{course_code}_ot.vtt"
    
    return {
        "path": "/orientation",
        "section": 1,
        "title": "오리엔테이션",
        "description": "본격적인 학습에 앞서 오리엔테이션을 먼저 들어주세요.",
        "script": "본격적인 학습에 앞서 교수님의 오리엔테이션을 먼저 들어주세요.",
        "component": "orientation",
        "media": video_url,
        "caption": [{
            "src": subtitle_path,
            "lable": "한국어",
            "language": "ko",
            "kind": "subtitles"
        }],
        "data": {}
    }


def create_term_page(terms, images_dir=None, course_code=None, image_counter=None):
    """용어체크 페이지 생성"""
    term_data = []
    for term in terms:
        if term.get("title") or term.get("content"):
            title = term.get("title", "")
            content_list = term.get("content", [])
            
            # 제목의 줄바꿈을 <br />로 변환
            if title:
                title = title.replace('\n', '<br />')
            
            # content가 배열인 경우 각 항목 앞에 불릿(•) 추가
            # content가 문자열인 경우 (기존 형식 호환) 배열로 변환
            if isinstance(content_list, str):
                content_list = [content_list] if content_list else []
            
            # 각 항목을 처리 (불릿은 HTML 클래스에서 제공되므로 추가하지 않음)
            processed_content = []
            for content_item in content_list:
                if content_item:
                    # 이미지 추출 및 저장 (images_dir가 제공된 경우)
                    processed_item = content_item
                    if images_dir and course_code and image_counter:
                        processed_item = extract_and_save_images(content_item, images_dir, course_code, image_counter)
                    processed_content.append(processed_item)
            
            term_data.append({
                "title": title,
                "content": processed_content if processed_content else []
            })

    return {
        "path": "/term",
        "section": 1,
        "title": "용어체크",
        "description": "이번 시간에 다룰 주요 용어를 체크해보세요.",
        "script": "이번 시간에 다룰 주요 용어를 체크해보세요.",
        "component": "term",
        "media": "../../../resources/media/common_word.mp3",
        "data": term_data
    }


def is_practice_content_empty(content):
    """실습 항목 내용이 비어있는지 확인"""
    if not content or not isinstance(content, str):
        return True
    # practice 항목인지 확인
    if "class='practice'" not in content:
        return False
    # HTML 태그 제거 후 텍스트만 추출
    import re
    text = re.sub(r'<[^>]+>', '', content)
    text = text.strip()
    # 비어있거나 공백만 있으면 True
    return not text or not text.strip()
    
def create_objectives_page(contents, objectives, images_dir=None, course_code=None, image_counter=None):
    """학습목표 페이지 생성"""
    # 실습 항목 제외하고 학습내용 필터링
    filtered_contents = []
    for c in contents:
        if c and not is_practice_content_empty(c):
            # 이미지 추출 및 저장
            if images_dir and course_code and image_counter:
                c = extract_and_save_images(c, images_dir, course_code, image_counter)
            filtered_contents.append(c)
    
    # 학습목표도 이미지 처리
    processed_objectives = []
    for obj in objectives:
        if obj:
            # 이미지 추출 및 저장
            if images_dir and course_code and image_counter:
                obj = extract_and_save_images(obj, images_dir, course_code, image_counter)
            processed_objectives.append(obj)
    
    # 학습내용과 학습목표에 자동 넘버링 추가
    numbered_contents = [f"{i+1}. {c}" for i, c in enumerate(filtered_contents) if c]
    numbered_objectives = [f"{i+1}. {o}" for i, o in enumerate(processed_objectives) if o]
    
    return {
        "path": "/objectives",
        "section": 1,
        "title": "학습목표",
        "description": "주요 학습내용과 학습목표를 살펴보세요.",
        "script": "이번 시간에 학습할 주요 학습 내용과 학습목표를 확인해보세요.",
        "component": "objectives",
        "media": "../../../resources/media/common_goal.mp3",
        "data": [
            {
                "title": "학습내용",
                "contents": numbered_contents
            },
            {
                "title": "학습목표",
                "contents": numbered_objectives
            }
        ]
    }


def create_opinion_page(question):
    """생각묻기 페이지 생성"""
    return {
        "path": "/opinion",
        "section": 2,
        "title": "생각묻기",
        "description": "다음의 질문에 답해보세요.",
        "script": "본격적인 학습을 시작하기 전 다음의 질문에 답해보세요.",
        "component": "opinion",
        "media": "../../../resources/media/common_question.mp3",
        "data": {
            "title": question
        }
    }


def create_lecture_page(lesson, course_code=None, year=None):
    """강의보기 페이지 생성
    
    Args:
        lesson: 차시 데이터
        course_code: 과목 코드 (자동 생성용)
        year: 연도 (자동 생성용)
    """
    # 강의 영상 URL 자동 생성 (비어있는 경우)
    lecture_video_url = lesson.get("lectureVideoUrl", "")
    if not lecture_video_url and course_code and year:
        lesson_num_str = f"{lesson['lessonNumber']:02d}"
        lecture_video_url = f"https://cdn-it.livestudy.com/mov/{year}/{course_code}/{course_code}_{lesson_num_str}.mp4"
    
    # 자막 파일 경로 자동 생성 (비어있는 경우)
    lecture_subtitle = lesson.get("lectureSubtitle", "")
    if not lecture_subtitle and course_code:
        lesson_num_str = f"{lesson['lessonNumber']:02d}"
        lecture_subtitle = f"../subtitles/{course_code}_{lesson_num_str}.vtt"
    
    timestamps = []
    for ts in lesson.get("timestamps", []):
        if ts:
            timestamps.append({"time": ts})

    return {
        "path": "/lecture",
        "section": 2,
        "title": "강의보기",
        "description": "교수님의 강의에 맞춰 주도적으로 학습하세요.",
        "script": "영상페이지에서는 내레이션을 제공하지 않습니다",
        "component": "lecture",
        "media": lecture_video_url,
        "caption": [{
            "src": lecture_subtitle,
            "lable": "한국어",
            "language": "ko",
            "kind": "subtitles"
        }],
        "data": timestamps
    }


def create_practice_page(lesson, course_code=None, year=None):
    """실습하기 페이지 생성
    
    Args:
        lesson: 차시 데이터
        course_code: 과목 코드 (자동 생성용)
        year: 연도 (자동 생성용)
    """
    # 실습 강의 영상 URL 자동 생성
    practice_video_url = lesson.get("practiceVideoUrl", "")
    if not practice_video_url:
        # 강의 영상 URL에서 _P.mp4로 변환
        lecture_video_url = lesson.get("lectureVideoUrl", "")
        if lecture_video_url:
            practice_video_url = lecture_video_url.replace('.mp4', '_P.mp4')
        elif course_code and year:
            lesson_num_str = f"{lesson['lessonNumber']:02d}"
            practice_video_url = f"https://cdn-it.livestudy.com/mov/{year}/{course_code}/{course_code}_{lesson_num_str}_P.mp4"
    
    # 실습 자막 파일 경로 자동 생성
    practice_subtitle = lesson.get("practiceSubtitle", "")
    if not practice_subtitle:
        # 자막 경로에서 _P.vtt로 변환
        lecture_subtitle = lesson.get("lectureSubtitle", "")
        if lecture_subtitle:
            practice_subtitle = lecture_subtitle.replace('.vtt', '_P.vtt')
        elif course_code:
            lesson_num_str = f"{lesson['lessonNumber']:02d}"
            practice_subtitle = f"../subtitles/{course_code}_{lesson_num_str}_P.vtt"
    
    # 실습 타임스탬프
    practice_timestamps = []
    if "practiceTimestamps" in lesson and isinstance(lesson["practiceTimestamps"], list):
        for ts in lesson["practiceTimestamps"]:
            if ts:
                practice_timestamps.append({"time": ts})
    
    return {
        "path": "/practice",
        "section": 2,
        "title": "실습하기",
        "description": "실습영상을 따라 하며 다양한 기능을 익혀보세요.",
        "script": "실습영상을 따라 하며 다양한 기능을 익혀보세요. ",
        "component": "practice",
        "media": practice_video_url,
        "caption": [{
            "src": practice_subtitle,
            "lable": "한국어",
            "language": "ko",
            "kind": "subtitles"
        }],
        "data": practice_timestamps
    }


def create_check_page(lesson, images_dir=None, course_code=None, image_counter=None):
    """점검하기 페이지 생성"""
    professor_think = lesson.get("professorThink", "")
    
    # 교수님 의견에 포함된 이미지 추출 및 저장
    if images_dir and course_code and image_counter and professor_think:
        professor_think = extract_and_save_images(professor_think, images_dir, course_code, image_counter)
    
    return {
        "path": "/check",
        "section": 2,
        "title": "점검하기",
        "description": "질문에 대한 교수님의 생각을 확인해보세요.",
        "script": "질문에 대한 교수님의 생각을 확인해보세요.",
        "component": "check",
        "media": "../../../resources/media/common_check.mp3",
        "data": {
            "title": lesson["opinionQuestion"],
            "photo": lesson.get("professorThinkImage") or "../images/professor-02.png",
            "think": professor_think
        }
    }


def create_exercise_page(lesson, images_dir=None, course_code=None, image_counter=None):
    """연습문제 페이지 생성 (exercises 배열 형식 지원)"""
    exercises = []

    # 새 형식: exercises 배열
    if "exercises" in lesson and isinstance(lesson["exercises"], list):
        for ex in lesson["exercises"]:
            question = ex.get("question", "")
            commentary = ex.get("commentary", "")
            options = ex.get("options", ["", "", "", ""])

            # 문항, 해설, 선택지의 이미지 추출 및 저장
            if images_dir and course_code and image_counter:
                if question:
                    question = extract_and_save_images(question, images_dir, course_code, image_counter)
                if commentary:
                    commentary = extract_and_save_images(commentary, images_dir, course_code, image_counter)
                # 선택지도 이미지 처리 및 줄바꿈 처리
                if ex.get("type") == "multiple":
                    processed_options = []
                    for opt in options:
                        if opt:
                            # 이미지 추출 및 저장
                            processed_opt = extract_and_save_images(opt, images_dir, course_code, image_counter)
                            # 줄바꿈 문자를 <br />로 변환
                            processed_opt = processed_opt.replace('\n', '<br />')
                            processed_options.append(processed_opt)
                        else:
                            processed_options.append(opt)
                    options = processed_options

            if question:
                if ex.get("type") == "boolean":
                    exercises.append({
                        "type": "boolean",
                        "subject": question,
                        "value": ["O", "X"],
                        "answer": ex.get("answer", "2"),
                        "commentary": commentary
                    })
                else:  # multiple
                    exercises.append({
                        "type": "multiple",
                        "subject": question,
                        "value": options,
                        "answer": ex.get("answer", "1"),
                        "commentary": commentary
                    })
    else:
        # 기존 형식 호환: exercise1, exercise2, exercise3
        for key in ["exercise1", "exercise2", "exercise3"]:
            if key in lesson and lesson[key].get("question"):
                ex = lesson[key]
                question = ex["question"]
                commentary = ex.get("commentary", "")
                options = ex.get("options", ["", "", "", ""])

                # 문항, 해설, 선택지의 이미지 추출 및 저장
                if images_dir and course_code and image_counter:
                    question = extract_and_save_images(question, images_dir, course_code, image_counter)
                    if commentary:
                        commentary = extract_and_save_images(commentary, images_dir, course_code, image_counter)
                    # 선택지도 이미지 처리 및 줄바꿈 처리
                    if ex.get("type") == "multiple":
                        processed_options = []
                        for opt in options:
                            if opt:
                                # 이미지 추출 및 저장
                                processed_opt = extract_and_save_images(opt, images_dir, course_code, image_counter)
                                # 줄바꿈 문자를 <br />로 변환
                                processed_opt = processed_opt.replace('\n', '<br />')
                                processed_options.append(processed_opt)
                            else:
                                processed_options.append(opt)
                        options = processed_options

                if ex.get("type") == "boolean" or key == "exercise1":
                    exercises.append({
                        "type": "boolean",
                        "subject": question,
                        "value": ["O", "X"],
                        "answer": ex.get("answer", "2"),
                        "commentary": commentary
                    })
                else:
                    exercises.append({
                        "type": "multiple",
                        "subject": question,
                        "value": options,
                        "answer": ex.get("answer", "1"),
                        "commentary": commentary
                    })

    return {
        "path": "/exercise",
        "section": 3,
        "title": "연습문제",
        "description": "학습한 내용을 토대로 다음의 문제를 풀어보세요.",
        "script": "학습한 내용을 얼마나 이해했는지 문제를 풀며 확인해보세요.",
        "component": "exercise",
        "media": "../../../resources/media/common_quiz.mp3",
        "data": exercises
    }


def create_theorem_page(lesson, images_dir=None, course_code=None, image_counter=None):
    """학습정리 페이지 생성"""
    import re
    summary = [s for s in lesson["summary"] if s]
    
    # 학습정리 내용의 이미지 추출 및 저장
    if images_dir and course_code and image_counter:
        summary = [
            extract_and_save_images(s, images_dir, course_code, image_counter) if s else s
            for s in summary
        ]
    
    # 모든 항목의 첫 번째 <p> 태그에 class='main-title' 추가
    # H1 태그를 <p class='main-title'><strong>로 변환
    processed_summary = []
    for s in summary:
        if s and isinstance(s, str):
            # H1 태그를 <p class='main-title'><strong>내용</strong></p>로 변환
            # <h1>내용</h1> → <p class='main-title'><strong>내용</strong></p>
            s = re.sub(r'<h1[^>]*>(.*?)</h1>', r"<p class='main-title'><strong>\1</strong></p>", s, flags=re.DOTALL)
            
            # 이미 class='main-title'이 있으면 그대로 유지
            if "<p class='main-title'>" in s or '<p class="main-title">' in s or "<p class=\"main-title\">" in s:
                processed_summary.append(s)
            else:
                # 첫 번째 <p> 태그를 찾아서 class='main-title' 추가
                # <p> 또는 <p 속성> 형태를 찾아서 <p class='main-title'>로 변경
                # <p> 태그 뒤에 공백이나 >가 오는 경우 처리
                s = re.sub(r'<p(\s[^>]*)?>', r"<p class='main-title'\1>", s, count=1)
                processed_summary.append(s)
        else:
            processed_summary.append(s)

    return {
        "path": "/theorem",
        "section": 3,
        "title": "학습정리",
        "description": "학습한 내용을 다시 한번 정리해보세요.",
        "script": "학습한 내용을 다시 한번 정리해보세요.",
        "component": "theorem",
        "media": "../../../resources/media/common_summary.mp3",
        "data": {
            "theorem": processed_summary,
            "reference": ""
        }
    }


def create_next_page(next_lesson=None):
    """다음안내 페이지 생성
    
    Args:
        next_lesson: 다음 차시 정보 딕셔너리 (lessonNumber, lessonTitle 등)
    """
    next_data = []
    
    # 다음 차시 정보가 있으면 추가
    if next_lesson:
        lesson_num = next_lesson.get("lessonNumber", "")
        lesson_title = next_lesson.get("lessonTitle", "")
        if lesson_num and lesson_title:
            next_data.append({
                "number": lesson_num,
                "title": lesson_title
            })
    
    return {
        "path": "/next",
        "section": 3,
        "title": "다음안내",
        "description": "다음시간 주제를 확인하고, 미리 준비해보세요.",
        "script": "이것으로 이번 시간 강의를 마쳤습니다. 수고하셨습니다.",
        "component": "next",
        "media": "../../../resources/media/common_out.mp3",
        "photo": "../images/professor.png",
        "data": next_data
    }


def get_index_html_template():
    """index.html 템플릿 반환 (IT 2023 스타일)"""
    return '''<!DOCTYPE html>
<html lang="ko">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, user-scalable=no" />
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>메가존아이티평생교육원</title>
	<script src="../../../resources/scripts/jquery/jquery.js"></script>
	<script src="../../../resources/scripts/vue/vue.min.js"></script>
	<script src="../../../resources/scripts/vue/vue-router.min.js"></script>

	<script src="../../../resources/scripts/2023/templates/layout.js"></script>
	<script src="../../../resources/scripts/2023/templates/defaults.js"></script>
	<script src="../../../resources/scripts/sync.js"></script>

	<link rel="stylesheet" href="../../../resources/scripts/videojs/video-js.min.css">


	<link rel="stylesheet" href="../../../resources/styles/2023/base.css">
	<link rel="stylesheet" href="../../../resources/styles/2025/layout.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/modules.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/mediaquery.css">
	<link rel="stylesheet" href="../../../resources/styles/2023/type-1.css">

	<link rel="stylesheet" media="print" type="text/css" href="../../../resources/styles/print.css">
</head>
<body>
	<div id="app"></div>
	<script src="../../../resources/scripts/app.js"></script>
	<script src="../../../resources/scripts/videojs/video.min.js"></script>

	<script src="../../../resources/scripts/2023/commons.js"></script>
	<script src="../../../resources/scripts/videojs/videojs-contrib-hls.min.js"></script>
	<script src="../../../resources/scripts/videojs/videojs.hotkeys.min.js"></script>
</body>
</html>'''


def create_subjects_json(course_data):
    """subjects.json 생성 (주차별 차시 목록)"""
    # 주차별로 그룹화
    weeks = {}
    for lesson in course_data["lessons"]:
        week_num = lesson["weekNumber"]
        if week_num not in weeks:
            weeks[week_num] = {
                "weekNumber": week_num,
                "weekTitle": lesson.get("weekTitle", ""),  # 주차 타이틀 (데이터에서 가져오기)
                "lessons": []
            }
        weeks[week_num]["lessons"].append({
            "number": lesson["lessonNumber"],
            "title": lesson["lessonTitle"]
        })
        # 주차 타이틀이 비어있으면 업데이트 (같은 주차의 차시들은 weekTitle 공유)
        if not weeks[week_num]["weekTitle"] and lesson.get("weekTitle"):
            weeks[week_num]["weekTitle"] = lesson.get("weekTitle", "")

    # subjects.json 형식으로 변환
    subjects = []
    for week_num in sorted(weeks.keys()):
        week = weeks[week_num]
        lessons = week["lessons"]

        # 주차 내에서의 순서 계산 (1차, 2차, ...)
        lists = []
        for idx, lesson in enumerate(lessons, 1):
            title = lesson["title"] if lesson["title"] else f"{lesson['number']}차시"
            lists.append(f"<span>{idx}차</span> {title}")

        # 주차 제목 생성 (주차 제목이 없으면 주차 번호만)
        week_title = week.get("weekTitle", "")
        if week_title:
            title_str = f"<span>{week_num}주</span> {week_title}"
        else:
            title_str = f"<span>{week_num}주</span>"

        subject_entry = {"title": title_str}
        if lists:
            subject_entry["lists"] = lists

        subjects.append(subject_entry)

    return {"subjects": subjects}


def save_imported_images(imported_images, images_dir):
    """
    임포트된 이미지들을 파일로 저장

    Args:
        imported_images: 경로 -> base64 딕셔너리
        images_dir: 저장할 디렉토리

    Returns:
        저장된 이미지 개수
    """
    if not imported_images:
        return 0

    saved_count = 0
    for rel_path, base64_data in imported_images.items():
        try:
            # ../images/filename.ext 에서 filename.ext 추출 (크로스 플랫폼 호환)
            # Windows와 Unix 모두 '/' 또는 '\' 구분자 처리
            filename = os.path.basename(rel_path.replace('\\', '/'))
            if not filename:
                continue

            # base64 데이터에서 헤더 제거 (data:image/png;base64, 부분)
            if ',' in base64_data:
                base64_data = base64_data.split(',')[1]

            # 디코딩 및 저장
            image_data = base64.b64decode(base64_data)
            image_path = images_dir / filename

            with open(image_path, 'wb') as f:
                f.write(image_data)

            saved_count += 1
        except Exception as e:
            print(f"⚠️ 이미지 저장 실패 ({rel_path}): {e}")

    return saved_count


def convert_builder_to_subjects(builder_json_path, output_dir=None):
    """Builder JSON을 subjects 폴더 구조로 변환
    
    Args:
        builder_json_path: Path 객체 또는 문자열 (JSON 파일 경로)
        output_dir: Path 객체 또는 문자열 (출력 디렉토리, None이면 현재 디렉토리/subjects)
    """

    # Path 객체로 변환 (크로스 플랫폼 호환성)
    builder_json_path = Path(builder_json_path)
    
    # JSON 로드
    with open(builder_json_path, 'r', encoding='utf-8') as f:
        course_data = json.load(f)

    course_code = course_data["courseCode"]
    course_name = course_data["courseName"]
    year = course_data.get("year", "")
    professor = course_data["professor"]
    # imported_images: import 시 가져온 원본 이미지들 (경로 -> base64)
    imported_images = course_data.get("importedImages", {})

    if not course_code:
        print("❌ 과목 코드가 없습니다!")
        return False

    # 출력 디렉토리 설정
    if output_dir is None:
        output_dir = Path.cwd() / "subjects"
    else:
        # ~ 경로 확장 (Windows/macOS/Linux 호환)
        output_dir = Path(output_dir).expanduser()

    course_dir = output_dir / course_code
    course_dir.mkdir(parents=True, exist_ok=True)

    print(f"📁 생성 위치: {course_dir}")

    # subjects.json 생성
    subjects_json = create_subjects_json(course_data)
    with open(course_dir / "subjects.json", 'w', encoding='utf-8') as f:
        json.dump(subjects_json, f, ensure_ascii=False, indent=2)
    print(f"✅ subjects.json 생성 완료")

    # subtitles 폴더 생성
    subtitles_dir = course_dir / "subtitles"
    subtitles_dir.mkdir(exist_ok=True)

    # images 폴더 생성
    images_dir = course_dir / "images"
    images_dir.mkdir(exist_ok=True)

    # import된 원본 이미지들 복사 (data-original-src에 있는 경로의 이미지들)
    if imported_images:
        saved_count = save_imported_images(imported_images, images_dir)
        print(f"✅ 원본 이미지 {saved_count}개 복사 완료")

    # 이미지 카운터 (전체 과정에서 공유)
    # HTML 내용의 base64 이미지를 추출하여 파일로 저장하고 상대경로로 교체
    image_counter = {'count': 0}

    # 교수 사진 미리 처리 (한 번만 처리하여 모든 차시에서 재사용)
    professor_photo = professor.get("photo", "")
    processed_professor_photo = professor_photo
    if professor_photo:
        # HTML 태그가 포함된 경우 (<img src="data:image/...">)
        if "<img" in professor_photo and "data:image/" in professor_photo:
            # HTML에서 base64 이미지를 추출하여 파일로 저장하고 상대경로로 교체
            processed_professor_photo = extract_and_save_images(
                professor_photo, images_dir, course_code, image_counter
            )
            # HTML 태그에서 src 속성의 경로만 추출
            src_match = re.search(r'src=["\']([^"\']+)["\']', processed_professor_photo)
            if src_match:
                processed_professor_photo = src_match.group(1)
        # 단순 base64 문자열인 경우 (data:image/...;base64,...)
        elif professor_photo.startswith("data:image/"):
            processed_professor_photo = save_base64_image(
                professor_photo, images_dir, course_code, image_counter
            )
        # 이미 상대경로인 경우 그대로 사용
        elif professor_photo.startswith("../images/"):
            processed_professor_photo = professor_photo
        # 절대경로나 URL인 경우 그대로 사용
        else:
            processed_professor_photo = professor_photo

    # 각 차시별 data.json 생성
    lessons_list = course_data["lessons"]
    for idx, lesson in enumerate(lessons_list):
        lesson_num = f"{lesson['lessonNumber']:02d}"
        lesson_dir = course_dir / lesson_num / "assets" / "data"
        lesson_dir.mkdir(parents=True, exist_ok=True)

        # 페이지 생성
        pages = []

        # 1. 인트로 (처리된 교수 사진 경로 사용, 차시 타이틀 포함)
        lesson_title = lesson.get("lessonTitle", "")
        pages.append(create_intro_page(professor, processed_professor_photo, lesson_title))

        # 2. 오리엔테이션 (1주1차시만, 자동 활성화)
        if lesson["hasOrientation"]:
            pages.append(create_orientation_page(lesson["orientation"], course_code, year))

        # 3. 용어체크
        pages.append(create_term_page(lesson["terms"], images_dir, course_code, image_counter))

        # 4. 학습목표
        # 학습내용에 실습 내용 추가 (실습이 있고 내용이 있는 경우)
        learning_contents_for_objectives = list(lesson.get("learningContents", []))
        if lesson.get("hasPractice", False):
            practice_content = lesson.get("practiceContent", "")
            # practiceContent가 없으면 학습내용에서 찾기 (기존 데이터 호환성)
            if not practice_content:
                for content in learning_contents_for_objectives:
                    if isinstance(content, str) and "class='practice'" in content:
                        practice_content = content
                        break
            # 실습 내용이 있고 비어있지 않으면 학습내용에 추가
            if practice_content and not is_practice_content_empty(practice_content):
                learning_contents_for_objectives.append(practice_content)
        
        pages.append(create_objectives_page(
            learning_contents_for_objectives,
            lesson["learningObjectives"],
            images_dir,
            course_code,
            image_counter
        ))

        # 5. 생각묻기
        pages.append(create_opinion_page(lesson["opinionQuestion"]))

        # 6. 강의보기
        pages.append(create_lecture_page(lesson, course_code, year))

        # 6-1. 실습하기 (실습있음 체크 시, 실습 내용이 있는 경우만)
        if lesson.get("hasPractice", False):
            # practiceContent 필드에서 실습 내용 가져오기 (학습내용과 분리)
            practice_content = lesson.get("practiceContent", "")
            
            # practiceContent가 없으면 학습내용에서 찾기 (기존 데이터 호환성)
            if not practice_content:
                learning_contents = lesson.get("learningContents", [])
                for content in learning_contents:
                    if isinstance(content, str) and "class='practice'" in content:
                        practice_content = content
                        break
            
            # practice 항목이 있고 내용이 비어있지 않으면 실습 페이지 생성
            if practice_content and not is_practice_content_empty(practice_content):
                pages.append(create_practice_page(lesson, course_code, year))

        # 7. 점검하기
        pages.append(create_check_page(lesson, images_dir, course_code, image_counter))

        # 8. 연습문제
        pages.append(create_exercise_page(lesson, images_dir, course_code, image_counter))

        # 9. 학습정리
        pages.append(create_theorem_page(lesson, images_dir, course_code, image_counter))

        # 10. 다음안내 (다음 차시 정보 포함)
        next_lesson = None
        if idx + 1 < len(lessons_list):
            next_lesson = lessons_list[idx + 1]
        pages.append(create_next_page(next_lesson))

        # index.html 생성 (차시 폴더 바로 아래에 생성: 01/index.html)
        index_html = get_index_html_template()
        lesson_folder = course_dir / lesson_num  # 01, 02, ...
        index_file = lesson_folder / "index.html"
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(index_html)

        # 다운로드 URL 자동 생성 (비어있는 경우)
        instruction_url = lesson.get("instructionUrl", "")
        if not instruction_url and course_code and year:
            lesson_num_str = f"{lesson['lessonNumber']:02d}"
            instruction_url = f"https://cdn-it.livestudy.com/mov/{year}/{course_code}/down/{course_code}_mp3_{lesson_num_str}.zip"
        
        guide_url = lesson.get("guideUrl", "")
        if not guide_url and course_code and year:
            lesson_num_str = f"{lesson['lessonNumber']:02d}"
            guide_url = f"https://cdn-it.livestudy.com/mov/{year}/{course_code}/down/{course_code}_book_{lesson_num_str}.zip"
        
        # data.json 생성
        data_json = {
            "subject": course_name,
            "index": lesson["weekNumber"],
            "section": lesson["lessonNumber"],
            "instruction": instruction_url,
            "guide": guide_url,
            "sections": ["인트로", "준비하기", "학습하기", "정리하기"],
            "pages": pages
        }

        data_json_path = lesson_dir / "data.json"
        with open(data_json_path, 'w', encoding='utf-8') as f:
            json.dump(data_json, f, ensure_ascii=False, indent=2)

        print(f"✅ {lesson_num}차시 index.html, data.json 생성 완료")
    
    # 이미지 저장 결과 출력
    if image_counter['count'] > 0:
        print(f"📷 총 {image_counter['count']}개 이미지 저장 완료: {images_dir}")

    print(f"\n🎉 총 {len(course_data['lessons'])}개 차시 변환 완료!")
    print(f"📂 생성된 폴더: {course_dir}")

    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 builder_to_subjects.py <builder_json_file> [output_dir]")
        print("Example: python3 builder_to_subjects.py 25itinse_builder.json")
        sys.exit(1)

    builder_json_path = sys.argv[1]
    output_dir = sys.argv[2] if len(sys.argv) > 2 else None

    # Windows 경로 처리: Path 객체로 변환하여 크로스 플랫폼 호환성 보장
    builder_json_path = Path(builder_json_path).resolve()
    if output_dir:
        output_dir = Path(output_dir).expanduser().resolve()
    else:
        output_dir = None

    if not builder_json_path.exists():
        print(f"❌ 파일을 찾을 수 없습니다: {builder_json_path}")
        sys.exit(1)

    success = convert_builder_to_subjects(builder_json_path, output_dir)
    sys.exit(0 if success else 1)
