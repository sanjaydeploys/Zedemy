import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import { fetchPostSSR } from '../actions/postActions';

// Styled Components
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
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [ssrHtml, setSsrHtml] = useState('');
  const postData = useSelector((state) => state.postReducer.post) || window.__POST_DATA__ || {};
  const error = useSelector((state) => state.postReducer.error);

  console.log('[PostPage.jsx] window.__POST_DATA__:', window.__POST_DATA__);
  console.log('[PostPage.jsx] Redux postData:', postData);
  console.log('[PostPage.jsx] Slug:', slug);
  console.log('[PostPage.jsx] Error:', error);

  useEffect(() => {
    if (!window.__POST_DATA__ || !postData.title) {
      console.log('[PostPage.jsx] Fetching post SSR for slug:', slug);
      dispatch(fetchPostSSR(slug))
        .then(({ html, postData: fetchedPostData }) => {
          console.log('[PostPage.jsx] SSR fetched, html length:', html?.length);
          setSsrHtml(html);
          if (fetchedPostData.title) {
            dispatch({ type: 'FETCH_POST_SUCCESS', payload: fetchedPostData });
          }
        })
        .catch((err) => {
          console.error('[PostPage.jsx] Error fetching SSR:', err);
          setSsrHtml('');
        });
    } else {
      console.log('[PostPage.jsx] Using SSR HTML from document');
      setSsrHtml(document.documentElement.outerHTML);
    }

    // Handle scroll to set active section
    const handleScroll = () => {
      const sections = postData.subtitles?.map((_, i) => `subtitle-${i}`) || [];
      if (postData.summary) sections.push('summary');
      let currentSection = '';
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element && element.getBoundingClientRect().top <= 100) {
          currentSection = section;
        }
      }
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [slug, dispatch, postData]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      if (isSidebarOpen) {
        setSidebarOpen(false);
      }
    }
  };

  if (error || (!postData.title && !ssrHtml)) {
    console.log('[PostPage.jsx] Rendering error state');
    return (
      <HelmetProvider>
        <Helmet>
          <title>Error | Zedemy</title>
          <meta name="description" content="An error occurred while loading the post." />
          <meta name="robots" content="noindex" />
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

  console.log('[PostPage.jsx] Rendering SSR HTML, ssrHtml length:', ssrHtml?.length);

  return (
    <HelmetProvider>
      <Helmet>
        <title>{postData.title || 'Loading...'} | Zedemy</title>
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
      </Helmet>
      <Layout>
        <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
        <Sidebar
          post={postData}
          isSidebarOpen={isSidebarOpen}
          setSidebarOpen={setSidebarOpen}
          activeSection={activeSection}
          scrollToSection={scrollToSection}
        />
      </Layout>
    </HelmetProvider>
  );
});

export default PostPage;
