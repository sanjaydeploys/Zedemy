import React, { useState, useRef, memo, Suspense, useDeferredValue, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { truncateText } from './utils';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import PriorityContent from './PriorityContent';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));
const StructuredData = React.lazy(() => import('./StructuredData'));

const css = `
  .container { 
    display: flex; 
    min-height: 100vh; 
    flex-direction: row; 
    width: 100%; 
    box-sizing: border-box; 
  }
  main { 
    flex: 1; 
    padding: 1rem; 
    background: #f4f4f9; 
    box-sizing: border-box; 
  }
  .sidebar-wrapper { 
    width: 250px; 
    flex-shrink: 0; 
  }
  .loading-overlay { 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    background: rgba(0, 0, 0, 0.5); 
    min-height: 100vh; 
    width: 100%; 
  }
  .spinner { 
    width: 50px; 
    height: 50px; 
    border: 5px solid #2c3e50; 
    border-top: 5px solid transparent; 
    border-radius: 50%; 
    animation: spin 1s linear infinite; 
  }
  .error-message { 
    color: #d32f2f; 
    font-size: 1rem; 
    text-align: center; 
    padding: 2rem; 
    background: #ffebee; 
    border-radius: 0.375rem; 
    margin: 1rem; 
  }
  @keyframes spin { 
    0% { transform: rotate(0deg); } 
    100% { transform: rotate(360deg); } 
  }
  @media (max-width: 768px) {
    .container { 
      flex-direction: column; 
    }
    .sidebar-wrapper { 
      width: 100%; 
      position: relative; 
      height: auto; 
    }
    main { 
      padding: 0.5rem; 
    }
    .toggle-button { 
      display: block !important; 
    }
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

  const post = useSelector(state => state.postReducer.post);
  const error = useSelector(state => state.postReducer.error); // Added to handle FETCH_POST_FAILURE
  const relatedPosts = useSelector(state => state.postReducer.posts?.filter(p => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase()).slice(0, 3) || []);
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);

  const readTime = post?.content
    ? Math.ceil(
        (post.content + (post.summary || '') + (post.subtitles || []).reduce((acc, sub) => {
          acc += sub.title || '';
          acc += sub.content || '';
          acc += (sub.bulletPoints || []).reduce((bpAcc, bp) => bpAcc + (bp.text || ''), '');
          return acc;
        }, '')).split(/\s+/).filter(w => w).length / 200
      )
    : 0;

  if (!hasFetched) {
    console.log('[PostPage] Starting fetch for slug:', slug);
    startTransition(() => {
      setHasFetched(true);
      setActiveSection(null);
    });
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
          <meta name="robots" content="index, follow, max-image-preview:large" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
          <style>{css}</style>
        </Helmet>
        <div className="container">
          <main>
            <PriorityContent post={null} readTime={0} />
          </main>
          <aside className="sidebar-wrapper">
            <div className="placeholder" style={{ minHeight: '200px' }}>Loading sidebar...</div>
          </aside>
        </div>
      </HelmetProvider>
    );
  }

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
          <style>{css}</style>
        </Helmet>
        <div className="container">
          <main>
            <div className="error-message">
              Failed to load the post: {error}. Please try again later.
            </div>
          </main>
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
          <meta name="robots" content="index, follow, max-image-preview:large" />
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
        <meta
          name="keywords"
          content={post.keywords ? `${post.keywords}, Zedemy, ${post.category || ''}` : `Zedemy, ${post.category || ''}`}
        />
        <meta name="author" content={post.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <style>{css}</style>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <PriorityContent post={post} readTime={readTime} />
          {hasFetched && post && (
            <Suspense fallback={<div className="placeholder" style={{ minHeight: '500px' }}>Loading additional content...</div>}>
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
            <Suspense fallback={<div className="placeholder" style={{ minHeight: '200px' }}>Loading sidebar...</div>}>
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
