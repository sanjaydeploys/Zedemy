import { toast } from 'react-toastify';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

export const fetchPostBySlug = (slug) => async (dispatch, getState) => {
  try {
    const currentPost = getState().postReducer.post;
    if (currentPost?.slug === slug && currentPost.title && currentPost.preRenderedContent && currentPost.subtitles?.length) {
      console.log('[fetchPostBySlug] Post already loaded for slug:', slug);
      return;
    }

    const initialData = window.__POST_DATA__ && window.__POST_DATA__.slug === slug ? window.__POST_DATA__ : {};

    if (initialData.preRenderedContent && initialData.title && initialData.subtitles?.length) {
      console.log('[fetchPostBySlug] Using SSR data for slug:', slug);
      dispatch({
        type: 'FETCH_POST_SUCCESS',
        payload: {
          ...initialData,
          slug,
          postId: initialData.postId || '',
          summary: initialData.summary || '',
          category: initialData.category || '',
          subtitles: initialData.subtitles || [],
          superTitles: initialData.superTitles || [],
          references: initialData.references || [],
          content: initialData.content || initialData.preRenderedContent || '',
          preRenderedContent: initialData.preRenderedContent || '',
        },
      });
      return;
    }

    console.log('[fetchPostBySlug] Fetching from API for slug:', slug);
    const apiRes = await fetch(`${API_BASE_URL}/${slug}?viewport=mobile`, {
      headers: { 'Accept': 'application/json' },
    });
    if (!apiRes.ok) throw new Error(`API error: ${apiRes.status}`);
    const postData = await apiRes.json();

    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: {
        ...postData,
        slug,
        postId: postData.postId || '',
        title: postData.title || 'Untitled',
        author: postData.author || 'Unknown',
        date: postData.date || new Date().toISOString(),
        contentHeight: postData.contentHeight || 500,
        titleImageAspectRatio: postData.titleImageAspectRatio || '16:9',
        summary: postData.summary || '',
        category: postData.category || '',
        subtitles: postData.subtitles || [],
        superTitles: postData.superTitles || [],
        references: postData.references || [],
        content: postData.content || postData.preRenderedContent || '',
        preRenderedContent: postData.preRenderedContent || '',
      },
    });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', error.message);
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    toast.error('Failed to load post.', { position: 'top-right', autoClose: 3000 });
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
