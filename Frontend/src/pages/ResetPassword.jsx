import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';
import { FiEye, FiEyeOff } from 'react-icons/fi';

// Styled Components
const Container = styled.div`
  max-width: 450px;
  margin: 60px auto;
  padding: 32px;
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  color: #1e1b4b;
  margin-bottom: 32px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #4b0082;
    box-shadow: 0 0 0 4px rgba(75, 0, 130, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  font-size: 1.25rem;
  
  &:hover {
    color: #1f2937;
  }
`;

const StrengthContainer = styled.div`
  margin-top: 12px;
`;

const StrengthText = styled.div`
  font-size: 0.9rem;
  color: #374151;
  font-weight: 500;
`;

const StrengthBar = styled.div`
  height: 8px;
  border-radius: 4px;
  background: ${(props) => {
    switch (props.strength) {
      case 'Strong':
        return '#10b981';
      case 'Medium':
        return '#f59e0b';
      case 'Weak':
        return '#ef4444';
      default:
        return '#d1d5db';
    }
  }};
  transition: background-color 0.4s ease;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 14px;
  background: linear-gradient(90deg, #4b0082, #6b21a8);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(90deg, #5b21b6, #7c3aed);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 12px;
`;

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [error, setError] = useState('');

    const validatePassword = (value) => {
        const minLength = value.length >= 8;
        const hasUpperCase = /[A-Z]/.test(value);
        const hasLowerCase = /[a-z]/.test(value);
        const hasNumbers = /\d/.test(value);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);

        const strength = minLength && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar
            ? 'Strong'
            : minLength && (hasUpperCase || hasLowerCase) && hasNumbers
            ? 'Medium'
            : 'Weak';

        setPasswordStrength(strength);
        return strength !== 'Weak';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            toast.error('Passwords do not match!');
            setError('Passwords do not match');
            return;
        }

        if (!validatePassword(password)) {
            toast.error('Password is too weak. Use at least 8 characters with uppercase, lowercase, numbers, and special characters.');
            setError('Password is too weak');
            return;
        }

        try {
            console.log(`Sending reset request with token: ${token}, password: ${password}`);
            const response = await axios.post(
                `https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/auth/reset-password/${token}`,
                { password }
            );
            console.log('Reset response:', response.data);
            toast.success(response.data.message);
        } catch (error) {
            console.error('Reset error:', error.response || error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.errors?.[0]?.msg || 
                               'Failed to reset password. Please try again.';
            toast.error(errorMessage);
            setError(errorMessage);
        }
    };

    return (
        <Container>
            <Title>Reset Password</Title>
            <Form onSubmit={handleSubmit}>
                <InputContainer>
                    <Input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            validatePassword(e.target.value);
                            setError('');
                        }}
                        required
                    />
                    <ToggleButton
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                    </ToggleButton>
                </InputContainer>
                {password && (
                    <StrengthContainer>
                        <StrengthText>Password Strength: {passwordStrength}</StrengthText>
                        <StrengthBar strength={passwordStrength} />
                    </StrengthContainer>
                )}
                <InputContainer>
                    <Input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            setError('');
                        }}
                        required
                    />
                    <ToggleButton
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                    </ToggleButton>
                </InputContainer>
                {error && <ErrorText>{error}</ErrorText>}
                <SubmitButton type="submit" disabled={!password || !confirmPassword}>
                    Reset Password
                </SubmitButton>
            </Form>
            <ToastContainer 
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </Container>
    );
};

export default ResetPassword;
