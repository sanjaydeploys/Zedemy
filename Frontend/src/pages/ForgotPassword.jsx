import React, { useState, useCallback, memo } from 'react';
import axios from 'axios';

const Container = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: '#1a1a1a',
};

const FormContainer = {
  padding: '1.5rem',
  borderRadius: '8px',
  boxShadow: '0 2px 8px #0b0101',
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

const Form = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
};

const InputContainer = {
  position: 'relative',
  width: '100%',
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

const SubmitButton = {
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

const ErrorText = {
  fontSize: '0.9rem',
  color: '#ff4d4f',
  textAlign: 'center',
  marginTop: '0.5rem',
};

const SuccessText = {
  fontSize: '0.9rem',
  color: '#2ecc71',
  textAlign: 'center',
  marginTop: '0.5rem',
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
    .error-text, .success-text {
      font-size: 0.85rem;
    }
  }
`;

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = useCallback((e) => {
    setEmail(e.target.value);
    setError('');
    setSuccessMessage('');
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setSuccessMessage('');

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      setIsLoading(true);
      try {
        await axios.post(
          'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/auth/forgot-password',
          { email }
        );
        setSuccessMessage('Password reset link sent to your email. Check your spam folder if not found.');
        setEmail('');
      } catch (error) {
        const errorMessage =
          error.response?.data?.message || 'Failed to send reset link. Please try again.';
        setError(
          errorMessage.includes('not found')
            ? `${errorMessage} Please check your spam folder if not found.`
            : errorMessage
        );
      } finally {
        setIsLoading(false);
      }
    },
    [email]
  );

  return (
    <>
      <style>{responsiveStyles}</style>
      <div style={Container} role="main" aria-labelledby="forgot-password-heading">
        <h1 id="forgot-password-heading" style={{ display: 'none' }}>
          Forgot Password
        </h1>
        <div style={FormContainer} className="form-container">
          <h2 style={Title} className="title" aria-label="Forgot Password Title">
            Forgot Password
          </h2>
          <form onSubmit={handleSubmit} noValidate>
            <div style={InputContainer}>
              <input
                style={Input}
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleEmailChange}
                placeholder="Enter your email"
                required
                aria-required="true"
                aria-describedby="email-error"
                aria-label="Email"
                className="input"
                disabled={isLoading}
              />
            </div>
            {error && (
              <div style={ErrorText} className="error-text" aria-live="polite">
                {error}
              </div>
            )}
            {successMessage && (
              <div style={SuccessText} className="success-text" aria-live="polite">
                {successMessage}
              </div>
            )}
            <button
              style={SubmitButton}
              type="submit"
              aria-label="Submit forgot password request"
              className="button"
              disabled={isLoading || !email}
            >
              {isLoading ? 'Sending...' : 'Submit'}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default memo(ForgotPassword);
