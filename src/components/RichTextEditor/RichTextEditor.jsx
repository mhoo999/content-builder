import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Image } from '@tiptap/extension-image';
import { Placeholder } from '@tiptap/extension-placeholder';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useRef, useCallback, useState } from 'react';
import { Math } from './MathExtension';
import katex from 'katex';
import './RichTextEditor.css';

// 커스텀 Image extension - data-original-src 속성 지원
const CustomImage = Image.extend({
  name: 'customImage',
  addAttributes() {
    return {
      ...this.parent?.(),
      'data-original-src': {
        default: null,
        parseHTML: element => element.getAttribute('data-original-src'),
        renderHTML: attributes => {
          if (!attributes['data-original-src']) {
            return {};
          }
          return { 'data-original-src': attributes['data-original-src'] };
        },
      },
    };
  },
});

function RichTextEditor({ value, onChange, placeholder = '내용을 입력하세요...' }) {
  const fileInputRef = useRef(null);
  const [showMathModal, setShowMathModal] = useState(false);
  const [mathFormula, setMathFormula] = useState('');
  const [mathDisplay, setMathDisplay] = useState(false);
  
  // LaTeX 예시 (백슬래시 이스케이프)
  const mathExampleInline = 'x^2 + y^2 = r^2';
  const mathExampleBlock = '\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}';

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        underline: false, // Underline extension을 별도로 추가하므로 비활성화
      }),
      Underline,
      CustomImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: 'notion-image',
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Math,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'notion-editor-content',
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith('image/')) {
            event.preventDefault();
            handleImageFile(file);
            return true;
          }
        }
        return false;
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (items) {
          for (const item of items) {
            if (item.type.startsWith('image/')) {
              event.preventDefault();
              const file = item.getAsFile();
              if (file) handleImageFile(file);
              return true;
            }
          }
        }
        return false;
      },
    },
  });

  const handleImageFile = useCallback((file) => {
    if (!editor) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      editor.chain().focus().setImage({ src: e.target.result }).run();
    };
    reader.readAsDataURL(file);
  }, [editor]);

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageFile(file);
    }
    e.target.value = '';
  };

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  // 이미지에 title 속성 추가 (호버 시 경로 표시) - 에디터 마운트 시 1회만 실행
  useEffect(() => {
    if (!editor) return;

    const addImageTitles = () => {
      if (!editor.view || editor.isDestroyed) return;
      try {
        const images = editor.view.dom.querySelectorAll('img[data-original-src]');
        images.forEach(img => {
          const originalSrc = img.getAttribute('data-original-src');
          if (originalSrc && !img.title) {
            img.title = `원본 경로: ${originalSrc}`;
          }
        });
      } catch (e) {
        // ignore
      }
    };

    // 초기 로드 시 실행
    const timer = setTimeout(addImageTitles, 200);

    return () => clearTimeout(timer);
  }, [editor]);

  // 수식 렌더링 (renderHTML에서 렌더링하지 못하므로 클라이언트 측에서 처리)
  useEffect(() => {
    if (!editor) return;

    const renderMath = () => {
      if (!editor.view || editor.isDestroyed) return;
      try {
        const mathSpans = editor.view.dom.querySelectorAll('span[data-formula]');
        mathSpans.forEach(span => {
          // 이미 렌더링된 경우 스킵
          if (span.querySelector('.katex')) return;
          
          const formula = span.getAttribute('data-formula');
          const display = span.hasAttribute('data-display');
          
          if (!formula) {
            span.className = 'math-empty';
            span.textContent = '수식';
            return;
          }

          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: display,
            });
            span.innerHTML = html;
            span.className = display ? 'math-block' : 'math-inline';
          } catch (error) {
            span.className = 'math-error';
            span.textContent = `수식 오류: ${formula}`;
          }
        });
      } catch (e) {
        // ignore
      }
    };

    // 에디터 업데이트 시 수식 렌더링
    const handleUpdate = () => {
      setTimeout(renderMath, 0);
    };
    
    editor.on('update', handleUpdate);
    editor.on('selectionUpdate', handleUpdate);

    // 초기 렌더링
    setTimeout(renderMath, 100);

    return () => {
      if (editor && !editor.isDestroyed) {
        editor.off('update', handleUpdate);
        editor.off('selectionUpdate', handleUpdate);
      }
    };
  }, [editor]);

  const handleMathInsert = () => {
    if (!editor) return;
    setShowMathModal(true);
    setMathFormula('');
    setMathDisplay(false);
  };

  const handleMathConfirm = () => {
    if (!editor || !mathFormula.trim()) return;
    
    editor.chain().focus().setMath({
      formula: mathFormula.trim(),
      display: mathDisplay,
    }).run();
    
    setShowMathModal(false);
    setMathFormula('');
    setMathDisplay(false);
  };

  const handleMathCancel = () => {
    setShowMathModal(false);
    setMathFormula('');
    setMathDisplay(false);
  };

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return <div className="notion-editor-loading">로딩 중...</div>;
  }

  return (
    <div className="notion-editor-wrapper">
      {/* 상단 툴바 */}
      <div className="notion-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
            title="제목 1 (# + space)"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
            title="제목 2 (## + space)"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
            title="제목 3 (### + space)"
          >
            H3
          </button>
        </div>

        <span className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
            title="굵게 (Ctrl+B)"
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
            title="기울임 (Ctrl+I)"
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
            title="밑줄 (Ctrl+U)"
          >
            <u>U</u>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive('strike') ? 'is-active' : ''}
            title="취소선"
          >
            <s>S</s>
          </button>
        </div>

        <span className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
            title="글머리 기호 목록 (- + space)"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'is-active' : ''}
            title="번호 매기기 목록 (1. + space)"
          >
            1.
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive('blockquote') ? 'is-active' : ''}
            title="인용 (&gt; + space)"
          >
            "
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={editor.isActive('codeBlock') ? 'is-active' : ''}
            title="코드 블록 (``` + enter)"
          >
            {'</>'}
          </button>
        </div>

        <span className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={handleImageUpload}
            title="이미지 삽입 (드래그 앤 드롭 가능)"
          >
            🖼 이미지
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            title="표 삽입"
          >
            ⊞ 표
          </button>
          <button
            type="button"
            onClick={handleMathInsert}
            title="수식 삽입 (LaTeX)"
          >
            ∑ 수식
          </button>
        </div>

        {/* 표 편집 버튼들 (표 안에 있을 때만 표시) */}
        {editor.isActive('table') && (
          <>
            <span className="toolbar-divider" />
            <div className="toolbar-group table-controls">
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnBefore().run()}
                title="왼쪽에 열 추가"
              >
                ← 열
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addColumnAfter().run()}
                title="오른쪽에 열 추가"
              >
                열 →
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteColumn().run()}
                title="열 삭제"
              >
                열 ×
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowBefore().run()}
                title="위에 행 추가"
              >
                ↑ 행
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().addRowAfter().run()}
                title="아래에 행 추가"
              >
                행 ↓
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteRow().run()}
                title="행 삭제"
              >
                행 ×
              </button>
              <button
                type="button"
                onClick={() => editor.chain().focus().deleteTable().run()}
                className="danger"
                title="표 삭제"
              >
                표 삭제
              </button>
            </div>
          </>
        )}
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} />

      {/* 숨겨진 파일 입력 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      {/* 힌트 */}
      <div className="notion-editor-hint">
        <span>💡 마크다운: # 제목, - 목록, &gt; 인용, ``` 코드 | 이미지 드래그 앤 드롭 · 붙여넣기 가능 | 수식: ∑ 버튼 클릭</span>
      </div>

      {/* 수식 입력 모달 */}
      {showMathModal && (
        <div className="math-modal-overlay" onClick={handleMathCancel}>
          <div className="math-modal" onClick={(e) => e.stopPropagation()}>
            <div className="math-modal-header">
              <h3>LaTeX 수식 입력</h3>
              <button type="button" onClick={handleMathCancel} className="math-modal-close">
                ×
              </button>
            </div>
            <div className="math-modal-body">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={mathDisplay}
                    onChange={(e) => setMathDisplay(e.target.checked)}
                  />
                  블록 수식 (별도 줄에 표시)
                </label>
              </div>
              <div className="form-group">
                <label>LaTeX 수식</label>
                <textarea
                  value={mathFormula}
                  onChange={(e) => setMathFormula(e.target.value)}
                  placeholder="예: x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}"
                  rows={3}
                  className="math-formula-input"
                />
              </div>
              {mathFormula && (
                <div className="math-preview">
                  <label>미리보기:</label>
                  <div className="math-preview-content">
                    <MathPreview formula={mathFormula} display={mathDisplay} />
                  </div>
                </div>
              )}
              <div className="math-examples">
                <small>
                  <strong>예시:</strong><br />
                  인라인: <code>{mathExampleInline}</code><br />
                  블록: <code>{mathExampleBlock}</code>
                </small>
              </div>
              <div className="math-help-link">
                <a
                  href="https://ko.wikipedia.org/wiki/%EB%8F%84%EC%9B%80%EB%A7%90:TeX_%EB%AC%B8%EB%B2%95"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  📚 LaTeX 문법 도움말
                </a>
              </div>
            </div>
            <div className="math-modal-footer">
              <button type="button" onClick={handleMathCancel}>
                취소
              </button>
              <button type="button" onClick={handleMathConfirm} className="primary">
                삽입
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 수식 미리보기 컴포넌트
function MathPreview({ formula, display }) {
  const [error, setError] = useState(null);
  const previewRef = useRef(null);

  useEffect(() => {
    if (!previewRef.current || !formula) return;
    
    try {
      katex.render(formula, previewRef.current, {
        throwOnError: true,
        displayMode: display,
      });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [formula, display]);

  if (error) {
    return <span className="math-error">오류: {error}</span>;
  }

  return <span ref={previewRef} />;
}

export default RichTextEditor;
