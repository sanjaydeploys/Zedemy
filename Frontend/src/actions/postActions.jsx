import { toast } from 'react-toastify';
const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';
const SSR_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod';

// Utility function for retrying fetch requests
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, options);
      if (res.ok) return res;
      const errorText = await res.text().catch(() => 'No error details available');
      console.warn(`[fetchWithRetry] Attempt ${i + 1} failed: ${res.status} - ${errorText}`);
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`HTTP error! status: ${res.status}, details: ${errorText}`);
      }
    } catch (error) {
      if (i < retries - 1) {
        console.warn(`[fetchWithRetry] Attempt ${i + 1} error: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
};

export const fetchPostSSR = (slug) => async (dispatch) => {
  try {
    const response = await fetch(`${SSR_BASE_URL}/post/${slug}?t=${Date.now()}`, {
      headers: {
        'Accept': 'text/html',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    if (!response.ok) {
      throw new Error(`SSR fetch error: ${response.status}`);
    }

    const html = await response.text();
    const match = html.match(/window\.__POST_DATA__\s*=\s*({[\s\S]*?});/);
    let postData = {};
    if (match && match[1]) {
      try {
        postData = JSON.parse(match[1]);
      } catch (err) {
        console.error('[fetchPostSSR] Error parsing window.__POST_DATA__:', err.message);
      }
    }

    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: postData
    });

    return { html, postData };
  } catch (error) {
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    toast.error('Failed to load SSR data.', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const fetchPosts = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  try {
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br'
    };
    if (token) {
      headers['x-auth-token'] = token;
    }
    const res = await fetch(`${API_BASE_URL}?fields=postId,slug,title,titleImage,category,author,date&t=${Date.now()}`, { headers });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'FETCH_POSTS_SUCCESS', payload: data });
  } catch (error) {
    dispatch({ type: 'FETCH_POSTS_FAILURE', payload: error.message });
    toast.error('Failed to fetch posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchUserPosts = () => async (dispatch, getState) => {
  const token = localStorage.getItem('token');
  let user = getState().auth.user;
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      console.error('[fetchUserPosts] Error parsing user from localStorage:', err.message);
    }
  }
  if (!token || !user?.id) {
    console.warn('[fetchUserPosts] Missing token or user ID:', { token: !!token, userId: user?.id });
    dispatch({ type: 'FETCH_USER_POSTS_FAILURE', payload: 'Authentication required' });
    toast.error('Please log in to view your posts.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  console.log('[fetchUserPosts] Fetching posts for user:', user.id);
  dispatch({ type: 'FETCH_USER_POSTS_REQUEST' });
  try {
    const res = await fetch(`${API_BASE_URL}/userposts?fields=postId,slug,title,titleImage,category,author,date&t=${Date.now()}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      }
    });
    if (!res.ok) {
      const status = res.status;
      const errorText = await res.text();
      console.error('[fetchUserPosts] Failed with status:', status, 'details:', errorText);
      if (status === 404) {
        dispatch({ type: 'FETCH_USER_POSTS_SUCCESS', payload: [] });
        return;
      }
      throw new Error(`HTTP error! status: ${status}, details: ${errorText}`);
    }
    const data = await res.json();
    console.log('[fetchUserPosts] Fetched posts:', data);
    dispatch({ type: 'FETCH_USER_POSTS_SUCCESS', payload: data });
  } catch (error) {
    console.error('[fetchUserPosts] Error:', error.message);
    dispatch({ type: 'FETCH_USER_POSTS_FAILURE', payload: error.message });
    toast.error(`Failed to fetch user posts: ${error.message}`, { position: 'top-right', autoClose: 2000 });
  }
};

