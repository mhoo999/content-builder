import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { BulletList } from "@tiptap/extension-bullet-list"
import { Image } from "@tiptap/extension-image"
import { Placeholder } from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import { TableRow } from "@tiptap/extension-table-row"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { mergeAttributes } from "@tiptap/core"
import { useEffect, useRef, useCallback, useState } from "react"
import { Math } from "./MathExtension"
import katex from "katex"
import "./RichTextEditor.css"

// 커스텀 Image extension - data-original-src 속성 지원
const CustomImage = Image.extend({
  name: "customImage",
  addAttributes() {
    return {
      ...this.parent?.(),
      "data-original-src": {
        default: null,
        parseHTML: (element) => element.getAttribute("data-original-src"),
        renderHTML: (attributes) => {
          if (!attributes["data-original-src"]) {
            return {}
          }
          return { "data-original-src": attributes["data-original-src"] }
        },
      },
    }
  },
})

// 커스텀 BulletList extension - class 속성 지원 (체크 표시용)
const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      class: {
        default: null,
        parseHTML: (element) => {
          const classAttr = element.getAttribute("class")
          return classAttr || null
        },
        renderHTML: (attributes) => {
          if (!attributes.class) {
            return {}
          }
          // class 속성을 명시적으로 반환
          return { class: attributes.class }
        },
      },
    }
  },
  // renderHTML을 오버라이드하여 class 속성이 확실히 포함되도록 함
  renderHTML({ HTMLAttributes }) {
    return ["ul", { ...HTMLAttributes }, 0]
  },
})

// 커스텀 TableCell extension - text-align 및 background-color 속성 지원
const CustomTableCell = TableCell.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => {
          const style = element.getAttribute("style") || ""
          // background-color를 style에서 추출하여 별도 속성으로도 저장
          const bgColorMatch = element.getAttribute("style")?.match(/background-color:\s*([^;]+)/i)
          const bgColor = bgColorMatch ? bgColorMatch[1].trim() : null
          return style || (bgColor ? `background-color: ${bgColor};` : null)
        },
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {}
          }
          return { style: attributes.style }
        },
      },
    }
  },
})

// 커스텀 TableHeader extension - text-align 및 background-color 속성 지원
const CustomTableHeader = TableHeader.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      style: {
        default: null,
        parseHTML: (element) => {
          const style = element.getAttribute("style") || ""
          // background-color를 style에서 추출하여 별도 속성으로도 저장
          const bgColorMatch = element.getAttribute("style")?.match(/background-color:\s*([^;]+)/i)
          const bgColor = bgColorMatch ? bgColorMatch[1].trim() : null
          return style || (bgColor ? `background-color: ${bgColor};` : null)
        },
        renderHTML: (attributes) => {
          if (!attributes.style) {
            return {}
          }
          return { style: attributes.style }
        },
      },
    }
  },
})

/**
 * 구글 Docs 표를 Tiptap 표 형식으로 정규화
 */
function normalizeGoogleDocsTable(html) {
  try {
    // 임시 DOM 요소 생성
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html

    // tableWrapper에서 표 추출
    const tableWrapper = tempDiv.querySelector(".tableWrapper")
    if (!tableWrapper) {
      // tableWrapper가 없으면 일반 표 찾기
      const table = tempDiv.querySelector("table")
      if (table) {
        return normalizeTable(table)
      }
      return null
    }

    const table = tableWrapper.querySelector("table")
    if (!table) return null

    return normalizeTable(table)
  } catch (error) {
    console.error("표 정규화 실패:", error)
    return null
  }
}

/**
 * 표를 Tiptap 형식으로 정규화
 */
