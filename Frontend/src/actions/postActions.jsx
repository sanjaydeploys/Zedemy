import { setAuthToken } from '../utils/setAuthToken';
import { parseLinks } from '../components/utils';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

export const fetchPostBySlug = (slug) => async (dispatch) => {
  try {
    dispatch({ type: 'CLEAR_POST' });
    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: {
        title: 'Loading...',
        preRenderedContent: '',
        contentHeight: { mobile: 300, mobileSmall: 300, tablet: 300, desktop: 300 },
      },
    });

    const width = window.innerWidth;
    const viewport = width <= 375 ? 'mobileSmall' : width <= 768 ? 'mobile' : width <= 1024 ? 'tablet' : 'desktop';
    const cacheKey = `${API_BASE_URL}/post/${slug}?viewport=${viewport}`;
    const cachedPost = await caches.match(cacheKey);
    if (cachedPost) {
      const post = await cachedPost.json();
      dispatch({
        type: 'FETCH_POST_SUCCESS',
        payload: {
          ...post,
          preRenderedContent: post.preRenderedContent || '',
          contentHeight: post.contentHeight || { mobile: 300, mobileSmall: 300, tablet: 300, desktop: 300 },
        },
      });
      return;
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
    if (!data) {
      throw new Error('Invalid API response: No data');
    }

    const contentField = data.content || data.body || data.text || '';
    let isFirstImage = true;
    const preRenderedContent = contentField
      ? parseLinks(contentField, data.category || '', true)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/<img([^>]+)src=["']([^"']+)["']/gi, (match, attrs, src) => {
              const width = window.innerWidth <= 375 ? 200 : window.innerWidth <= 768 ? 240 : window.innerWidth <= 1024 ? 280 : 320;
              const height = width / (16/9);
              const priority = isFirstImage ? 'eager' : 'lazy';
              const fetchPriority = isFirstImage ? 'high' : 'auto';
              const decoding = isFirstImage ? 'sync' : 'async';
              isFirstImage = false;
              return `<img${attrs} src="${src}?w=${width}&format=avif&q=20" srcset="${src}?w=200&format=avif&q=20 200w,${src}?w=240&format=avif&q=20 240w,${src}?w=280&format=avif&q=20 280w,${src}?w=320&format=avif&q=20 320w" sizes="(max-width: 375px) 200px, (max-width: 768px) 240px, (max-width: 1024px) 280px, 320px" width="${width}" height="${height}" loading="${priority}" decoding="${decoding}" fetchpriority="${fetchPriority}"`;
            })
      : '';

    const post = {
      ...data,
      preRenderedContent,
      contentHeight: data.contentHeight || { mobile: 300, mobileSmall: 300, tablet: 300, desktop: 300 },
    };

    const cache = await caches.open('api-cache');
    await cache.put(cacheKey, new Response(JSON.stringify(post), {
      headers: { 'Cache-Control': 'public, max-age=86400' },
    }));

    dispatch({ type: 'FETCH_POST_SUCCESS', payload: post });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', { message: error.message, slug });
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to fetch post.', { position: 'top-right', autoClose: 2000 });
    });
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
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to search posts.', { position: 'top-right', autoClose: 2000 });
    });
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
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to fetch posts.', { position: 'top-right', autoClose: 2000 });
    });
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
  videoHash
) => async (dispatch, getState) => {
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[addPost] No auth token found');
    import('react-toastify').then(({ toast }) => {
      toast.error('Please log in to add a post.', { position: 'top-right', autoClose: 2000 });
    });
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
    import('react-toastify').then(({ toast }) => {
      toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });
    });
    await fetch(`https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/users/category/${category}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
    });
  } catch (error) {
    console.error('[addPost] Error:', error.message);
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to add post.', { position: 'top-right', autoClose: 2000 });
    });
  }
};

export const markPostAsCompleted = (postId) => async (dispatch, getState) => {
  if (!postId) {
    console.error('[markPostAsCompleted] Invalid postId');
    import('react-toastify').then(({ toast }) => {
      toast.error('Invalid post ID.', { position: 'top-right', autoClose: 2000 });
    });
    return;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[markPostAsCompleted] No auth token');
    import('react-toastify').then(({ toast }) => {
      toast.error('Please log in to mark posts.', { position: 'top-right', autoClose: 2000 });
    });
    return;
  }
  const { completedPosts = [] } = getState().postReducer || {};
  if (completedPosts.some((post) => post.postId === postId)) {
    import('react-toastify').then(({ toast }) => {
      toast.info('This post is already completed.', { position: 'top-right', autoClose: 2000 });
    });
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
      import('react-toastify').then(({ toast }) => {
        toast.success(`Category completed! Certificate: ${data.certificateUrl}`, {
          position: 'top-right',
          autoClose: 5000,
          onClick: () => window.open(data.certificateUrl, '_blank'),
        });
      });
      dispatch({ type: 'FETCH_CERTIFICATES' });
    } else {
      import('react-toastify').then(({ toast }) => {
        toast.success('Post marked as completed!', { position: 'top-right', autoClose: 2000 });
      });
    }
    dispatch({ type: 'FETCH_COMPLETED_POSTS' });
  } catch (error) {
    console.error('[markPostAsCompleted] Error:', error.message);
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to mark post.', { position: 'top-right', autoClose: 2000 });
    });
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
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to fetch completed posts.', { position: 'top-right', autoClose: 2000 });
    });
  }
};
