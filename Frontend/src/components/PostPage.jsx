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

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
`;

const ErrorContainer = styled.div`
  color: #d32f2f;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  background: #ffebee;
  border-radius: 0.25rem;
  margin: 1rem auto;
  max-width: 600px;
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const postData = useSelector((state) => state.postReducer.post) || {};
  const error = useSelector((state) => state.postReducer.error);

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
    setLoading(true);
    const fetchData = async () => {
      try {
        // Fetch post metadata for Helmet
        await dispatch(fetchPostBySlug(slug));

        // Fetch SSR HTML if not already available
        if (!window.__POST_DATA__ || !postData.title) {
          const { html, postData: fetchedPostData } = await dispatch(fetchPostSSR(slug));
          setSsrHtml(html);
          if (fetchedPostData.title) {
            dispatch({ type: 'FETCH_POST_SUCCESS', payload: fetchedPostData });
          }
        } else {
          setSsrHtml(document.documentElement.outerHTML);
        }
      } catch (err) {
        console.error('[PostPage.jsx] Error fetching data:', err.message);
        setSsrHtml('');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [slug, dispatch, postData.title]);

  if (loading) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Loading... | Zedemy</title>
          <meta name="description" content="Loading post content..." />
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        </Helmet>
        <LoadingContainer>
          <ClipLoader color="#22c55e" size={50} />
        </LoadingContainer>
      </HelmetProvider>
    );
  }

  if (error || (!postData.title && !ssrHtml)) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Error | Zedemy</title>
          <meta name="description" content="An error occurred while loading the post." />
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        </Helmet>
        <div className="container">
          <main>
            <ErrorContainer>
              Post not found. Please try again later.
            </ErrorContainer>
          </main>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{postData.title || 'Untitled'} | Zedemy</title>
        <meta name="description" content={postData.summary || 'Explore this post on Zedemy.'} />
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
