import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MainPage.css';
import API_CONFIG from '../services/config';
import { imageAPI } from '../services/api';

// Add CSS styles for label information
const labelInfoStyles = `
.label-info {
  margin-top: 15px;
  background-color: #ffffff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  scrollbar-width: thin;
}

.label-info::-webkit-scrollbar {
  width: 6px;
}

.label-info::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.label-info::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 3px;
}

.legend-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 2px solid #e7eaf3;
}

.layer-count {
  font-size: 15px;
  color: #5a6776;
  margin-bottom: 25px;
  padding: 12px;
  background-color: #f8f9fa;
  border-radius: 6px;
  text-align: center;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.layer-group {
  border: 1px solid #e7eaf3;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background-color: #fff;
}

.layer-group:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
  transform: translateY(-2px);
}

.layer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background-color: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #e7eaf3;
}

.layer-header:hover {
  background-color: #f8f9fa;
}

.layer-header.selected {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.layer-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  font-size: 15px;
}

.layer-color {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: 2px solid rgba(0,0,0,0.1);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.flake-count {
  color: #6c757d;
  font-size: 14px;
  font-weight: 500;
  padding: 4px 12px;
  background-color: #f8f9fa;
  border-radius: 20px;
}

.flake-list {
  background-color: #fff;
  padding: 8px;
}

.flake-item {
  padding: 15px;
  margin: 8px;
  border-radius: 8px;
  background-color: #f8f9fa;
  transition: all 0.2s ease;
}

.flake-item:hover {
  background-color: #e9ecef;
}

.flake-name {
  font-weight: 600;
  margin-bottom: 12px;
  color: #2c3e50;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.flake-name::before {
  content: '';
  display: inline-block;
  width: 8px;
  height: 8px;
  background-color: #4a90e2;
  border-radius: 50%;
}

.flake-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
  padding: 12px;
  background-color: #ffffff;
  border-radius: 6px;
  font-size: 13px;
  color: #5a6776;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.05);
}

.flake-details > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.flake-details > div span:first-child {
  font-weight: 500;
  color: #2c3e50;
}

@media (min-width: 1200px) {
  .analysis-layout {
    grid-template-columns: 2fr 1fr;
    gap: 30px;
  }

  .info-column {
    position: sticky;
    top: 20px;
    max-height: calc(100vh - 40px);
    overflow-y: auto;
  }
}

@media (max-width: 1199px) {
  .analysis-layout {
    grid-template-columns: 1fr;
  }

  .info-column {
    margin-top: 20px;
  }
}

.user-guide {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background-color: #fff3e0;
  border-radius: 8px;
  margin-bottom: 20px;
  border: 1px solid #ffe0b2;
}

.guide-icon {
  font-size: 20px;
}

.guide-text {
  color: #795548;
  font-size: 14px;
  line-height: 1.4;
}

.layer-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-weight: 500;
  font-size: 15px;
  position: relative;
}

.expansion-indicator {
  font-size: 12px;
  color: #666;
  margin-left: 8px;
  transition: transform 0.2s ease;
}

.layer-header {
  position: relative;
  padding-right: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.layer-header:hover {
  background-color: #f5f5f5;
}

.layer-header:hover .expansion-indicator {
  color: #2196f3;
}

.layer-header.selected {
  background-color: #e3f2fd;
  border-left: 4px solid #2196f3;
}

.flake-list {
  background-color: #fff;
  padding: 8px;
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
`;

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
  const [selectedLayer, setSelectedLayer] = useState(null); // Currently selected layer for highlighting
  const [expandedLayers, setExpandedLayers] = useState(new Set());
  const [showOriginalImage, setShowOriginalImage] = useState(false);
  const [highlightedImage, setHighlightedImage] = useState(null);
  
  const dropdownRef = useRef(null); // Reference for dropdown menu (used for click outside detection)
  const uploadDropdownRef = useRef(null); // Reference for upload dropdown
  const folderInputRef = useRef(null); // Reference for folder input
  const fileInputRef = useRef(null); // Reference for file input
  const isLoadingRef = useRef(false);

  // Initialize component and set up event listeners
  useEffect(() => {
    // Load user data from local storage
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

  // Use useCallback to wrap loadImages function to ensure it's only recreated when dependencies change
  const loadImages = useCallback(async () => {
    // Check if already loading to prevent duplicate requests
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
        headers: {
          ...API_CONFIG.headers,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        mode: 'cors',
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
  }, [currentPath]); // Add currentPath as a dependency

  // Second useEffect to load images after user data is loaded
  // Only triggered when userData changes
  useEffect(() => {
    // If user data is loaded, load images
    if (userData) {
      loadImages();
    }
  }, [userData, loadImages]); // Add loadImages as a dependency

  useEffect(() => {
    // If there's a success message, set a timer to clear it after 3 seconds
    if (statusType === 'success' && uploadStatus) {
      const timer = setTimeout(() => {
        setUploadStatus('');
      }, 3000);
      
      // Cleanup function
      return () => clearTimeout(timer);
    }
  }, [statusType, uploadStatus]);

  // Dynamic style addition
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = labelInfoStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  /**
   * Handles image selection and loads the image URL
   * @param {string} imageKey - The key/path of the selected image
   */
  const handleImageSelect = async (imageKey) => {
    setSelectedImage('');
    setSelectedImageKey(imageKey);
    setProcessedImage(null);
    setSelectedLayer(null);
    setExpandedLayers(new Set());
    setShowOriginalImage(false);
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

      // 新增：下载图片并存到localStorage
      const imgRes = await fetch(bodyData.url);
      const imgBlob = await imgRes.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        // 存base64到localStorage
        localStorage.setItem(`img_${imageKey}`, reader.result);
        setSelectedImage(reader.result); // 直接用base64
      };
      reader.readAsDataURL(imgBlob);
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
    setSelectedLayer(null);
    setExpandedLayers(new Set());
    setShowOriginalImage(false);
    setHighlightedImage(null);
    setError('');

    // 记录当前图片key
    const currentKey = selectedImageKey;

    try {
      const response = await fetch(API_CONFIG.endpoints.processImage, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bucket_name: 'test-matsight',
          image_key: currentKey,
          material: 'Graphene'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.body || 'Processing failed');
      }

      const result = await response.json();
      if (result.statusCode === 200) {
        const bodyObj = result.body;
        if (bodyObj.file_locations && bodyObj.file_locations.output_image) {
          const imageKey = bodyObj.file_locations.output_image.replace('s3://test-matsight/', '');
          const imageResponse = await fetch(API_CONFIG.endpoints.getImageUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({
              image_key: imageKey
            })
          });

          const imageData = await imageResponse.json();
          if (imageData.statusCode === 200) {
            const imageUrl = JSON.parse(imageData.body).url;
            // 只在key没变时才set
            if (selectedImageKey === currentKey) {
              setProcessedImage({
                image: imageUrl,
                isS3Url: true,
                flakes: bodyObj.flakes,
                flakes_detected: bodyObj.flakes_detected,
                material: bodyObj.material,
                detection_parameters: bodyObj.detection_parameters
              });
            }
          } else {
            throw new Error('Failed to get processed image URL');
          }
        } else {
          throw new Error('No processed image location in response');
        }
      } else {
        throw new Error('Processing failed: ' + (result.body?.error || 'Unknown error'));
      }
    } catch (error) {
      if (selectedImageKey === currentKey) {
        setError('Image processing failed: ' + error.message);
      }
    } finally {
      if (selectedImageKey === currentKey) {
        setLoading(false);
      }
    }
  };

  /**
   * Converts the processed image data into a displayable image
   * Creates a canvas element and draws the pixel data
   * @returns {string|null} - Data URL of the processed image
   */
  const drawProcessedImage = () => {
    if (!processedImage) return null;
    if (showOriginalImage) {
      return selectedImage;
    }
    if (!processedImage.label) return null;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const [height, width] = processedImage.label.shape;
    canvas.width = width;
    canvas.height = height;
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const label = processedImage.label[y][x];
        const color = getFlakeAnalysis().colorMap[label] || 'rgb(0, 0, 0)';
        const [r, g, b] = color.match(/\d+/g).map(Number);
        const i = (y * width + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
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

      // Check file size, may need compression
      let base64Data;
      if (file.size > 4 * 1024 * 1024) { // Larger than 4MB image compression
        setStatusType('info');
        setUploadStatus(`Compressing ${file.name} (${Math.round(file.size/1024/1024)}MB)...`);
        base64Data = await compressAndConvertToBase64(file);
      } else {
        base64Data = await convertToBase64(file);
      }

      // Upload through API
      await imageAPI.uploadImage(fileName, base64Data);

      // Show success message
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

      // Collect all image files
      const imageFiles = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        // Only process image files
        if (file.type.startsWith('image/')) {
          imageFiles.push(file);
        }
      }

      if (imageFiles.length === 0) {
        setError('No image files found in the selected folder');
        setUploading(false);
        return;
      }

      // Show upload progress
      setStatusType('info');
      setUploadStatus(`Preparing to upload ${imageFiles.length} files...`);

      // Reduce batch upload size, process only 5 files at a time
      const batchSize = 2;
      const totalBatches = Math.ceil(imageFiles.length / batchSize);
      let successCount = 0;
      let failedFiles = [];

      // First create all necessary folder structure
      const uniqueFolders = new Set();
      for (let file of imageFiles) {
        if (!file.webkitRelativePath) continue;
        
        const pathParts = file.webkitRelativePath.split('/');
        pathParts.pop(); // Remove file name
        
        if (pathParts.length > 0) {
          // Create folder markers for each level
          let folderPath = '';
          for (let part of pathParts) {
            folderPath = folderPath ? `${folderPath}/${part}` : part;
            uniqueFolders.add(folderPath);
          }
        }
      }
      
      // Create necessary folder markers
      if (uniqueFolders.size > 0) {
        setStatusType('info');
        setUploadStatus(`Creating ${uniqueFolders.size} folder(s)...`);
        
        // Sequential folder creation to avoid concurrency issues
        for (let folderPath of uniqueFolders) {
          try {
            const fullFolderPath = `${userSub}/${folderPath}/`;
            const response = await fetch(API_CONFIG.endpoints.uploadImage, {
              method: 'POST',
              headers: API_CONFIG.headers,
              body: JSON.stringify({
                image_key: fullFolderPath,
                image_data: ''  // Empty string indicates this is a folder
              })
            });
            
            // Check response but do not throw error to allow upload process to continue
            if (!response.ok) {
              console.warn(`Warning: Failed to create folder ${folderPath}, status: ${response.status}`);
            }
          } catch (error) {
            console.warn(`Warning: Failed to create folder ${folderPath}:`, error);
          }
        }
      }

      // Process image file upload
      for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
        const start = batchIndex * batchSize;
        const end = Math.min(start + batchSize, imageFiles.length);
        const batchFiles = imageFiles.slice(start, end);
        
        setStatusType('info');
        setUploadStatus(`Uploading batch ${batchIndex + 1}/${totalBatches} (${start + 1}-${end} of ${imageFiles.length} files)`);
        
        // Sequential upload of current batch files to reduce concurrency and network load
        for (const file of batchFiles) {
          try {
            // Check file size
            if (file.size > 5 * 1024 * 1024) { // 5MB
              setStatusType('info');
              setUploadStatus(`Compressing ${file.name} (${Math.round(file.size/1024/1024)}MB)...`);
            }
            
            // Get file path information
            const relativePath = file.webkitRelativePath || file.name;
            const pathParts = relativePath.split('/');
            const fileName = pathParts.pop(); // Remove file name
            
            // Build full path including current navigation path
            let filePath = '';
            if (currentPath) {
              filePath = `${userSub}/${currentPath}${pathParts.join('/')}/${fileName}`;
            } else if (pathParts.length > 0) {
              filePath = `${userSub}/${pathParts.join('/')}/${fileName}`;
            } else {
              filePath = `${userSub}/${fileName}`;
            }
            
            // Convert and possibly compress image
            let base64Data;
            try {
              if (file.size > 4 * 1024 * 1024) { // Larger than 4MB image compression
                base64Data = await compressAndConvertToBase64(file);
              } else {
                base64Data = await convertToBase64(file);
              }
            } catch (e) {
              console.error(`Failed to process ${file.name}:`, e);
              failedFiles.push(relativePath);
              continue; // Skip this file but continue uploading other files
            }
            
            // Upload file, use mode:'cors' explicitly specify CORS mode
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
            
            // Check response
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
            // Continue uploading other files
          }
          
          // Add small delay to avoid request storm
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }

      // Completion message
      if (failedFiles.length > 0) {
        setStatusType(successCount > 0 ? 'warning' : 'error');
        setUploadStatus(`Upload completed with errors: ${successCount} files uploaded, ${failedFiles.length} failed.`);
      } else {
        setStatusType('success');
        setUploadStatus(`Successfully uploaded ${successCount} files.`);
      }

      // Refresh image list
      loadImages();
      
    } catch (error) {
      console.error('Folder upload failed:', error);
      setStatusType('error');
      setError('Failed to upload folder: ' + (error.message || 'Unknown error'));
      setUploadStatus('');
    } finally {
      setUploading(false);
      // Reset folder input
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

      // Create folder path (format: userSub/currentPath/folderName/)
      const folderPath = currentPath 
        ? `${userSub}/${currentPath}${folderName.trim()}/`
        : `${userSub}/${folderName.trim()}/`;

      // We actually call the UploadImage API to create the folder
      // Note: We need to pass the full path to the image_key parameter, not use the prefix parameter
      const response = await fetch(API_CONFIG.endpoints.uploadImage, {
        method: 'POST',
        headers: {
          ...API_CONFIG.headers,
          'Content-Type': 'application/json'
        },
        mode: 'cors',
        body: JSON.stringify({
          image_key: folderPath,
          image_data: ''  // Empty string indicates this is a folder
        })
      });

      const data = await response.json();
      
      if (data.statusCode !== 200) {
        throw new Error(`Failed to create folder: ${data.body?.message || 'Unknown error'}`);
      }

      // Show success message
      setStatusType('success');
      setUploadStatus(`Folder "${folderName.trim()}" created successfully`);

      // Refresh image list
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

  /**
   * Get flake analysis data from the processed result
   * @returns {Object} Flake analysis data
   */
  const getFlakeAnalysis = () => {
    if (!processedImage || !processedImage.flakes) return null;
    
    const flakes = processedImage.flakes;
    const uniqueThicknesses = new Set();
    const flakesByThickness = {};
    
    // Collect all unique thicknesses and group flakes
    flakes.forEach(flake => {
      uniqueThicknesses.add(flake.thickness);
      if (!flakesByThickness[flake.thickness]) {
        flakesByThickness[flake.thickness] = [];
      }
      flakesByThickness[flake.thickness].push(flake);
    });

    // Create color mapping for different thicknesses
    const colorMap = {};
    const thicknessDescriptions = {};
    const sortedThicknesses = Array.from(uniqueThicknesses).sort((a, b) => parseInt(a) - parseInt(b));

    sortedThicknesses.forEach(thickness => {
      // Generate color based on thickness
      const hue = (parseInt(thickness) * 30) % 360; // Different hue for each thickness
      colorMap[thickness] = `hsl(${hue}, 70%, 50%)`;
      thicknessDescriptions[thickness] = `${thickness} Layer${parseInt(thickness) > 1 ? 's' : ''}`;
    });

    // Calculate each thickness's statistics
    const statistics = {};
    sortedThicknesses.forEach(thickness => {
      const thicknessFlakes = flakesByThickness[thickness];
      statistics[thickness] = {
        count: thicknessFlakes.length,
        totalSize: thicknessFlakes.reduce((sum, f) => sum + f.size, 0),
        avgSize: thicknessFlakes.reduce((sum, f) => sum + f.size, 0) / thicknessFlakes.length,
        avgAspectRatio: thicknessFlakes.reduce((sum, f) => sum + f.aspect_ratio, 0) / thicknessFlakes.length,
        avgFalsePositive: thicknessFlakes.reduce((sum, f) => sum + f.false_positive_probability, 0) / thicknessFlakes.length
      };
    });

    return {
      colorMap,
      labelDescriptions: thicknessDescriptions,
      sortedLabels: sortedThicknesses,
      count: uniqueThicknesses.size,
      flakesByThickness,
      statistics,
      totalFlakes: processedImage.flakes_detected,
      detectionParams: processedImage.detection_parameters
    };
  };

  // Render folder item, add delete button
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
          e.stopPropagation(); // Prevent navigation trigger
          
          // Add animation effect
          const folderItem = e.currentTarget.closest('.folder-item');
          if (folderItem) {
            folderItem.classList.add('deleting');
            
            // Show confirmation dialog
            const folderName = folder.name || folder.key.split('/').filter(Boolean).pop();
            const confirmed = window.confirm(
              `Are you sure you want to delete the folder "${folderName}" and ALL its contents? This action cannot be undone.`
            );
            
            if (confirmed) {
              // Delay delete operation to wait for animation to complete
              setTimeout(() => {
                handleDeleteFolder(folder.key);
              }, 600);
            } else {
              // User canceled, restore element display
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

  /**
   * Download processed image
   */
  const downloadProcessedImage = () => {
    if (!processedImage) return;
    
    const link = document.createElement('a');
    link.download = 'graphene_analysis.png';
    link.href = drawProcessedImage();
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Download analysis data
   */
  const downloadAnalysisData = () => {
    if (!processedImage || !processedImage.label) {
      console.warn('Cannot download analysis data: No label data available');
      setError('Cannot download analysis data: No label data available');
      return;
    }
    
    // Calculate pixel count for each label
    const labelData = processedImage.label;
    const pixelCounts = {};
    const totalPixels = labelData.length * labelData[0].length;
    
    // Initialize counters for all labels
    getFlakeAnalysis().sortedLabels.forEach(label => {
      pixelCounts[label] = 0;
    });
    
    // Count pixels for each label
    for (let y = 0; y < labelData.length; y++) {
      for (let x = 0; x < labelData[y].length; x++) {
        const label = labelData[y][x];
        pixelCounts[label] = (pixelCounts[label] || 0) + 1;
      }
    }
    
    // Create analysis result data
    const analysisData = {
      material: 'Graphene',
      imageSize: {
        width: labelData[0].length,
        height: labelData.length,
        totalPixels: totalPixels
      },
      layers: []
    };
    
    // Add data for each region
    getFlakeAnalysis().sortedLabels.forEach(label => {
      const percentage = ((pixelCounts[label] / totalPixels) * 100).toFixed(2);
      const description = getFlakeAnalysis().labelDescriptions[label];
      
      analysisData.layers.push({
        label: label,
        description: description,
        pixelCount: pixelCounts[label],
        percentage: `${percentage}%`
      });
    });
    
    // Convert to JSON and download
    const dataStr = JSON.stringify(analysisData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.download = 'graphene_analysis_data.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Release URL object
    URL.revokeObjectURL(url);
  };

  // 添加处理展开/折叠的函数
  const toggleLayerExpansion = (thickness) => {
    setExpandedLayers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(thickness)) {
        newSet.delete(thickness);
      } else {
        newSet.add(thickness);
      }
      return newSet;
    });
  };

  const handleFlakeSelect = (flake) => {
    const base64Img = localStorage.getItem(`img_${selectedImageKey}`);
    if (!base64Img) {
      // 未找到本地缓存的原图
      return;
    }
    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      if (flake.mask && flake.mask.rle && flake.mask.shape) {
        // 解析mask
        const [height, width] = flake.mask.shape;
        const mask = new Array(height * width).fill(0);
        const rle = flake.mask.rle;
        for (let i = 0; i < rle.length; i += 2) {
          const start = rle[i];
          const length = rle[i + 1];
          for (let j = 0; j < length; j++) {
            mask[start + j] = 1;
          }
        }
        // Moore-Neighbor tracing 轮廓追踪
        function traceContour(mask, width, height) {
          // 寻找第一个边缘点
          let start = null;
          for (let y = 0; y < height && !start; y++) {
            for (let x = 0; x < width && !start; x++) {
              if (mask[y * width + x] === 1) {
                // 是边缘点
                let isEdge = false;
                for (let dy = -1; dy <= 1 && !isEdge; dy++) {
                  for (let dx = -1; dx <= 1 && !isEdge; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= width || ny < 0 || ny >= height || mask[ny * width + nx] === 0) {
                      isEdge = true;
                    }
                  }
                }
                if (isEdge) {
                  start = [x, y];
                }
              }
            }
          }
          if (!start) return [];
          const dirs = [
            [1, 0], [1, 1], [0, 1], [-1, 1],
            [-1, 0], [-1, -1], [0, -1], [1, -1]
          ];
          let contour = [start];
          let curr = start.slice();
          let prevDir = 6; // 上一个方向，初始向左
          let loop = 0;
          do {
            let found = false;
            for (let i = 0; i < 8; i++) {
              const dir = (prevDir + i) % 8;
              const [dx, dy] = dirs[dir];
              const nx = curr[0] + dx;
              const ny = curr[1] + dy;
              if (nx >= 0 && nx < width && ny >= 0 && ny < height && mask[ny * width + nx] === 1) {
                // 是边缘点
                curr = [nx, ny];
                contour.push(curr);
                prevDir = (dir + 6) % 8; // 下次从当前方向的前一个方向开始
                found = true;
                break;
              }
            }
            if (!found) break;
            loop++;
            if (curr[0] === start[0] && curr[1] === start[1] && loop > 1) break;
            if (loop > 10000) break; // 防止死循环
          } while (true);
          return contour;
        }
        const contour = traceContour(mask, width, height);
        if (contour.length > 1) {
          ctx.save();
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(contour[0][0], contour[0][1]);
          for (let i = 1; i < contour.length; i++) {
            ctx.lineTo(contour[i][0], contour[i][1]);
          }
          ctx.closePath();
          ctx.stroke();
          ctx.restore();
        }
      }
      const base64 = canvas.toDataURL();
      setHighlightedImage(base64);
    };
    img.src = base64Img;
    setShowOriginalImage(false);
  };

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
                          
                          // Set current image as selected state
                          setSelectedImageKey(image.key);
                          
                          // Add delete animation class
                          const imageItem = e.currentTarget.closest('.image-item');
                          if (imageItem) {
                            imageItem.classList.add('deleting');
                            
                            // Show confirmation dialog, if user cancels then restore element
                            const confirmed = window.confirm('Are you sure you want to delete this image?');
                            if (confirmed) {
                              // Wait for animation to complete before deleting
                              setTimeout(() => {
                                handleDeleteImage();
                              }, 500);
                            } else {
                              // User canceled, restore element display
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
            <div className="analysis-layout">
              {/* Left side - Images */}
              <div className="images-column">
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
                        <img 
                          src={highlightedImage ? highlightedImage : (processedImage.isS3Url ? processedImage.image : drawProcessedImage())} 
                          alt="Processed result" 
                        />
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
                
                {/* Download buttons - under the images */}
                {processedImage && (
                  <div className="download-buttons">
                    <button 
                      className="download-button" 
                      onClick={downloadProcessedImage}
                      title="Download analysis image"
                    >
                      Download Image
                    </button>
                    {getFlakeAnalysis() && (
                      <button 
                        className="download-button data-button" 
                        onClick={downloadAnalysisData}
                        title="Download analysis data"
                      >
                        Download Data
                      </button>
                    )}
                  </div>
                )}
                
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
              
              {/* Right side - Layer information */}
              {processedImage && (
                <div className="info-column">
                  {getFlakeAnalysis() && (
                    <div className="label-info">
                      <div className="legend-title">Graphene Layer Analysis</div>
                      <div className="layer-count">
                        Detected {getFlakeAnalysis().totalFlakes} graphene flakes
                      </div>
                      
                      <div className="user-guide">
                        <div className="guide-icon">💡</div>
                        <div className="guide-text">
                          Click on layer headers to expand/collapse details
                        </div>
                      </div>
                      
                      {/* Layer list */}
                      <div className="layer-list">
                        {getFlakeAnalysis().sortedLabels.map((thickness) => {
                          const flakes = getFlakeAnalysis().flakesByThickness[thickness];
                          const isExpanded = expandedLayers.has(thickness);
                          
                          return (
                            <div key={thickness} className="layer-group">
                              <div 
                                className={`layer-header ${selectedLayer === thickness ? 'selected' : ''}`}
                                onClick={() => toggleLayerExpansion(thickness)}
                              >
                                <div className="layer-title">
                                  <div 
                                    className="layer-color" 
                                    style={{ backgroundColor: getFlakeAnalysis().colorMap[thickness] }}
                                  ></div>
                                  <span>{thickness} Layer</span>
                                  <div className="expansion-indicator">
                                    {isExpanded ? '▼' : '▶'}
                                  </div>
                                </div>
                                <div className="flake-count">
                                  {flakes.length} flakes
                                </div>
                              </div>
                              {isExpanded && (
                                <div className="flake-list">
                                  {flakes.map((flake, index) => (
                                    <div
                                      key={index}
                                      className="flake-item"
                                      onClick={() => handleFlakeSelect(flake)}
                                    >
                                      <div className="flake-name">Flake {index + 1}</div>
                                      <div className="flake-details">
                                        <div>
                                          <span>Area</span>
                                          <span>{flake.size.toFixed(2)} μm²</span>
                                        </div>
                                        <div>
                                          <span>Aspect Ratio</span>
                                          <span>{flake.aspect_ratio.toFixed(2)}</span>
                                        </div>
                                        <div>
                                          <span>False Positive</span>
                                          <span>{(flake.false_positive_probability * 100).toFixed(2)}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {processedImage && !getFlakeAnalysis() && (
                    <div className="label-info">
                      <div className="legend-title">Legacy Processing Mode</div>
                      <div className="label-count">
                        Using original segmentation image (no flake data available)
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MainPage; 