function normalizeTable(table) {
  try {
    // 새 표 생성
    const normalizedTable = document.createElement("table")
    
    // tbody 처리
    const tbody = table.querySelector("tbody") || table
    const rows = tbody.querySelectorAll("tr")

    let isFirstRow = true
    rows.forEach((row, rowIndex) => {
      const normalizedRow = document.createElement("tr")
      const cells = row.querySelectorAll("td, th")

      cells.forEach((cell, cellIndex) => {
        // colspan과 rowspan 유지
        const colspan = cell.getAttribute("colspan") || "1"
        const rowspan = cell.getAttribute("rowspan") || "1"
        
        // 셀 타입 결정 (th인지 td인지)
        // 1. 이미 th 태그인 경우
        // 2. 첫 번째 행이고 배경색이 있는 경우 (구글 Docs 헤더 스타일)
        // 3. 첫 번째 열이고 배경색이 있는 경우 (세로형 표)
        const isHeader = 
          cell.tagName === "TH" || 
          cell.classList.contains("header") ||
          (isFirstRow && rowIndex === 0 && (cell.style.backgroundColor || cell.style.fontWeight === "bold")) ||
          (cellIndex === 0 && (cell.style.backgroundColor || cell.style.fontWeight === "bold"))
        
        const newCell = document.createElement(isHeader ? "th" : "td")

        if (colspan !== "1") newCell.setAttribute("colspan", colspan)
        if (rowspan !== "1") newCell.setAttribute("rowspan", rowspan)

        // 텍스트 정렬 스타일 유지 (left, center, right)
        const textAlign = cell.style.textAlign || ""
        if (textAlign && ["left", "center", "right"].includes(textAlign)) {
          newCell.style.textAlign = textAlign
        }

        // 배경색 유지 (헤더 색상이 아닌 경우만)
        const bgColor = cell.style.backgroundColor || ""
        if (bgColor && bgColor !== "rgb(255, 255, 255)" && bgColor !== "#ffffff") {
          newCell.style.backgroundColor = bgColor
        }

        // 셀 내용 추출 (p 태그나 직접 텍스트)
        const content = cell.innerHTML.trim()
        // p 태그가 있으면 그대로 유지, 없으면 p 태그로 감싸기
        if (content && !content.startsWith("<p")) {
          newCell.innerHTML = `<p>${content}</p>`
        } else if (content) {
          newCell.innerHTML = content
        } else {
          newCell.innerHTML = "<p></p>"
        }

        normalizedRow.appendChild(newCell)
      })

        normalizedTable.appendChild(normalizedRow)
      })
      
      isFirstRow = false
    })

    return normalizedTable.outerHTML
  } catch (error) {
    console.error("표 정규화 실패:", error)
    return null
  }
}

