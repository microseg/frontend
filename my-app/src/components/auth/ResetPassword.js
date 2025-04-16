import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../services/config';
import './Auth.css';

const ResetPassword = ({ switchForm, initialEmail }) => {
  const [formData, setFormData] = useState({
    email: initialEmail || '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If initialEmail changes, update the email in form data
  useEffect(() => {
    if (initialEmail && initialEmail !== formData.email) {
      setFormData(prev => ({
        ...prev,
        email: initialEmail
      }));
    }
  }, [initialEmail, formData.email]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const validatePassword = (password) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;

    if (!isLongEnough) return 'Password must be at least 8 characters long';
    if (!hasUpperCase) return 'Password must contain at least one uppercase letter';
    if (!hasLowerCase) return 'Password must contain at least one lowercase letter';
    if (!hasNumbers) return 'Password must contain at least one number';
    if (!hasSpecialChar) return 'Password must contain at least one special character';

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    // Validate form
    if (!formData.email || !formData.verificationCode || !formData.newPassword) {
      setError('All fields are required');
      setIsLoading(false);
      return;
    }

    // Validate password match
    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Validate password strength
    const passwordError = validatePassword(formData.newPassword);
    if (passwordError) {
      setError(passwordError);
      setIsLoading(false);
      return;
    }

    try {
      // Format request according to API expectations
      const requestData = {
        email: formData.email.trim(),
        verificationCode: formData.verificationCode,
        newPassword: formData.newPassword,
        resetPassword: true  // Flag to explicitly indicate this is a reset password request
      };

      const response = await fetch(API_CONFIG.endpoints.resetPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }
      
      // Check both direct response and wrapped response in body (API Gateway format)
      const responseData = data.body ? JSON.parse(data.body) : data;
      
      if (!response.ok || (responseData && responseData.success === false)) {
        const errorMessage = 
          responseData?.error?.message || 
          data?.error?.message || 
          'Failed to reset password';
        throw new Error(errorMessage);
      }

      setSuccess('Password has been reset successfully');
      // Automatically switch to sign in form after 2 seconds
      setTimeout(() => {
        switchForm('signIn');
      }, 2000);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!formData.email) {
      setError('Email is required to resend verification code');
      return;
    }

    setError('');
    setSuccess('Sending verification code...');
    setIsLoading(true);

    try {
      // Make sure email is trimmed to avoid whitespace issues
      const cleanEmail = formData.email.trim();
      
      // Format request according to API expectations
      const requestData = {
        email: cleanEmail,
        forgotPassword: true  // Flag to explicitly indicate this is a forgot password request
      };
      
      const response = await fetch(API_CONFIG.endpoints.forgotPassword, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response from server');
      }
      
      // Check both direct response and wrapped response in body (API Gateway format)
      const responseData = data.body ? JSON.parse(data.body) : data;
      
      if (!response.ok || (responseData && responseData.success === false)) {
        const errorMessage = 
          responseData?.error?.message || 
          data?.error?.message || 
          'Failed to send verification code';
        throw new Error(errorMessage);
      }

      setSuccess('A new verification code has been sent to your email. Please check your inbox and spam folder.');
    } catch (err) {
      setError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <input
            type="text"
            id="verificationCode"
            value={formData.verificationCode}
            onChange={handleInputChange}
            placeholder="Enter verification code"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            id="newPassword"
            value={formData.newPassword}
            onChange={handleInputChange}
            placeholder="Enter new password"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            id="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            placeholder="Confirm new password"
            required
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading}
        >
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </button>

        <p className="resend-link" onClick={handleResendCode}>
          Didn't receive code? Send again
        </p>

        <p className="switch-auth" onClick={() => switchForm('signIn')}>
          Back to Login
        </p>
      </form>
    </>
  );
};

export default ResetPassword; 