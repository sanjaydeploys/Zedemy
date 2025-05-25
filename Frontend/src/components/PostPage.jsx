import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import { fetchPostSSR } from '../actions/postActions';
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
  // Load sidebar.js dynamically to ensure toggleSidebar and scrollToSection are defined
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
  // Fetch SSR HTML
  useEffect(() => {
    if (!window.__POST_DATA__ || !postData.title) {
      dispatch(fetchPostSSR(slug))
        .then(({ html, postData: fetchedPostData }) => {
          setSsrHtml(html);
          if (fetchedPostData.title) {
            dispatch({ type: 'FETCH_POST_SUCCESS', payload: fetchedPostData });
          }
        })
        .catch((err) => {
          setSsrHtml('');
        });
    } else {
      setSsrHtml(document.documentElement.outerHTML);
    }
  }, [slug, dispatch, postData]);
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
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
      </Helmet>
      <Layout>
        <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
      </Layout>
    </HelmetProvider>
  );
});
export default PostPage;
