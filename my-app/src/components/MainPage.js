import React, { useState, useEffect, useRef } from 'react';
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
  const [selectedImage, setSelectedImage] = useState(''); // URL of the currently selected image
  const [selectedImageKey, setSelectedImageKey] = useState(''); // Key/path of the selected image
  const [processedImage, setProcessedImage] = useState(null); // Processed image data
  const [loading, setLoading] = useState(false); // Loading state for async operations
  const [error, setError] = useState(''); // Error message state
  const [userData, setUserData] = useState(null); // Current user data
  const [uploading, setUploading] = useState(false); // Upload operation state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // Dropdown menu state
  const dropdownRef = useRef(null); // Reference for dropdown menu (used for click outside detection)

  // Initialize component and set up event listeners
  useEffect(() => {
    loadImages();
    // Load user data from local storage
    const storedUserData = localStorage.getItem('userData');
    if (storedUserData) {
      setUserData(JSON.parse(storedUserData));
    }

    // Handle clicks outside the dropdown menu
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Loads the list of images for the current user
   * Filters out folders and sorts by last modified date
   */
  const loadImages = async () => {
    try {
      const storedUserData = localStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      const prefix = userData?.sub || '';

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
      const sortedImages = (bodyData.images || [])
        .filter(image => !image.key.endsWith('/')) // Filter out folders
        .sort((a, b) => new Date(b.last_modified) - new Date(a.last_modified));
      setImages(sortedImages);
    } catch (error) {
      console.error('Failed to load image list:', error);
      setError('Failed to load image list: ' + error.message);
    }
  };

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
   * Confirms with user before deleting and updates the image list
   */
  const handleDeleteImage = async () => {
    if (!selectedImageKey) {
      setError('Please select an image first');
      return;
    }

    if (window.confirm('Are you sure you want to delete this image?')) {
      try {
        await imageAPI.deleteImage(selectedImageKey);
        
        // Refresh image list and reset selection
        loadImages();
        setSelectedImage('');
        setSelectedImageKey('');
        setProcessedImage(null);
      } catch (error) {
        console.error('Delete failed:', error);
        setError(error.message || 'Failed to delete image');
      }
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

    try {
      const storedUserData = localStorage.getItem('userData');
      const userData = storedUserData ? JSON.parse(storedUserData) : null;
      const userSub = userData?.sub;

      if (!userSub) {
        throw new Error('User not logged in');
      }

      // Create filename with user prefix
      const fileName = `${userSub}/${file.name}`;

      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      
      const base64Data = await base64Promise;

      // Upload through API
      await imageAPI.uploadImage(fileName, base64Data);

      // Refresh image list
      loadImages();
    } catch (error) {
      console.error('Upload failed:', error);
      setError(error.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
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
              <div className="dropdown-menu">
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
              <div className="upload-container">
                <input
                  type="file"
                  id="file-upload"
                  className="file-input"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                <label htmlFor="file-upload" className="upload-button">
                  {uploading ? 'Uploading...' : 'Upload Image'}
                </label>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="image-list">
              {images.length === 0 ? (
                <div className="empty-library">
                  <span>Your library is empty</span>
                  <span className="empty-subtitle">Upload your first image to get started</span>
                </div>
              ) : (
                images.map((image) => (
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
                        handleDeleteImage();
                      }}
                    >
                      <span className="delete-icon">×</span>
                    </button>
                  </div>
                ))
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