// API Configuration
const API_CONFIG = {
    // API Endpoints
    endpoints: {
        // List images API
        listImages: process.env.REACT_APP_LIST_IMAGES_URL || '/api/not-configured/images/list',
        // Get image URL API
        getImageUrl: process.env.REACT_APP_GET_IMAGE_URL || '/api/not-configured/images/url',
        // Upload image API
        uploadImage: process.env.REACT_APP_UPLOAD_IMAGE_URL || '/api/not-configured/images/upload',
        // Delete image API
        deleteImage: process.env.REACT_APP_DELETE_IMAGE_URL || '/api/not-configured/images/delete',
        // Image processing API
        processImage: process.env.REACT_APP_PROCESS_IMAGE_URL || '/api/not-configured/image-processing',
        // User registration API
        registerUser: process.env.REACT_APP_REGISTER_USER_URL || '/api/not-configured/user/register-folder',
        // Auth APIs
        register: process.env.REACT_APP_REGISTER_URL || '/api/not-configured/auth/register',
        verifyEmail: process.env.REACT_APP_VERIFY_EMAIL_URL || '/api/not-configured/auth/verify-email',
        resendVerification: process.env.REACT_APP_RESEND_VERIFICATION_URL || '/api/not-configured/auth/resend-verification',
        login: process.env.REACT_APP_LOGIN_URL || '/api/not-configured/auth/login',
        // Product APIs
        products: process.env.REACT_APP_PRODUCTS_URL || '/api/not-configured/products',
        // Password reset APIs with explicit paths in the URL
        forgotPassword: process.env.REACT_APP_FORGOT_PASSWORD_URL || '/api/not-configured/auth/forgot-password',
        resetPassword: process.env.REACT_APP_RESET_PASSWORD_URL || '/api/not-configured/auth/reset-password'
    },
    
    // Default headers
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Origin': process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : window.location.origin,
    },
};

export default API_CONFIG; 