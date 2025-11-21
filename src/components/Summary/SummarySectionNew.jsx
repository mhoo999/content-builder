import './SummarySection.css';
import ImageUploader from '../ImageUploader/ImageUploader';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Underline } from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { useEffect, useMemo } from 'react';

// RichTextEditor를 별도 컴포넌트로 분리
function RichTextEditor({ value, onChange, placeholder, editorId }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content',
        placeholder: placeholder,
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy();
      }
    };
  }, [editor]);

  if (!editor) {
    return <div className="rich-text-editor-loading">로딩 중...</div>;
  }

    return (
      <div className="rich-text-editor-wrapper">
        <div className="rich-text-toolbar">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive('bold') ? 'is-active' : ''}
          >
            <strong>B</strong>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive('italic') ? 'is-active' : ''}
          >
            <em>I</em>
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive('underline') ? 'is-active' : ''}
          >
            <u>U</u>
          </button>
          <div className="toolbar-divider"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}
          >
            H3
          </button>
          <div className="toolbar-divider"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive('bulletList') ? 'is-active' : ''}
          >
            • 목록
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive('orderedList') ? 'is-active' : ''}
          >
            1. 목록
          </button>
          <div className="toolbar-divider"></div>
          <button
            type="button"
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          >
            표
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            disabled={!editor.can().deleteTable()}
          >
            표 삭제
          </button>
        </div>
        <EditorContent editor={editor} />
      </div>
    );
  };
  // 연습문제 추가
  const addExercise = () => {
    onUpdate({
      ...lessonData,
      exercises: [
        ...lessonData.exercises,
        {
          type: 'boolean',
          question: '',
          answer: '2',
          options: [],
          commentary: ''
        }
      ]
    });
  };

  // 연습문제 삭제
  const removeExercise = (index) => {
    onUpdate({
      ...lessonData,
      exercises: lessonData.exercises.filter((_, i) => i !== index)
    });
  };

  // 연습문제 타입 변경
  const changeExerciseType = (index, newType) => {
    const newExercises = [...lessonData.exercises];
    newExercises[index] = {
      ...newExercises[index],
      type: newType,
      answer: newType === 'boolean' ? '2' : '1',
      options: newType === 'multiple' ? ['', '', '', ''] : []
    };
    onUpdate({ ...lessonData, exercises: newExercises });
  };

  // 연습문제 업데이트
  const updateExercise = (index, field, value) => {
    const newExercises = [...lessonData.exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    onUpdate({ ...lessonData, exercises: newExercises });
  };

  // 연습문제 선택지 업데이트
  const updateExerciseOption = (exerciseIndex, optionIndex, value) => {
    const newExercises = [...lessonData.exercises];
    const newOptions = [...newExercises[exerciseIndex].options];
    newOptions[optionIndex] = value;
    newExercises[exerciseIndex] = { ...newExercises[exerciseIndex], options: newOptions };
    onUpdate({ ...lessonData, exercises: newExercises });
  };

  // 학습정리 추가
  const addSummary = () => {
    onUpdate({
      ...lessonData,
      summary: [...lessonData.summary, '']
    });
  };

  // 학습정리 삭제
  const removeSummary = (index) => {
    onUpdate({
      ...lessonData,
      summary: lessonData.summary.filter((_, i) => i !== index)
    });
  };

  // 학습정리 업데이트
  const updateSummary = (index, value) => {
    const newSummary = [...lessonData.summary];
    newSummary[index] = value;
    onUpdate({ ...lessonData, summary: newSummary });
  };

  // 다운로드 URL 업데이트
  const handleDownloadChange = (field, value) => {
    onUpdate({ ...lessonData, [field]: value });
  };

  return (
    <div className="form-section">
      <h3>✅ 정리하기</h3>

      {/* 연습문제 */}
      <div className="subsection">
        <div className="list-header">
          <h4>연습문제</h4>
          <button className="btn-add-small" onClick={addExercise}>
            + 문제 추가
          </button>
        </div>

        {lessonData.exercises.map((exercise, index) => (
          <div key={index} className="exercise-item">
            <div className="exercise-header">
              <span className="exercise-number">문제 {index + 1}</span>
              <div className="exercise-controls">
                <select
                  className="type-selector"
                  value={exercise.type}
                  onChange={(e) => changeExerciseType(index, e.target.value)}
                >
                  <option value="boolean">OX</option>
                  <option value="multiple">4지선다</option>
                </select>
                {lessonData.exercises.length > 1 && (
                  <button
                    className="btn-remove-inline"
                    onClick={() => removeExercise(index)}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>문항</label>
              <textarea
                placeholder="문제를 입력하세요"
                value={exercise.question}
                onChange={(e) => updateExercise(index, 'question', e.target.value)}
                rows={2}
              />
            </div>

            {exercise.type === 'multiple' && (
              <div className="options-group">
                <label className="group-label">선택지</label>
                {exercise.options.map((option, optIndex) => (
                  <div key={optIndex} className="form-group">
                    <input
                      type="text"
                      placeholder={`선택지 ${optIndex + 1}`}
                      value={option}
                      onChange={(e) => updateExerciseOption(index, optIndex, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="form-group">
              <label>정답</label>
              {exercise.type === 'boolean' ? (
                <div className="radio-group">
                  <label>
                    <input
                      type="radio"
                      name={`exercise${index}_answer`}
                      value="1"
                      checked={exercise.answer === '1'}
                      onChange={(e) => updateExercise(index, 'answer', e.target.value)}
                    />
                    <span>O (참)</span>
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`exercise${index}_answer`}
                      value="2"
                      checked={exercise.answer === '2'}
                      onChange={(e) => updateExercise(index, 'answer', e.target.value)}
                    />
                    <span>X (거짓)</span>
                  </label>
                </div>
              ) : (
                <select
                  value={exercise.answer}
                  onChange={(e) => updateExercise(index, 'answer', e.target.value)}
                >
                  <option value="1">1번</option>
                  <option value="2">2번</option>
                  <option value="3">3번</option>
                  <option value="4">4번</option>
                </select>
              )}
            </div>

            <div className="form-group">
              <label>해설</label>
              <textarea
                placeholder="정답에 대한 해설을 작성하세요"
                value={exercise.commentary}
                onChange={(e) => updateExercise(index, 'commentary', e.target.value)}
                rows={3}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 학습정리 */}
      <div className="subsection">
        <div className="list-header">
          <h4>학습정리</h4>
          <button className="btn-add-small" onClick={addSummary}>
            + 추가
          </button>
        </div>
        {lessonData.summary.map((sum, index) => (
          <div key={index} className="dynamic-item-vertical">
            <div className="item-header">
              <label>정리 {index + 1}</label>
              {lessonData.summary.length > 1 && (
                <button
                  className="btn-remove-inline"
                  onClick={() => removeSummary(index)}
                >
                  ×
                </button>
              )}
            </div>
            <RichTextEditor
              key={`summary-editor-${index}-${lessonData.lessonNumber}`}
              value={sum}
              onChange={(value) => updateSummary(index, value)}
              placeholder={`학습정리 내용 ${index + 1}`}
            />
          </div>
        ))}
      </div>

      {/* 다운로드 */}
      <div className="subsection">
        <h4>다운로드 파일</h4>
        <div className="form-group">
          <label>음성파일 ZIP URL</label>
          <input
            type="url"
            placeholder="https://cdn-it.livestudy.com/mov/2025/25itinse/down/25itinse_mp3_01.zip"
            value={lessonData.instructionUrl}
            onChange={(e) => handleDownloadChange('instructionUrl', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>교안 ZIP URL</label>
          <input
            type="url"
            placeholder="https://cdn-it.livestudy.com/mov/2025/25itinse/down/25itinse_book_01.zip"
            value={lessonData.guideUrl}
            onChange={(e) => handleDownloadChange('guideUrl', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

export default SummarySection;
