import React, { useState, useEffect, useRef, useCallback } from 'react';
import './MainPage.css';
import API_CONFIG from '../services/config';
import { imageAPI } from '../services/api';

// Add CSS styles for label information
const labelInfoStyles = `
.label-info {
  margin-top: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.label-count {
  font-weight: bold;
  margin-bottom: 15px;
  color: #333;
  font-size: 14px;
  border-bottom: 1px solid #eee;
  padding-bottom: 8px;
}

.label-colors {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 10px;
}

.label-color-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  cursor: pointer;
  border-radius: 4px;
  padding: 5px;
  transition: background-color 0.2s;
}

.label-color-item:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.label-color-item.selected {
  background-color: rgba(74, 144, 226, 0.15);
  border-left: 3px solid #4a90e2;
  padding-left: 7px;
  font-weight: 500;
}

.color-box {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.label-description {
  font-size: 14px;
  color: #333;
}

.legend-title {
  font-weight: bold;
  margin-bottom: 10px;
  font-size: 15px;
  color: #333;
}

.download-buttons {
  display: flex;
  gap: 10px;
  margin-top: 20px;
  margin-bottom: 20px;
  justify-content: center;
}

.download-button {
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
}

.download-button:hover {
  background-color: #357ab8;
}

.data-button {
  background-color: #5cb85c;
}

.data-button:hover {
  background-color: #4a984a;
}

.results-section {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

@media (min-width: 1024px) {
  .results-section {
    flex-direction: row;
    justify-content: space-between;
    align-items: flex-start;
  }
  
  .label-info {
    flex: 1;
    margin-right: 20px;
    margin-top: 0;
  }
  
  .download-buttons {
    flex-direction: column;
    margin-top: 0;
  }
}

.analysis-layout {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.images-column {
  flex: 1;
  margin-bottom: 20px;
}

.info-column {
  width: 100%;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.image-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
  margin-bottom: 15px;
}

@media (min-width: 768px) {
  .image-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .analysis-layout {
    flex-direction: row;
    align-items: flex-start;
    gap: 20px;
  }
  
  .images-column {
    flex: 3;
    margin-bottom: 0;
  }
  
  .info-column {
    flex: 1;
    max-width: 300px;
    align-self: stretch;
    display: flex;
    flex-direction: column;
    position: sticky;
    top: 20px;
  }
  
  .label-info {
    flex: 1;
    margin-top: 0;
  }
}

.layer-instructions {
  font-size: 12px;
  color: #666;
  margin-bottom: 15px;
  font-style: italic;
  border-bottom: 1px dashed #eee;
  padding-bottom: 10px;
}

.expand-collapse-button {
  margin-top: 10px;
  padding: 8px 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #444;
  transition: background-color 0.2s;
  user-select: none;
}

.expand-collapse-button:hover {
  background-color: #e0e0e0;
}

.expand-collapse-button .arrow {
  margin-right: 6px;
  font-size: 10px;
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
  const [expandedLayers, setExpandedLayers] = useState(false); // Whether to show layers above 5
  
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
    setSelectedLayer(null); // Reset selected layer when changing images
    setExpandedLayers(false); // Reset expanded layers state when changing images
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
   * Toggles expanded view of layers above 5
   */
  const toggleExpandLayers = () => {
    setExpandedLayers(!expandedLayers);
  };

  /**
   * Processes the selected image using the analysis API
   * Sends the image for material analysis (Graphene)
   */
  const processImage = async () => {
    if (!selectedImageKey) return;

    setLoading(true);
    setProcessedImage(null);
    setSelectedLayer(null); // Reset selected layer when processing a new image
    setExpandedLayers(false); // Reset expanded layers state
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
      console.log('API response:', result); // Add logging to inspect the response
      
      if (result.statusCode === 200) {
        const bodyObj = JSON.parse(result.body);
        console.log('Parsed body:', bodyObj); // Add logging to inspect the parsed body
        
        if (bodyObj.result_img && bodyObj.result_label) {
          // Save segmentation image and label mapping
          setProcessedImage({
            image: bodyObj.result_img,
            label: bodyObj.result_label
          });
        } else if (bodyObj.result) {
          // Handle old API format for backward compatibility
          setProcessedImage({
            image: bodyObj.result,
            label: null // No label data in old format
          });
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
   * Handles click on a layer in the wedge
   * @param {number} layer - The layer number that was clicked
   */
  const handleLayerClick = (layer) => {
    // If the same layer is clicked again, toggle it off
    if (selectedLayer === layer) {
      setSelectedLayer(null);
    } else {
      setSelectedLayer(layer);
    }
  };

  /**
   * Converts the processed image data into a displayable image
   * Creates a canvas element and draws the pixel data
   * @returns {string|null} - Data URL of the processed image
   */
  const drawProcessedImage = () => {
    if (!processedImage || !processedImage.image) return null;

    const canvas = document.createElement('canvas');
    const width = processedImage.image[0].length;
    const height = processedImage.image.length;
    
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(width, height);
    
    // Draw each pixel from the processed data
    if (selectedLayer === null || !processedImage.label) {
      // No layer selected or no label data - show the original processed image
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const pixel = processedImage.image[y][x];
          const index = (y * width + x) * 4;
          imageData.data[index] = pixel[0];     // R
          imageData.data[index + 1] = pixel[1]; // G
          imageData.data[index + 2] = pixel[2]; // B
          imageData.data[index + 3] = 255;      // A
        }
      }
    } else {
      // A layer is selected - only show that layer, make other areas black
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          const labelValue = processedImage.label[y][x];
          
          if (labelValue === selectedLayer) {
            // This pixel belongs to the selected layer - show it
            const pixel = processedImage.image[y][x];
            imageData.data[index] = pixel[0];     // R
            imageData.data[index + 1] = pixel[1]; // G
            imageData.data[index + 2] = pixel[2]; // B
          } else {
            // This pixel does not belong to the selected layer - make it black with some transparency
            imageData.data[index] = 0;      // R
            imageData.data[index + 1] = 0;  // G
            imageData.data[index + 2] = 0;  // B
          }
          imageData.data[index + 3] = 255;  // A
        }
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
   * Get color mapping for labels
   * @returns {Object} Label color mapping object
   */
  const getLabelColors = () => {
    if (!processedImage) return null;
    
    // If no label data is available (old API format), return null
    if (!processedImage.label) {
      console.log('No label data available, using legacy mode');
      return null;
    }
    
    const labelData = processedImage.label;
    const imageData = processedImage.image;
    const uniqueLabels = new Set();
    
    // Collect all unique labels
    for (let y = 0; y < labelData.length; y++) {
      for (let x = 0; x < labelData[y].length; x++) {
        const label = labelData[y][x];
        uniqueLabels.add(label); // Include background labels -1
      }
    }
    
    console.log('Unique labels found:', Array.from(uniqueLabels));
    
    // Create mapping from labels to colors extracted from the image
    const colorMap = {};
    const labelDescriptions = {};
    
    // Find a representative color for each label by sampling the image
    uniqueLabels.forEach(label => {
      if (label === -1) {
        // Background label uses black
        colorMap[label] = `rgb(0, 0, 0)`;
        labelDescriptions[label] = 'Background';
      } else {
        // For each non-background label, find pixels with this label
        // and use the corresponding color from the image
        let redSum = 0, greenSum = 0, blueSum = 0, count = 0;
        let samplePixels = [];
        
        // Sample up to 100 pixels to find average color
        for (let y = 0; y < labelData.length && count < 100; y++) {
          for (let x = 0; x < labelData[y].length && count < 100; x++) {
            if (labelData[y][x] === label) {
              const pixel = imageData[y][x];
              if (count < 5) { // Store a few sample pixels for debugging
                samplePixels.push({y, x, pixel});
              }
              redSum += pixel[0];
              greenSum += pixel[1];
              blueSum += pixel[2];
              count++;
            }
          }
        }
        
        if (count > 0) {
          const avgRed = Math.round(redSum / count);
          const avgGreen = Math.round(greenSum / count);
          const avgBlue = Math.round(blueSum / count);
          colorMap[label] = `rgb(${avgRed}, ${avgGreen}, ${avgBlue})`;
          console.log(`Label ${label} color: rgb(${avgRed}, ${avgGreen}, ${avgBlue}) from ${count} pixels`);
          if (samplePixels.length > 0) {
            console.log(`Sample pixels for label ${label}:`, samplePixels);
          }
        } else {
          // Fallback if no pixels found (should not happen)
          const hue = (label * 137.5) % 360;
          colorMap[label] = `hsl(${hue}, 70%, 60%)`;
          console.warn(`No pixels found for label ${label}, using fallback color`);
        }
        
        // Updated: Label 0 represents 1 Layer, Label 1 represents 2 Layers, etc.
        const layerNumber = label + 1;
        labelDescriptions[label] = `${layerNumber} Layer${layerNumber > 1 ? 's' : ''}`;
      }
    });
    
    // Sort labels by value, with background (-1) at the beginning
    const sortedLabels = Array.from(uniqueLabels).sort((a, b) => {
      if (a === -1) return -1;
      if (b === -1) return 1;
      return a - b;
    });
    
    console.log('Final color map:', colorMap);
    console.log('Label descriptions:', labelDescriptions);
    
    return { 
      colorMap, 
      labelDescriptions,
      sortedLabels,
      count: uniqueLabels.size - (uniqueLabels.has(-1) ? 1 : 0) // Don't count background
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
    getLabelColors().sortedLabels.forEach(label => {
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
    getLabelColors().sortedLabels.forEach(label => {
      const percentage = ((pixelCounts[label] / totalPixels) * 100).toFixed(2);
      const description = getLabelColors().labelDescriptions[label];
      
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
                    {getLabelColors() && (
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
                  {/* Label information display (Wedge) */}
                  {getLabelColors() && (
                    <div className="label-info">
                      <div className="legend-title">Graphene Layer Analysis</div>
                      <div className="layer-instructions">
                        Click on a layer to highlight it
                      </div>
                      <div className="label-count">
                        Detected {getLabelColors().count} different layer regions
                      </div>
                      <div className="label-colors">
                        {getLabelColors().sortedLabels
                          .filter(label => {
                            // Show background layer (-1) and layers 1-5 (label 0-4) always
                            // For layers >5 (label >4), only show if expanded
                            return label === -1 || label <= 4 || expandedLayers;
                          })
                          .map((label) => (
                            <div 
                              key={label} 
                              className={`label-color-item ${selectedLayer === label ? 'selected' : ''}`}
                              onClick={() => handleLayerClick(label)}
                            >
                              <div className="color-box" style={{ backgroundColor: getLabelColors().colorMap[label] }}></div>
                              <span className="label-description">{getLabelColors().labelDescriptions[label]}</span>
                            </div>
                          ))
                        }
                        
                        {/* Show expand/collapse button only if there are layers > 5 (label > 4) */}
                        {getLabelColors().sortedLabels.some(label => label > 4) && (
                          <div className="expand-collapse-button" onClick={toggleExpandLayers}>
                            {expandedLayers ? (
                              <>
                                <span className="arrow">▲</span>
                                <span>Show fewer layers</span>
                              </>
                            ) : (
                              <>
                                <span className="arrow">▼</span>
                                <span>Show more layers ({getLabelColors().sortedLabels.filter(label => label > 4).length} more)</span>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Show message for legacy API format */}
                  {processedImage && !getLabelColors() && (
                    <div className="label-info">
                      <div className="legend-title">Legacy Processing Mode</div>
                      <div className="label-count">
                        Using original segmentation image (no layer data available)
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