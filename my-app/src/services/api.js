import axios from 'axios';
import API_CONFIG from './config';

// Create axios instance
const apiClient = axios.create({
    headers: API_CONFIG.headers,
    timeout: 30000, // 30 seconds timeout
});

// User related APIs
export const userAPI = {
    /**
     * Register user after successful Cognito confirmation
     * @param {string} cognitoSub - User's Cognito sub ID
     * @returns {Promise<Object>} Registration result
     */
    registerUser: async (cognitoSub) => {
        try {
            const payload = {
                "user_id": cognitoSub
            };
            
            const response = await apiClient.put(API_CONFIG.endpoints.registerUser, payload, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Image related APIs
export const imageAPI = {
    /**
     * Get list of images
     * @param {string} [prefix] - Optional folder prefix
     * @returns {Promise<Array>} List of images
     */
    listImages: async (prefix = '') => {
        try {
            const response = await apiClient.get(API_CONFIG.endpoints.listImages, {
                params: { prefix }
            });
            return response.data.images;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Get pre-signed URL for a single image
     * @param {string} imageKey - Key of the image
     * @returns {Promise<string>} Pre-signed URL
     */
    getImageUrl: async (imageKey) => {
        try {
            const response = await apiClient.get(API_CONFIG.endpoints.getImageUrl, {
                params: { image_key: imageKey }
            });
            return response.data.url;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Process an image
     * @param {string} imageUrl - URL of the image to process
     * @param {Object} options - Processing options
     * @param {number} [options.threshold=0.5] - Processing threshold
     * @returns {Promise<Object>} Processing result containing processed image URL
     */
    processImage: async (imageUrl, options = {}) => {
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.processImage, {
                url: imageUrl,
                threshold: options.threshold || 0.5
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Upload an image
     * @param {string} imageKey - Key for the image
     * @param {string} base64Data - Base64 encoded image data
     * @returns {Promise<Object>} Upload result
     */
    uploadImage: async (imageKey, base64Data) => {
        try {
            const response = await apiClient.post(API_CONFIG.endpoints.uploadImage, {
                image_key: imageKey,
                image_data: base64Data
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    /**
     * Delete an image
     * @param {string} imageKey - Key of the image to delete
     * @returns {Promise<Object>} Delete result
     */
    deleteImage: async (imageKey) => {
        try {
            const response = await apiClient.delete(API_CONFIG.endpoints.deleteImage, {
                data: { image_key: imageKey }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

// Response interceptor for error handling
apiClient.interceptors.response.use(
    response => response,
    error => {
        // Handle common errors
        if (error.response) {
            switch (error.response.status) {
                case 404:
                    console.error('Resource not found');
                    break;
                case 500:
                    console.error('Server error');
                    break;
                default:
                    console.error('API request failed:', error.response.data);
            }
        } else if (error.request) {
            console.error('No response received:', error.request);
        } else {
            console.error('Request configuration error:', error.message);
        }
        return Promise.reject(error);
    }
); 