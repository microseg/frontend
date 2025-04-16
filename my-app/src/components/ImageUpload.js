import React, { useState } from 'react';
import './ImageUpload.css';

function ImageUpload({ onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError('请先选择要上传的图片');
      return;
    }

    setUploading(true);
    setError('');

    try {
      // 从localStorage获取用户信息
      const storedUserData = localStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      const userSub = userData?.sub;

      if (!userSub) {
        throw new Error('用户未登录');
      }

      // 构建文件名
      const fileExtension = selectedFile.name.split('.').pop();
      const timestamp = new Date().getTime();
      const fileName = `${userSub}/${timestamp}.${fileExtension}`;

      // 获取预签名URL
      const response = await fetch(API_CONFIG.endpoints.getImageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_key: fileName
        })
      });

      if (!response.ok) {
        throw new Error('获取上传URL失败');
      }

      const data = await response.json();
      const uploadUrl = data.url;

      // 上传文件
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type
        }
      });

      if (!uploadResponse.ok) {
        throw new Error('上传文件失败');
      }

      // 清除选择的文件
      setSelectedFile(null);
      // 通知父组件上传成功
      if (onUploadSuccess) {
        onUploadSuccess();
      }
    } catch (error) {
      console.error('上传失败:', error);
      setError(error.message || '上传失败，请重试');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="image-upload">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {selectedFile && (
        <div className="file-info">
          <span>{selectedFile.name}</span>
          <button 
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? '上传中...' : '上传'}
          </button>
        </div>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}

export default ImageUpload; 