import React, { memo, Suspense, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts, fetchPostSSR } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import PriorityContent from './PriorityContent';
import Sidebar from './Sidebar';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const StructuredData = React.lazy(() => import('./StructuredData'));

const criticalCss = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .container { display: flex; flex-direction: column; min-height: 100vh; width: 100%; }
  main { flex: 1; padding: 0; background: #f4f4f9; width: 100%; display: flex; flex-direction: column; min-height: 600px; contain-intrinsic-size: 100% 600px; }
  .sidebar-wrapper { width: 250px; height: 100vh; position: sticky; top: 0; min-height: 600px; contain-intrinsic-size: 250px 600px; }
  .error-message { color: #d32f2f; font-size: 0.875rem; text-align: center; padding: 0.5rem; background: #ffebee; border-radius: 0.25rem; margin: 0; min-height: 50px; }
  .skeleton { background: #e0e0e0; border-radius: 0.375rem; width: 100%; animation: pulse 1.5s ease-in-out infinite; }
  .skeleton-section { height: 600px; margin: 1rem 0; }
  .skeleton-sidebar { height: 600px; width: 100%; }
  @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
  @media (max-width: 767px) {
    .sidebar-wrapper { width: min(100%, 300px); position: fixed; top: 0; left: -300px; height: calc(100vh - 0.5rem); z-index: 1000; }
    .sidebar-wrapper.open { left: 0; }
  }
  @media (min-width: 768px) {
    .container { flex-direction: row; }
    .sidebar-wrapper { margin: 0; }
    main { min-height: 900px; }
  }
`;

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

  console.log('[PostPage] postFromRedux:', JSON.stringify(postFromRedux, null, 2));

  const readTime = Math.ceil((postFromRedux.content || '').split(/\s+/).filter(w => w).length / 200) || 1;

  useEffect(() => {
    console.log('[PostPage] Dispatching fetchPostSSR and fetchPostBySlug for slug:', slug);
    dispatch(fetchPostSSR(slug)); // Fetch SSR HTML
    dispatch(fetchPostBySlug(slug)); // Fetch non-critical data
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
          <style>{criticalCss}</style>
        </Helmet>
        <div className="container">
          <main>
            <div className="error-message">Failed to load the post: {error}. Please try again later.</div>
          </main>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{postFromRedux.title || 'Loading...'} | Zedemy</title>
        <meta name="description" content={(postFromRedux.preRenderedContent || '').slice(0, 160)} />
        <meta name="keywords" content={`${postFromRedux.category || 'General'}, Zedemy`} />
        <meta name="author" content={postFromRedux.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={postFromRedux.title || 'Loading...'} />
        <meta property="og:description" content={(postFromRedux.preRenderedContent || '').slice(0, 160)} />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        {postFromRedux.titleImage && <meta property="og:image" content={`${postFromRedux.titleImage.replace('q=5', 'q=40')}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postFromRedux.title || 'Loading...'} />
        <meta name="twitter:description" content={(postFromRedux.preRenderedContent || '').slice(0, 160)} />
        {postFromRedux.titleImage && <meta name="twitter:image" content={`${postFromRedux.titleImage.replace('q=5', 'q=40')}`} />}
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {postFromRedux.titleImage && <link rel="preload" as="image" href={`${postFromRedux.titleImage}`} fetchPriority="high" media="(max-width: 767px)" />}
        {postFromRedux.titleImage && <link rel="preload" as="image" href={`${postFromRedux.titleImage.replace('w=240', 'w=280')}`} fetchPriority="high" media="(min-width: 768px)" />}
        <link rel="preload" href="/dist/assets/index.js" as="script" fetchPriority="high" />
        <style>{criticalCss}</style>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <PriorityContent readTime={readTime} slug={slug} />
          <Suspense fallback={<div className="skeleton-section skeleton" />}>
            <PostContentNonCritical
              post={postFromRedux}
              relatedPosts={relatedPosts}
              completedPosts={completedPosts}
              dispatch={dispatch}
            />
          </Suspense>
        </main>
        <aside className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <Suspense fallback={<div className="skeleton-sidebar skeleton" />}>
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
