import axios from 'axios';
import { setAuthToken } from '../utils/setAuthToken';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FETCH_POSTS_SUCCESS,
    ADD_POST_SUCCESS,
    FETCH_USER_POSTS_SUCCESS,
    FETCH_USER_POSTS_REQUEST,
    FETCH_USER_POSTS_FAILURE,
    SEARCH_POSTS_SUCCESS,
    SEARCH_POSTS_FAILURE,
    FETCH_COMPLETED_POSTS_SUCCESS,
    MARK_POST_COMPLETED_SUCCESS,
    FETCH_COMPLETED_POSTS_FAILURE,
    FETCH_POST_SUCCESS
} from './types';
import { fetchCertificates } from './certificateActions';
const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

export const fetchPostBySlug = (slug) => async dispatch => {
    console.log('[fetchPostBySlug] Fetching post by slug:', slug);
    try {
        const res = await axios.get(`${API_BASE_URL}/post/${slug}`);
        console.log('[fetchPostBySlug] Fetched post data:', res.data);
        dispatch({ type: FETCH_POST_SUCCESS, payload: res.data });
    } catch (error) {
        console.error('[fetchPostBySlug] Error fetching post by slug:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response'
        });
    }
};

export const searchPosts = (query) => async dispatch => {
    console.log('[searchPosts] Searching posts with query:', query);
    try {
        const res = await axios.get(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        console.log('[searchPosts] Search results:', res.data);
        dispatch({ type: SEARCH_POSTS_SUCCESS, payload: res.data });
    } catch (error) {
        console.error('[searchPosts] Error searching posts:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response'
        });
        dispatch({ type: SEARCH_POSTS_FAILURE, payload: error.response?.data?.message || 'Failed to search posts' });
        toast.error('Failed to search posts.', { position: 'top-right', autoClose: 2000 });
    }
};

export const fetchPosts = () => async dispatch => {
    console.log('[fetchPosts] Fetching all posts...');
    const token = localStorage.getItem('token');
    if (token) setAuthToken(token);
    try {
        const res = await axios.get(API_BASE_URL, {
            headers: token ? { 'x-auth-token': token } : {}
        });
        console.log('[fetchPosts] Fetched posts:', res.data);
        dispatch({ type: FETCH_POSTS_SUCCESS, payload: res.data });
    } catch (error) {
        console.error('[fetchPosts] Error fetching posts:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response'
        });
    }
};

export const fetchUserPosts = () => async (dispatch) => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('[fetchUserPosts] No token found');
      return;
    }
    dispatch({ type: FETCH_USER_POSTS_REQUEST });
    try {
      const res = await axios.get(`${API_BASE_URL}/userposts`, { headers: { 'x-auth-token': token } });
      console.log('[fetchUserPosts] Fetched user posts:', res.data);
      dispatch({ type: FETCH_USER_POSTS_SUCCESS, payload: res.data });
    } catch (error) {
      console.error('[fetchUserPosts] Error:', error.message);
      dispatch({ type: FETCH_USER_POSTS_FAILURE, payload: error.message });
    }
};

export const addPost = (title, content, category, subtitles, summary, titleImage, superTitles, titleVideo, titleImageHash, videoHash) => async (dispatch, getState) => {
    const token = localStorage.getItem('token');
    console.log('[addPost] Starting add post process...');
    if (!token) {
        console.error('[addPost] No auth token found');
        toast.error('Please log in to add a post.', { position: 'top-right', autoClose: 2000 });
        return;
    }

    console.log('[addPost] Token found, adding new post...');
    const { user } = getState().auth || JSON.parse(localStorage.getItem('user') || '{}');
    if (!user) {
        console.error('[addPost] User not found in state or localStorage');
        return;
    }

    const postData = { 
        title, 
        content, 
        category, 
        subtitles, 
        summary, 
        titleImage, 
        superTitles, 
        titleVideo, 
        titleImageHash, 
        videoHash, 
        author: user.name 
    };
    console.log('[addPost] Sending post data to backend:', postData);

    try {
        setAuthToken(token);
        const res = await axios.post(API_BASE_URL, postData, {
            headers: { 'x-auth-token': token }
        });
        console.log('[addPost] Post added successfully:', res.data);
        dispatch({ type: ADD_POST_SUCCESS, payload: res.data });
        toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });

        console.log('[addPost] Fetching users to notify for category:', category);
        const usersToNotify = await axios.get(`https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/users/category/${category}`, {
            headers: { 'x-auth-token': token }
        });
        console.log('[addPost] Users to notify:', usersToNotify.data);
    } catch (error) {
        console.error('[addPost] Error adding post:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response'
        });
        toast.error('Failed to add post.', { position: 'top-right', autoClose: 2000 });
    }
};

