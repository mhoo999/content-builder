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


def clean_data_original_src(html_content):
    """
    HTML에서 data-original-src 속성 제거 (에디터 표시용 속성)

    Args:
        html_content: HTML 문자열

    Returns:
        정리된 HTML 문자열
    """
    if not html_content:
        return html_content

    # data-original-src 속성 제거
    pattern = r'\s*data-original-src=["\'][^"\']*["\']'
    return re.sub(pattern, '', html_content)


def extract_and_save_images(html_content, images_dir, course_code, image_counter):
    """
    HTML에서 base64 이미지를 추출하여 파일로 저장하고 상대경로로 교체

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

    # 먼저 data-original-src 속성 제거
    html_content = clean_data_original_src(html_content)

    # base64 이미지 패턴 찾기: <img src="data:image/...;base64,..." />
    pattern = r'<img\s+[^>]*src=["\'](data:image/([^;]+);base64,([^"\']+))["\'][^>]*>'

    def replace_image(match):
        full_data_url = match.group(1)
        image_type = match.group(2)  # png, jpeg, jpg, gif 등
        base64_data = match.group(3)

        # 이미지 카운터 증가
        image_counter['count'] += 1
        image_num = image_counter['count']

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
            return match.group(0).replace(full_data_url, relative_path)
        except Exception as e:
            print(f"⚠️ 이미지 저장 실패: {e}")
            return match.group(0)  # 실패 시 원본 유지

    # 모든 base64 이미지를 찾아서 교체
    result = re.sub(pattern, replace_image, html_content)
    return result


def create_intro_page(professor, images_dir=None, course_code=None, image_counter=None):
    """인트로 페이지 생성"""
    photo = professor.get("photo", "")
    
    # 교수 사진 이미지 추출 및 저장
    if images_dir and course_code and image_counter and photo:
        photo = extract_and_save_images(photo, images_dir, course_code, image_counter)
    
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
    
    return {
        "path": "",
        "section": 0,
        "title": "인트로",
        "component": "intro",
        "media": "../../../resources/media/common_start.mp4",
        "data": {
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
    }


def create_orientation_page(orientation):
    """오리엔테이션 페이지 생성"""
    return {
        "path": "/orientation",
        "section": 1,
        "title": "오리엔테이션",
        "description": "본격적인 학습에 앞서 오리엔테이션을 먼저 들어주세요.",
        "script": "본격적인 학습에 앞서 교수님의 오리엔테이션을 먼저 들어주세요.",
        "component": "orientation",
        "media": orientation["videoUrl"],
        "caption": [{
            "src": orientation["subtitlePath"],
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
            content = term.get("content", "")
            
            # 제목의 줄바꿈을 <br />로 변환
            if title:
                title = title.replace('\n', '<br />')
            
            # 내용 이미지 추출 및 저장 (images_dir가 제공된 경우)
            if images_dir and course_code and image_counter and content:
                content = extract_and_save_images(content, images_dir, course_code, image_counter)
            
            term_data.append({
                "title": title,
                "content": [content] if content else []
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


def create_objectives_page(contents, objectives):
    """학습목표 페이지 생성"""
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
                "contents": [c for c in contents if c]
            },
            {
                "title": "학습목표",
                "contents": [o for o in objectives if o]
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


def create_lecture_page(lesson):
    """강의보기 페이지 생성"""
    timestamps = []
    for ts in lesson["timestamps"]:
        if ts:
            timestamps.append({"time": ts})

    return {
        "path": "/lecture",
        "section": 2,
        "title": "강의보기",
        "description": "교수님의 강의에 맞춰 주도적으로 학습하세요.",
        "script": "영상페이지에서는 내레이션을 제공하지 않습니다",
        "component": "lecture",
        "media": lesson["lectureVideoUrl"],
        "caption": [{
            "src": lesson["lectureSubtitle"],
            "lable": "한국어",
            "language": "ko",
            "kind": "subtitles"
        }],
        "data": timestamps
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

            # 문항과 해설의 이미지 추출 및 저장
            if images_dir and course_code and image_counter:
                if question:
                    question = extract_and_save_images(question, images_dir, course_code, image_counter)
                if commentary:
                    commentary = extract_and_save_images(commentary, images_dir, course_code, image_counter)

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
                        "value": ex.get("options", ["", "", "", ""]),
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

                # 문항과 해설의 이미지 추출 및 저장
                if images_dir and course_code and image_counter:
                    question = extract_and_save_images(question, images_dir, course_code, image_counter)
                    if commentary:
                        commentary = extract_and_save_images(commentary, images_dir, course_code, image_counter)

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
                        "value": ex.get("options", ["", "", "", ""]),
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
    summary = [s for s in lesson["summary"] if s]
    
    # 학습정리 내용의 이미지 추출 및 저장
    if images_dir and course_code and image_counter:
        summary = [
            extract_and_save_images(s, images_dir, course_code, image_counter) if s else s
            for s in summary
        ]

    return {
        "path": "/theorem",
        "section": 3,
        "title": "학습정리",
        "description": "학습한 내용을 다시 한번 정리해보세요.",
        "script": "학습한 내용을 다시 한번 정리해보세요.",
        "component": "theorem",
        "media": "../../../resources/media/common_summary.mp3",
        "data": {
            "theorem": summary,
            "reference": ""
        }
    }


def create_next_page():
    """다음안내 페이지 생성"""
    return {
        "path": "/next",
        "section": 3,
        "title": "다음안내",
        "description": "다음시간 주제를 확인하고, 미리 준비해보세요.",
        "script": "이것으로 이번 시간 강의를 마쳤습니다. 수고하셨습니다.",
        "component": "next",
        "media": "../../../resources/media/common_out.mp3",
        "photo": "../images/professor.png",
        "data": []
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
                "lessons": []
            }
        weeks[week_num]["lessons"].append({
            "number": lesson["lessonNumber"],
            "title": lesson["lessonTitle"]
        })

    # subjects.json 형식으로 변환
    subjects = []
    for week_num in sorted(weeks.keys()):
        week = weeks[week_num]
        lists = []
        for lesson in week["lessons"]:
            lists.append(f"<span>{lesson['number']}차</span> {lesson['title']}")

        subjects.append({
            "title": f"<span>{week_num}주</span>",
            "lists": lists
        })

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
            # ../images/filename.ext 에서 filename.ext 추출
            filename = rel_path.split('/')[-1]
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
    """Builder JSON을 subjects 폴더 구조로 변환"""

    # JSON 로드
    with open(builder_json_path, 'r', encoding='utf-8') as f:
        course_data = json.load(f)

    course_code = course_data["courseCode"]
    course_name = course_data["courseName"]
    professor = course_data["professor"]
    imported_images = course_data.get("importedImages", {})

    if not course_code:
        print("❌ 과목 코드가 없습니다!")
        return False

    # 출력 디렉토리 설정
    if output_dir is None:
        output_dir = Path.cwd() / "subjects"
    else:
        output_dir = Path(output_dir)

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

    # 임포트된 이미지들 먼저 저장
    if imported_images:
        saved_imported = save_imported_images(imported_images, images_dir)
        print(f"📷 임포트된 이미지 {saved_imported}개 저장 완료")

    # 이미지 카운터 (전체 과정에서 공유)
    image_counter = {'count': 0}

    # 각 차시별 data.json 생성
    for lesson in course_data["lessons"]:
        lesson_num = f"{lesson['lessonNumber']:02d}"
        lesson_dir = course_dir / lesson_num / "assets" / "data"
        lesson_dir.mkdir(parents=True, exist_ok=True)

        # 페이지 생성
        pages = []

        # 1. 인트로
        pages.append(create_intro_page(professor, images_dir, course_code, image_counter))

        # 2. 오리엔테이션 (1주1차시만)
        if lesson["hasOrientation"]:
            pages.append(create_orientation_page(lesson["orientation"]))

        # 3. 용어체크
        pages.append(create_term_page(lesson["terms"], images_dir, course_code, image_counter))

        # 4. 학습목표
        pages.append(create_objectives_page(
            lesson["learningContents"],
            lesson["learningObjectives"]
        ))

        # 5. 생각묻기
        pages.append(create_opinion_page(lesson["opinionQuestion"]))

        # 6. 강의보기
        pages.append(create_lecture_page(lesson))

        # 7. 점검하기
        pages.append(create_check_page(lesson, images_dir, course_code, image_counter))

        # 8. 연습문제
        pages.append(create_exercise_page(lesson, images_dir, course_code, image_counter))

        # 9. 학습정리
        pages.append(create_theorem_page(lesson, images_dir, course_code, image_counter))

        # 10. 다음안내
        pages.append(create_next_page())

        # index.html 생성
        index_html = get_index_html_template()
        index_file = lesson_dir.parent / "index.html"
        with open(index_file, 'w', encoding='utf-8') as f:
            f.write(index_html)

        # data.json 생성
        data_json = {
            "subject": course_name,
            "index": lesson["weekNumber"],
            "section": lesson["lessonNumber"],
            "instruction": lesson["instructionUrl"],
            "guide": lesson["guideUrl"],
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

    if not os.path.exists(builder_json_path):
        print(f"❌ 파일을 찾을 수 없습니다: {builder_json_path}")
        sys.exit(1)

    success = convert_builder_to_subjects(builder_json_path, output_dir)
    sys.exit(0 if success else 1)
