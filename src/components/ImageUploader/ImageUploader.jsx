import { useState } from 'react';
import './ImageUploader.css';

function ImageUploader({ onImageInsert }) {
  const [preview, setPreview] = useState(null);
  const [imageName, setImageName] = useState('');

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
      setPreview(base64);
      setImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const insertImage = () => {
    if (!preview) {
      alert('먼저 이미지를 선택해주세요.');
      return;
    }

    // 이미지 HTML 태그 생성 (base64 embedded)
    const imageHtml = `<img src="${preview}" alt="${imageName}" style="max-width: 100%; height: auto;" />`;
    onImageInsert(imageHtml);

    // 리셋
    setPreview(null);
    setImageName('');
  };

  const cancelImage = () => {
    setPreview(null);
    setImageName('');
  };

  return (
    <div className="image-uploader">
      <div className="uploader-controls">
        <label className="btn-upload">
          📷 이미지 선택
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />
        </label>

        {preview && (
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
          <img src={preview} alt={imageName} />
          <p className="preview-name">{imageName}</p>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
