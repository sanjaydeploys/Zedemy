import { setAuthToken } from '../utils/setAuthToken';
import { parseLinks } from '../components/utils';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

export const fetchPostBySlug = (slug) => async (dispatch) => {
  try {
    dispatch({ type: 'CLEAR_POST' });

    const viewport = window.innerWidth <= 360 ? 'small' : window.innerWidth <= 480 ? 'mobile' : window.innerWidth <= 768 ? 'tablet' : window.innerWidth <= 1200 ? 'desktop' : 'large';
    const cacheKey = `${API_BASE_URL}/post/${slug}?viewport=${viewport}`;
    const cachedPost = await caches.match(cacheKey);
    if (cachedPost) {
      const post = await cachedPost.json();
      dispatch({
        type: 'FETCH_POST_INITIAL',
        payload: { titleInitial: post.title, titleImageInitial: post.titleImage, lcpContent: post.lcpContent }
      });
      dispatch({
        type: 'FETCH_POST_SUCCESS',
        payload: {
          ...post,
          preRenderedContent: post.preRenderedContent || '',
          lcpContent: post.lcpContent || '',
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
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }
    const data = await response.json();

    if (!data) {
      throw new Error('Invalid API response: No data');
    }

    const contentField = data.content || data.body || data.text || '';
    if (!contentField) {
      console.error('[fetchPostBySlug] No valid content field:', data);
    }

    let imageCount = 0;
    const preRenderedContent = contentField
      ? parseLinks(contentField, data.category || '', true)
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/\bon\w+\s*=\s*["'][^"']*["']/gi, '')
          .replace(/<img([^>]+)src=["']([^"']+)["']/gi, (match, attrs, src) => {
              const width = viewport === 'small' ? 220 : viewport === 'mobile' ? 240 : viewport === 'tablet' ? 280 : viewport === 'desktop' ? 320 : 360;
              const height = width / (16/9);
              const priority = imageCount < 3 ? 'eager' : 'lazy';
              const fetchPriority = imageCount < 3 ? 'high' : 'auto';
              imageCount++;
              return `<img${attrs} src="${src}?w=${width}&format=avif&q=10" srcset="${src}?w=220&format=avif&q=10 220w,${src}?w=240&format=avif&q=10 240w,${src}?w=280&format=avif&q=10 280w,${src}?w=320&format=avif&q=10 320w,${src}?w=360&format=avif&q=10 360w" sizes="(max-width: 360px) 220px, (max-width: 480px) 240px, (max-width: 768px) 280px, (max-width: 1200px) 320px, 360px" width="${width}" height="${height}" loading="${priority}" decoding="sync" fetchpriority="${fetchPriority}"`;
            })
      : '';

const lcpMatch = contentField.match(/<p[^>]*>[\s\S]*?<\/p>|<img[^>]+>/i);
    const lcpContent = lcpMatch ? lcpMatch[0].replace(/<[^>]*$/, '') : '';

    if (preRenderedContent.match(/<script|\bon\w+/i)) {
      console.error('[fetchPostBySlug] Suspicious content detected');
    }

    dispatch({
      type: 'FETCH_POST_INITIAL',
      payload: { titleInitial: data.title, titleImageInitial: data.titleImage, lcpContent }
    });

    const post = {
      ...data,
      preRenderedContent,
      lcpContent,
      contentHeight: data.contentHeight || 300,
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
      dispatch({
        type: 'FETCH_POST_INITIAL',
        payload: { titleInitial: post.title, titleImageInitial: post.titleImage, lcpContent: post.lcpContent }
      });
      dispatch({
        type: 'FETCH_POST_SUCCESS',
        payload: post
      });
      import('react-toastify').then(({ toast }) => {
        toast.warn('Using cached post due to network issue.', { position: 'top-right', autoClose: 3000 });
      });
    } else {
      dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
      import('react-toastify').then(({ toast }) => {
        toast.error('Failed to load post. Please check your connection.', { position: 'top-right', autoClose: 3000 });
      });
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
    await fetch(`/api/users/category/${category}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token,
      },
    });
    import('react-toastify').then(({ toast }) => {
      toast.success('Post added successfully!', { position: 'top-right', autoClose: 2000 });
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
    return;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('[markPostAsCompleted] No auth token');
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