function RichTextEditor({ value, onChange, placeholder = "내용을 입력하세요..." }) {
  const fileInputRef = useRef(null)
  const editorRef = useRef(null)
  const [showMathModal, setShowMathModal] = useState(false)
  const [mathFormula, setMathFormula] = useState("")
  const [mathDisplay, setMathDisplay] = useState(false)

  // LaTeX 예시 (백슬래시 이스케이프)
  const mathExampleInline = "x^2 + y^2 = r^2"
  const mathExampleBlock = "\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}"

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 3], // H1, H3만 사용
        },
        bold: false, // 제거
        italic: false, // 제거
        strike: false, // 제거
        code: false, // 제거
        codeBlock: false, // 제거
        blockquote: false, // 제거
        orderedList: false, // 제거
        bulletList: false, // 커스텀 BulletList 사용
        horizontalRule: false, // 제거
        hardBreak: false, // 제거
        history: true, // 유지 (실행 취소/다시 실행)
        dropcursor: true, // 유지 (드래그 앤 드롭)
        gapcursor: true, // 유지 (커서)
      }),
      CustomBulletList,
      CustomImage.configure({
        inline: false,
        allowBase64: true,
        HTMLAttributes: {
          class: "notion-image",
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      CustomTableHeader,
      CustomTableCell,
      Math,
    ],
    content: value || "",
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: "notion-editor-content",
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0]
          if (file.type.startsWith("image/")) {
            event.preventDefault()
            handleImageFile(file)
            return true
          }
        }
        return false
      },
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (items) {
          for (const item of items) {
            if (item.type.startsWith("image/")) {
              event.preventDefault()
              const file = item.getAsFile()
              if (file) handleImageFile(file)
              return true
            }
          }
        }
        
        // 구글 Docs 표 정규화 처리
        const html = event.clipboardData?.getData("text/html")
        if (html && (html.includes("tableWrapper") || html.includes("<table"))) {
          event.preventDefault()
          const normalizedHtml = normalizeGoogleDocsTable(html)
          if (normalizedHtml && editorRef.current) {
            // 에디터에 표 삽입
            editorRef.current.chain().focus().insertContent(normalizedHtml).run()
            return true
          }
        }
        
        return false
      },
    },
  })

  // editor ref 업데이트
  useEffect(() => {
    if (editor) {
      editorRef.current = editor
    }
  }, [editor])

  const handleImageFile = useCallback(
    (file) => {
      if (!editor) return

      const reader = new FileReader()
      reader.onload = (e) => {
        editor.chain().focus().setImage({ src: e.target.result }).run()
      }
      reader.readAsDataURL(file)
    },
    [editor],
  )

  const handleImageUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      handleImageFile(file)
    }
    e.target.value = ""
  }

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || "")
    }
  }, [value, editor])

  // 이미지에 title 속성 추가 (호버 시 경로 표시) - 에디터 마운트 시 1회만 실행
  useEffect(() => {
    if (!editor) return

    const addImageTitles = () => {
      if (!editor.view || editor.isDestroyed) return
      try {
        const images = editor.view.dom.querySelectorAll("img[data-original-src]")
        images.forEach((img) => {
          const originalSrc = img.getAttribute("data-original-src")
          if (originalSrc && !img.title) {
            img.title = `원본 경로: ${originalSrc}`
          }
        })
      } catch (e) {
        // ignore
      }
    }

    // 초기 로드 시 실행
    const timer = setTimeout(addImageTitles, 200)

    return () => clearTimeout(timer)
  }, [editor])

  // 수식 렌더링 (renderHTML에서 렌더링하지 못하므로 클라이언트 측에서 처리)
  useEffect(() => {
    if (!editor) return

    const renderMath = () => {
      if (!editor.view || editor.isDestroyed) return
      try {
        const mathSpans = editor.view.dom.querySelectorAll("span[data-formula]")
        mathSpans.forEach((span) => {
          // 이미 렌더링된 경우 스킵
          if (span.querySelector(".katex")) return

          const formula = span.getAttribute("data-formula")
          const display = span.hasAttribute("data-display")

          if (!formula) {
            span.className = "math-empty"
            span.textContent = "수식"
            return
          }

          try {
            const html = katex.renderToString(formula, {
              throwOnError: false,
              displayMode: display,
            })
            span.innerHTML = html
            span.className = display ? "math-block" : "math-inline"
          } catch (error) {
            span.className = "math-error"
            span.textContent = `수식 오류: ${formula}`
          }
        })
      } catch (e) {
        // ignore
      }
    }

    // 에디터 업데이트 시 수식 렌더링
    const handleUpdate = () => {
      setTimeout(renderMath, 0)
    }

    editor.on("update", handleUpdate)
    editor.on("selectionUpdate", handleUpdate)

    // 초기 렌더링
    setTimeout(renderMath, 100)

    return () => {
      if (editor && !editor.isDestroyed) {
        editor.off("update", handleUpdate)
        editor.off("selectionUpdate", handleUpdate)
      }
    }
  }, [editor])

  const handleMathInsert = () => {
    if (!editor) return
    setShowMathModal(true)
    setMathFormula("")
    setMathDisplay(false)
  }

  const handleMathConfirm = () => {
    if (!editor || !mathFormula.trim()) return

    editor
      .chain()
      .focus()
      .setMath({
        formula: mathFormula.trim(),
        display: mathDisplay,
      })
      .run()

    setShowMathModal(false)
    setMathFormula("")
    setMathDisplay(false)
  }

  const handleMathCancel = () => {
    setShowMathModal(false)
    setMathFormula("")
    setMathDisplay(false)
  }

  useEffect(() => {
    return () => {
      if (editor) {
        editor.destroy()
      }
    }
  }, [editor])

  if (!editor) {
    return <div className="notion-editor-loading">로딩 중...</div>
  }

  return (
    <div className="notion-editor-wrapper">
      {/* 상단 툴바 */}
      <div className="notion-toolbar">
        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={editor.isActive("heading", { level: 1 }) ? "is-active" : ""}
            title="제목 1 (# + space)"
          >
            H1
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={editor.isActive("heading", { level: 3 }) ? "is-active" : ""}
            title="제목 3 (### + space)"
          >
            H3
          </button>
        </div>

        <span className="toolbar-divider" />

        <div className="toolbar-group">
          <button
            type="button"
            onClick={() => {
              // 일반 블릿 목록 생성/토글
              const { $from } = editor.state.selection
              let listPos = null
              let listNode = null

              // 블릿 목록 노드 찾기
              for (let depth = $from.depth; depth > 0; depth--) {
                const node = $from.node(depth)
                if (node.type.name === "bulletList") {
                  listNode = node
                  listPos = $from.before(depth)
                  break
                }
              }

              if (listNode && listPos !== null) {
                // 이미 블릿 목록이 있으면 체크 표시 제거하고 일반 블릿으로
                const isCheckBullet = listNode.attrs?.class === "check-bullet"
                if (isCheckBullet) {
                  editor
                    .chain()
                    .focus()
                    .command(({ tr }) => {
                      const node = tr.doc.nodeAt(listPos)
                      if (node) {
                        tr.setNodeMarkup(listPos, null, { ...node.attrs, class: null })
                      }
                      return true
                    })
                    .run()
                } else {
                  // 이미 일반 블릿이면 토글 (제거)
                  editor.chain().focus().toggleBulletList().run()
                }
              } else {
                // 블릿 목록 생성
                editor.chain().focus().toggleBulletList().run()
              }
            }}
            className={(() => {
              if (!editor.isActive("bulletList")) return ""
              const { $from } = editor.state.selection
              for (let depth = $from.depth; depth > 0; depth--) {
                const node = $from.node(depth)
                if (node.type.name === "bulletList") {
                  return node.attrs?.class === "check-bullet" ? "" : "is-active"
                }
              }
              return editor.isActive("bulletList") ? "is-active" : ""
            })()}
            title="블릿 목록 (- + space)"
          >
            •
          </button>
          <button
            type="button"
            onClick={() => {
              // 체크 표시 블릿 목록 생성/토글
              const { $from } = editor.state.selection
              let listPos = null
              let listNode = null

              // 블릿 목록 노드 찾기
              for (let depth = $from.depth; depth > 0; depth--) {
                const node = $from.node(depth)
                if (node.type.name === "bulletList") {
                  listNode = node
                  listPos = $from.before(depth)
                  break
                }
              }

              if (listNode && listPos !== null) {
                // 이미 블릿 목록이 있으면 체크 표시 토글
                const isCheckBullet = listNode.attrs?.class === "check-bullet"

                if (isCheckBullet) {
                  // 체크 표시 제거 (일반 블릿으로)
                  editor
                    .chain()
                    .focus()
                    .command(({ tr }) => {
                      const node = tr.doc.nodeAt(listPos)
                      if (node) {
                        tr.setNodeMarkup(listPos, null, { ...node.attrs, class: null })
                      }
                      return true
                    })
                    .run()
                } else {
                  // 체크 표시 추가
                  editor
                    .chain()
                    .focus()
                    .command(({ tr }) => {
                      const node = tr.doc.nodeAt(listPos)
                      if (node) {
                        tr.setNodeMarkup(listPos, null, { ...node.attrs, class: "check-bullet" })
                      }
                      return true
                    })
                    .run()
                }
              } else {
                // 체크 표시 블릿 목록 생성
                editor.chain().focus().toggleBulletList().run()
                setTimeout(() => {
                  editor
                    .chain()
                    .focus()
                    .command(({ tr, state }) => {
                      const { $from } = state.selection
                      for (let depth = $from.depth; depth > 0; depth--) {
                        const node = $from.node(depth)
                        if (node.type.name === "bulletList") {
                          const pos = $from.before(depth)
                          tr.setNodeMarkup(pos, null, { ...node.attrs, class: "check-bullet" })
                          break
                        }
                      }
                      return true
                    })
                    .run()
                }, 10)
              }
            }}
            className={(() => {
              if (!editor.isActive("bulletList")) return ""
              const { $from } = editor.state.selection
              for (let depth = $from.depth; depth > 0; depth--) {
                const node = $from.node(depth)
                if (node.type.name === "bulletList") {
                  return node.attrs?.class === "check-bullet" ? "is-active" : ""
                }
              }
              return ""
            })()}
            title="체크 표시 블릿 (✓)"
          >
            ✓
          </button>
        </div>

        <span className="toolbar-divider" />

        <div className="toolbar-group">
          <button type="button" onClick={handleImageUpload} title="이미지 삽입 (드래그 앤 드롭 가능)">
            🖼 이미지
          </button>
          <div className="table-insert-group">
            <button
              type="button"
              onClick={() => {
                // 가로형 표 삽입 (첫 번째 행이 제목)
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
              }}
              title="가로형 표 삽입 (첫 번째 행이 제목)"
            >
              ⊞ 가로
            </button>
            <button
              type="button"
              onClick={() => {
                // 세로형 표 삽입 (첫 번째 열이 제목)
                editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: false }).run()
                // 첫 번째 열의 모든 셀을 헤더로 변환
                setTimeout(() => {
                  editor
                    .chain()
                    .focus()
                    .command(({ tr, state }) => {
                      const { $from } = state.selection
                      let tablePos = null

                      // 테이블 노드 찾기
                      for (let depth = $from.depth; depth > 0; depth--) {
                        const node = $from.node(depth)
                        if (node.type.name === "table") {
                          tablePos = $from.before(depth)
                          break
                        }
                      }

                      if (tablePos === null) return false

                      const tableNode = tr.doc.nodeAt(tablePos)
                      if (!tableNode) return false

                      // 테이블의 각 행을 순회하며 첫 번째 열의 셀을 헤더로 변환
                      let pos = tablePos + 1
                      tableNode.forEach((rowNode) => {
                        if (rowNode.type.name === "tableRow") {
                          const rowStart = pos
                          pos += 1 // row 시작

                          // 첫 번째 셀 찾기
                          rowNode.forEach((cellNode, cellOffset) => {
                            if (cellOffset === 0 && cellNode.type.name === "tableCell") {
                              // 첫 번째 셀을 헤더로 변환
                              const cellPos = rowStart + 1
                              const headerType = state.schema.nodes.tableHeader
                              if (headerType) {
                                tr.setNodeMarkup(cellPos, headerType, cellNode.attrs)
                              }
                            }
                            pos += cellNode.nodeSize
                          })

                          pos = rowStart + rowNode.nodeSize
                        } else {
                          pos += rowNode.nodeSize
                        }
                      })

                      return true
                    })
                    .run()
                }, 100)
              }}
              title="세로형 표 삽입 (첫 번째 열이 제목)"
            >
              ⊞ 세로
            </button>
          </div>
          <button type="button" onClick={handleMathInsert} title="수식 삽입 (LaTeX)">
            ∑ 수식
          </button>
        </div>

        {/* 표 편집 버튼들 (표 안에 있을 때만 표시) */}
        {editor.isActive("table") && (
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
              <button type="button" onClick={() => editor.chain().focus().deleteColumn().run()} title="열 삭제">
                열 ×
              </button>
              <button type="button" onClick={() => editor.chain().focus().addRowBefore().run()} title="위에 행 추가">
                ↑ 행
              </button>
              <button type="button" onClick={() => editor.chain().focus().addRowAfter().run()} title="아래에 행 추가">
                행 ↓
              </button>
              <button type="button" onClick={() => editor.chain().focus().deleteRow().run()} title="행 삭제">
                행 ×
              </button>
              <span className="toolbar-divider" />
              <button
                type="button"
                onClick={() => {
                  // 현재 셀에 좌측 정렬 적용
                  editor
                    .chain()
                    .focus()
                    .command(({ tr, state }) => {
                      const { $from } = state.selection
                      for (let depth = $from.depth; depth > 0; depth--) {
                        const node = $from.node(depth)
                        if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
                          const pos = $from.before(depth)
                          const attrs = { ...node.attrs, style: "text-align: left;" }
                          tr.setNodeMarkup(pos, null, attrs)
                          return true
                        }
                      }
                      return false
                    })
                    .run()
                }}
                title="좌측 정렬"
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => {
                  // 현재 셀에 중앙 정렬 적용
                  editor
                    .chain()
                    .focus()
                    .command(({ tr, state }) => {
                      const { $from } = state.selection
                      for (let depth = $from.depth; depth > 0; depth--) {
                        const node = $from.node(depth)
                        if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
                          const pos = $from.before(depth)
                          const attrs = { ...node.attrs, style: "text-align: center;" }
                          tr.setNodeMarkup(pos, null, attrs)
                          return true
                        }
                      }
                      return false
                    })
                    .run()
                }}
                title="중앙 정렬"
              >
                ↔
              </button>
              <span className="toolbar-divider" />
              <button
                type="button"
                onClick={() => {
                  // 현재 셀에 배경색 적용 (색상 선택 다이얼로그)
                  const color = prompt("배경색을 입력하세요 (예: #ff831e, red, rgb(255, 131, 30)):", "#ff831e")
                  if (color) {
                    editor
                      .chain()
                      .focus()
                      .command(({ tr, state }) => {
                        const { $from } = state.selection
                        for (let depth = $from.depth; depth > 0; depth--) {
                          const node = $from.node(depth)
                          if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
                            const pos = $from.before(depth)
                            const currentStyle = node.attrs.style || ""
                            // 기존 background-color 제거
                            const cleanedStyle = currentStyle.replace(/background-color:\s*[^;]+;?/gi, "").trim()
                            const newStyle = cleanedStyle 
                              ? `${cleanedStyle}; background-color: ${color};`
                              : `background-color: ${color};`
                            const attrs = { ...node.attrs, style: newStyle }
                            tr.setNodeMarkup(pos, null, attrs)
                            return true
                          }
                        }
                        return false
                      })
                      .run()
                  }
                }}
                title="셀 배경색 변경"
              >
                🎨 색상
              </button>
              <button
                type="button"
                onClick={() => {
                  // 현재 셀의 배경색 제거
                  editor
                    .chain()
                    .focus()
                    .command(({ tr, state }) => {
                      const { $from } = state.selection
                      for (let depth = $from.depth; depth > 0; depth--) {
                        const node = $from.node(depth)
                        if (node.type.name === "tableCell" || node.type.name === "tableHeader") {
                          const pos = $from.before(depth)
                          const currentStyle = node.attrs.style || ""
                          // background-color 제거
                          const cleanedStyle = currentStyle.replace(/background-color:\s*[^;]+;?/gi, "").trim()
                          const attrs = { ...node.attrs, style: cleanedStyle || null }
                          tr.setNodeMarkup(pos, null, attrs)
                          return true
                        }
                      }
                      return false
                    })
                    .run()
                }}
                title="배경색 제거"
              >
                🚫 색상 제거
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
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />

      {/* 힌트 */}
      <div className="notion-editor-hint">
        <span>💡 마크다운: # H1, ### H3, - 블릿 | 이미지 드래그 앤 드롭 · 붙여넣기 가능 | 수식: ∑ 버튼 클릭</span>
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
                  <input type="checkbox" checked={mathDisplay} onChange={(e) => setMathDisplay(e.target.checked)} />
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
                  <strong>예시:</strong>
                  <br />
                  인라인: <code>{mathExampleInline}</code>
                  <br />
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
  )
}

// 수식 미리보기 컴포넌트
function MathPreview({ formula, display }) {
  const [error, setError] = useState(null)
  const previewRef = useRef(null)

  useEffect(() => {
    if (!previewRef.current || !formula) return

    try {
      katex.render(formula, previewRef.current, {
        throwOnError: true,
        displayMode: display,
      })
      setError(null)
    } catch (e) {
      setError(e.message)
    }
  }, [formula, display])

  if (error) {
    return <span className="math-error">오류: {error}</span>
  }

  return <span ref={previewRef} />
}

export default RichTextEditor
