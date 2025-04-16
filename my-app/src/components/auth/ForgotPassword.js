import React, { useState, useEffect } from 'react';
import API_CONFIG from '../../services/config';
import './Auth.css';

const ForgotPassword = ({ switchForm, initialEmail }) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // If initialEmail changes, update the email state
  useEffect(() => {
    if (initialEmail && initialEmail !== email) {
      setEmail(initialEmail);
    }
  }, [initialEmail, email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Make sure email is trimmed to avoid whitespace issues
      const cleanEmail = email.trim();
      
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

      setSuccess('Verification code sent. Check your inbox and spam folder.');
      // Automatically switch to reset password form after 3 seconds
      setTimeout(() => {
        switchForm('resetPassword', { email: cleanEmail });
      }, 3000);
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isLoading}
          />
        </div>

        <button 
          type="submit" 
          disabled={isLoading}
        >
          {isLoading ? 'Sending...' : 'Send Verification Code'}
        </button>

        <p className="switch-auth" onClick={() => switchForm('signIn')}>
          Back to Login
        </p>
      </form>
    </>
  );
};

export default ForgotPassword;