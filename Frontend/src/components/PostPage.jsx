import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import { fetchPostBySlug } from '../actions/postActions';

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const PostContent = styled.div`
  flex: 1;
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const postData = useSelector((state) => state.postReducer.post) || window.__POST_DATA__ || {};
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

  // Handle SSR data and fallback
  useEffect(() => {
    if (window.__POST_DATA__ && window.__POST_DATA__.title) {
      console.log('[PostPage.jsx] Using SSR data from window.__POST_DATA__');
      dispatch({ type: 'FETCH_POST_SUCCESS', payload: window.__POST_DATA__ });
      setSsrHtml(document.documentElement.outerHTML);
    } else {
      console.warn('[PostPage.jsx] SSR data missing, fetching post by slug');
      dispatch(fetchPostBySlug(slug)).then(() => {
        setSsrHtml(document.documentElement.outerHTML); // Fallback to current HTML
      }).catch((err) => {
        console.error('[PostPage.jsx] Error fetching post:', err.message);
        setSsrHtml('');
      });
    }
  }, [slug, dispatch]);

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
            <div style={{ color: '#d32f2f', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem', background: '#ffebee', borderRadius: '0.25rem' }}>
              Failed to load the post: {error || 'Not found'}. Please try again later.
            </div>
          </main>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <title>{postData.title || 'Loading...'} | Zedemy</title>
        <meta name="description" content={postData.summary || 'Explore this post on Zedemy, a modern educational platform.'} />
        <meta name="keywords" content={`${postData.category || 'programming'}, zedemy, sanjay patidar, ${postData.title || 'post'}`} />
        <meta name="author" content={postData.author || 'Zedemy Team'} />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <meta property="og:title" content={postData.title || 'Loading...'} />
        <meta property="og:description" content={postData.summary || 'Explore this post on Zedemy.'} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        <meta property="og:image" content={postData.titleImage || 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png'} />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postData.title || 'Loading...'} />
        <meta name="twitter:description" content={postData.summary || 'Explore this post on Zedemy.'} />
        <meta name="twitter:image" content={postData.titleImage || 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png'} />
      </Helmet>
      <Layout>
        <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
      </Layout>
    </HelmetProvider>
  );
});

export default PostPage;
