import React, { useState, useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import { register } from '../actions/authActions';

const Container = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '1rem',
};

const FormContainer = {
  padding: '1.5rem',
  borderRadius: '8px',
  backgroundColor: '#333',
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
  width: '100%',
  maxWidth: '400px',
};

const InstructionText = {
  fontSize: '0.9rem',
  color: '#ccc',
  marginBottom: '1rem',
  lineHeight: '1.4',
};

const FormGroup = {
  marginBottom: '1rem',
  position: 'relative',
};

const Label = {
  display: 'block',
  fontSize: '1rem',
  marginBottom: '0.5rem',
  color: '#fff',
  fontWeight: '500',
};

const Input = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #555',
  borderRadius: '6px',
  fontSize: '1rem',
  color: '#fff',
  backgroundColor: '#444',
  boxSizing: 'border-box',
  transition: 'border-color 0.2s ease-in-out',
};

const Select = {
  width: '100%',
  padding: '0.75rem',
  border: '1px solid #555',
  borderRadius: '6px',
  fontSize: '1rem',
  color: '#fff',
  backgroundColor: '#444',
  boxSizing: 'border-box',
};

const Button = {
  width: 'auto',
  padding: '0.75rem 1.5rem',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out',
};

const TogglePasswordButton = {
  position: 'absolute',
  top: '60%',
  right: '10px',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#007bff',
  fontSize: '1rem',
};

// Media queries for responsiveness
const responsiveStyles = `
  @media (max-width: 600px) {
    .form-container {
      padding: 1rem;
      max-width: 90%;
    }
    .input, .select, .button {
      font-size: 0.9rem;
      padding: 0.6rem;
    }
    .instruction-text {
      font-size: 0.85rem;
    }
  }
`;

const RegisterForm = () => {
  const dispatch = useDispatch();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
  });
  const { name, email, password, confirmPassword, role } = formData;
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const response = await dispatch(register(formData)) || { success: false };
    if (response.success) {
      navigate('/dashboard'); // Assumes navigate is defined (e.g., via react-router-dom)
    }
  }, [dispatch, formData]);

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const toggleConfirmPasswordVisibility = useCallback(() => {
    setShowConfirmPassword((prev) => !prev);
  }, []);

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={Container} role="main" aria-labelledby="register-heading">
        <h1 id="register-heading" style={{ display: 'none' }}>Register</h1>
        <div style={FormContainer} className="form-container">
          <p
            style={InstructionText}
            className="instruction-text"
            aria-live="polite"
          >
            Your full name will be displayed on the certificate as the bearer. Ensure your full name is entered correctly without any spelling mistakes. If there is any discrepancy, contact the Hogwarts Team.
          </p>
          <form onSubmit={handleSubmit} noValidate>
            <div style={FormGroup}>
              <label style={Label} htmlFor="name">
                Name
              </label>
              <input
                style={Input}
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                placeholder="Enter your full name"
                required
                aria-required="true"
                aria-describedby="name-error"
                className="input"
              />
            </div>
            <div style={FormGroup}>
              <label style={Label} htmlFor="email">
                Email
              </label>
              <input
                style={Input}
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="Enter your email"
                required
                aria-required="true"
                aria-describedby="email-error"
                className="input"
              />
            </div>
            <div style={FormGroup}>
              <label style={Label} htmlFor="password">
                Password
              </label>
              <input
                style={Input}
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                aria-required="true"
                aria-describedby="password-error"
                className="input"
              />
              <button
                style={TogglePasswordButton}
                type="button"
                onClick={togglePasswordVisibility}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div style={FormGroup}>
              <label style={Label} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                style={Input}
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                aria-required="true"
                aria-describedby="confirmPassword-error"
                className="input"
              />
              <button
                style={TogglePasswordButton}
                type="button"
                onClick={toggleConfirmPasswordVisibility}
                aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
              >
                {showConfirmPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <div style={FormGroup}>
              <label style={Label} htmlFor="role">
                Role
              </label>
              <select
                style={Select}
                id="role"
                name="role"
                value={role}
                onChange={handleChange}
                required
                aria-required="true"
                aria-describedby="role-error"
                className="select"
              >
                <option value="">Select Role</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <button
              style={Button}
              type="submit"
              aria-label="Submit registration form"
              className="button"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default memo(RegisterForm);
