import katex from 'katex'
import 'katex/dist/katex.min.css'

/**
 * 수식을 이미지로 변환 (base64)
 */
export async function convertMathToImage(formula, displayMode = false) {
  try {
    if (!formula || !formula.trim()) {
      console.warn('수식이 비어있음')
      return null
    }

    // KaTeX로 HTML 렌더링
    const html = katex.renderToString(formula, {
      throwOnError: false,
      displayMode: displayMode,
    })

    // 임시 DOM 요소 생성
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    container.style.background = 'white'
    container.style.padding = displayMode ? '20px' : '10px'
    container.innerHTML = html
    document.body.appendChild(container)

    // 렌더링 대기 (KaTeX CSS 적용 대기)
    await new Promise(resolve => setTimeout(resolve, 200))

    // KaTeX가 생성한 요소 찾기 (span.katex)
    const katexElement = container.querySelector('.katex')
    if (!katexElement) {
      console.warn('KaTeX 요소를 찾을 수 없음:', formula, html.substring(0, 200))
      document.body.removeChild(container)
      return null
    }

    // 실제 렌더링된 크기 확인
    const rect = katexElement.getBoundingClientRect()
    const padding = displayMode ? 20 : 10
    const width = Math.ceil(rect.width || 100) + padding * 2
    const height = Math.ceil(rect.height || 30) + padding * 2

    // html2canvas를 사용하여 KaTeX HTML을 이미지로 변환 (CORS 문제 방지)
    try {
      const { default: html2canvas } = await import('html2canvas')
      
      // 수식 이미지는 원본 크기로 캡처한 후 0.8배로 축소
      // html2canvas는 요소의 실제 렌더링 크기를 사용하므로 width/height를 지정하지 않음
      const canvas = await html2canvas(katexElement, {
        backgroundColor: 'white',
        scale: 2, // 고해상도로 캡처
        useCORS: false, // CORS 문제 방지
        logging: false,
        allowTaint: false,
        removeContainer: false,
        // width/height를 지정하지 않으면 요소의 실제 렌더링 크기 사용
      })
      
      console.log(`수식 원본 캡처: ${canvas.width}x${canvas.height}, 요소 크기: ${rect.width}x${rect.height}`)
      
      // 1.0배로 유지 (축소하지 않음)
      // Base64로 변환
      const base64 = canvas.toDataURL('image/png')
      console.log(`수식 이미지 변환 성공 (html2canvas, 1.0배): ${formula.substring(0, 30)}... -> 크기: ${canvas.width}x${canvas.height}`)
      
      document.body.removeChild(container)
      return base64
    } catch (html2canvasError) {
      console.warn('html2canvas 사용 실패, 대체 방법 시도:', html2canvasError)
      
      // html2canvas가 없거나 실패한 경우, foreignObject 방식 시도 (CORS 문제 가능)
      const katexHtml = katexElement.outerHTML
      
      // SVG에 HTML을 포함 (foreignObject 사용)
      const svgData = `
        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" width="${width}" height="${height}">
          <foreignObject width="100%" height="100%" x="0" y="0">
            <xhtml:div style="background: white; padding: ${padding}px; font-size: 1em; font-family: KaTeX_Main, 'Times New Roman', serif;">
              ${katexHtml}
            </xhtml:div>
          </foreignObject>
        </svg>
      `
      
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
      const url = URL.createObjectURL(svgBlob)

      // Image 객체로 로드
      const img = new Image()
      await new Promise((resolve, reject) => {
        img.onload = () => {
          console.log(`수식 SVG 이미지 로드 성공: ${img.width}x${img.height}`)
          resolve()
        }
        img.onerror = (e) => {
          console.error('수식 SVG 이미지 로드 실패', e)
          URL.revokeObjectURL(url)
          reject(e)
        }
        img.src = url
      })

      // Canvas에 그리기
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      
      // 배경
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, width, height)
      
      try {
        ctx.drawImage(img, 0, 0, width, height)
        console.log(`Canvas에 수식 이미지 그리기 성공: ${width}x${height}`)
      } catch (e) {
        console.error('Canvas에 이미지 그리기 실패 (CORS 문제 가능)', e)
        URL.revokeObjectURL(url)
        document.body.removeChild(container)
        return null
      }

      // Base64로 변환
      let base64
      try {
        base64 = canvas.toDataURL('image/png')
        console.log(`수식 이미지 변환 성공: ${formula.substring(0, 30)}... -> base64 길이: ${base64.length}`)
      } catch (e) {
        console.error('Canvas toDataURL 실패 (CORS 문제)', e)
        URL.revokeObjectURL(url)
        document.body.removeChild(container)
        return null
      }
      
      URL.revokeObjectURL(url)
      document.body.removeChild(container)
      return base64
    }

    // 정리
    URL.revokeObjectURL(url)
    document.body.removeChild(container)

    return base64
  } catch (error) {
    console.error('수식 이미지 변환 실패:', error, formula)
    return null
  }
}

