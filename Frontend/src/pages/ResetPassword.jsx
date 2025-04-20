import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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

    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 'Strong': return 'bg-green-500';
            case 'Medium': return 'bg-yellow-500';
            case 'Weak': return 'bg-red-500';
            default: return 'bg-gray-200';
        }
    };

    return (
        <div className="max-w-md mx-auto mt-12 p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center text-indigo-900 mb-6">Reset Password</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            validatePassword(e.target.value);
                        }}
                        required
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
                    </button>
                </div>
                {password && (
                    <div className="mt-2">
                        <div className="text-sm text-gray-600">Password Strength: {passwordStrength}</div>
                        <div className={`h-2 rounded-full ${getStrengthColor()} transition-all duration-300`} />
                    </div>
                )}
                <button
                    type="submit"
                    className="w-full p-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200"
                >
                    Reset Password
                </button>
            </form>
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
        </div>
    );
};

export default ResetPassword;
