import { useRef, useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import './TinyMCEEditor.css';

/**
 * TinyMCE 기반 리치 텍스트 에디터
 * - 표, 이미지, 링크 등 기본 기능 제공
 * - H1, H3 헤딩 지원
 * - 이미지 리사이즈 기본 제공
 * - KaTeX 수식 지원
 */
function TinyMCEEditor({ value, onChange, placeholder = '내용을 입력하세요...', editorType }) {
  const editorRef = useRef(null);
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathFormula, setMathFormula] = useState('');
  const [mathDisplay, setMathDisplay] = useState(false);

  // 직접 onChange 호출 (debounce 제거로 롤백 버그 해결)
  const handleEditorChange = (content) => {
    if (onChange) {
      onChange(content);
    }
  };

  // 수식 모달 열기
  const openMathModal = () => {
    setMathFormula('');
    setMathDisplay(false);
    setShowMathModal(true);
  };

  // 수식 삽입
  const insertMath = () => {
    if (!mathFormula.trim() || !editorRef.current) {
      setShowMathModal(false);
      return;
    }

    try {
      // KaTeX로 렌더링
      const html = katex.renderToString(mathFormula, {
        throwOnError: false,
        displayMode: mathDisplay,
      });

      // HTML 생성: 기존 Tiptap 형식과 호환되도록
      const className = mathDisplay ? 'math-block' : 'math-inline';
      const displayAttr = mathDisplay ? ' data-display=""' : '';
      const mathHtml = `<span class="${className}" data-formula="${mathFormula.replace(/"/g, '&quot;')}"${displayAttr}>${html}</span>`;

      // 에디터에 삽입
      editorRef.current.insertContent(mathHtml);
    } catch (error) {
      console.error('수식 렌더링 오류:', error);
      alert('수식 렌더링에 실패했습니다.');
    }

    setShowMathModal(false);
  };

  return (
    <div className={`tinymce-editor-wrapper ${editorType ? `type-${editorType}` : ''}`}>
      {/* 수식 입력 모달 */}
      {showMathModal && (
        <div className="math-modal-overlay" onClick={() => setShowMathModal(false)}>
          <div className="math-modal" onClick={(e) => e.stopPropagation()}>
            <h3>수식 입력 (LaTeX)</h3>
            <div className="math-modal-content">
              <label>
                <input
                  type="checkbox"
                  checked={mathDisplay}
                  onChange={(e) => setMathDisplay(e.target.checked)}
                />
                <span>블록 수식 (가운데 정렬)</span>
              </label>
              <textarea
                value={mathFormula}
                onChange={(e) => setMathFormula(e.target.value)}
                placeholder="예: x^2 + y^2 = r^2"
                rows={4}
                autoFocus
              />
              {mathFormula && (
                <div className="math-preview">
                  <strong>미리보기:</strong>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: katex.renderToString(mathFormula, {
                        throwOnError: false,
                        displayMode: mathDisplay,
                      }),
                    }}
                  />
                </div>
              )}
              <div className="math-modal-actions">
                <button onClick={insertMath}>삽입</button>
                <button onClick={() => setShowMathModal(false)}>취소</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        onInit={(evt, editor) => editorRef.current = editor}
        value={value}
        onEditorChange={handleEditorChange}
        init={{
          license_key: 'gpl',
          base_url: '/tinymce',
          suffix: '.min',
          // height: 500, 제거하고 min_height 적용
          min_height: 200,
          menubar: false,

          // 성능 최적화
          convert_urls: false,
          remove_script_host: false,
          relative_urls: false,
          plugins: [
            'table',
            'link',
            'image',
            'paste',
            'code',
            'lists'
          ],
          toolbar:
            'undo redo | ' +
            'bold italic forecolor backcolor | ' +
            'h1 h3 | ' +
            'bullist | ' +
            'table | ' +
            'image | ' +
            'math | ' +
            'code',

          // 커스텀 버튼 등록
          setup: (editor) => {
            // 수식 버튼
            editor.ui.registry.addButton('math', {
              text: '∑',
              tooltip: '수식 삽입',
              onAction: () => {
                openMathModal();
              }
            });

            // 임포트/초기 로드 시 내용에 맞게 높이 자동 조절 (이후에는 사용자가 핸들로 자유롭게 조절 가능)
            const adjustHeight = () => {
              setTimeout(() => {
                try {
                  const body = editor.getBody();
                  if (body) {
                    const scrollHeight = body.scrollHeight;
                    // 기본 높이 200px, 내용이 더 길면 내용만큼 늘림 (여백 20px 추가)
                    const newHeight = Math.max(200, scrollHeight + 20);
                    // 에디터 컨테이너 높이 변경
                    if (editor.theme && editor.theme.resizeTo) {
                      editor.theme.resizeTo(null, newHeight);
                    } else if (editor.getContainer()) {
                      editor.getContainer().style.height = `${newHeight}px`;
                    }
                  }
                } catch (e) {
                  console.error('높이 자동 조절 실패:', e);
                }
              }, 100);
            };

            editor.on('init', adjustHeight);
            editor.on('LoadContent', adjustHeight);
            editor.on('SetContent', adjustHeight);
          },

          // 테이블 툴바
          table_toolbar:
            'tableprops tabledelete | ' +
            'tableinsertrowbefore tableinsertrowafter tabledeleterow | ' +
            'tableinsertcolbefore tableinsertcolafter tabledeletecol',

          // 이미지 리사이즈 활성화
          object_resizing: 'img',

          // 한국어 언어팩 (추가 예정)
          // language: 'ko_KR',
          // language_url: '/tinymce/langs/ko_KR.js',

          // 붙여넣기 설정
          paste_as_text: false,
          paste_data_images: true,

          // 콘텐츠 스타일
          content_style: `
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              padding: 12px;
              background-color: ${
                editorType === 'question' ? '#f0f4ff' :
                editorType === 'option' ? '#f2fbf5' :
                editorType === 'commentary' ? '#fff9f0' :
                '#ffffff'
              };
            }

            /* 표 스타일 */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }

            table td, table th {
              border: 1px solid #ddd;
              padding: 6px 8px;
              line-height: 1.4;
            }

            table th {
              background-color: #f5f5f5;
              font-weight: bold;
              text-align: left;
            }

            /* 이미지 스타일 */
            img {
              max-width: 100%;
              height: auto;
            }

            /* 체크 불릿 스타일 */
            ul.check-bullet {
              list-style-type: none;
              padding-left: 0;
            }

            ul.check-bullet li:before {
              content: "✓";
              margin-right: 8px;
              color: #4CAF50;
              font-weight: bold;
            }
          `,

          // 플레이스홀더
          placeholder: placeholder,

          // 커스텀 포맷 (H1, H3만 사용)
          block_formats: 'Paragraph=p; Heading 1=h1; Heading 3=h3',

          // HTML 엘리먼트 허용 (H1, H3 포함)
          valid_elements: '*[*]', // 모든 태그 허용
          extended_valid_elements: 'h1[*],h3[*]',

          // 기타 설정
          branding: false, // "Powered by TinyMCE" 제거
          statusbar: true, // 상태바 활성화 (리사이즈 핸들 표시용)
          resize: 'vertical', // 세로 리사이즈만 허용

          // 이미지 업로드 핸들러
          images_upload_handler: (blobInfo, progress) => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve(reader.result);
            };
            reader.onerror = () => {
              reject('이미지 변환 실패');
            };
            reader.readAsDataURL(blobInfo.blob());
          }),
        }}
      />
    </div>
  );
}

export default TinyMCEEditor;
