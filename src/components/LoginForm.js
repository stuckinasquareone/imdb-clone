import React, { useState } from 'react';
import './LoginForm.css';

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [validation, setValidation] = useState({
    minLength: false,
    uppercase: false,
    number: false,
    special: false,
  });

  // Validation rules
  const validatePassword = (pwd) => {
    const rules = {
      minLength: pwd.length >= 8,
      uppercase: /[A-Z]/.test(pwd),
      number: /[0-9]/.test(pwd),
      special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    };
    setValidation(rules);
    return rules;
  };

  const handlePasswordChange = (e) => {
    const pwd = e.target.value;
    setPassword(pwd);
    validatePassword(pwd);
  };

  const handleUsernameChange = (e) => {
    setUsername(e.target.value);
  };

  // Check if all validation rules are met
  const isPasswordStrong = Object.values(validation).every((rule) => rule === true);

  // Check if form is valid (both fields filled and password is strong)
  const isFormValid = username.trim() !== '' && isPasswordStrong;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      alert(`Login successful!\nUsername: ${username}\nPassword strength: Strong`);
      // Reset form
      setUsername('');
      setPassword('');
      setValidation({ minLength: false, uppercase: false, number: false, special: false });
    }
  };

  return (
    <div className="login-form-container">
      <div className="login-form">
        <h1>Login</h1>
        <form onSubmit={handleSubmit}>
          {/* Username Field */}
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={handleUsernameChange}
              placeholder="Enter your username"
              className="input-field"
            />
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              className="input-field"
            />
          </div>

          {/* Password Validation Feedback */}
          {password && (
            <div className="validation-feedback">
              <h3>Password Strength Requirements:</h3>
              <div className="validation-rule">
                <span className={validation.minLength ? 'valid' : 'invalid'}>
                  {validation.minLength ? '✅' : '❌'}
                </span>
                <span>At least 8 characters</span>
              </div>
              <div className="validation-rule">
                <span className={validation.uppercase ? 'valid' : 'invalid'}>
                  {validation.uppercase ? '✅' : '❌'}
                </span>
                <span>Contains at least 1 uppercase letter</span>
              </div>
              <div className="validation-rule">
                <span className={validation.number ? 'valid' : 'invalid'}>
                  {validation.number ? '✅' : '❌'}
                </span>
                <span>Contains at least 1 number</span>
              </div>
              <div className="validation-rule">
                <span className={validation.special ? 'valid' : 'invalid'}>
                  {validation.special ? '✅' : '❌'}
                </span>
                <span>Contains at least 1 special character (!@#$%^&*)</span>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="submit-button"
            disabled={!isFormValid}
          >
            Login
          </button>

          {/* Status Message */}
          {password && !isPasswordStrong && (
            <p className="status-message error">
              Password does not meet all requirements
            </p>
          )}
          {password && isPasswordStrong && (
            <p className="status-message success">
              ✅ Password is strong!
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
