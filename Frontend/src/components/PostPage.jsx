import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import { fetchPostSSR, fetchPostBySlug } from '../actions/postActions';
import { BounceLoader } from 'react-spinners';

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
  background: #f9fafb;
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const [loading, setLoading] = useState(!window.__POST_DATA__); // Only true if no SSR data
  const postData = useSelector((state) => state.postReducer.post) || window.__POST_DATA__ || {};

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

  // Fetch SSR HTML and post metadata
  useEffect(() => {
    // If SSR data is available, use it
    if (window.__POST_DATA__ && window.__POST_DATA__.title) {
      setSsrHtml(document.documentElement.outerHTML);
      setLoading(false);
      dispatch({ type: 'FETCH_POST_SUCCESS', payload: window.__POST_DATA__ });
    } else {
      // Fetch post metadata for Helmet and SSR HTML
      Promise.all([
        dispatch(fetchPostBySlug(slug)), // Fetch metadata for Helmet
        dispatch(fetchPostSSR(slug)).then(({ html, postData: fetchedPostData }) => {
          setSsrHtml(html);
          if (fetchedPostData.title) {
            dispatch({ type: 'FETCH_POST_SUCCESS', payload: fetchedPostData });
          }
        }),
      ])
        .then(() => setLoading(false))
        .catch((err) => {
          console.error('[PostPage.jsx] Error fetching data:', err.message);
          setSsrHtml('');
          setLoading(false);
        });
    }
  }, [slug, dispatch]);

  // Show loading spinner while fetching
  if (loading) {
    return (
      <HelmetProvider>
        <Helmet>
          <title>Loading... | Zedemy</title>
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        </Helmet>
        <LoadingContainer>
          <BounceLoader color="#22c55e" size={60} />
        </LoadingContainer>
      </HelmetProvider>
    );
  }

  // Render SSR HTML
  return (
    <HelmetProvider>
      <Helmet>
        <title>{postData.title || 'Untitled'} | Zedemy</title>
        <meta
          name="description"
          content={postData.summary || postData.content?.substring(0, 155) || `Explore ${postData.title?.toLowerCase() || 'tech tutorials'}.`}
        />
        <meta property="og:title" content={postData.title || 'Untitled'} />
        <meta
          property="og:image"
          content={
            postData.titleImage
              ? `${postData.titleImage}?w=1200&format=avif&q=40`
              : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/default-post-image.webp'
          }
        />
        <meta property="og:image:alt" content={postData.title || 'Post'} />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
      </Helmet>
      <Layout>
        <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
      </Layout>
    </HelmetProvider>
  );
});

export default PostPage;
