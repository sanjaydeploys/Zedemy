import React, { memo, Suspense, useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostSSR, fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Sidebar from './Sidebar';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const StructuredData = React.lazy(() => import('./StructuredData'));

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const postFromRedux = useSelector((state) => state.postReducer.post || {});
  const error = useSelector((state) => state.postReducer.error);
  const relatedPosts = useSelector((state) => state.postReducer.posts || []).filter(
    (p) => p.postId !== postFromRedux.postId && p.category?.toLowerCase() === postFromRedux.category?.toLowerCase()
  ).slice(0, 3);
  const completedPosts = useSelector((state) => state.postReducer.completedPosts || []);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [isSSRInjected, setIsSSRInjected] = useState(false);
  const priorityContentRef = useRef(null);

  const readTime = window.__POST_DATA__?.readTime || postFromRedux.readTime || 1;

  useEffect(() => {
    const injectSSRHTML = async () => {
      const priorityContent = document.getElementById('priority-content');
      if (priorityContent?.innerHTML.trim() && priorityContent.querySelector('h1, img')) {
        console.log('[PostPage] Valid SSR HTML found in #priority-content');
        setIsSSRInjected(true);
        return;
      }

      console.log('[PostPage] Fetching SSR HTML for slug:', slug);
      try {
        const { html } = await dispatch(fetchPostSSR(slug));
        if (priorityContentRef.current) {
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          const ssrContent = doc.querySelector('#priority-content');
          if (ssrContent) {
            priorityContentRef.current.innerHTML = ssrContent.innerHTML;
            setIsSSRInjected(true);
            console.log('[PostPage] Injected SSR HTML into #priority-content');
          } else {
            console.error('[PostPage] #priority-content not found in SSR HTML');
          }
        }
      } catch (err) {
        console.error('[PostPage] Failed to inject SSR HTML:', err.message);
      }
    };

    // Fetch SSR HTML and client-side data
    injectSSRHTML();
    dispatch(fetchPostBySlug(slug));
    dispatch(fetchPosts());
    dispatch(fetchCompletedPosts());
  }, [dispatch, slug]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setSidebarOpen(false);
    }
  };

  if (error) {
    console.log('[PostPage] Rendering error state:', error);
    return (
      <HelmetProvider>
        <Helmet>
          <html lang="en" />
          <title>Error | Zedemy</title>
          <meta name="description" content="An error occurred while loading the post." />
          <meta name="keywords" content="Zedemy" />
          <meta name="author" content="Zedemy Team" />
          <meta name="robots" content="noindex" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        </Helmet>
        <div className="container">
          <main>
            <div style={{ color: '#d32f2f', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem', background: '#ffebee', borderRadius: '0.25rem', margin: 0, minHeight: '50px' }}>
              Failed to load the post: {error}. Please try again later.
            </div>
          </main>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{postFromRedux.title || window.__POST_DATA__?.title || 'Loading...'} | Zedemy</title>
        <meta name="description" content={(postFromRedux.preRenderedContent || window.__POST_DATA__?.preRenderedContent || '').slice(0, 160)} />
        <meta name="keywords" content={`${postFromRedux.category || window.__POST_DATA__?.category || 'General'}, Zedemy`} />
        <meta name="author" content={postFromRedux.author || window.__POST_DATA__?.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={postFromRedux.title || window.__POST_DATA__?.title || 'Loading...'} />
        <meta property="og:description" content={(postFromRedux.preRenderedContent || window.__POST_DATA__?.preRenderedContent || '').slice(0, 160)} />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        {postFromRedux.titleImage && <meta property="og:image" content={`${postFromRedux.titleImage.replace('q=30', 'q=50')}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postFromRedux.title || window.__POST_DATA__?.title || 'Loading...'} />
        <meta name="twitter:description" content={(postFromRedux.preRenderedContent || window.__POST_DATA__?.preRenderedContent || '').slice(0, 160)} />
        {postFromRedux.titleImage && <meta name="twitter:image" content={`${postFromRedux.titleImage.replace('q=30', 'q=50')}`} />}
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://d2rq30ca0zyvzp.cloudfront.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {postFromRedux.titleImage && <link rel="preload" as="image" href={`${postFromRedux.titleImage}`} fetchPriority="high" media="(max-width: 767px)" />}
        {postFromRedux.titleImage && <link rel="preload" as="image" href={`${postFromRedux.titleImage.replace('w=240', 'w=280')}`} fetchPriority="high" media="(min-width: 768px)" />}
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <div id="priority-content" ref={priorityContentRef} style={{ minHeight: '600px' }} />
          <Suspense fallback={<div style={{ height: '200px', background: '#e0e0e0', borderRadius: '0.375rem', width: '100%' }} />}>
            <PostContentNonCritical
              post={postFromRedux}
              relatedPosts={relatedPosts}
              completedPosts={completedPosts}
              dispatch={dispatch}
            />
          </Suspense>
        </main>
        <aside id="sidebar" className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <Suspense fallback={<div style={{ height: '600px', background: '#e0e0e0', borderRadius: '0.375rem', width: '100%' }} />}>
            <Sidebar
              post={postFromRedux}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
              scrollToSection={scrollToSection}
            />
          </Suspense>
        </aside>
        <Suspense fallback={null}>
          <StructuredData post={postFromRedux} readTime={readTime} slug={slug} />
        </Suspense>
      </div>
    </HelmetProvider>
  );
});

export default PostPage;
