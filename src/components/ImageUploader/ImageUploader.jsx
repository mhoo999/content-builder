import { useState, useRef } from 'react';
import './ImageUploader.css';

function ImageUploader({ onImageInsert, disabled = false }) {
  const [preview, setPreview] = useState(null);
  const [imageName, setImageName] = useState('');
  const [originalImage, setOriginalImage] = useState(null);
  const [imageWidth, setImageWidth] = useState(0);
  const [imageHeight, setImageHeight] = useState(0);
  const [targetWidth, setTargetWidth] = useState(0);
  const [targetHeight, setTargetHeight] = useState(0);
  const [keepRatio, setKeepRatio] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target.result;

      // HTMLImageElement로 로드하여 원본 크기 확인
      const img = document.createElement('img');
      img.onload = () => {
        setPreview(base64);
        setImageName(file.name);
        setOriginalImage(img);
        setImageWidth(img.naturalWidth);
        setImageHeight(img.naturalHeight);

        // 기본 타겟 크기는 원본 크기 또는 최대 600px
        const maxWidth = 600;
        if (img.naturalWidth > maxWidth) {
          setTargetWidth(maxWidth);
          setTargetHeight(Math.round((maxWidth / img.naturalWidth) * img.naturalHeight));
        } else {
          setTargetWidth(img.naturalWidth);
          setTargetHeight(img.naturalHeight);
        }
      };
      img.onerror = () => {
        console.error('이미지 로드 실패');
        alert('이미지를 로드할 수 없습니다.');
      };
      img.src = base64;
    };
    reader.readAsDataURL(file);
  };

  // 타겟 크기 변경 핸들러
  const handleWidthChange = (value) => {
    const newWidth = parseInt(value) || 0;
    setTargetWidth(newWidth);

    if (keepRatio && originalImage) {
      const ratio = originalImage.naturalHeight / originalImage.naturalWidth;
      setTargetHeight(Math.round(newWidth * ratio));
    }
  };

  const handleHeightChange = (value) => {
    const newHeight = parseInt(value) || 0;
    setTargetHeight(newHeight);

    if (keepRatio && originalImage) {
      const ratio = originalImage.naturalWidth / originalImage.naturalHeight;
      setTargetWidth(Math.round(newHeight * ratio));
    }
  };

  // Canvas를 사용하여 이미지 리사이즈
  const resizeImage = (img, width, height) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    return canvas.toDataURL('image/png');
  };

  const insertImage = () => {
    if (!preview) {
      alert('먼저 이미지를 선택해주세요.');
      return;
    }

    // 리사이즈 적용 (원본 크기와 다른 경우)
    let finalImage = preview;
    if (originalImage && (targetWidth !== imageWidth || targetHeight !== imageHeight)) {
      finalImage = resizeImage(originalImage, targetWidth, targetHeight);
    }

    // 이미지 HTML 태그 생성 (base64 embedded)
    const imageHtml = `<img src="${finalImage}" alt="${imageName}" style="max-width: 100%; height: auto;" />`;
    onImageInsert(imageHtml);

    // 리셋
    setPreview(null);
    setImageName('');
    setOriginalImage(null);
    setImageWidth(0);
    setImageHeight(0);
    setTargetWidth(0);
    setTargetHeight(0);

    // input 파일 선택기 리셋 (같은 파일을 다시 선택할 수 있도록)
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const cancelImage = () => {
    setPreview(null);
    setImageName('');
    setOriginalImage(null);
    setImageWidth(0);
    setImageHeight(0);
    setTargetWidth(0);
    setTargetHeight(0);

    // input 파일 선택기 리셋
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="image-uploader">
      <div className="uploader-controls">
        <label className={`btn-upload ${disabled ? 'disabled' : ''}`}>
          📷 이미지 선택
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={disabled}
          />
        </label>

        {preview && !disabled && (
          <>
            <button className="btn-insert" onClick={insertImage}>
              ✅ 삽입
            </button>
            <button className="btn-cancel" onClick={cancelImage}>
              ✖ 취소
            </button>
          </>
        )}
      </div>

      {preview && (
        <div className="image-preview">
          <p className="preview-label">미리보기:</p>
          <img src={preview} alt={imageName} style={{ maxWidth: '100%', height: 'auto' }} />
          <p className="preview-name">{imageName}</p>

          {/* 이미지 크기 정보 */}
          <div className="image-size-info">
            <p className="size-label">원본 크기: {imageWidth} × {imageHeight}px</p>
            <p className="size-hint">💡 권장 최대 폭: 600px</p>
          </div>

          {/* 크기 조절 */}
          <div className="image-resize-controls">
            <div className="size-input-group">
              <label>
                폭 (px):
                <input
                  type="number"
                  value={targetWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  min="1"
                  max={imageWidth}
                />
              </label>
              <label>
                높이 (px):
                <input
                  type="number"
                  value={targetHeight}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  min="1"
                  max={imageHeight}
                />
              </label>
            </div>
            <label className="keep-ratio-checkbox">
              <input
                type="checkbox"
                checked={keepRatio}
                onChange={(e) => setKeepRatio(e.target.checked)}
              />
              비율 유지
            </label>
          </div>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
