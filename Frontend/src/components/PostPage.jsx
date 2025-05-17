import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import Sidebar from './Sidebar';
import { fetchPostSSR } from '../actions/postActions';
import { parseLinks } from './utils';

// Styled Components for Post Content
const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const MainContent = styled.div`
  margin-left: var(--sidebar-width, 48px);
  padding: 1rem;
  flex: 1;
  background: #f9fafb;
  min-height: 100vh;
  @media (max-width: 768px) {
    margin-left: 0;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 0.75rem;
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 1.5rem;
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
`;

const ContentText = styled.div`
  font-size: 1.05rem;
  line-height: 1.75;
  margin-bottom: 1.5rem;
  word-break: break-word;
  p {
    margin-bottom: 1rem;
  }
  a {
    color: #1e40af;
    text-decoration: underline;
    &:hover,
    &:focus {
      color: #22c55e;
      outline: none;
    }
  }
`;

const SectionHeading = styled.h2`
  font-size: 1.35rem;
  color: #1f2937;
  margin: 1.5rem 0 0.75rem;
  font-weight: 600;
  border-left: 3px solid #22c55e;
  padding-left: 0.75rem;
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const postData = useSelector((state) => state.postReducer.post) || window.__POST_DATA__ || {};
  const error = useSelector((state) => state.postReducer.error);
  const [ssrHtml, setSsrHtml] = useState('');

  console.log('[PostPage.jsx] window.__POST_DATA__:', window.__POST_DATA__);
  console.log('[PostPage.jsx] Redux postData:', postData);
  console.log('[PostPage.jsx] Slug:', slug);
  console.log('[PostPage.jsx] Error:', error);

  useEffect(() => {
    if (!postData.title || !window.__POST_DATA__) {
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
      console.log('[PostPage.jsx] Using existing postData');
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

  console.log('[PostPage.jsx] Rendering post content, postData:', postData);

  // Render subtitles (simplified for brevity; expand as needed)
  const renderSubtitles = (subtitles, category) => {
    return subtitles.map((subtitle, index) => (
      <section key={`subtitle-${index}`} id={`subtitle-${index}`} aria-labelledby={`subtitle-${index}-heading`}>
        <SectionHeading id={`subtitle-${index}-heading`}>
          {parseLinks(subtitle.title || `Section ${index + 1}`, category || '')}
        </SectionHeading>
        <ul className="bullet-list">
          {(subtitle.bulletPoints || []).map((point, j) => (
            <li key={`point-${j}`} className="bullet-item">
              <div className="bullet-text">{parseLinks(point.text || '', category || '')}</div>
            </li>
          ))}
        </ul>
      </section>
    ));
  };

  return (
    <HelmetProvider>
      <Helmet>
        {/* Minimal Helmet for fallback; SSR meta tags take precedence */}
        <title>{postData.title || 'Loading...'} | Zedemy</title>
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
      </Helmet>
      <Layout>
        <nav className="sidebar-nav" aria-label="Main navigation">
          {/* Navigation unchanged from SSR */}
          <div className="nav-container">
            <a href="/" className="nav-item" aria-label="Home"><span className="nav-icon">🏠</span></a>
            <a href="/category" className="nav-item" aria-label="Courses"><span className="nav-icon">📚</span></a>
            <a href="/add-post" className="nav-item" aria-label="Add Post"><span className="nav-icon">📤</span></a>
            <a href="/login" className="nav-item" aria-label="User Login"><span className="nav-icon">👤</span></a>
            <a href="/certificate-verification" className="nav-item" aria-label="Certificate Verification"><span className="nav-icon">🎓</span></a>
            <a href="/editor" className="nav-item" aria-label="Code Editor"><span className="nav-icon">💻</span></a>
          </div>
        </nav>
        <MainContent>
          <Container>
            <main role="main" aria-label="Main content">
              {postData.title ? (
                <>
                  <nav className="breadcrumbs" aria-label="Breadcrumb">
                    <a href="/">Home</a> &gt;
                    <a href={`/category/${postData.category?.toLowerCase() || 'blog'}`}>
                      {postData.category || 'Blog'}
                    </a> &gt;
                    <span>{postData.title}</span>
                  </nav>
                  <h1>{postData.title}</h1>
                  <div className="meta-info">
                    <span><span className="icon">👤</span> {postData.author || 'Zedemy Team'}</span>
                    <span><span className="icon">📅</span> {postData.date ? new Date(postData.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown'}</span>
                    <span><span className="icon">⏱️</span> {postData.readTime || 1} min read</span>
                  </div>
                  {postData.content && (
                    <ContentText>{parseLinks(postData.content, postData.category || '')}</ContentText>
                  )}
                  {postData.subtitles?.length > 0 && renderSubtitles(postData.subtitles, postData.category)}
                  {postData.summary && (
                    <section id="summary" aria-labelledby="summary-heading">
                      <SectionHeading id="summary-heading">Summary</SectionHeading>
                      <ContentText>{parseLinks(postData.summary, postData.category || '')}</ContentText>
                    </section>
                  )}
                </>
              ) : (
                <div className="post-content" dangerouslySetInnerHTML={{ __html: ssrHtml }} />
              )}
            </main>
            <Sidebar
              post={postData}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
              scrollToSection={scrollToSection}
            />
          </Container>
        </MainContent>
      </Layout>
    </HelmetProvider>
  );
});

export default PostPage;
