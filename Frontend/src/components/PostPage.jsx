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

  // Initialize sidebar event listeners
  const initializeSidebar = () => {
    console.log('[PostPage.jsx] Initializing sidebar event listeners');
    const toggleButton = document.getElementById('toggle-button');
    if (toggleButton && window.toggleSidebar) {
      // Remove existing listeners to prevent duplicates
      toggleButton.removeEventListener('click', window.toggleSidebar);
      toggleButton.removeEventListener('keydown', handleSidebarKeydown);
      // Add new listeners
      toggleButton.addEventListener('click', window.toggleSidebar);
      toggleButton.addEventListener('keydown', handleSidebarKeydown);
      // Add click-outside handler
      document.removeEventListener('click', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
    } else {
      console.warn('[PostPage.jsx] Toggle button or toggleSidebar not found');
    }
  };

  // Keyboard handler for sidebar toggle
  const handleSidebarKeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.toggleSidebar();
    }
  };

  // Click-outside handler to close sidebar
  const handleClickOutside = (e) => {
    const sidebar = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    if (
      sidebar &&
      toggleButton &&
      !sidebar.contains(e.target) &&
      !toggleButton.contains(e.target) &&
      sidebar.classList.contains('open')
    ) {
      window.toggleSidebar();
    }
  };

  // Load sidebar.js and fetch post data
  useEffect(() => {
    // Ensure sidebar.js is loaded synchronously
    let sidebarScript = document.querySelector('script[src="/scripts/sidebar.js"]');
    if (!sidebarScript) {
      console.log('[PostPage.jsx] Loading sidebar.js');
      sidebarScript = document.createElement('script');
      sidebarScript.src = '/scripts/sidebar.js';
      sidebarScript.async = false; // Load synchronously
      document.head.appendChild(sidebarScript);
      sidebarScript.onload = initializeSidebar;
    } else if (window.toggleSidebar) {
      initializeSidebar();
    } else {
      // Wait for existing script to load
      sidebarScript.addEventListener('load', initializeSidebar);
    }

    // Fetch post data if not preloaded
    if (!window.__POST_DATA__ || !postData.title) {
      dispatch(fetchPostSSR(slug))
        .then(({ html, postData: fetchedPostData }) => {
          setSsrHtml(html);
          if (fetchedPostData.title) {
            dispatch({ type: 'FETCH_POST_SUCCESS', payload: fetchedPostData });
          }
          // Only initialize sidebar if not already done
          if (!document.querySelector('script[src="/scripts/sidebar.js"]').hasAttribute('data-initialized')) {
            initializeSidebar();
            sidebarScript.setAttribute('data-initialized', 'true');
          }
        })
        .catch((err) => {
          setSsrHtml('');
          console.error('[PostPage.jsx] Failed to fetch SSR:', err);
        });
    } else {
      setSsrHtml(document.documentElement.outerHTML);
      // Only initialize sidebar if not already done
      if (!document.querySelector('script[src="/scripts/sidebar.js"]')?.hasAttribute('data-initialized')) {
        initializeSidebar();
        if (sidebarScript) sidebarScript.setAttribute('data-initialized', 'true');
      }
    }

    // Cleanup
    return () => {
      const toggleButton = document.getElementById('toggle-button');
      if (toggleButton) {
        toggleButton.removeEventListener('click', window.toggleSidebar);
        toggleButton.removeEventListener('keydown', handleSidebarKeydown);
      }
      document.removeEventListener('click', handleClickOutside);
    };
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
            <div
              style={{
                color: '#d32f2f',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '0.5rem',
                background: '#ffebee',
                borderRadius: '0.25rem',
              }}
            >
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
        <title>{postData.title || 'Post'} | Zedemy</title>
        <meta name="description" content={postData.summary || 'Explore this post on Zedemy.'} />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
      </Helmet>
      <Layout>
        <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
      </Layout>
    </HelmetProvider>
  );
});

export default PostPage;
