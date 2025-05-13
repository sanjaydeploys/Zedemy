import { setAuthToken } from '../utils/setAuthToken';
import { parseLinks } from '../components/utils';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

export const fetchPostBySlug = (slug) => async (dispatch) => {
  console.log('[fetchPostBySlug] Fetching post:', slug);
  try {
    dispatch({ type: 'CLEAR_POST' });

    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: {
        title: 'Loading...',
        preRenderedContent: '',
        contentHeight: 300,
      },
    });

    const viewport = window.innerWidth > 768 ? 'desktop' : 'mobile';
    const cacheKey = `${API_BASE_URL}/post/${slug}?viewport=${viewport}`;
    const cachedPost = await caches.match(cacheKey);
    if (cachedPost) {
      console.log('[fetchPostBySlug] Using cached post');
      const post = await cachedPost.json();
      dispatch({
        type: 'FETCH_POST_SUCCESS',
        payload: {
          ...post,
          preRenderedContent: post.preRenderedContent || '',
          contentHeight: post.contentHeight || 300,
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
      console.error('[fetchPostBySlug] API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();

    if (!data) {
      throw new Error('Invalid API response: No data');
    }

    const contentField = data.content || data.body || data.text || '';
    if (!contentField) {
      console.warn('[fetchPostBySlug] No valid content field:', data);
    }

    const preRenderedContent = contentField
      ? parseLinks(contentField, data.category || '', true)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/<img([^>]+)src=["']([^"']+)["']/gi, (match, attrs, src) => {
              const width = window.innerWidth <= 768 ? 240 : 320;
              const height = width / (16/9);
              return `<img${attrs} src="${src}?w=${width}&format=avif&q=5" srcset="${src}?w=240&format=avif&q=5 240w,${src}?w=320&format=avif&q=5 320w" sizes="(max-width: 768px) 240px, 320px" width="${width}" height="${height}" loading="lazy" decoding="async" fetchpriority="low"`;
            })
      : '';

    if (preRenderedContent.match(/<script|\bon\w+/i)) {
      console.warn('[fetchPostBySlug] Suspicious content detected:', preRenderedContent);
    }

    const post = {
      ...data,
      preRenderedContent,
      contentHeight: data.contentHeight || 300,
    };

    const cache = await caches.open('api-cache');
    await cache.put(cacheKey, new Response(JSON.stringify(post), {
      headers: { 'Cache-Control': 'public, max-age=2592000' },
    }));

    dispatch({ type: 'FETCH_POST_SUCCESS', payload: post });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', { message: error.message, slug });
    dispatch({
      type: 'FETCH_POST_FAILURE',
      payload: error.message,
    });
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to fetch post. Please check your network or try again later.', { position: 'top-right', autoClose: 2000 });
    });
  }
};

export const searchPosts = (slug) => async (dispatch) => {
  const { toast } = await import('react-toastify');
  console.log('[searchPosts] Searching posts:', slug);
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
    console.error('[searchPosts] Error:', { message: error.message });
    dispatch({ type: 'SEARCH_POSTS_FAILURE', payload: error.message || 'Failed to search posts' });
    toast.error('Failed to search posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchPosts = () => async (dispatch) => {
  const { toast } = await import('react-toastify');
  console.log('[fetchPosts] Fetching all posts...');
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
    console.error('[fetchPosts] Error:', { message: error.message });
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
    toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });
    await fetch(`https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/users/category/${category}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
    });
  } catch (error) {
    console.error('[addPost] Error:', { message: error.message });
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
    console.error('[markPostAsCompleted] Error:', { message: error.message });
    toast.error(error.message || 'Failed to mark post.', { position: 'top-right', autoClose: 2000 });
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
    console.error('[fetchCompletedPosts] Error:', { message: error.message });
    dispatch({ type: 'FETCH_COMPLETED_POSTS_FAILURE' });
    toast.error('Failed to fetch completed posts.', { position: 'top-right', autoClose: 2000 });
  }
};
