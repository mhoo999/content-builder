/**
 * base64 이미지가 포함된 텍스트를 textarea에 표시하기 위해 축약하는 유틸리티
 */

/**
 * base64 이미지 태그를 짧은 표시로 대체
 * @param {string} text - 원본 텍스트
 * @returns {string} - 축약된 텍스트
 */
export const shortenImageText = (text) => {
  if (!text) return '';
  
  // <img src="data:image/..."> 형태의 이미지 태그를 찾아서 [이미지]로 대체
  const imgTagRegex = /<img[^>]*src=["']data:image\/[^"']+["'][^>]*>/gi;
  
  let shortened = text;
  let imageCount = 0;
  
  shortened = shortened.replace(imgTagRegex, (match) => {
    imageCount++;
    return `[이미지 ${imageCount}]`;
  });
  
  return shortened;
};

/**
 * 축약된 텍스트에서 [이미지 N]을 원본 이미지 태그로 복원
 * @param {string} shortenedText - 축약된 텍스트 (사용자가 편집한 텍스트)
 * @param {string} originalText - 원본 텍스트 (이미지 태그 포함)
 * @returns {string} - 복원된 텍스트
 */
export const restoreImageText = (shortenedText, originalText) => {
  if (!shortenedText && !originalText) return '';
  if (!originalText) return shortenedText;
  if (!shortenedText) return originalText;
  
  // 원본에서 이미지 태그들을 추출
  const imgTagRegex = /<img[^>]*src=["']data:image\/[^"']+["'][^>]*>/gi;
  const images = originalText.match(imgTagRegex) || [];
  
  if (images.length === 0) {
    // 원본에 이미지가 없으면 그냥 반환
    return shortenedText;
  }
  
  // 축약된 텍스트에서 [이미지 N] 패턴 찾기
  const imagePlaceholderRegex = /\[이미지\s+(\d+)\]/g;
  const placeholders = [];
  let match;
  
  // 모든 매치를 찾아서 배열에 저장
  const tempText = shortenedText;
  while ((match = imagePlaceholderRegex.exec(tempText)) !== null) {
    placeholders.push({
      index: parseInt(match[1], 10) - 1, // 0-based index
      placeholder: match[0],
      position: match.index
    });
  }
  
  // [이미지 N]을 원본 이미지 태그로 대체
  let restored = shortenedText;
  
  // 역순으로 대체 (인덱스가 변경되지 않도록)
  placeholders.reverse().forEach(({ index, placeholder }) => {
    if (index >= 0 && index < images.length) {
      // 첫 번째 매치만 대체 (replace는 첫 번째만 대체)
      restored = restored.replace(placeholder, images[index]);
    }
  });
  
  return restored;
};

/**
 * 텍스트에 이미지가 포함되어 있는지 확인
 * @param {string} text - 확인할 텍스트
 * @returns {boolean} - 이미지 포함 여부
 */
export const hasImage = (text) => {
  if (!text) return false;
  const imgTagRegex = /<img[^>]*src=["']data:image\/[^"']+["'][^>]*>/gi;
  return imgTagRegex.test(text);
};