/**
 * HTML 표를 이미지로 변환 (base64)
 * Canvas를 직접 사용하여 표를 그리기
 */
export async function convertTableToImage(tableHtml) {
  try {
    // 임시 DOM 요소 생성
    const container = document.createElement('div')
    container.style.position = 'absolute'
    container.style.left = '-9999px'
    container.style.top = '-9999px'
    container.style.background = 'white'
    container.style.padding = '20px'
    container.style.width = '800px' // 고정 너비
    container.innerHTML = tableHtml
    document.body.appendChild(container)

    // CSS 스타일 적용
    const style = document.createElement('style')
    style.textContent = `
      table {
        border-collapse: collapse;
        width: 100%;
        font-family: Arial, sans-serif;
        font-size: 14px;
      }
      th {
        background-color: #ff831e;
        color: white;
        padding: 8px;
        text-align: left;
        border: 1px solid #ddd;
      }
      td {
        border: 1px solid #ddd;
        padding: 8px;
      }
    `
    container.appendChild(style)

    // 표 요소 찾기
    const table = container.querySelector('table')
    if (!table) {
      document.body.removeChild(container)
      return null
    }

    // 표를 Canvas에 직접 그리기 (CORS 문제 방지)
    try {
      // 렌더링 대기
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const rect = table.getBoundingClientRect()
      // 표 이미지는 1.0배로 유지
      const scale = 1.0
      const basePadding = 20
      const padding = Math.ceil(basePadding * scale)
      const baseWidth = Math.max(rect.width || 600, 600)
      const width = Math.ceil(baseWidth * scale) + padding * 2
      
      const rows = table.querySelectorAll('tr')
      const baseCellPadding = 8
      const cellPadding = Math.ceil(baseCellPadding * scale)
      const headerColor = '#ff831e'
      const borderColor = '#ddd'
      const textColor = '#000'
      const headerTextColor = '#fff'
      // 폰트 크기도 1.4배로 확대
      const baseFontSize = 14
      const fontSize = Math.ceil(baseFontSize * scale)
      const lineHeight = fontSize * 1.4
      
      // 각 행의 높이 계산 (원본 크기로 계산 후 scale 적용)
      const baseRowHeights = []
      const baseLineHeight = baseFontSize * 1.4
      rows.forEach(row => {
        const cells = row.querySelectorAll('th, td')
        let maxHeight = baseLineHeight + baseCellPadding * 2
        cells.forEach(cell => {
          const cellText = (cell.textContent || cell.innerText || '').trim()
          const lines = cellText.split('\n').filter(l => l.trim()).length || 1
          const cellHeight = Math.max(baseLineHeight * lines + baseCellPadding * 2, baseLineHeight + baseCellPadding * 2)
          maxHeight = Math.max(maxHeight, cellHeight)
        })
        baseRowHeights.push(maxHeight)
      })
      
      // 확대된 행 높이 계산
      const rowHeights = baseRowHeights.map(h => Math.ceil(h * scale))
      
      const baseTotalHeight = baseRowHeights.reduce((sum, h) => sum + h, 0)
      const totalHeight = Math.ceil(baseTotalHeight * scale) + padding * 2
      
      console.log(`표 이미지 변환 시작: 원본 크기 ${rect.width}x${rect.height}, 확대 크기 ${width}x${totalHeight} (scale: ${scale})`)
      console.log(`표 행 높이 계산: 원본 총 높이 ${baseTotalHeight}, 확대 총 높이 ${totalHeight}, scale: ${scale}`)
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = totalHeight
      const ctx = canvas.getContext('2d')
      
      // 배경
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, width, totalHeight)
      
      // 각 행의 최대 열 수 계산
      const colCounts = []
      rows.forEach(row => {
        colCounts.push(row.querySelectorAll('th, td').length)
      })
      const maxCols = Math.max(...colCounts)
      const baseCellWidth = (baseWidth - basePadding * 2) / maxCols
      const cellWidth = Math.ceil(baseCellWidth * scale)
      
      console.log(`표 셀 크기: 원본 셀 너비 ${baseCellWidth}, 확대 셀 너비 ${cellWidth}`)
      
      // 표 타입 감지: 세로형(첫 번째 열이 모두 헤더) vs 가로형(첫 번째 행이 모두 헤더)
      let isVerticalTable = false
      if (rows.length > 0) {
        const firstRowCells = rows[0].querySelectorAll('th, td')
        if (firstRowCells.length > 0) {
          // 첫 번째 열의 모든 셀이 th인지 확인
          let firstColAllTh = true
          for (let i = 0; i < rows.length; i++) {
            const rowCells = rows[i].querySelectorAll('th, td')
            if (rowCells.length > 0 && rowCells[0].tagName !== 'TH') {
              firstColAllTh = false
              break
            }
          }
          // 첫 번째 행의 첫 번째 셀이 th이고, 첫 번째 행의 나머지 셀이 td이면 가로형
          // 첫 번째 열의 모든 셀이 th이면 세로형
          if (firstColAllTh && firstRowCells.length > 1 && firstRowCells[1].tagName === 'TD') {
            isVerticalTable = true
          }
        }
      }
      
      let currentY = padding
      
      rows.forEach((row, rowIndex) => {
        const cells = row.querySelectorAll('th, td')
        const rowHeight = rowHeights[rowIndex]
        let currentX = padding
        
        cells.forEach((cell, cellIndex) => {
          // 셀 배경
          // 세로형 표: 첫 번째 열(cellIndex === 0)이 헤더
          // 가로형 표: 첫 번째 행(rowIndex === 0)이 헤더
          const isHeader = isVerticalTable 
            ? (cellIndex === 0)  // 세로형: 첫 번째 열이 모두 헤더
            : (rowIndex === 0)   // 가로형: 첫 번째 행이 모두 헤더
          
          if (isHeader) {
            ctx.fillStyle = headerColor
          } else {
            ctx.fillStyle = 'white'
          }
          ctx.fillRect(currentX, currentY, cellWidth, rowHeight)
          
          // 셀 테두리 (1.2배 확대)
          ctx.strokeStyle = borderColor
          ctx.lineWidth = Math.ceil(1 * scale)
          ctx.strokeRect(currentX, currentY, cellWidth, rowHeight)
          
          // 텍스트
          const text = (cell.textContent || cell.innerText || '').trim()
          ctx.fillStyle = isHeader ? headerTextColor : textColor
          ctx.font = `${fontSize}px Arial`
          ctx.textBaseline = 'top'
          
          // 텍스트 정렬 확인
          const computedStyle = window.getComputedStyle(cell)
          const textAlign = computedStyle.textAlign || 'left'
          if (textAlign === 'center') {
            ctx.textAlign = 'center'
          } else {
            ctx.textAlign = 'left'
          }
          
          // 텍스트 그리기 (여러 줄 지원)
          const lines = text.split('\n').filter(l => l.trim())
          const textX = textAlign === 'center' ? currentX + cellWidth / 2 : currentX + cellPadding
          let textY = currentY + cellPadding
          
          if (lines.length === 0) {
            lines.push('')
          }
          
          lines.forEach(line => {
            if (line.trim()) {
              // 텍스트가 너무 길면 자르기
              const maxWidth = cellWidth - cellPadding * 2
              let displayText = line
              const metrics = ctx.measureText(line)
              if (metrics.width > maxWidth) {
                let truncated = line
                while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
                  truncated = truncated.slice(0, -1)
                }
                displayText = truncated + '...'
              }
              ctx.fillText(displayText, textX, textY)
              textY += lineHeight
            }
          })
          
          currentX += cellWidth
        })
        
        currentY += rowHeight
      })
      
      const base64 = canvas.toDataURL('image/png')
      document.body.removeChild(container)
      
      return base64
    } catch (e) {
      console.warn('표 이미지 변환 실패:', e)
      document.body.removeChild(container)
      return null
    }
  } catch (error) {
    console.error('표 이미지 변환 실패:', error)
    return null
  }
}

