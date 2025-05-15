import { toast } from 'react-toastify';

const API_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';
const SSR_BASE_URL = 'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts';

export const fetchPostSSR = (slug) => async (dispatch) => {
  try {
    console.log('[fetchPostSSR] Fetching SSR HTML for slug:', slug);
    const response = await fetch(`${SSR_BASE_URL}/post/${slug}?viewport=mobile`, {
      headers: {
        'Accept': 'text/html',
        'Accept-Encoding': 'gzip, deflate, br'
      }
    });

    if (!response.ok) {
      throw new Error(`SSR fetch error: ${response.status}`);
    }

    const html = await response.text();
    console.log('[fetchPostSSR] Received SSR HTML:', html.slice(0, 200));

    // Extract window.__POST_DATA__ for Redux and metadata
    const match = html.match(/window\.__POST_DATA__\s*=\s*({[\s\S]*?});/);
    let postData = {};
    if (match && match[1]) {
      try {
        postData = JSON.parse(match[1]);
      } catch (err) {
        console.error('[fetchPostSSR] Error parsing window.__POST_DATA__:', err.message);
      }
    }

    if (!postData.title || !postData.preRenderedContent || !postData.category || !postData.slug) {
      console.warn('[fetchPostSSR] Incomplete SSR data:', {
        hasTitle: !!postData.title,
        hasPreRenderedContent: !!postData.preRenderedContent,
        hasCategory: !!postData.category,
        hasSlug: !!postData.slug
      });
    }

    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: postData
    });

    return { html, postData };
  } catch (error) {
    console.error('[fetchPostSSR] Error:', error.message);
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    toast.error('Failed to load SSR data.', { position: 'top-right', autoClose: 3000 });
    throw error;
  }
};

export const fetchPostBySlug = (slug) => async (dispatch, getState) => {
  try {
    console.log('[fetchPostBySlug] Starting for slug:', slug);
    const currentPost = getState().postReducer.post;
    if (currentPost?.slug === slug && currentPost.subtitles && currentPost.references) {
      console.log('[fetchPostBySlug] Using existing Redux post:', currentPost.title);
      return;
    }

    console.log('[fetchPostBySlug] Fetching non-critical data from API for slug:', slug);
    const apiRes = await fetch(`${API_BASE_URL}/${slug}?viewport=mobile`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!apiRes.ok) throw new Error(`API error: ${apiRes.status}`);
    const postData = await apiRes.json();
    console.log('[fetchPostBySlug] API response:', JSON.stringify(postData, null, 2));

    if (!postData.title || !postData.content || !postData.titleImage) {
      console.warn('[fetchPostBySlug] Incomplete API data:', {
        hasTitle: !!postData.title,
        hasContent: !!postData.content,
        hasTitleImage: !!postData.titleImage,
        hasSubtitles: postData.subtitles?.length || 0
      });
    }

    dispatch({
      type: 'FETCH_POST_SUCCESS',
      payload: {
        ...postData,
        slug,
        postId: postData.postId || '',
        title: postData.title || 'Untitled Post',
        author: postData.author || 'Zedemy Team',
        date: postData.date || new Date().toISOString(),
        contentHeight: postData.contentHeight || 500,
        titleImageAspectRatio: postData.titleImageAspectRatio || '16:9',
        titleImage: postData.titleImage || '',
        category: postData.category || 'General',
        subtitles: postData.subtitles || [],
        superTitles: postData.superTitles || [],
        references: postData.references || [],
        content: postData.content || postData.preRenderedContent || '',
        preRenderedContent: postData.preRenderedContent || '',
        summary: postData.summary || ''
      }
    });
  } catch (error) {
    console.error('[fetchPostBySlug] Error:', error.message);
    dispatch({ type: 'FETCH_POST_FAILURE', payload: error.message });
    toast.error('Failed to load post data.', { position: 'top-right', autoClose: 3000 });
  }
};

export const searchPosts = (slug) => async (dispatch) => {
  try {
    console.log('[searchPosts] Searching for query:', slug);
    const res = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(slug)}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br'
      }
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
    console.log('[fetchPosts] Fetching posts');
    const headers = {
      'Accept': 'application/json',
      'Accept-Encoding': 'gzip, deflate, br'
    };
    if (token) {
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
    console.log('[fetchUserPosts] Fetching user posts');
    const res = await fetch(`${API_BASE_URL}/userposts`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      }
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
  console.log('[addPost] Adding post:', title);
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
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      },
      body: JSON.stringify(postData)
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    dispatch({ type: 'ADD_POST_SUCCESS', payload: data });
    await fetch(`/api/users/category/${category}`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      }
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
  console.log('[markPostAsCompleted] Marking post as completed:', postId);
  try {
    const res = await fetch(`${API_BASE_URL}/complete/${postId}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      },
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
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
    dispatch({ type: 'FETCH_COMPLETED_POSTS' });
  } catch (error) {
    console.error('[markPostAsCompleted] Error:', error.message);
    toast.error('Failed to mark post.', { position: 'top-right', autoClose: 2000 });
  }
};

export const fetchCompletedPosts = () => async (dispatch) => {
  const token = localStorage.getItem('token');
  if (!token) return;
  console.log('[fetchCompletedPosts] Fetching completed posts');
  try {
    const res = await fetch(`${API_BASE_URL}/completed`, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate, br',
        'x-auth-token': token
      }
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
