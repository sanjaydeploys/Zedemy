import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import { ClipLoader } from 'react-spinners';
import { fetchPostSSR, fetchPostBySlug } from '../actions/postActions';

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const PostContent = styled.div`
  flex: 1;
`;

const LoaderContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f9fafb;
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const postData = useSelector((state) => state.postReducer.post) || {};
  const [isLoading, setIsLoading] = useState(true);

  // Load sidebar.js dynamically
  useEffect(() => {
    const loadSidebarScript = () => {
      if (typeof window.toggleSidebar !== 'function' || typeof window.scrollToSection !== 'function') {
        console.log('[PostPage.jsx] Loading sidebar.js');
        const script = document.createElement('script');
        script.src = '/scripts/sidebar.js';
        script.async = true;
        script.onload = () => console.log('[PostPage.jsx] sidebar.js loaded');
        script.onerror = () => console.error('[PostPage.jsx] Error loading sidebar.js');
        document.head.appendChild(script);
        return () => document.head.removeChild(script);
      } else {
        console.log('[PostPage.jsx] sidebar.js already loaded');
      }
    };
    loadSidebarScript();
  }, []);

  // Fetch post data and SSR HTML
  useEffect(() => {
    // If SSR data is already available (direct access), use it
    if (window.__POST_DATA__ && window.__POST_DATA__.title) {
      setSsrHtml(document.documentElement.outerHTML);
      dispatch({ type: 'FETCH_POST_SUCCESS', payload: window.__POST_DATA__ });
      setIsLoading(false);
      return;
    }

    // Fetch post data for Helmet and SSR HTML
    Promise.all([
      dispatch(fetchPostBySlug(slug)), // Fetch title and titleImage for Helmet
      dispatch(fetchPostSSR(slug)).then(({ html, postData: fetchedPostData }) => {
        setSsrHtml(html);
        if (fetchedPostData.title) {
          dispatch({ type: 'FETCH_POST_SUCCESS', payload: fetchedPostData });
        }
      }),
    ])
      .then(() => setIsLoading(false))
      .catch((err) => {
        console.error('[PostPage.jsx] Error fetching data:', err.message);
        setSsrHtml('');
        setIsLoading(false);
      });
  }, [slug, dispatch]);

  // Show loader while fetching
  if (isLoading) {
    return (
      <LoaderContainer>
        <ClipLoader color="#22c55e" size={50} aria-label="Loading post content" />
      </LoaderContainer>
    );
  }

  // If no SSR HTML or post data, rely on backend error handling
  if (!ssrHtml || !postData.title) {
    return null; // Backend will serve 404/500 HTML
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{postData.title || 'Untitled'} | Zedemy</title>
        <meta name="description" content={postData.summary || postData.content?.slice(0, 155) || 'Explore tech tutorials.'} />
        <meta property="og:title" content={postData.title || 'Untitled'} />
        <meta property="og:image" content={postData.titleImage || 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/default-post-image.webp'} />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
      </Helmet>
      <Layout>
        <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
      </Layout>
    </HelmetProvider>
  );
});

export default PostPage;