/**
 * HTML 콘텐츠에서 수식과 표를 이미지로 변환
 * RichTextEditor에 입력된 수식(<span data-formula>)과 표(<table>)만 변환
 */
export async function convertMathAndTablesToImages(htmlContent) {
  if (!htmlContent || typeof htmlContent !== 'string') {
    return htmlContent
  }

  // 수식이나 표가 없으면 변환하지 않음
  if (!htmlContent.includes('data-formula') && !htmlContent.includes('<table')) {
    return htmlContent
  }

  // 임시 DOM 요소 생성
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = htmlContent

  // 수식 변환: <span data-formula="..." data-display>...</span>
  const mathSpans = tempDiv.querySelectorAll('span[data-formula]')
  console.log(`수식 발견: ${mathSpans.length}개`)
  
  // 역순으로 처리 (DOM 변경 시 인덱스 문제 방지)
  for (let i = mathSpans.length - 1; i >= 0; i--) {
    const span = mathSpans[i]
    const formula = span.getAttribute('data-formula')
    const displayMode = span.hasAttribute('data-display') || span.classList.contains('math-block')

    if (formula && formula.trim()) {
      console.log(`수식 변환 중: ${formula}, displayMode: ${displayMode}`)
      const base64 = await convertMathToImage(formula, displayMode)
      if (base64) {
        const img = document.createElement('img')
        img.src = base64
        img.alt = `수식: ${formula}`
        img.setAttribute('data-math-formula', formula)
        img.setAttribute('data-display', displayMode ? 'true' : 'false')
        if (span.parentNode) {
          span.parentNode.replaceChild(img, span)
          console.log(`수식 변환 완료: ${formula.substring(0, 20)}...`)
        } else {
          console.warn(`수식 부모 노드 없음: ${formula}`)
        }
      } else {
        console.warn(`수식 변환 실패: ${formula}`)
      }
    } else {
      console.warn(`수식 공식 없음 또는 비어있음:`, span)
    }
  }

  // 표 변환: <table>...</table>
  const tables = tempDiv.querySelectorAll('table')
  console.log(`표 발견: ${tables.length}개`)
  
  // 역순으로 처리 (DOM 변경 시 인덱스 문제 방지)
  for (let i = tables.length - 1; i >= 0; i--) {
    const table = tables[i]
    const tableHtml = table.outerHTML
    console.log(`표 변환 중...`)
    const base64 = await convertTableToImage(tableHtml)
    if (base64) {
      const img = document.createElement('img')
      img.src = base64
      img.alt = '표'
      img.setAttribute('data-table', 'true')
      table.parentNode?.replaceChild(img, table)
      console.log(`표 변환 완료`)
    } else {
      console.warn(`표 변환 실패`)
    }
  }

  const result = tempDiv.innerHTML
  console.log(`변환 결과 HTML 길이: ${result.length}, 수식/표 포함 여부: ${result.includes('data:image')}`)
  return result
}