export const searchPosts = (query) => async (dispatch) => {
  try {
    const res = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}&fields=postId,slug,title,titleImage,category,author,date&t=${Date.now()}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'SEARCH_POSTS_SUCCESS', payload: data });
  } catch (error) {
    dispatch({ type: 'SEARCH_POSTS_FAILURE', payload: error.message });
    toast.error('Failed to search posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchPostBySlug = (slug) => async (dispatch, getState) => {
  try {
    console.log('[fetchPostBySlug] Starting for slug:', slug);
    const currentPost = getState().postReducer.post;
    if (currentPost?.slug === slug) {
      console.log('[fetchPostBySlug] Post already in state, skipping fetch');
      return;
    }

    const apiRes = await fetch(`${API_BASE_URL}/${slug}?fields=postId,slug,title,titleImage,category,author,date&t=${Date.now()}`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!apiRes.ok) throw new Error(`API error: ${apiRes.status}`);
    const postData = await apiRes.json();

    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: {
        ...postData,
        slug,
        postId: postData.postId || '',
        title: postData.title || 'Untitled Post',
        author: postData.author || 'Zedemy Team',
        date: postData.date || new Date().toISOString(),
        titleImage: postData.titleImage || '',
        category: postData.category || 'General'
      }
    });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', error.message);
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    toast.error('Failed to load post data.', { position: 'top-right', autoClose: 2000 });
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
  let user = getState().auth.user;
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      console.error('[addPost] Error parsing user from localStorage:', err.message);
    }
  }
  if (!token || !user?.id) {
    console.error('[addPost] Missing token or user ID:', { token: !!token, userId: user?.id });
    toast.error('Authentication required to add post.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  console.log('[addPost] Adding post:', title, 'by user:', user.id);
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
    userId: user.id,
    titleImageAspectRatio: titleImageAspectRatio || '16:9'
  };
  try {
    const res = await fetch(`${API_BASE_URL}?t=${Date.now()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      },
      body: JSON.stringify(postData)
    });
    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`HTTP error! status: ${res.status}, details: ${errorText}`);
    }
    const data = await res.json();
    dispatch({ type: 'ADD_POST_SUCCESS', payload: data });
    toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });
  } catch (error) {
    console.error('[addPost] Error:', error.message);
    toast.error(`Failed to add post: ${error.message}`, { position: 'top-right', autoClose: 2000 });
  }
};

export const markPostAsCompleted = (postId) => async (dispatch, getState) => {
  if (!postId) {
    console.error('[markPostAsCompleted] Invalid postId:', postId);
    toast.error('Invalid post ID.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  const token = localStorage.getItem('token');
  let user = getState().auth.user;
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      console.error('[markPostAsCompleted] Error parsing user from localStorage:', err.message);
    }
  }
  if (!token) {
    console.error('[markPostAsCompleted] Missing authentication token');
    toast.error('Authentication token missing. Please log in.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  if (!user?.id) {
    console.error('[markPostAsCompleted] Missing user ID:', { user });
    toast.error('User ID not found. Please log in.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  const { completedPosts = [] } = getState().postReducer;
  if (completedPosts.some((post) => post.postId === postId)) {
    console.log('[markPostAsCompleted] Post already completed:', postId);
    toast.info('This post is already completed.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  console.log('[markPostAsCompleted] Marking post as completed:', postId, 'for user:', user.id);
  try {
    const res = await fetchWithRetry(`${API_BASE_URL}/complete/${postId}?t=${Date.now()}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      },
      body: JSON.stringify({})
    }, 3, 1000);
    const data = await res.json();
    dispatch({ type: 'MARK_POST_COMPLETED_SUCCESS', payload: { postId } });
    if (data.certificateUrl) {
      toast.success(`Category completed! Certificate: ${data.certificateUrl}`, {
        position: 'top-right',
        autoClose: 5000,
        onClick: () => window.open(data.certificateUrl, '_blank')
      });
      dispatch({ type: 'FETCH_CERTIFICATES' });
    } else {
      toast.success('Post marked as completed!', { position: 'top-right', autoClose: 2000 });
    }
    dispatch(fetchCompletedPosts());
  } catch (error) {
    console.error('[markPostAsCompleted] Error:', error.message, 'postId:', postId);
    toast.error(`Failed to mark post as completed: ${error.message}`, { position: 'top-right', autoClose: 3000 });
  }
};

export const fetchCompletedPosts = ({ retries = 3, delay = 1000 } = {}) => async (dispatch, getState) => {
  const token = localStorage.getItem('token');
  let user = getState().auth.user;
  if (!user) {
    try {
      user = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (err) {
      console.error('[fetchCompletedPosts] Error parsing user from localStorage:', err.message);
    }
  }
  if (!token || !user?.id) {
    console.warn('[fetchCompletedPosts] Missing token or user ID:', { token: !!token, userId: user?.id });
    dispatch({ type: 'FETCH_COMPLETED_POSTS_FAILURE', payload: 'Authentication required' });
    toast.error('Please log in to view completed posts.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  console.log('[fetchCompletedPosts] Fetching completed posts for user:', user.id);
  try {
    const res = await fetchWithRetry(`${API_BASE_URL}/completed?t=${Date.now()}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      }
    }, retries, delay);
    if (!res.ok) {
      const status = res.status;
      const errorText = await res.text();
      console.error('[fetchCompletedPosts] Failed with status:', status, 'details:', errorText);
      if (status === 404) {
        dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: [] });
        return;
      }
      throw new Error(`HTTP error! status: ${status}, details: ${errorText}`);
    }
    const data = await res.json();
    console.log('[fetchCompletedPosts] Fetched completed posts:', data);
    dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: data });
  } catch (error) {
    console.error('[fetchCompletedPosts] Error:', error.message);
    dispatch({ type: 'FETCH_COMPLETED_POSTS_FAILURE', payload: error.message });
    toast.error(`Failed to fetch completed posts: ${error.message}`, { position: 'top-right', autoClose: 3000 });
  }
};
