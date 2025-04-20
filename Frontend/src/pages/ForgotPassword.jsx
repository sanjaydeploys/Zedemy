import React, { useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
  
  &:hover:not(:disabled) {
    background: linear-gradient(90deg, #5b21b6, #7c3aed);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: #9ca3af;
    cursor: not-allowed;
    opacity: 0.7;
  }
`;

const ErrorText = styled.p`
  color: #dc2626;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 12px;
`;

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateEmail(email)) {
            setError('Please enter a valid email address');
            toast.error('Please enter a valid email address');
            return;
        }

        setIsLoading(true);
        try {
            const response = await axios.post(
                'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/auth/forgot-password',
                { email }
            );
            toast.success(response.data.message);
            setEmail(''); // Clear input on success
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Failed to send reset link. Please try again.';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <Title>Forgot Password</Title>
            <Form onSubmit={handleSubmit}>
                <InputContainer>
                    <Input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => {
                            setEmail(e.target.value);
                            setError('');
                        }}
                        required
                        disabled={isLoading}
                    />
                </InputContainer>
                {error && <ErrorText>{error}</ErrorText>}
                <SubmitButton type="submit" disabled={isLoading || !email}>
                    {isLoading ? 'Sending...' : 'Submit'}
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

export default ForgotPassword;