export const markPostAsCompleted = (postId) => async (dispatch, getState) => {
    console.log('[markPostAsCompleted] Starting process with postId:', postId);
    if (!postId) {
        console.error('[markPostAsCompleted] Invalid postId: undefined');
        toast.error('Invalid post ID. Please try again.', { position: 'top-right', autoClose: 2000 });
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        console.error('[markPostAsCompleted] No auth token found');
        toast.error('Please log in to mark posts as completed.', { position: 'top-right', autoClose: 2000 });
        return;
    }

    console.log('[markPostAsCompleted] Token found, checking completed posts...');
    const { completedPosts = [] } = getState().postReducer || {};
    if (completedPosts.some(post => post.postId === postId)) {
        console.log('[markPostAsCompleted] Post already marked as completed in state:', postId);
        toast.info('This post is already marked as completed.', { position: 'top-right', autoClose: 2000 });
        return;
    }

    try {
        setAuthToken(token);
        console.log('[markPostAsCompleted] Sending request to mark post as completed:', `${API_BASE_URL}/complete/${postId}`);
        const res = await axios.put(`${API_BASE_URL}/complete/${postId}`, {}, {
            headers: { 'x-auth-token': token }
        });
        console.log('[markPostAsCompleted] Post marked as completed, response:', res.data);

        dispatch({ type: MARK_POST_COMPLETED_SUCCESS, payload: { postId } });

        if (res.data.certificateUrl) {
            console.log('[markPostAsCompleted] Certificate issued:', res.data.certificateUrl);
            toast.success(`Category completed! Certificate issued: ${res.data.certificateUrl}`, {
                position: 'top-right',
                autoClose: 5000,
                onClick: () => window.open(res.data.certificateUrl, '_blank')
            });
            dispatch(fetchCertificates());
        } else {
            console.log('[markPostAsCompleted] Post marked as completed, no certificate issued');
            toast.success('Post marked as completed!', { position: 'top-right', autoClose: 2000 });
        }

        console.log('[markPostAsCompleted] Fetching updated completed posts...');
        dispatch(fetchCompletedPosts());
    } catch (error) {
        console.error('[markPostAsCompleted] Error marking post as completed:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response'
        });
        toast.error(error.response?.data?.msg || 'Failed to mark post as completed.', { position: 'top-right', autoClose: 2000 });
    }
};

export const fetchCompletedPosts = () => async dispatch => {
    const token = localStorage.getItem('token');
    console.log('[fetchCompletedPosts] Starting fetch process...');
    if (!token) {
        console.log('[fetchCompletedPosts] No token found, skipping fetch completed posts');
        return;
    }

    setAuthToken(token);
    console.log('[fetchCompletedPosts] Token set, fetching completed posts from:', `${API_BASE_URL}/completed`);
    try {
        const res = await axios.get(`${API_BASE_URL}/completed`, {
            headers: { 'x-auth-token': token }
        });
        console.log('[fetchCompletedPosts] Fetched completed posts:', res.data);
        dispatch({ type: FETCH_COMPLETED_POSTS_SUCCESS, payload: res.data });
    } catch (error) {
        console.error('[fetchCompletedPosts] Error fetching completed posts:', {
            message: error.message,
            response: error.response ? error.response.data : 'No response'
        });
        dispatch({ type: FETCH_COMPLETED_POSTS_FAILURE });
        toast.error('Failed to fetch completed posts.', { position: 'top-right', autoClose: 2000 });
    }
};
