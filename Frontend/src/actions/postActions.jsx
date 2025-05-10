import { setAuthToken } from '../utils/setAuthToken';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

const createParseLinksWorker = () => {
  const blob = new Blob([`
    self.onmessage = function(e) {
      const { content, category } = e.data;
      const parsedContent = content
        .replace(/\\n\\n/g, '</p><p style="min-height: 24px; contain-intrinsic-size: 100% 24px;">')
        .replace(/\\n/g, '<br>')
        .replace(/(https?:\\/\\/[^\\s]+)/g, url => {
          const isImage = url.match(/\\.(jpg|jpeg|png|gif|webp)$/i);
          const isVideo = url.match(/\\.(mp4|webm|ogg)$/i);
          if (isImage) {
            return \`<img src="\${url}" alt="Embedded image" style="width:100%;max-width:280px;aspect-ratio:16/9;min-height:157.5px;contain-intrinsic-size:280px 157.5px;border-radius:0.25rem;" loading="lazy" />\`;
          } else if (isVideo) {
            return \`<video src="\${url}" controls style="width:100%;max-width:280px;aspect-ratio:16/9;min-height:157.5px;contain-intrinsic-size:280px 157.5px;border-radius:0.25rem;" preload="none"></video>\`;
          } else {
            return \`<a href="\${url}" target="_blank" class="content-link">\${url}</a>\`;
          }
        });
      self.postMessage(\`<p style="min-height: 24px; contain-intrinsic-size: 100% 24px;">\${parsedContent}</p>\`);
    };
  `], { type: 'text/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

export const fetchPostBySlug = (slug) => async (dispatch) => {
  try {
    dispatch({ type: 'CLEAR_POST' });

    const cachedPost = await caches.match(`${API_BASE_URL}/post/${slug}`);
    if (cachedPost) {
      const post = await cachedPost.json();
      dispatch({
        type: 'FETCH_POST_SUCCESS',
        payload: {
          ...post,
          preRenderedContent: post.preRenderedContent || '',
          estimatedContentHeight: 150,
        },
      });
      return;
    }

    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: {
        title: 'Loading...',
        preRenderedContent: '<p style="min-height: 150px; contain-intrinsic-size: 100% 150px;"></p>',
        estimatedContentHeight: 150,
      },
    });

    const response = await fetch(`${API_BASE_URL}/post/${slug}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
      },
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    const contentField = data.content || data.body || data.text || '';
    if (!contentField) {
      console.warn('[fetchPostBySlug] No content field:', data);
    }

    const worker = createParseLinksWorker();
    const preRenderedContent = await new Promise((resolve, reject) => {
      worker.onmessage = (e) => resolve(e.data);
      worker.onerror = (e) => reject(e);
      worker.postMessage({ content: contentField, category: data.category });
    });
    worker.terminate();

    const post = {
      ...data,
      preRenderedContent,
      estimatedContentHeight: 150,
    };

    const cache = await caches.open('api-cache');
    await cache.put(`${API_BASE_URL}/post/${slug}`, new Response(JSON.stringify(post)));

    dispatch({ type: 'FETCH_POST_SUCCESS', payload: post });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', {
      message: error.message,
    });
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    import('react-toastify').then(({ toast }) => {
      toast.error('Failed to fetch post.', { position: 'top-right', autoClose: 2000 });
    });
  }
};

export const searchPosts = (slug) => async (dispatch) => {
  const { toast } = await import('react-toastify');
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
    console.error('[searchPosts] Error:', {
      message: error.message,
    });
    dispatch({ type: 'SEARCH_POSTS_FAILURE', payload: error.message || 'Failed to search posts' });
    toast.error('Failed to search posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchPosts = () => async (dispatch) => {
  const { toast } = await import('react-toastify');
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
    console.error('[fetchPosts] Error:', {
      message: error.message,
    });
    dispatch({ type: 'FETCH_POSTS_FAILURE', payload: error.message });
    toast.error('Failed to fetch posts.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchUserPosts = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (!token) {
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
  if (!token) {
    toast.error('Please log in to add a post.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  const { user } = getState().auth || JSON.parse(localStorage.getItem('user') || '{}');
  if (!user) {
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
    console.error('[addPost] Error:', {
      message: error.message,
    });
    toast.error('Failed to add post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const markPostAsCompleted = (postId) => async (dispatch, getState) => {
  const { toast } = await import('react-toastify');
  if (!postId) {
    toast.error('Invalid post ID.', { position: 'top-right', autoClose: 2000 });
    return;
  }
  const token = localStorage.getItem('token');
  if (!token) {
    toast.error('Please log in to mark posts.', { position: 'top-right', autoClose: 2000 });
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
    console.error('[markPostAsCompleted] Error:', {
      message: error.message,
    });
    toast.error(error.message || 'Failed to mark post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchCompletedPosts = () => async (dispatch) => {
  const { toast } = await import('react-toastify');
  const token = localStorage.getItem('token');
  if (!token) {
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
    console.error('[fetchCompletedPosts] Error:', {
      message: error.message,
    });
    dispatch({ type: 'FETCH_COMPLETED_POSTS_FAILURE' });
    toast.error('Failed to fetch completed posts.', { position: 'top-right', autoClose: 2000 });
  }
};
