import React from 'react';
import './Auth.css';

const SignIn = ({ formData, handleInputChange, signIn, switchForm, error, successMessage }) => {
  return (
    <>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
      
      <div className="form-group">
        <input
          name="username"
          type="email"
          placeholder="Enter email address"
          onChange={handleInputChange}
          value={formData.username}
        />
      </div>

      <div className="form-group">
        <input
          name="password"
          type="password"
          placeholder="Enter password"
          onChange={handleInputChange}
          value={formData.password}
        />
      </div>

      <button onClick={signIn}>Sign In</button>

      <p onClick={() => switchForm('forgotPassword')} className="forgot-password-link">
        Forgot password?
      </p>

      <p onClick={() => switchForm('signUp')} className="switch-auth">
        No account? Sign up
      </p>
    </>
  );
};

export default SignIn; 