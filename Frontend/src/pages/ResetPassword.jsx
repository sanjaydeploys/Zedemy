import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styled from 'styled-components';

// Styled Components
const Container = styled.div`
  max-width: 400px;
  margin: 48px auto;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: bold;
  text-align: center;
  color: #2d1b5e;
  margin-bottom: 24px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  
  &:focus {
    outline: none;
    border-color: #4b0082;
    box-shadow: 0 0 0 3px rgba(75, 0, 130, 0.1);
  }
`;

const ToggleButton = styled.button`
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #6b7280;
  
  &:hover {
    color: #374151;
  }
`;

const StrengthContainer = styled.div`
  margin-top: 8px;
`;

const StrengthText = styled.div`
  font-size: 0.875rem;
  color: #4b5563;
`;

const StrengthBar = styled.div`
  height: 6px;
  border-radius: 3px;
  background: ${(props) => {
    switch (props.strength) {
      case 'Strong':
        return '#22c55e';
      case 'Medium':
        return '#eab308';
      case 'Weak':
        return '#ef4444';
      default:
        return '#e5e7eb';
    }
  }};
  transition: background-color 0.3s;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  background: #4b0082;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: #5a0b9c;
  }
`;

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');

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
        
        if (!validatePassword(password)) {
            toast.error('Password is too weak. Please use at least 8 characters with uppercase, lowercase, numbers, and special characters.');
            return;
        }

        if (password !== confirmPassword) {
            toast.error('Passwords do not match.');
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
                        }}
                        required
                    />
                    <ToggleButton
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
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
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                    />
                    <ToggleButton
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                        {showConfirmPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        )}
                    </ToggleButton>
                </InputContainer>
                <SubmitButton type="submit">
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
                theme="light"
            />
        </Container>
    );
};

export default ResetPassword;
