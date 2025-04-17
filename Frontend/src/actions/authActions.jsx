import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setAuthToken } from '../utils/setAuthToken';
import {
    FETCH_USER_SUCCESS,
    LOGIN_SUCCESS,
    REGISTER_SUCCESS,
    LOGOUT,
    AUTHENTICATE_USER,
    ACCEPT_POLICY_SUCCESS,
    AUTH_ERROR,
    FOLLOW_CATEGORY_SUCCESS
} from './types';

const API_BASE_URL = "https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api";

export const loadUser = () => async dispatch => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, skipping user load');
        dispatch({ type: AUTH_ERROR });
        return;
    }

    setAuthToken(token);
    console.log('Loading authenticated user...');
    try {
        const res = await axios.get(`${API_BASE_URL}/auth/user`, {
            headers: { 'x-auth-token': token }
        });
        const user = res.data;

        if (!user || !user.id) {
            console.error('Invalid user data received from backend:', res.data);
            throw new Error('Invalid user data');
        }

        localStorage.setItem('user', JSON.stringify(user));
        dispatch({
            type: FETCH_USER_SUCCESS,
            payload: { user, token, policyAccepted: user.policyAccepted || false }
        });
        dispatch({ type: FOLLOW_CATEGORY_SUCCESS, payload: user.followedCategories || [] });
        dispatch({ type: AUTHENTICATE_USER, payload: true });

        console.log('User loaded successfully:', user);
    } catch (error) {
        console.error('Error loading user:', error.response ? error.response.data : error.message);
        dispatch({ type: AUTH_ERROR });
    }
};

export const login = (email, password) => async dispatch => {
    console.log(`Attempting login with: ${email}`);
    const config = {
        headers: { 'Content-Type': 'application/json' }
    };
    const body = JSON.stringify({ email, password });

    try {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, body, config);
        console.log('Raw login response:', response.data);

        if (!response.data || !response.data.token || !response.data.user) {
            console.error('Invalid login response data:', response.data);
            throw new Error('Invalid user data from server');
        }

        const { token, user } = response.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Stored in localStorage:', { token, user });

        dispatch({
            type: LOGIN_SUCCESS,
            payload: { user, token }
        });
        setAuthToken(token);
        await dispatch(loadUser()); // Await to ensure loadUser completes

        console.log('Login successful:', user);
        toast.success('Login successful!', { position: 'top-right', autoClose: 2000 });
        return { success: true, user, token, role: user.role };
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message || 'Login failed';
        console.error('Error logging in:', errorMsg);
        toast.error(errorMsg, { position: 'top-right', autoClose: 2000 });
        return { success: false, message: errorMsg };
    }
};

export const register = (formData) => async dispatch => {
    console.log('Registering user:', formData.email);
    const config = {
        headers: { 'Content-Type': 'application/json' }
    };
    const body = JSON.stringify(formData);

    try {
        const res = await axios.post(`${API_BASE_URL}/auth/register`, body, config);
        console.log('Raw registration response:', res.data);

        if (!res.data || !res.data.token || !res.data.user) {
            console.error('Invalid registration response data:', res.data);
            throw new Error('Invalid user data from server');
        }

        const { token, user } = res.data;
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Stored in localStorage:', { token, user });

        dispatch({
            type: REGISTER_SUCCESS,
            payload: { user, token }
        });
        setAuthToken(token);
        await dispatch(loadUser());

        console.log('Registration successful:', user);
        toast.success('Registration successful!', { position: 'top-right', autoClose: 2000 });
        return { success: true, role: user.role };
    } catch (error) {
        const errorMsg = error.response?.data?.message || 'Registration failed';
        console.error('Error registering user:', errorMsg);
        toast.error(errorMsg, { position: 'top-right', autoClose: 2000 });
        return { success: false, message: errorMsg };
    }
};

export const loginSuccess = (userData) => async dispatch => {
    console.log('Processing login success with user data:', userData);
    let token = userData.token;
    let user = userData.user || userData;

    if (!token || !user) {
        console.error('Invalid or incomplete userData for loginSuccess:', userData);
        if (!token && user?.id) {
            console.log('No token provided, attempting to fetch with loadUser');
            await dispatch(loadUser()); // Try to fetch token if missing
            token = localStorage.getItem('token');
            user = JSON.parse(localStorage.getItem('user') || '{}');
        }
        if (!token || !user.id) {
            throw new Error('Invalid user data or unable to fetch token');
        }
    }

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setAuthToken(token);
    console.log('Stored in localStorage from loginSuccess:', { token, user });

    dispatch({
        type: LOGIN_SUCCESS,
        payload: { user, token }
    });
};

export const acceptPolicy = () => async dispatch => {
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('No token found, user must log in to accept policy');
        toast.error('Please log in to accept the policy.', { position: 'top-right', autoClose: 2000 });
        return;
    }

    console.log('Accepting policy...');
    try {
        setAuthToken(token);
        await axios.post(`${API_BASE_URL}/auth/accept-policy`, {}, {
            headers: { 'x-auth-token': token }
        });
        const res = await axios.get(`${API_BASE_URL}/auth/user`, {
            headers: { 'x-auth-token': token }
        });
        const user = res.data;

        if (!user || !user.id) {
            console.error('Invalid user data after policy acceptance:', res.data);
            throw new Error('Invalid user data');
        }

        localStorage.setItem('user', JSON.stringify(user));
        dispatch({ type: ACCEPT_POLICY_SUCCESS, payload: user });

        toast.success('Policy accepted successfully!', {
            position: 'top-right',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
        console.log('Policy acceptance successful:', user);
    } catch (error) {
        console.error('Error accepting policy:', error.response ? error.response.data : error.message);
        toast.error('Error accepting policy. Please try again.', {
            position: 'top-right',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
        });
    }
};

export const logout = () => dispatch => {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch({ type: LOGOUT });
    toast.info('Logged out successfully.', { position: 'top-right', autoClose: 2000 });
};
