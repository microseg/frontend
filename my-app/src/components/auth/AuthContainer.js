import React, { useState, useEffect } from 'react';
import SignIn from './SignIn';
import SignUp from './SignUp';
import Verify from './Verify';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import API_CONFIG from '../../services/config';
import './Auth.css';

const AuthContainer = ({ onAuthenticated }) => {
  const [formState, setFormState] = useState('signIn');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    confirmPassword: '',
    verificationCode: '',
    newPassword: ''
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [autoSendVerification, setAutoSendVerification] = useState(false);
  const [verificationCodeJustSent, setVerificationCodeJustSent] = useState(false);
  const [formHistory, setFormHistory] = useState(['signIn']); // Array to store form history
  const [blockHistoryListener, setBlockHistoryListener] = useState(false); // Flag to block history listener

  // Listen to browser popstate event (triggered when the user clicks the back button)
  useEffect(() => {
    const handlePopState = () => {
      if (!blockHistoryListener && formHistory.length > 1) {
        // Remove current form state, get previous form state
        const newHistory = [...formHistory];
        newHistory.pop();
        const previousForm = newHistory[newHistory.length - 1];
        
        setFormState(previousForm);
        setFormHistory(newHistory);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [formHistory, blockHistoryListener]);

  // Monitor form state changes and send verification code when needed
  useEffect(() => {
    if (formState === 'verify' && formData.email && autoSendVerification && !verificationCodeJustSent) {
      setAutoSendVerification(false);
      // Small delay to ensure state is updated
      setTimeout(() => {
        resendVerificationCode();
      }, 300);
    }
    
    // Reset flag, only block one send
    if (verificationCodeJustSent) {
      // console.log('Skipping automatic verification code sending because code was just sent during registration');
      setTimeout(() => {
        setVerificationCodeJustSent(false);
      }, 5000); // Reset flag after 5 seconds, in case user needs to resend
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState, formData.email, autoSendVerification, verificationCodeJustSent]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Update form state and handle browser history
  const updateFormState = (newState) => {
    // Temporarily block history listener
    setBlockHistoryListener(true);
    
    // Update form state
    setFormState(newState);
    
    // Add new state to history
    const newHistory = [...formHistory, newState];
    setFormHistory(newHistory);
    
    // Add new entry to browser history
    window.history.pushState({ formState: newState }, '', `#${newState}`);
    
    // Restore history listener
    setTimeout(() => {
      setBlockHistoryListener(false);
    }, 100);
  };

  // Handler for unverified email detection from SignUp or SignIn
  const handleEmailNotVerified = (emailToUse) => {
    setError('Your account email is not verified. Please verify your email first');
    
    setFormData(prevData => ({
      ...prevData,
      email: emailToUse
    }));
    
    // Only set auto-send flag if verification code was not just sent
    if (!verificationCodeJustSent) {
      setAutoSendVerification(true);
    }
    
    updateFormState('verify'); // Use update function instead of direct setting
  };

  const signIn = async () => {
    try {
      const response = await fetch(API_CONFIG.endpoints.login, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password
        })
      });

      const responseData = await response.json();
      const data = responseData.body ? JSON.parse(responseData.body) : responseData;

      if (!response.ok || !data.success) {
        if (data.error && data.error.code === 'EMAIL_NOT_VERIFIED') {
          const username = data.error.username || formData.username;
          handleEmailNotVerified(username);
          return;
        }
        
        throw new Error(data.error?.message || 'Login failed');
      }

      handleSuccessfulLogin(data.data);
    } catch (err) {
      if (err.message.includes('verification')) {
        setError('Your account needs email verification. Please verify your email first');
        
        // If username looks like an email, use it as email
        if (formData.username && formData.username.includes('@') && !formData.email) {
          setFormData(prevData => ({
            ...prevData,
            email: formData.username
          }));
        }
        
        // Only set auto-send flag if verification code was not just sent
        if (!verificationCodeJustSent) {
          setAutoSendVerification(true);
        }
        
        updateFormState('verify'); // Use update function instead of direct setting
      } else if (err.message.includes('password')) {
        setError('Incorrect email or password');
      } else if (err.message.includes('not found')) {
        setError('Account not found. Please check your email');
      } else {
        setError('Login failed: ' + (err.message || 'Please try again later'));
      }
    }
  };

  const handleSuccessfulLogin = async (authResult) => {
    try {
      if (!authResult || !authResult.tokens) {
        throw new Error('Invalid authentication response');
      }

      const { tokens, user } = authResult;
      localStorage.setItem('userToken', tokens.accessToken);
      localStorage.setItem('refreshToken', tokens.refreshToken);
      localStorage.setItem('idToken', tokens.idToken);

      if (user) {
        localStorage.setItem('userData', JSON.stringify(user));
      }

      setError('');
      setSuccessMessage('Login successful!');
      onAuthenticated();
    } catch (error) {
      setError('Error processing login response: ' + error.message);
      localStorage.removeItem('userToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('idToken');
      localStorage.removeItem('userData');
    }
  };

  const signUp = async () => {
    try {
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long');
        return;
      }

      const registerResponse = await fetch(API_CONFIG.endpoints.register, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          username: formData.username,
          password: formData.password
        })
      });

      // console.log('Register response:', await registerResponse.clone().text());
      const responseData = await registerResponse.json();
      // console.log('Parsed data:', responseData);

      if (registerResponse.status !== 200) {
        let errorMessage = 'Registration failed';
        if (responseData.body) {
          try {
            const parsedBody = JSON.parse(responseData.body);
            if (parsedBody.error && parsedBody.error.message) {
              errorMessage = parsedBody.error.message;
            }
          } catch (parseError) {
            // console.error('Error parsing error message:', parseError);
          }
        } else if (responseData.error && responseData.error.message) {
          errorMessage = responseData.error.message;
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = responseData.body ? JSON.parse(responseData.body) : responseData;
      } catch (parseError) {
        // console.error('Error parsing success response:', parseError);
        data = { data: { message: 'Registration successful!' } };
      }

      if (data.success) {
        setFormData(prevData => ({
          ...prevData,
          password: '',
          confirmPassword: '',
          verificationCode: ''
        }));
        
        // When registration is successful, API has already sent the verification code
        // Only set verificationCodeJustSent flag to avoid triggering automatic resend
        setVerificationCodeJustSent(true);
        updateFormState('verify'); // Use update function instead of direct setting
        setSuccessMessage(data.data?.message || 'Registration successful! Please check your email for verification code.');
      } else {
        throw new Error(data.error?.message || 'Registration failed with unknown error');
      }
      
      setError('');
    } catch (err) {
      // console.error('Registration error:', err);
      if (err.message.includes('Password does not meet requirements')) {
        setError('Password must contain uppercase, lowercase, numbers, and special characters');
      } else if (err.message.includes('already exists') || err.message.includes('already registered')) {
        setError('Email already registered. Please use a different email');
      } else {
        setError('Registration failed: ' + (err.message || 'Please try again later'));
      }
    }
  };

  const verifyEmail = async () => {
    try {
      const response = await fetch(API_CONFIG.endpoints.verifyEmail, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          verificationCode: formData.verificationCode
        })
      });

      // console.log('Verification response:', await response.clone().text());
      const responseData = await response.json();
      // console.log('Parsed verification data:', responseData);

      if (response.status !== 200) {
        throw new Error(responseData.error?.message || 'Verification failed');
      }

      const data = responseData.body ? JSON.parse(responseData.body) : responseData;

      // Save email address for use in login page
      const verifiedEmail = formData.email;
      
      // Clear old form data, only keep necessary fields
      setFormData({
        username: verifiedEmail, // In login form, username field is used for email input
        password: '',
        email: verifiedEmail,  // Also keep email field for future use
        confirmPassword: '',
        verificationCode: '',
        newPassword: ''
      });
      
      setSuccessMessage(data.data.message || 'Email verification successful! You can now log in');
      setError('');
      updateFormState('signIn'); // Use update function instead of direct setting
    } catch (err) {
      // console.error('Verification error:', err);
      if (err.message.includes('Invalid verification code')) {
        setError('Invalid verification code. Please try again');
      } else if (err.message.includes('expired')) {
        setError('Verification code has expired. Please request a new one');
      } else {
        setError('Verification failed: ' + (err.message || 'Please try again later'));
      }
    }
  };

  const resendVerificationCode = async () => {
    try {
      if (!formData.email) {
        if (formData.username && formData.username.includes('@')) {
          setFormData(prevData => ({
            ...prevData,
            email: formData.username
          }));
        } else {
          setError('Please enter your email address');
          return;
        }
      }

      const emailToUse = formData.email || formData.username;
      
      setSuccessMessage('Sending verification code...');

      const response = await fetch(API_CONFIG.endpoints.resendVerification, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: emailToUse.trim()
        })
      });

      // console.log('Resend verification response:', await response.clone().text());
      const responseData = await response.json();
      // console.log('Parsed resend data:', responseData);

      if (response.status !== 200) {
        throw new Error(responseData.error?.message || 'Failed to resend verification code');
      }

      const data = responseData.body ? JSON.parse(responseData.body) : responseData;

      setSuccessMessage(data.data.message || 'A new verification code has been sent to your email');
      // Set flag to indicate verification code has been sent, avoid duplicate sending
      setVerificationCodeJustSent(true);
      setError('');
    } catch (err) {
      // console.error('Resend verification error:', err);
      if (err.message.includes('Too many attempts')) {
        setError('Too many attempts. Please try again later');
      } else if (err.message.includes('User not found')) {
        setError('User not found. Please check your email address');
      } else {
        setError('Failed to send verification code: ' + (err.message || 'Please try again later'));
      }
    }
  };

  const switchForm = (formType, data = {}) => {
    setError('');
    setSuccessMessage('');
    
    // Special handling for SignIn to SignUp transition, ensure email only goes to email field
    if (formType === 'signUp' && formState === 'signIn' && formData.username) {
      // When switching from SignIn to SignUp, move username field (email address) to email field, clear username field
      setFormData(prevData => ({
        ...prevData,
        email: prevData.username, // Save signin email address to email field
        username: '',            // Clear username field, let user enter a new username
        password: '',            // Clear password field
        confirmPassword: ''      // Clear confirm password field
      }));
    }
    // Regular form data update
    else if (Object.keys(data).length > 0) {
      setFormData(prevData => ({
        ...prevData,
        ...data
      }));
    }
    
    // If switching to verify form, consider automatically sending verification code
    // Only set auto-send flag if verification code was not just sent
    if (formType === 'verify' && formData.email && !verificationCodeJustSent) {
      setAutoSendVerification(true);
    }
    
    // Use update function instead of direct setting
    updateFormState(formType);
  };

  return (
    <div className="auth-container">
      <h1>
        {formState === 'signIn' ? 'Sign In' : 
         formState === 'signUp' ? 'Sign Up' : 
         formState === 'verify' ? 'Email Verification' :
         formState === 'forgotPassword' ? 'Forgot Password' :
         formState === 'resetPassword' ? 'Reset Password' :
         'Authentication'}
      </h1>

      {formState === 'signIn' && (
        <SignIn 
          formData={formData}
          handleInputChange={handleInputChange}
          signIn={signIn}
          switchForm={switchForm}
          error={error}
          successMessage={successMessage}
        />
      )}

      {formState === 'signUp' && (
        <SignUp 
          formData={formData}
          handleInputChange={handleInputChange}
          signUp={signUp}
          switchForm={switchForm}
          error={error}
          successMessage={successMessage}
        />
      )}

      {formState === 'verify' && (
        <Verify 
          formData={formData}
          handleInputChange={handleInputChange}
          verifyEmail={verifyEmail}
          resendVerificationCode={resendVerificationCode}
          switchForm={switchForm}
          error={error}
          successMessage={successMessage}
        />
      )}

      {formState === 'forgotPassword' && (
        <ForgotPassword 
          switchForm={switchForm}
          initialEmail={formData.email || formData.username}
        />
      )}

      {formState === 'resetPassword' && (
        <ResetPassword 
          switchForm={switchForm}
          initialEmail={formData.email}
        />
      )}
    </div>
  );
};

export default AuthContainer; 