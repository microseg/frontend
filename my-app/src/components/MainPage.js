import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MainPage.css';
import API_CONFIG from '../services/config';
import { imageAPI } from '../services/api';

/**
 * MainPage Component - The main interface for the MatSight application
 * Handles image upload, display, processing, and user interactions
 * @param {Object} props - Component props
 * @param {Function} props.onLogout - Callback function for user logout
 */
function MainPage({ onLogout }) {
  // State management for images and UI
  const [images, setImages] = useState([]); // List of all uploaded images
  const [folders, setFolders] = useState([]); // List of folders
  const [selectedImage, setSelectedImage] = useState(''); // URL of the currently selected image
  const [selectedImageKey, setSelectedImageKey] = useState(''); // Key/path of the selected image
  const [processedImage, setProcessedImage] = useState(null); // Processed image data
  const [loading, setLoading] = useState(false); // Loading state for async operations
  const [error, setError] = useState(''); // Error message state
  const [uploadStatus, setUploadStatus] = useState(''); // Upload status message
  const [statusType, setStatusType] = useState('info'); // Status type: 'info', 'success', 'error'
  const [userData, setUserData] = useState(null); // Current user data
  const [uploading, setUploading] = useState(false); // Upload operation state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown menu state
  const [isUploadDropdownOpen, setIsUploadDropdownOpen] = useState(false); // Upload dropdown state
  const [currentPath, setCurrentPath] = useState(''); // Current folder path
  const dropdownRef = useRef(null); // Reference for dropdown menu (used for click outside detection)
  const uploadDropdownRef = useRef(null); // Reference for upload dropdown
  const folderInputRef = useRef(null); // Reference for folder input
  const fileInputRef = useRef(null); // Reference for file input
  const isLoadingRef = useRef(false);

  // Initialize component and set up event listeners
  useEffect(() => {
    // 加载本地存储中的用户数据
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    // Handle clicks outside the dropdown menus
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (uploadDropdownRef.current && !uploadDropdownRef.current.contains(event.target)) {
        setIsUploadDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 使用useCallback包裹loadImages函数，确保只在依赖项变化时才创建新函数
  const loadImages = useCallback(async () => {
    // 检查是否已经在加载中，防止重复请求
    if (isLoadingRef.current) {
      return;
    }
    
    try {
      isLoadingRef.current = true;
      setLoading(true);
      const storedUserData = localStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      const prefix = userData?.sub ? `${userData.sub}/${currentPath}` : '';

      const response = await fetch(API_CONFIG.endpoints.listImages, {
        method: 'POST',
        headers: API_CONFIG.headers,
        body: JSON.stringify({
          prefix: prefix
        })
      });

      const data = await response.json();
      
      if (data.statusCode !== 200) {
        throw new Error('Failed to get image list');
      }

      const bodyData = JSON.parse(data.body);
      
      // Set images and folders
      const filesList = bodyData.images || [];
      const foldersList = bodyData.folders || [];
      
      // Sort images by last modified date
      const sortedImages = filesList.sort((a, b) => 
        new Date(b.last_modified) - new Date(a.last_modified)
      );
      
      setImages(sortedImages);
      setFolders(foldersList);
      
      // Clear selection when navigating
      setSelectedImage('');
      setSelectedImageKey('');
      setProcessedImage(null);
    } catch (error) {
      console.error('Failed to load image list:', error);
      setError('Failed to load image list: ' + error.message);
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  }, [currentPath]); // 将currentPath添加为依赖项

  // 第二个useEffect用于在用户数据加载后加载图片
  // 仅当userData变化时才会触发
  useEffect(() => {
    // 如果用户数据已加载，则加载图片
    if (userData) {
      loadImages();
    }
  }, [userData, loadImages]); // 添加loadImages作为依赖项

  useEffect(() => {
    // 如果有成功消息，设置定时器在3秒后自动清除
    if (statusType === 'success' && uploadStatus) {
      const timer = setTimeout(() => {
        setUploadStatus('');
      }, 3000);
      
      // 清理函数
      return () => clearTimeout(timer);
    }
  }, [statusType, uploadStatus]);

  /**
   * Handles image selection and loads the image URL
   * @param {string} imageKey - The key/path of the selected image
   */
  const handleImageSelect = async (imageKey) => {
    setSelectedImage('');
    setSelectedImageKey(imageKey);
    setProcessedImage(null);
    setLoading(true);
    setError('');

    try {
      const response = await fetch(API_CONFIG.endpoints.getImageUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          image_key: imageKey
        })
      });

      const data = await response.json();
      if (data.statusCode !== 200) {
        throw new Error('Failed to get image');
      }

      const bodyData = JSON.parse(data.body);
      if (!bodyData.url) {
        throw new Error('No URL in response');
      }

      setSelectedImage(bodyData.url);
    } catch (error) {
      console.error('Failed to load image:', error);
      setError('Failed to load image: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Processes the selected image using the analysis API
   * Sends the image for material analysis (Graphene)
   */
  const processImage = async () => {
    if (!selectedImageKey) return;

    setLoading(true);
    setProcessedImage(null);
    setError('');

    try {
      const response = await fetch(API_CONFIG.endpoints.processImage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucket_name: 'test-matsight',
          image_key: selectedImageKey,
          material: 'Graphene'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.body || 'Processing failed');
      }

      const result = await response.json();
      if (result.statusCode === 200) {
        const bodyObj = JSON.parse(result.body);
        if (bodyObj.result) {
          setProcessedImage(bodyObj.result);
        } else {
          throw new Error('Invalid response data format');
        }
      } else {
        throw new Error('Processing failed: ' + (result.body || 'Unknown error'));
      }
    } catch (error) {
      console.error('Image processing failed:', error);
      setError('Image processing failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Converts the processed image data into a displayable image
   * Creates a canvas element and draws the pixel data
   * @returns {string|null} - Data URL of the processed image
   */
  const drawProcessedImage = () => {
    if (!processedImage) return null;

    const canvas = document.createElement('canvas');
    const width = processedImage[0].length;
    const height = processedImage.length;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    
    // Draw each pixel from the processed data
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const pixel = processedImage[y][x];
        const index = (y * width + x) * 4;
        imageData.data[index] = pixel[0];     // R
        imageData.data[index + 1] = pixel[1]; // G
        imageData.data[index + 2] = pixel[2]; // B
        imageData.data[index + 3] = 255;      // A
      }
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas.toDataURL();
  };

  /**
   * Handles image deletion
   * Deletes the selected image and updates the image list
   */
  const handleDeleteImage = async () => {
    if (!selectedImageKey) {
      setError('Please select an image first');
      return;
    }

    try {
      await imageAPI.deleteImage(selectedImageKey);
      
      // Refresh image list and reset selection
      loadImages();
      setSelectedImage('');
      setSelectedImageKey('');
      setProcessedImage(null);
    } catch (error) {
      console.error('Delete failed:', error);
      setError('Failed to delete image: ' + error.message);
      
      // Remove deleting class from all images to restore any that might have been animated
      const deletingElements = document.querySelectorAll('.image-item.deleting');
      deletingElements.forEach(el => el.classList.remove('deleting'));
    }
  };

  /**
   * Handles folder deletion
   * @param {string} folderKey - The folder key to delete
   */
  const handleDeleteFolder = async (folderKey) => {
    if (!folderKey) return;

    try {
      setLoading(true);
      
      // Call the same delete API but with a folder path (ending with /)
      await imageAPI.deleteImage(folderKey);
      
      // Refresh image list
      loadImages();
    } catch (error) {
      console.error('Folder deletion failed:', error);
      setError('Failed to delete folder: ' + error.message);
      
      // Remove deleting class from all folders to restore any that might have been animated
      const deletingElements = document.querySelectorAll('.folder-item.deleting');
      deletingElements.forEach(el => el.classList.remove('deleting'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles file upload
   * Validates file type, converts to base64, and uploads to server
   * @param {Event} event - The file input change event
   */
  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError('');
    setStatusType('info');
    setUploadStatus('Uploading file...');

    try {
      const storedUserData = localStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      const userSub = userData?.sub;

      if (!userSub) {
        throw new Error('User not logged in');
      }

      // Create filename with user prefix and current path
      const fileName = currentPath 
        ? `${userSub}/${currentPath}${file.name}`
        : `${userSub}/${file.name}`;

      // 检查文件大小，可能需要压缩
      let base64Data;
      if (file.size > 4 * 1024 * 1024) { // 大于4MB的图片压缩
        setStatusType('info');
        setUploadStatus(`Compressing ${file.name} (${Math.round(file.size/1024/1024)}MB)...`);
        base64Data = await compressAndConvertToBase64(file);
      } else {
        base64Data = await convertToBase64(file);
      }

      // Upload through API
      await imageAPI.uploadImage(fileName, base64Data);

      // 显示成功消息
      setStatusType('success');
      setUploadStatus(`Successfully uploaded ${file.name}`);

      // Refresh image list
      loadImages();
    } catch (error) {
      console.error('Upload failed:', error);
      setStatusType('error');
      setError(error.message || 'Upload failed');
      setUploadStatus('');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  /**
   * Handles folder navigation
   * @param {string} folderKey - The folder key to navigate to
   */
  const navigateToFolder = (folderKey) => {
    // Extract relative path from folder key
    // Format: users/userId/path/to/folder/
    const userPrefix = userData?.sub ? `users/${userData.sub}/` : 'users/';
    let relativePath = folderKey.replace(userPrefix, '');
    setCurrentPath(relativePath);
  };

  /**
   * Navigates up one level in the folder hierarchy
   */
  const navigateUp = () => {
    if (!currentPath) return; // Already at root
    
    // Remove the last folder from the path
    const pathParts = currentPath.split('/').filter(part => part);
    pathParts.pop();
    const newPath = pathParts.join('/');
    setCurrentPath(newPath ? `${newPath}/` : '');
  };

  /**
   * Handles file input button click
   */
  const handleFileInputClick = () => {
    setIsUploadDropdownOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  /**
   * Handles folder input button click
   */
  const handleFolderInputClick = () => {
    setIsUploadDropdownOpen(false);
    if (folderInputRef.current) {
      folderInputRef.current.click();
    }
  };

  /**
   * Toggles the upload dropdown menu
   */
  const toggleUploadDropdown = () => {
    setIsUploadDropdownOpen(prev => !prev);
  };

  /**
   * Handles folder upload
   * @param {Event} event - The folder input change event
   */
  const handleFolderUpload = async (event) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError('');
    setStatusType('info');
    setUploadStatus('');

    try {
      const storedUserData = localStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      const userSub = userData?.sub;

      if (!userSub) {
        throw new Error('User not logged in');
      }

      // 收集所有图片文件
      const imageFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // 只处理图片文件
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }

      if (imageFiles.length === 0) {
        setError('No image files found in the selected folder');
        setUploading(false);
        return;
      }

      // 显示上传进度
      setStatusType('info');
      setUploadStatus(`Preparing to upload ${imageFiles.length} files...`);

      // 减小批量上传大小，每批只处理5个文件
      const batchSize = 2;
      const totalBatches = Math.ceil(imageFiles.length / batchSize);
      let successCount = 0;
      let failedFiles = [];

      // 先创建所有必要的文件夹结构
      const uniqueFolders = new Set();
      for (let file of imageFiles) {
        if (!file.webkitRelativePath) continue;
        
        const pathParts = file.webkitRelativePath.split('/');
        pathParts.pop(); // 移除文件名
        
        if (pathParts.length > 0) {
          // 为每级文件夹创建标记
          let folderPath = '';
          for (let part of pathParts) {
            folderPath = folderPath ? `${folderPath}/${part}` : part;
            uniqueFolders.add(folderPath);
          }
        }
      }
      
      // 创建必要的文件夹标记
      if (uniqueFolders.size > 0) {
        setStatusType('info');
        setUploadStatus(`Creating ${uniqueFolders.size} folder(s)...`);
        
        // 串行创建文件夹，避免并发问题
        for (let folderPath of uniqueFolders) {
          try {
            const fullFolderPath = `${userSub}/${folderPath}/`;
            const response = await fetch(API_CONFIG.endpoints.uploadImage, {
              method: 'POST',
              headers: API_CONFIG.headers,
              body: JSON.stringify({
                image_key: fullFolderPath,
                image_data: ''  // 空字符串表示这是一个文件夹
              })
            });
            
            // 检查响应但不抛出错误，让上传过程继续
            if (!response.ok) {
              console.warn(`Warning: Failed to create folder ${folderPath}, status: ${response.status}`);
            }
          } catch (error) {
            console.warn(`Warning: Failed to create folder ${folderPath}:`, error);
          }
        }
      }

      // 处理图片文件上传
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, imageFiles.length);
        const batchFiles = imageFiles.slice(start, end);
        
        setStatusType('info');
        setUploadStatus(`Uploading batch ${batchIndex + 1}/${totalBatches} (${start + 1}-${end} of ${imageFiles.length} files)`);
        
        // 串行上传当前批次的文件，减少并发和网络负载
        for (const file of batchFiles) {
          try {
            // 检查文件大小
            if (file.size > 5 * 1024 * 1024) { // 5MB
              setStatusType('info');
              setUploadStatus(`Compressing ${file.name} (${Math.round(file.size/1024/1024)}MB)...`);
            }
            
            // 获取文件路径信息
            const relativePath = file.webkitRelativePath || file.name;
            const pathParts = relativePath.split('/');
            const fileName = pathParts.pop(); // 移除文件名
            
            // 构建完整路径，包括当前导航路径
            let filePath = '';
            if (currentPath) {
              filePath = `${userSub}/${currentPath}${pathParts.join('/')}/${fileName}`;
            } else if (pathParts.length > 0) {
              filePath = `${userSub}/${pathParts.join('/')}/${fileName}`;
            } else {
              filePath = `${userSub}/${fileName}`;
            }
            
            // 转换并可能压缩图像
            let base64Data;
            try {
              if (file.size > 4 * 1024 * 1024) { // 大于4MB的图片压缩
                base64Data = await compressAndConvertToBase64(file);
              } else {
                base64Data = await convertToBase64(file);
              }
            } catch (e) {
              console.error(`Failed to process ${file.name}:`, e);
              failedFiles.push(relativePath);
              continue; // 跳过这个文件，但继续上传其他文件
            }
            
            // 上传文件，使用mode:'cors'明确指定CORS模式
            const response = await fetch(API_CONFIG.endpoints.uploadImage, {
              method: 'POST',
              headers: {
                ...API_CONFIG.headers,
                'Content-Type': 'application/json'
              },
              mode: 'cors',
              body: JSON.stringify({
                image_key: filePath,
                image_data: base64Data
              })
            });
            
            // 检查响应
            if (response.ok) {
              successCount++;
              setStatusType('info');
              setUploadStatus(`Uploaded ${successCount}/${imageFiles.length} files (Batch ${batchIndex + 1}/${totalBatches})`);
            } else {
              failedFiles.push(relativePath);
            }
          } catch (error) {
            console.error(`Failed to upload ${file.name}:`, error);
            failedFiles.push(file.webkitRelativePath || file.name);
            // 继续上传其他文件
          }
          
          // 添加小延迟，避免请求风暴
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // 完成消息
      if (failedFiles.length > 0) {
        setStatusType(successCount > 0 ? 'warning' : 'error');
        setUploadStatus(`Upload completed with errors: ${successCount} files uploaded, ${failedFiles.length} failed.`);
      } else {
        setStatusType('success');
        setUploadStatus(`Successfully uploaded ${successCount} files.`);
      }

      // 刷新图片列表
      loadImages();
      
    } catch (error) {
      console.error('Folder upload failed:', error);
      setStatusType('error');
      setError('Failed to upload folder: ' + (error.message || 'Unknown error'));
      setUploadStatus('');
    } finally {
      setUploading(false);
      // 重置文件夹输入
      if (folderInputRef.current) {
        folderInputRef.current.value = '';
      }
    }
  };
  
  /**
   * Compresses and converts an image file to base64
   * @param {File} file - The file to compress and convert
   * @returns {Promise<string>} - Base64 string
   */
  const compressAndConvertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Calculate new dimensions (max 1600px width/height)
          let width = img.width;
          let height = img.height;
          const maxDimension = 1600;
          
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round(height * (maxDimension / width));
              width = maxDimension;
            } else {
              width = Math.round(width * (maxDimension / height));
              height = maxDimension;
            }
          }
          
          // Create canvas and resize image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64 (0.8 = 80% quality)
          const base64String = canvas.toDataURL(file.type, 0.8).split(',')[1];
          resolve(base64String);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image for compression'));
        };
        
        img.src = event.target.result;
      };
      
      reader.onerror = (error) => {
        reject(error);
      };
      
      reader.readAsDataURL(file);
    });
  };
  
  /**
   * Converts file to base64 without compression
   * @param {File} file - File to convert
   * @returns {Promise<string>} - Base64 string
   */
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Creates a new folder in the current path
   */
  const createFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (!folderName || !folderName.trim()) return;

    setLoading(true);
    setError('');
    setStatusType('info');
    setUploadStatus(`Creating folder "${folderName.trim()}"...`);

    try {
      const storedUserData = localStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      const userSub = userData?.sub;

      if (!userSub) {
        throw new Error('User not logged in');
      }

      // 创建文件夹路径 (格式为: userSub/currentPath/folderName/)
      const folderPath = currentPath 
        ? `${userSub}/${currentPath}${folderName.trim()}/`
        : `${userSub}/${folderName.trim()}/`;

      // 我们实际上是调用UploadImage API来创建文件夹
      // 注意：我们需要传递完整路径到image_key参数，不使用prefix参数
      const response = await fetch(API_CONFIG.endpoints.uploadImage, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          image_key: folderPath,
          image_data: ''  // 空字符串表示这是一个文件夹
        })
      });

      const data = await response.json();
      
      if (data.statusCode !== 200) {
        throw new Error(`Failed to create folder: ${data.body?.message || 'Unknown error'}`);
      }

      // 显示成功消息
      setStatusType('success');
      setUploadStatus(`Folder "${folderName.trim()}" created successfully`);

      // 刷新图片列表
      loadImages();
    } catch (error) {
      console.error('Create folder failed:', error);
      setStatusType('error');
      setError('Failed to create folder: ' + error.message);
      setUploadStatus('');
    } finally {
      setLoading(false);
    }
  };

  // 渲染文件夹项，添加删除按钮
  const renderFolderItem = (folder) => (
    <div key={folder.key} className="folder-item">
      <div 
        className="folder-content" 
        onClick={() => navigateToFolder(folder.key)}
      >
        <span className="folder-icon">📁</span>
        <span className="folder-name">{folder.name}</span>
      </div>
      <button 
        className="delete-folder-button"
        onClick={(e) => {
          e.stopPropagation(); // 防止触发导航
          
          // 添加动画效果
          const folderItem = e.currentTarget.closest('.folder-item');
          if (folderItem) {
            folderItem.classList.add('deleting');
            
            // 显示确认对话框
            const folderName = folder.name || folder.key.split('/').filter(Boolean).pop();
            const confirmed = window.confirm(
              `Are you sure you want to delete the folder "${folderName}" and ALL its contents? This action cannot be undone.`
            );
            
            if (confirmed) {
              // 延迟删除操作，等待动画完成
              setTimeout(() => {
                handleDeleteFolder(folder.key);
              }, 600);
            } else {
              // 用户取消，恢复元素显示
              folderItem.classList.remove('deleting');
            }
          } else {
            handleDeleteFolder(folder.key);
          }
        }}
        title="Delete folder"
      >
        🗑️
      </button>
    </div>
  );

  // Render the main interface
  return (
    <div className="main-page">
      {/* Header section with user info and menu */}
      <header className="header">
        <h1>MatSight</h1>
        <div className="user-info">
          {userData && <span>Welcome, {userData.username}</span>}
          <div className="dropdown-container" ref={dropdownRef}>
            <button 
              className="dropdown-toggle"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <span className="dots">•••</span>
            </button>
            {isDropdownOpen && (
              <div className="dropdown-menu" style={{ transform: 'translateY(0)' }}>
                <a 
                  href="https://forms.gle/MPBVJ4oi38Gjaev66" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="dropdown-item"
                >
                  Report Technical Issue
                </a>
                <button 
                  onClick={onLogout} 
                  className="dropdown-item"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="content">
        <div className="main-content-grid">
          {/* Image gallery/library section */}
          <div className="image-gallery">
            <div className="gallery-header">
              <h2>Your Library</h2>
              <div className="action-buttons">
                {/* Upload dropdown */}
                <div className="upload-dropdown" ref={uploadDropdownRef}>
                  <button 
                    className="action-button primary"
                    onClick={toggleUploadDropdown}
                    disabled={uploading || loading}
                  >
                    <span className="button-icon">⬆️</span>
                    Upload
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  
                  {isUploadDropdownOpen && (
                    <div className="dropdown-menu">
                      <button 
                        className="dropdown-item"
                        onClick={handleFileInputClick}
                      >
                        Upload File
                      </button>
                      <button 
                        className="dropdown-item"
                        onClick={handleFolderInputClick}
                      >
                        Upload Folder
                      </button>
                    </div>
                  )}
                </div>

                {/* New folder button */}
                <button 
                  className="action-button secondary"
                  onClick={createFolder}
                  disabled={uploading || loading}
                >
                  <span className="button-icon">📁</span>
                  New Folder
                </button>
                
                {/* Hidden file input */}
                <input
                  type="file"
                  id="file-upload"
                  className="file-input"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
                
                {/* Hidden folder input */}
                <input
                  type="file"
                  id="folder-upload"
                  className="file-input"
                  ref={folderInputRef}
                  webkitdirectory="true"
                  directory="true"
                  multiple
                  onChange={handleFolderUpload}
                  disabled={uploading}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            {/* Path navigation */}
            <div className="path-navigation">
              <button 
                className="nav-button"
                onClick={() => setCurrentPath('')}
                disabled={!currentPath}
              >
                Home
              </button>
              {currentPath && (
                <button 
                  className="nav-button"
                  onClick={navigateUp}
                >
                  ← Back
                </button>
              )}
              {currentPath && (
                <span className="current-path">
                  /{currentPath}
                </span>
              )}
            </div>

            {/* Status and error messages */}
            {error && <div className="error">{error}</div>}
            {uploadStatus && <div className={`status status-${statusType}`}>{uploadStatus}</div>}
            
            {/* Folder and image list */}
            <div className="image-list">
              {folders.length === 0 && images.length === 0 ? (
                <div className="empty-library">
                  <span>This folder is empty</span>
                  <span className="empty-subtitle">Upload images or create folders to get started</span>
                </div>
              ) : (
                <>
                  {/* Folder list */}
                  {folders.map((folder) => (
                    renderFolderItem(folder)
                  ))}
                  
                  {/* Image list */}
                  {images.map((image) => (
                    <div
                      key={image.key}
                      className={`image-item ${selectedImageKey === image.key ? 'selected' : ''}`}
                      onClick={() => handleImageSelect(image.key)}
                    >
                      <div className="image-item-info">
                        <span className="image-name">{image.key.split('/').pop()}</span>
                        <span className="image-meta">
                          Uploaded: {new Date(image.last_modified).toLocaleString()}
                        </span>
                      </div>
                      <button 
                        className="delete-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          
                          // 设置当前图片为选中状态
                          setSelectedImageKey(image.key);
                          
                          // 添加删除动画类
                          const imageItem = e.currentTarget.closest('.image-item');
                          if (imageItem) {
                            imageItem.classList.add('deleting');
                            
                            // 显示确认对话框，如果用户取消则恢复元素
                            const confirmed = window.confirm('Are you sure you want to delete this image?');
                            if (confirmed) {
                              // 等待动画完成后删除
                              setTimeout(() => {
                                handleDeleteImage();
                              }, 500);
                            } else {
                              // 用户取消，恢复元素显示
                              imageItem.classList.remove('deleting');
                            }
                          } else {
                            handleDeleteImage();
                          }
                        }}
                      >
                        <span className="delete-icon">×</span>
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Image display and analysis section */}
          <div className="image-display">
            <div className="image-grid">
              {/* Original image display */}
              <div className="image-container">
                <h3>Original Sample</h3>
                <div className="image-preview">
                  {selectedImage ? (
                    <img src={selectedImage} alt="Selected sample" />
                  ) : (
                    <span className="placeholder-text">Select a sample from the library</span>
                  )}
                  {loading && (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                      <span>Loading...</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Processed image display */}
              <div className="image-container">
                <h3>Analysis Result</h3>
                <div className="image-preview">
                  {processedImage ? (
                    <img src={drawProcessedImage()} alt="Processed result" />
                  ) : (
                    <span className="placeholder-text">Process the sample to view results</span>
                  )}
                  {loading && (
                    <div className="loading-overlay">
                      <div className="loading-spinner"></div>
                      <span>Processing...</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Analysis control */}
            <div className="button-container">
              <button
                className="process-button"
                onClick={processImage}
                disabled={!selectedImageKey || loading}
              >
                {loading ? 'Processing...' : 'Analyze Sample'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage; 