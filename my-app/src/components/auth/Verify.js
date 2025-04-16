import React from 'react';
import './Auth.css';

const Verify = ({ 
  formData, 
  handleInputChange, 
  verifyEmail, 
  resendVerificationCode, 
  switchForm, 
  error, 
  successMessage 
}) => {
  // Helper function: display friendly information if email is not available
  const getEmailDisplay = () => {
    if (formData.email) {
      return formData.email;
    } else if (formData.username && formData.username.includes('@')) {
      return formData.username;
    } else {
      return 'your registered email';
    }
  };

  return (
    <>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
      
      <div className="form-group">
        <p className="email-display">Verification code will be sent to: <strong>{getEmailDisplay()}</strong></p>
      </div>

      <div className="form-group">
        <input
          name="verificationCode"
          placeholder="Enter verification code"
          onChange={handleInputChange}
          value={formData.verificationCode}
          required
        />
      </div>

      <button onClick={verifyEmail}>Verify Email</button>

      <p className="resend-link" onClick={resendVerificationCode}>
        Didn't receive the code? Click to resend
      </p>

      <p onClick={() => switchForm('signIn')} className="switch-auth">
        Already verified? Click to login
      </p>
    </>
  );
};

export default Verify; 