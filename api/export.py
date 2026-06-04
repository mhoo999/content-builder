"""
Vercel Serverless Function: Export to ZIP
JSON 데이터를 받아서 subjects 폴더 구조를 ZIP으로 생성하여 반환
"""

from http.server import BaseHTTPRequestHandler
import json
import sys
import os
import tempfile
import zipfile
import io
import base64
from pathlib import Path

# 상위 디렉토리의 모듈 import를 위한 경로 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from builder_to_subjects import convert_builder_to_subjects


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """CORS preflight"""
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        """Export JSON to ZIP"""
        try:
            # 요청 본문 읽기
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            course_data = data.get("courseData")
            if not course_data:
                self._send_error(400, "courseData is required")
                return

            course_code = course_data.get("courseCode", "export")

            # 임시 디렉토리에서 작업
            with tempfile.TemporaryDirectory() as temp_dir:
                temp_path = Path(temp_dir)

                # JSON 파일 임시 저장
                json_file = temp_path / f"{course_code}_builder.json"
                with open(json_file, 'w', encoding='utf-8') as f:
                    json.dump(course_data, f, ensure_ascii=False)

                # 폴더 구조 생성
                output_dir = temp_path / "output"
                output_dir.mkdir(exist_ok=True)

                success = convert_builder_to_subjects(json_file, output_dir)

                if not success:
                    self._send_error(500, "Export failed")
                    return

                # ZIP 파일 생성
                zip_buffer = io.BytesIO()
                course_dir = output_dir / course_code

                with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                    for file_path in course_dir.rglob('*'):
                        if file_path.is_file():
                            arcname = file_path.relative_to(output_dir)
                            zip_file.write(file_path, arcname)

                zip_buffer.seek(0)
                zip_data = zip_buffer.getvalue()

                # ZIP 파일 응답
                self.send_response(200)
                self._send_cors_headers()
                self.send_header('Content-Type', 'application/zip')
                self.send_header('Content-Disposition', f'attachment; filename="{course_code}.zip"')
                self.send_header('Content-Length', str(len(zip_data)))
                self.end_headers()
                self.wfile.write(zip_data)

        except json.JSONDecodeError as e:
            self._send_error(400, f"Invalid JSON: {str(e)}")
        except Exception as e:
            import traceback
            self._send_error(500, f"{str(e)}\n{traceback.format_exc()}")

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send_error(self, code, message):
        self.send_response(code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({"error": message}).encode('utf-8'))
