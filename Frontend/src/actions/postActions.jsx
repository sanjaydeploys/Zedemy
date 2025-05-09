import axios from 'axios';
import { setAuthToken } from '../utils/setAuthToken';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FETCH_POSTS_SUCCESS,
    FETCH_POSTS_FAILURE,
    ADD_POST_SUCCESS,
    FETCH_USER_POSTS_SUCCESS,
    FETCH_USER_POSTS_REQUEST,
    FETCH_USER_POSTS_FAILURE,
    SEARCH_POSTS_SUCCESS,
    SEARCH_POSTS_FAILURE,
    FETCH_COMPLETED_POSTS_SUCCESS,
    MARK_POST_COMPLETED_SUCCESS,
    FETCH_COMPLETED_POSTS_FAILURE,
    FETCH_POST_SUCCESS,
    FETCH_POST_FAILURE,
    FETCH_CRITICAL_POST_SUCCESS
} from './types';
import { fetchCertificates } from './certificateActions';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';
const cache = new Map();

const parseLinksForPreRender = (text, category) => {
  if (!text) return '';
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  return text.replace(linkRegex, (match, linkText, url) => {
    const isInternal = url.startsWith('/');
    return isInternal
      ? `<a href="${url}" class="text-blue-600 hover:text-blue-800" aria-label="Navigate to ${linkText}">${linkText}</a>`
      : `<a href="${url}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800" aria-label="Visit ${linkText}">${linkText}</a>`;
  });
};

export const fetchCriticalPostBySlug = (slug) => async () => {
  console.log('[fetchCriticalPostBySlug] Fetching critical post by slug:', slug);
  const cacheKey = `critical-post-${slug}`;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/post/${slug}`, {
      headers: { 'Cache-Control': 'public, max-age=3600' }
    });
    const contentField = res.data.content || res.data.body || res.data.text || '';
    const post = {
      ...res.data,
      preRenderedContent: parseLinksForPreRender(contentField, res.data.category),
    };
    cache.set(cacheKey, post);
    return post;
  } catch (error) {
    console.error('[fetchCriticalPostBySlug] Error:', error.message);
    throw error;
  }
};

export const fetchPostBySlug = (slug) => async dispatch => {
  console.log('[fetchPostBySlug] Fetching post by slug:', slug);
  const cacheKey = `post-${slug}`;
  if (cache.has(cacheKey)) {
    dispatch({ type: FETCH_POST_SUCCESS, payload: cache.get(cacheKey) });
    return;
  }
  try {
    const res = await axios.get(`${API_BASE_URL}/post/${slug}`);
    const contentField = res.data.content || res.data.body || res.data.text || '';
    if (!contentField) {
      console.warn('[fetchPostBySlug] No content field found:', res.data);
    }
    const post = {
      ...res.data,
      preRenderedContent: parseLinksForPreRender(contentField, res.data.category),
    };
    cache.set(cacheKey, post);
    dispatch({ type: FETCH_POST_SUCCESS, payload: post });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    dispatch({ type: FETCH_POST_FAILURE, payload: error.message });
    toast.error('Failed to fetch post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const searchPosts = (query) => async dispatch => {
  console.log('[searchPosts] Searching posts with query:', query);
  try {
    const res = await axios.get(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
    dispatch({ type: SEARCH_POSTS_SUCCESS, payload: res.data });
  } catch (error) {
    console.error('[searchPosts] Error:', {
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
    dispatch({ type: FETCH_POSTS_SUCCESS, payload: res.data });
  } catch (error) {
    console.error('[fetchPosts] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    dispatch({ type: FETCH_POSTS_FAILURE, payload: error.message });
    toast.error('Failed to fetch posts.', { position: 'top-right', autoClose: 2000 });
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
    dispatch({ type: ADD_POST_SUCCESS, payload: res.data });
    toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });

    console.log('[addPost] Fetching users to notify for category:', category);
    const usersToNotify = await axios.get(`https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/users/category/${category}`, {
      headers: { 'x-auth-token': token }
    });
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
    console.log('[markPostAsCompleted] Post already marked as completed:', postId);
    toast.info('This post is already marked as completed.', { position: 'top-right', autoClose: 2000 });
    return;
  }

  try {
    setAuthToken(token);
    const res = await axios.put(`${API_BASE_URL}/complete/${postId}`, {}, {
      headers: { 'x-auth-token': token }
    });
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

    dispatch(fetchCompletedPosts());
  } catch (error) {
    console.error('[markPostAsCompleted] Error:', {
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
    console.log('[fetchCompletedPosts] No token found, skipping fetch');
    return;
  }

  setAuthToken(token);
  try {
    const res = await axios.get(`${API_BASE_URL}/completed`, {
      headers: { 'x-auth-token': token }
    });
    dispatch({ type: FETCH_COMPLETED_POSTS_SUCCESS, payload: res.data });
  } catch (error) {
    console.error('[fetchCompletedPosts] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    dispatch({ type: FETCH_COMPLETED_POSTS_FAILURE });
    toast.error('Failed to fetch completed posts.', { position: 'top-right', autoClose: 2000 });
  }
};
