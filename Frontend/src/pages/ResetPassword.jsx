import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
    const { token } = useParams();
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            console.log(`Sending reset request with token: ${token}, password: ${password}`);
            const response = await axios.post(
                `https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/auth/reset-password/${token}`,
                { password }
            );
            console.log('Reset response:', response.data);
            setMessage(response.data.message);
        } catch (error) {
            console.error('Reset error:', error.response || error);
            const errorMessage = error.response?.data?.message || 
                               error.response?.data?.errors?.[0]?.msg || 
                               'Failed to reset password. Please try again.';
            setMessage(errorMessage);
        }
    };

    return (
        <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2 style={{ textAlign: 'center' }}>Reset Password</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{ width: '100%', padding: '10px', margin: '10px 0', borderRadius: '5px', border: '1px solid #ccc' }}
                />
                <button
                    type="submit"
                    style={{ width: '100%', padding: '10px', backgroundColor: '#4B0082', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                    Reset Password
                </button>
            </form>
            {message && <p style={{ color: message.includes('successfully') ? 'green' : 'red', textAlign: 'center', marginTop: '10px' }}>{message}</p>}
        </div>
    );
};

export default ResetPassword;
