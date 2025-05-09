import React, { useState, useRef, memo, Suspense, useDeferredValue, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { parseLinks, truncateText } from './utils';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import PriorityContent from './PriorityContent';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));
const StructuredData = React.lazy(() => import('./StructuredData'));

const css = `
  .container { display: flex; min-height: 100vh; flex-direction: column; }
  main { flex: 1; padding: 1rem; background: #fff; }
  .sidebar-wrapper { }
  .loading-overlay { display: flex; justify-content: center; align-items: center; min-height: 100vh; width: 100%; }
  .spinner { width: 40px; height: 40px; border: 4px solid #ccc; border-top: 4px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @media (min-width: 769px) {
    .container { flex-direction: row; }
    main { margin-right: 250px; padding: 1.5rem; }
    .sidebar-wrapper { width: 250px; min-height: 1000px; flex-shrink: 0; }
  }
  @media (max-width: 480px) {
    main { padding: 0.5rem; }
  }
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const deferredActiveSection = useDeferredValue(activeSection);
  const subtitlesListRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);

  const post = useSelector(state => state.postReducer.post, (oldVal, newVal) => oldVal?.postId === newVal?.postId);
  const relatedPosts = useSelector(state => state.postReducer.posts?.filter(p => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase()).slice(0, 3) || []);
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);

  const readTime = post?.content
    ? Math.ceil(
        (post.content + (post.summary || '') + (post.subtitles?.reduce((acc, sub) => acc + (sub.title || '') + (sub.content || '') + (sub.bulletPoints?.reduce((a, bp) => a + (bp.text || ''), '') || ''), '') || ''))
          .split(/\s+/).filter(w => w).length / 200
      )
    : 0;

  const preRenderedContent = post?.content ? parseLinks(post.content, post?.category || '', false) : 'Loading content...';

  if (!hasFetched) {
    console.log('[PostPage] Starting fetch for slug:', slug);
    startTransition(() => {
      setHasFetched(true);
      setActiveSection(null);
      dispatch(fetchPostBySlug(slug)).then(() => {
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, { timeout: 10000 });
        } else {
          setTimeout(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, 10000);
        }
      }).catch(error => {
        console.error('Fetch post failed:', error);
      });
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (!post && !hasFetched) {
    return (
      <HelmetProvider>
        <Helmet>
          <html lang="en" />
          <title>Loading... | Zedemy</title>
          <meta name="description" content="Loading..." />
          <meta name="keywords" content="Zedemy" />
          <meta name="author" content="Zedemy Team" />
          <meta name="robots" content="index, follow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
          <style>{css}</style>
        </Helmet>
        <div className="container">
          <main>
            <PriorityContent preRenderedContent="Loading content..." post={null} readTime={0} />
          </main>
          <aside className="sidebar-wrapper">
            <div style={{ height: '1000px' }}>Loading sidebar...</div>
          </aside>
        </div>
      </HelmetProvider>
    );
  }

  if (!post) {
    return (
      <HelmetProvider>
        <Helmet>
          <html lang="en" />
          <title>Loading... | Zedemy</title>
          <meta name="description" content="Loading..." />
          <meta name="keywords" content="Zedemy" />
          <meta name="author" content="Zedemy Team" />
          <meta name="robots" content="index, follow" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
          <style>{css}</style>
        </Helmet>
        <div className="container">
          <div className="loading-overlay" aria-live="polite">
            <div className="spinner" />
          </div>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{`${post.title} | Zedemy`}</title>
        <meta name="description" content={truncateText(post.summary || post.content, 160)} />
        <meta name="keywords" content={post.keywords ? `${post.keywords}, Zedemy, ${post.category || ''}` : `Zedemy, ${post.category || ''}`} />
        <meta name="author" content={post.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <style>{css}</style>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <PriorityContent preRenderedContent={preRenderedContent} post={post} readTime={readTime} />
          {hasFetched && post && (
            <Suspense fallback={<div style={{ height: '400px' }}>Loading additional content...</div>}>
              <PostContentNonCritical
                post={post}
                relatedPosts={relatedPosts}
                completedPosts={completedPosts}
                dispatch={dispatch}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeSection={deferredActiveSection}
                setActiveSection={setActiveSection}
                subtitlesListRef={subtitlesListRef}
              />
            </Suspense>
          )}
        </main>
        {hasFetched && post && (
          <aside className="sidebar-wrapper">
            <Suspense fallback={<div style={{ height: '1000px' }}>Loading sidebar...</div>}>
              <Sidebar
                post={post}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeSection={deferredActiveSection}
                scrollToSection={(id) => {
                  const section = document.getElementById(id);
                  if (section) {
                    section.scrollIntoView({ behavior: 'smooth' });
                    startTransition(() => setActiveSection(id));
                    if (isSidebarOpen) startTransition(() => setSidebarOpen(false));
                  }
                }}
                subtitlesListRef={subtitlesListRef}
              />
            </Suspense>
          </aside>
        )}
        {hasFetched && post && (
          <Suspense fallback={null}>
            <StructuredData post={post} readTime={readTime} slug={slug} />
          </Suspense>
        )}
      </div>
    </HelmetProvider>
  );
});

export default PostPage;
