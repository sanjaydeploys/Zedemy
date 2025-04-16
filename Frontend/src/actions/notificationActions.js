import axios from 'axios';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setAuthToken } from '../utils/setAuthToken';
import {
    FETCH_NOTIFICATIONS_SUCCESS,
    ADD_NOTIFICATION_SUCCESS,
    MARK_NOTIFICATION_AS_READ_SUCCESS,
    FOLLOW_CATEGORY_SUCCESS,
    UNFOLLOW_CATEGORY_SUCCESS,
    FETCH_FOLLOWED_CATEGORIES_SUCCESS
} from './types';

const API_BASE_URL = 'https://desei9yzrk.execute-api.ap-south-1.amazonaws.com/prod/api/notifications';

export const fetchNotifications = () => async dispatch => {
    const token = localStorage.getItem('token');
    console.log('[fetchNotifications] Starting fetch process...');
    if (!token) {
        console.log('[fetchNotifications] No token found, skipping fetch notifications');
        return;
    }

    setAuthToken(token);
    console.log('[fetchNotifications] Token set, fetching notifications from:', API_BASE_URL);
    try {
        const response = await axios.get(API_BASE_URL, {
            headers: { 'x-auth-token': token }
        });
        console.log('[fetchNotifications] Successfully fetched notifications:', response.data);
        dispatch({ type: FETCH_NOTIFICATIONS_SUCCESS, payload: response.data });
    } catch (error) {
        console.error('[fetchNotifications] Error fetching notifications:', {
            message: error.message,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : 'No response data'
        });
    }
};

export const addNotification = (notification) => async dispatch => {
    const token = localStorage.getItem('token');
    console.log('[addNotification] Starting add process...', { notification });
    if (!token) {
        console.log('[addNotification] No token found, skipping add notification');
        return;
    }

    console.log('[addNotification] Token found, preparing to add notification:', notification);
    try {
        setAuthToken(token);
        const response = await axios.post(API_BASE_URL, notification, {
            headers: { 'x-auth-token': token }
        });
        console.log('[addNotification] Notification successfully added:', response.data);
        dispatch({ type: ADD_NOTIFICATION_SUCCESS, payload: response.data });
    } catch (error) {
        console.error('[addNotification] Error adding notification:', {
            message: error.message,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : 'No response data'
        });
    }
};

export const markNotificationAsRead = (id) => async dispatch => {
    const token = localStorage.getItem('token');
    console.log('[markNotificationAsRead] Starting process for ID:', id);
    if (!token) {
        console.log('[markNotificationAsRead] No token found, skipping mark as read');
        return;
    }

    setAuthToken(token);
    console.log('[markNotificationAsRead] Token set, marking notification as read:', id);
    try {
        const response = await axios.put(`${API_BASE_URL}/${id}/read`, {}, {
            headers: { 'x-auth-token': token }
        });
        console.log('[markNotificationAsRead] Notification marked as read:', response.data);
        dispatch({ type: MARK_NOTIFICATION_AS_READ_SUCCESS, payload: response.data });
        toast.success('Notification marked as read successfully', {
            position: 'top-right',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
    } catch (error) {
        console.error('[markNotificationAsRead] Error marking notification as read:', {
            message: error.message,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : 'No response data'
        });
        toast.error('Error marking as read. Please try again.', {
            position: 'top-right',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
    }
};

export const followCategory = (category) => async dispatch => {
    const token = localStorage.getItem('token');
    console.log('[followCategory] Starting process for category:', category);
    if (!token) {
        console.log('[followCategory] No token found, user must log in to follow category');
        toast.error('Please log in to follow a category.', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
        return;
    }

    setAuthToken(token);
    console.log('[followCategory] Token set, following category:', category);
    try {
        const response = await axios.post(`${API_BASE_URL}/follow-category`, { category }, {
            headers: { 'x-auth-token': token }
        });
        const followedCategories = response.data;
        console.log('[followCategory] Category followed successfully:', followedCategories);
        dispatch({ type: FOLLOW_CATEGORY_SUCCESS, payload: followedCategories });
        toast.success('You have successfully followed the category!', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
    } catch (error) {
        console.error('[followCategory] Error following category:', {
            message: error.message,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : 'No response data'
        });
        toast.error('Error following category. Please try again.', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
    }
};

export const unfollowCategory = (category) => async dispatch => {
    const token = localStorage.getItem('token');
    console.log('[unfollowCategory] Starting process for category:', category);
    if (!token) {
        console.log('[unfollowCategory] No token found, user must log in to unfollow category');
        toast.error('Please log in to unfollow a category.', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
        return;
    }

    setAuthToken(token);
    console.log('[unfollowCategory] Token set, unfollowing category:', category);
    try {
        const response = await axios.post(`${API_BASE_URL}/unfollow-category`, { category }, {
            headers: { 'x-auth-token': token }
        });
        const followedCategories = response.data;
        console.log('[unfollowCategory] Category unfollowed successfully:', followedCategories);
        dispatch({ type: UNFOLLOW_CATEGORY_SUCCESS, payload: followedCategories });
        toast.success('Category unfollowed successfully.', {
            position: 'top-right',
            autoClose: 2000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
    } catch (error) {
        console.error('[unfollowCategory] Error unfollowing category:', {
            message: error.message,
            response: error.response ? {
                status: error.response.status,
                data: error.response.data
            } : 'No response data'
        });
        toast.error('Error unfollowing category. Please try again.', {
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: true,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
        });
    }
};

export const fetchFollowedCategories = () => async dispatch => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setAuthToken(token);
    try {
      const response = await axios.get(`${API_BASE_URL}/followed-categories`, {
        headers: { 'x-auth-token': token }
      });
      console.log('[fetchFollowedCategories] Fetched:', response.data);
      dispatch({ type: FETCH_FOLLOWED_CATEGORIES_SUCCESS, payload: response.data });
    } catch (error) {
      console.error('[fetchFollowedCategories] Error:', error);
      toast.error('Failed to fetch followed categories.');
    }
  };
