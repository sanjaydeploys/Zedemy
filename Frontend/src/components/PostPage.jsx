import React, { memo, Suspense, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
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
  .skeleton-summary { height: 150px; margin: 1rem 0; }
  .skeleton-nav { height: 44px; margin: 1.5rem 0; }
  .skeleton-related { height: 450px; margin: 1rem 0; }
  .skeleton-references { height: 150px; margin: 1rem 0; }
  .skeleton-sidebar { height: 600px; width: 100%; }
  .skeleton-sidebar-item { height: 48px; margin: 0.5rem 0; }
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
  const postFromRedux = useSelector((state) => state.postReducer.post || {}, (a, b) => a.postId === b.postId);
  const error = useSelector((state) => state.postReducer.error);
  const relatedPosts = useSelector((state) => state.postReducer.posts || [], (a, b) => a.length === b.length).filter(
    (p) => p.postId !== postFromRedux.postId && p.category?.toLowerCase() === postFromRedux.category?.toLowerCase()
  ).slice(0, 3);
  const completedPosts = useSelector((state) => state.postReducer.completedPosts || [], (a, b) => a.length === b.length);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  const initialPostData = window.__POST_DATA__ && window.__POST_DATA__.slug === slug ? window.__POST_DATA__ : {};
  const post = useMemo(() => ({
    postId: initialPostData.postId || postFromRedux.postId || '',
    title: initialPostData.title || postFromRedux.title || 'Untitled',
    summary: initialPostData.summary || postFromRedux.summary || '',
    content: initialPostData.content || initialPostData.preRenderedContent || postFromRedux.content || '',
    preRenderedContent: initialPostData.preRenderedContent || postFromRedux.preRenderedContent || '',
    category: initialPostData.category || postFromRedux.category || '',
    author: initialPostData.author || postFromRedux.author || 'Zedemy Team',
    date: initialPostData.date || postFromRedux.date || new Date().toISOString(),
    titleImage: initialPostData.titleImage || postFromRedux.titleImage || '',
    subtitles: initialPostData.subtitles || postFromRedux.subtitles || [],
    superTitles: initialPostData.superTitles || postFromRedux.superTitles || [],
    references: initialPostData.references || postFromRedux.references || [],
    keywords: initialPostData.keywords || postFromRedux.keywords || '',
  }), [initialPostData, postFromRedux]);
  const readTime = useMemo(() => Math.ceil((post.content || '').split(/\s+/).filter(w => w).length / 200), [post.content]);

  React.useEffect(() => {
    if (!initialPostData.preRenderedContent || !initialPostData.title || !initialPostData.subtitles?.length) {
      dispatch(fetchPostBySlug(slug));
      dispatch(fetchPosts());
      dispatch(fetchCompletedPosts());
    }
  }, [dispatch, slug, initialPostData.preRenderedContent, initialPostData.title, initialPostData.subtitles]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setSidebarOpen(false);
    }
  };

  if (error) {
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
        <title>{post.title}</title>
        <meta name="description" content={post.summary || (post.preRenderedContent ? post.preRenderedContent.slice(0, 160) : 'Loading...')} />
        <meta name="keywords" content={`${post.category}, Zedemy`} />
        <meta name="author" content={post.author} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.summary || (post.preRenderedContent ? post.preRenderedContent.slice(0, 160) : 'Loading...')} />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        {post.titleImage && <meta property="og:image" content={`${post.titleImage.replace('q=5', 'q=40')}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title} />
        <meta name="twitter:description" content={post.summary || (post.preRenderedContent ? post.preRenderedContent.slice(0, 160) : 'Loading...')} />
        {post.titleImage && <meta name="twitter:image" content={`${post.titleImage.replace('q=5', 'q=40')}`} />}
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {post.titleImage && <link rel="preload" as="image" href={`${post.titleImage.replace('w=240', 'w=280')}`} fetchPriority="high" media="(max-width: 767px)" />}
        {post.titleImage && <link rel="preload" as="image" href={`${post.titleImage.replace('w=240', 'w=600')}`} fetchPriority="high" media="(min-width: 768px)" />}
        <link rel="preload" href="/dist/assets/index.js" as="script" fetchPriority="high" />
        <style>{criticalCss}</style>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <PriorityContent readTime={readTime} post={post} />
          <Suspense fallback={<div className="skeleton-section skeleton" />}>
            <PostContentNonCritical
              post={post}
              relatedPosts={relatedPosts}
              completedPosts={completedPosts}
              dispatch={dispatch}
            />
          </Suspense>
        </main>
        <aside className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <Suspense fallback={<div className="skeleton-sidebar skeleton" />}>
            <Sidebar
              post={post}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
              scrollToSection={scrollToSection}
            />
          </Suspense>
        </aside>
        <Suspense fallback={null}>
          <StructuredData post={post} readTime={readTime} slug={slug} />
        </Suspense>
      </div>
    </HelmetProvider>
  );
});

export default PostPage;
