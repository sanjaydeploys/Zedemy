import { setAuthToken } from '../utils/setAuthToken';
import { toast } from 'react-toastify';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

export const fetchPostBySlug = (slug) => async (dispatch) => {
  try {
    dispatch({ type: 'CLEAR_POST' });

    const viewport = window.innerWidth <= 360 ? 'small' : window.innerWidth <= 480 ? 'mobile' : window.innerWidth <= 768 ? 'tablet' : window.innerWidth <= 1200 ? 'desktop' : 'large';
    const cacheKey = `${API_BASE_URL}/post/${slug}?viewport=${viewport}`;
    const cachedPost = await caches.match(cacheKey);
    if (cachedPost) {
      const post = await cachedPost.json();
      if (!post.lcpContent || !post.preRenderedContent) {
        console.log('[fetchPostBySlug] Skipping invalid cache: empty lcpContent or preRenderedContent');
        const cache = await caches.open('api-cache');
        await cache.delete(cacheKey);
      } else {
        dispatch({
          type: 'FETCH_POST_INITIAL',
          payload: {
            title: post.title,
            lcpContent: post.lcpContent,
            contentHeight: post.contentHeight,
            titleImageAspectRatio: post.titleImageAspectRatio || '16:9'
          }
        });
        dispatch({
          type: 'FETCH_POST_SUCCESS',
          payload: {
            ...post,
            preRenderedContent: post.preRenderedContent || '',
            lcpContent: post.lcpContent || '',
            contentHeight: post.contentHeight,
            titleImageAspectRatio: post.titleImageAspectRatio || '16:9'
          },
        });
        console.log('[fetchPostBySlug] Cached post:', { preRenderedContent: post.preRenderedContent, lcpContent: post.lcpContent });
        return;
      }
    }

    const response = await fetch(`${API_BASE_URL}/post/${slug}?viewport=${viewport}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();

    if (!data || !data.lcpContent) {
      throw new Error('Invalid API response: No data or empty lcpContent');
    }

    const preRenderedContent = data.preRenderedContent || '<p>No content available.</p>';
    const lcpContent = data.lcpContent || '';

    console.log('[fetchPostBySlug] API response:', { preRenderedContent, lcpContent });

    dispatch({
      type: 'FETCH_POST_INITIAL',
      payload: {
        title: data.title,
        lcpContent,
        contentHeight: data.contentHeight,
        titleImageAspectRatio: data.titleImageAspectRatio || '16:9'
      }
    });

    const post = {
      ...data,
      preRenderedContent,
      lcpContent,
      contentHeight: data.contentHeight,
      titleImageAspectRatio: data.titleImageAspectRatio || '16:9'
    };

    const cache = await caches.open('api-cache');
    await cache.put(cacheKey, new Response(JSON.stringify(post), {
      headers: { 'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800' },
    }));

    dispatch({ type: 'FETCH_POST_SUCCESS', payload: post });
  } catch (error) {
    console.error('[fetchPostBySlug] Fetch failed:', error.message, error.stack);
    const cacheKey = `${API_BASE_URL}/post/${slug}?viewport=${viewport}`;
    const cachedPost = await caches.match(cacheKey);
    if (cachedPost) {
      const post = await cachedPost.json();
      if (post.lcpContent && post.preRenderedContent) {
        dispatch({
          type: 'FETCH_POST_INITIAL',
          payload: {
            title: post.title,
            lcpContent: post.lcpContent,
            contentHeight: post.contentHeight,
            titleImageAspectRatio: post.titleImageAspectRatio || '16:9'
          }
        });
        dispatch({
          type: 'FETCH_POST_SUCCESS',
          payload: post
        });
        toast.warn('Using cached post due to network issue.', { position: 'top-right', autoClose: 3000 });
      } else {
        console.log('[fetchPostBySlug] Skipping invalid cache in error handler: empty lcpContent or preRenderedContent');
        dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
        dispatch({
          type: 'FETCH_POST_INITIAL',
          payload: {
            title: 'Loading...',
            lcpContent: '',
            contentHeight: 0,
            titleImageAspectRatio: '16:9'
          }
        });
        toast.error('Failed to load post. Please check your connection.', { position: 'top-right', autoClose: 3000 });
      }
    } else {
      dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
      dispatch({
        type: 'FETCH_POST_INITIAL',
        payload: {
          title: 'Loading...',
          lcpContent: '',
          contentHeight: 0,
          titleImageAspectRatio: '16:9'
        }
      });
      toast.error('Failed to load post. Please check your connection.', { position: 'top-right', autoClose: 3000 });
    }
  }
};

export const searchPosts = (slug) => async (dispatch) => {
  try {
    const res = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(slug)}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'SEARCH_POSTS_SUCCESS', payload: data });
  } catch (error) {
    console.error('[searchPosts] Error:', error.message);
    dispatch({ type: 'SEARCH_POSTS_FAILURE', payload: error.message });
    toast.error('Failed to search posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchPosts = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  try {
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br',
    };
    if (token) {
      setAuthToken(token);
      headers['x-auth-token'] = token;
    }
    const res = await fetch(API_BASE_URL, { headers });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'FETCH_POSTS_SUCCESS', payload: data });
  } catch (error) {
    console.error('[fetchPosts] Error:', error.message);
    dispatch({ type: 'FETCH_POSTS_FAILURE', payload: error.message });
    toast.error('Failed to fetch posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchUserPosts = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (!token) return;
  dispatch({ type: 'FETCH_USER_POSTS_REQUEST' });
  try {
    setAuthToken(token);
    const res = await fetch(`${API_BASE_URL}/userposts`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'FETCH_USER_POSTS_SUCCESS', payload: data });
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
  videoHash,
  titleImageAspectRatio
) => async (dispatch, getState) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[addPost] No auth token found');
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
    titleImageAspectRatio: titleImageAspectRatio || '16:9'
  };
  try {
    setAuthToken(token);
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
      body: JSON.stringify(postData),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'ADD_POST_SUCCESS', payload: data });
    await fetch(`/api/users/category/${category}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
    });
    toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });
  } catch (error) {
    console.error('[addPost] Error:', error.message);
    toast.error('Failed to add post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const markPostAsCompleted = (postId) => async (dispatch, getState) => {
  if (!postId) {
    console.error('[markPostAsCompleted] Invalid postId');
    return;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[markPostAsCompleted] No auth token');
    return;
  }
  const { completedPosts = [] } = getState().postReducer || {};
  if (completedPosts.some((post) => post.postId === postId)) {
    toast.info('This post is already completed.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  try {
    setAuthToken(token);
    const res = await fetch(`${API_BASE_URL}/complete/${postId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'MARK_POST_COMPLETED_SUCCESS', payload: { postId } });
    if (data.certificateUrl) {
      toast.success(`Category completed! Certificate: ${data.certificateUrl}`, {
        position: 'top-right',
        autoClose: 5000,
        onClick: () => window.open(data.certificateUrl, '_blank'),
      });
      dispatch({ type: 'FETCH_CERTIFICATES' });
    } else {
      toast.success('Post marked as completed!', { position: 'top-right', autoClose: 2000 });
    }
    dispatch({ type: 'FETCH_COMPLETED_POSTS' });
  } catch (error) {
    console.error('[markPostAsCompleted] Error:', error.message);
    toast.error('Failed to mark post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchCompletedPosts = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (!token) return;
  setAuthToken(token);
  try {
    const res = await fetch(`${API_BASE_URL}/completed`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: data });
  } catch (error) {
    console.error('[fetchCompletedPosts] Error:', error.message);
    dispatch({ type: 'FETCH_COMPLETED_POSTS_FAILURE' });
    toast.error('Failed to fetch completed posts.', { position: 'top-right', autoClose: 2000 });
  }
};
