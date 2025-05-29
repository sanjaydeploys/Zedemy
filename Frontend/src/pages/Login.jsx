import React, { useState, useEffect, useCallback, memo } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, loginSuccess } from '../actions/authActions';

const Container = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
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

const Title = {
  fontSize: '1.5rem',
  color: '#fff',
  textAlign: 'center',
  marginBottom: '1.5rem',
  fontWeight: '600',
};

const FormGroup = {
  marginBottom: '1rem',
  position: 'relative',
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

const Button = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '6px',
  fontSize: '1rem',
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out',
  marginTop: '1rem',
};

const GoogleButton = {
  ...Button,
  backgroundColor: '#db4437',
};

const TogglePasswordButton = {
  position: 'absolute',
  top: '50%',
  right: '10px',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#007bff',
  fontSize: '1rem',
};

const ForgotPasswordLink = {
  display: 'inline-block',
  marginTop: '1rem',
  fontSize: '0.9rem',
  color: '#ccc',
  textDecoration: 'none',
  transition: 'color 0.2s ease-in-out',
};

const LoadingText = {
  fontSize: '1rem',
  color: '#fff',
  textAlign: 'center',
};

const ErrorMessage = {
  fontSize: '0.9rem',
  color: '#ff4d4f',
  marginTop: '0.5rem',
  textAlign: 'center',
};

// Media queries for responsiveness
const responsiveStyles = `
  @media (max-width: 600px) {
    .form-container {
      padding: 1rem;
      max-width: 90%;
    }
    .input, .button {
      font-size: 0.9rem;
      padding: 0.6rem;
    }
    .title {
      font-size: 1.3rem;
    }
    .error-message {
      font-size: 0.85rem;
    }
  }
`;

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { email, password } = formData;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const user = params.get('user');
    if (user) {
      const userData = JSON.parse(decodeURIComponent(user));
      dispatch(loginSuccess(userData));
      navigate('/dashboard');
    }
  }, [dispatch, navigate]);

  const handleChange = useCallback((e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setLoading(true);
      setErrorMessage('');
      const response = await dispatch(login(email, password));
      setLoading(false);
      if (response.success) {
        if (response.role === 'admin') {
          navigate('/admin-dashboard');
        } else {
          navigate('/dashboard');
        }
      } else {
        setErrorMessage(response.message || 'Invalid email or password');
      }
    },
    [dispatch, email, password, navigate]
  );

  const togglePasswordVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  const handleGoogleLogin = useCallback(() => {
    window.location.href = 'https://g3u06ptici.execute-api.ap-south-1.amazonaws.com/prod/api/auth/google';
  }, []);

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={Container} role="main" aria-labelledby="login-heading">
        <h1 id="login-heading" style={{ display: 'none' }}>Login</h1>
        <div style={FormContainer} className="form-container">
        
          <form onSubmit={handleSubmit} noValidate>
            <div style={FormGroup}>
              <input
                style={Input}
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                placeholder="Email"
                required
                aria-required="true"
                aria-describedby="email-error"
                aria-label="Email"
                className="input"
              />
            </div>
            <div style={FormGroup}>
              <input
                style={Input}
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={password}
                onChange={handleChange}
                placeholder="Password"
                required
                aria-required="true"
                aria-describedby="password-error"
                aria-label="Password"
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
            {errorMessage && (
              <div
                style={ErrorMessage}
                className="error-message"
                aria-live="polite"
              >
                {errorMessage}
              </div>
            )}
            <button
              style={Button}
              type="submit"
              aria-label="Login"
              className="button"
              disabled={loading}
            >
              {loading ? (
                <span style={LoadingText} aria-live="polite">
                  Loading...
                </span>
              ) : (
                'Login'
              )}
            </button>
            <button
              style={GoogleButton}
              type="button"
              onClick={handleGoogleLogin}
              aria-label="Login with Google"
              className="button"
            >
              Login with Google
            </button>
            <Link
              to="/forgot-password"
              style={ForgotPasswordLink}
              aria-label="Forgot Password"
            >
              Forgot Password? Click to reset
            </Link>
          </form>
        </div>
      </div>
    </>
  );
};

export default memo(Login);