/**
 * 객체의 모든 HTML 필드에서 수식과 표를 이미지로 변환
 */
export async function convertAllMathAndTablesInData(data) {
  console.log('수식과 표 변환 시작...')
  const converted = JSON.parse(JSON.stringify(data)) // Deep clone

  let conversionCount = 0

  // 재귀적으로 HTML 필드를 찾아 변환
  async function processValue(value, path = '') {
    if (typeof value === 'string' && value.includes('<')) {
      // HTML 태그가 포함된 문자열인 경우
      const hasMath = value.includes('data-formula')
      const hasTable = value.includes('<table')
      
      if (hasMath || hasTable) {
        console.log(`변환 대상 발견 (${path}): 수식=${hasMath}, 표=${hasTable}`)
        conversionCount++
        const converted = await convertMathAndTablesToImages(value)
        return converted
      }
    } else if (Array.isArray(value)) {
      return await Promise.all(value.map((item, index) => processValue(item, `${path}[${index}]`)))
    } else if (value && typeof value === 'object') {
      const processed = {}
      for (const key in value) {
        processed[key] = await processValue(value[key], path ? `${path}.${key}` : key)
      }
      return processed
    }
    return value
  }

  const result = await processValue(converted)
  console.log(`변환 완료: ${conversionCount}개 필드 처리됨`)
  return result
}

