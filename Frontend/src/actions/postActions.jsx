import axios from 'axios';
import { setAuthToken } from '../utils/setAuthToken';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';
import { parseLinks } from '../components/utils';

export const fetchPostBySlug = (slug) => async (dispatch) => {
  console.log('[fetchPostBySlug] Fetching post:', slug);
  try {
    dispatch({ type: 'CLEAR_POST' });
    // Dispatch minimal placeholder for immediate render
    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: {
        title: 'Loading...',
        preRenderedContent: '',
        estimatedContentHeight: 150,
      },
    });

    const cacheBust = new Date().getTime();
    const res = await axios.get(`${API_BASE_URL}/post/${slug}?cb=${cacheBust}`, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });

    const contentField = res.data.content || res.data.body || res.data.text || '';
    if (!contentField) {
      console.warn('[fetchPostBySlug] No content field:', res.data);
    }

    // Use parseLinks from utils.jsx for minimal processing
    const preRenderedContent = parseLinks(contentField, res.data.category, true);
    const post = {
      ...res.data,
      preRenderedContent,
      estimatedContentHeight: 150, // Fixed height to avoid CLS
    };

    dispatch({ type: 'FETCH_POST_SUCCESS', payload: post });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response',
    });
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to fetch post.', { position: 'top-right', autoClose: 2000 });
    });
  }
};

// Defer other actions to avoid blocking initial render
export const searchPosts = (slug) => async (dispatch) => {
  const { toast } = await import('react-toastify');
  console.log('[searchPosts] Searching posts:', slug);
  try {
    const res = await axios.get(`${API_BASE_URL}/search?query=${encodeURIComponent(slug)}`);
    dispatch({ type: 'SEARCH_POSTS_SUCCESS', payload: res.data });
  } catch (error) {
    console.error('[searchPosts] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    dispatch({ type: 'SEARCH_POSTS_FAILURE', payload: error.response?.data?.message || 'Failed to search posts' });
    toast.error('Failed to search posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchPosts = () => async (dispatch) => {
  const { toast } = await import('react-toastify');
  console.log('[fetchPosts] Fetching all posts...');
  const token = localStorage.getItem('token');
  if (token) setAuthToken(token);
  try {
    const res = await axios.get(API_BASE_URL, {
      headers: token ? { 'x-auth-token': token } : {},
    });
    dispatch({ type: 'FETCH_POSTS_SUCCESS', payload: res.data });
  } catch (error) {
    console.error('[fetchPosts] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    dispatch({ type: 'FETCH_POSTS_FAILURE', payload: error.message });
    toast.error('Failed to fetch posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchUserPosts = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.log('[fetchUserPosts] No token found');
    return;
  }
  dispatch({ type: 'FETCH_USER_POSTS_REQUEST' });
  try {
    const res = await axios.get(`${API_BASE_URL}/userposts`, {
      headers: { 'x-auth-token': token },
    });
    dispatch({ type: 'FETCH_USER_POSTS_SUCCESS', payload: res.data });
  } catch (error) {
    console.error('[fetchUserPosts] Error:', error.message);
    dispatch({ type: 'FETCH_USER_POSTS_FAILURE', payload: error.message });
  }
};

export const addPost = (
  title,
  content,
  category,
  subtitles,
  summary,
  titleImage,
  superTitles,
  titleVideo,
  titleImageHash,
  videoHash
) => async (dispatch, getState) => {
  const { toast } = await import('react-toastify');
  const token = localStorage.getItem('token');
  console.log('[addPost] Starting add post...');
  if (!token) {
    console.error('[addPost] No auth token found');
    toast.error('Please log in to add a post.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  const { user } = getState().auth || JSON.parse(localStorage.getItem('user') || '{}');
  if (!user) {
    console.error('[addPost] User not found');
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
    author: user.name,
  };
  try {
    setAuthToken(token);
    const res = await axios.post(API_BASE_URL, postData, {
      headers: { 'x-auth-token': token },
    });
    dispatch({ type: 'ADD_POST_SUCCESS', payload: res.data });
    toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });
    await axios.get(`https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/users/category/${category}`, {
      headers: { 'x-auth-token': token },
    });
  } catch (error) {
    console.error('[addPost] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    toast.error('Failed to add post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const markPostAsCompleted = (postId) => async (dispatch, getState) => {
  const { toast } = await import('react-toastify');
  console.log('[markPostAsCompleted] Starting with postId:', postId);
  if (!postId) {
    console.error('[markPostAsCompleted] Invalid postId');
    toast.error('Invalid post ID.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[markPostAsCompleted] No auth token');
    toast.error('Please log in to mark posts.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  const { completedPosts = [] } = getState().postReducer || {};
  if (completedPosts.some((post) => post.postId === postId)) {
    console.log('[markPostAsCompleted] Post already completed:', postId);
    toast.info('This post is already completed.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  try {
    setAuthToken(token);
    const res = await axios.put(`${API_BASE_URL}/complete/${postId}`, {}, {
      headers: { 'x-auth-token': token },
    });
    dispatch({ type: 'MARK_POST_COMPLETED_SUCCESS', payload: { postId } });
    if (res.data.certificateUrl) {
      toast.success(`Category completed! Certificate: ${res.data.certificateUrl}`, {
        position: 'top-right',
        autoClose: 5000,
        onClick: () => window.open(res.data.certificateUrl, '_blank'),
      });
      dispatch({ type: 'FETCH_CERTIFICATES' });
    } else {
      toast.success('Post marked as completed!', { position: 'top-right', autoClose: 2000 });
    }
    dispatch({ type: 'FETCH_COMPLETED_POSTS' });
  } catch (error) {
    console.error('[markPostAsCompleted] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    toast.error(error.response?.data?.msg || 'Failed to mark post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchCompletedPosts = () => async (dispatch) => {
  const { toast } = await import('react-toastify');
  const token = localStorage.getItem('token');
  console.log('[fetchCompletedPosts] Starting fetch...');
  if (!token) {
    console.log('[fetchCompletedPosts] No token found');
    return;
  }
  setAuthToken(token);
  try {
    const res = await axios.get(`${API_BASE_URL}/completed`, {
      headers: { 'x-auth-token': token },
    });
    dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: res.data });
  } catch (error) {
    console.error('[fetchCompletedPosts] Error:', {
      message: error.message,
      response: error.response ? error.response.data : 'No response'
    });
    dispatch({ type: 'FETCH_COMPLETED_POSTS_FAILURE' });
    toast.error('Failed to fetch completed posts.', { position: 'top-right', autoClose: 2000 });
  }
};
