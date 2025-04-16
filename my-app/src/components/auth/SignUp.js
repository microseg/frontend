import React from 'react';
import './Auth.css';

const SignUp = ({ formData, handleInputChange, signUp, switchForm, error, successMessage }) => {
  return (
    <>
      {error && <p className="error">{error}</p>}
      {successMessage && <p className="success">{successMessage}</p>}
      
      <div className="form-group">
        <input
          name="username"
          type="text"
          placeholder="Choose a username"
          onChange={handleInputChange}
          value={formData.username}
        />
      </div>

      <div className="form-group">
        <input
          name="email"
          type="email"
          placeholder="Enter email address"
          onChange={handleInputChange}
          value={formData.email}
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

      <div className="form-group">
        <input
          name="confirmPassword"
          type="password"
          placeholder="Confirm password"
          onChange={handleInputChange}
          value={formData.confirmPassword}
        />
      </div>

      <button onClick={signUp}>Sign Up</button>

      <p onClick={() => switchForm('signIn')} className="switch-auth">
        Have an account? Sign in
      </p>
    </>
  );
};

export default SignUp; 