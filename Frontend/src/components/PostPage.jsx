import React, { useState, useRef, memo, Suspense, useDeferredValue, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import PriorityContent from './PriorityContent';
import { truncateText } from './utils';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));
const StructuredData = React.lazy(() => import('./StructuredData'));

const criticalCss = `
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    box-sizing: border-box;
    position: relative;
  }
  main {
    flex: 1;
    padding: 0.5rem;
    background: #f4f4f9;
    box-sizing: border-box;
    min-height: 100vh;
  }
  .sidebar-wrapper {
    width: 250px;
    height: 100vh;
    position: sticky;
    top: 0;
    box-sizing: border-box;
  }
  .error-message {
    color: #d32f2f;
    font-size: 0.875rem;
    text-align: center;
    padding: 1rem;
    background: #ffebee;
    border-radius: 0.25rem;
    margin: 0.5rem;
  }
  @media (max-width: 768px) {
    .container {
      padding-top: 48px;
    }
    .sidebar-wrapper {
      width: min(100%, 300px);
      position: fixed;
      top: 0.5rem;
      right: ${(props) => (props.isSidebarOpen ? '0.5rem' : '-300px')};
      margin: 0.5rem;
      height: calc(100vh - 1rem);
      transition: right 0.3s ease-in-out;
      z-index: 1000;
    }
    main {
      padding: 0.5rem;
    }
  }
  @media (min-width: 768px) {
    .container {
      flex-direction: row;
    }
    .sidebar-wrapper {
      margin: 0;
      right: 0;
    }
    main {
      padding: 1rem;
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
  const error = useSelector(state => state.postReducer.error);
  const relatedPosts = useSelector(state =>
    state.postReducer.posts?.filter(p => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase()).slice(0, 3) || []
  );
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

  React.useEffect(() => {
    if (!hasFetched) {
      console.log('[PostPage] Starting fetch for slug:', slug);
      setHasFetched(true);
      window.requestAnimationFrame(() => {
        dispatch(fetchPostBySlug(slug)).then(() => {
          if (typeof window !== 'undefined' && window.requestIdleCallback) {
            window.requestIdleCallback(() => {
              Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
            }, { timeout: 3000 });
          } else {
            setTimeout(() => {
              Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
            }, 1000);
          }
        }).catch(err => {
          console.error('Fetch post failed:', err);
        });
      });
    }
  }, [dispatch, slug, hasFetched]);

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
            <div className="error-message">
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
        <title>{post ? `${post.title} | Zedemy` : 'Zedemy'}</title>
        <meta name="description" content={post ? truncateText(post.summary || post.content, 160) : 'Loading post content...'} />
        <meta name="keywords" content={post ? (post.keywords ? `${post.keywords}, Zedemy, ${post.category || ''}` : `Zedemy, ${post.category || ''}`) : 'Zedemy'} />
        <meta name="author" content={post?.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {post?.titleImage && (
          <link
            rel="preload"
            as="image"
            href={`${post.titleImage}?w=280&format=avif&q=50`}
            media="(max-width: 767px)"
          />
        )}
        {post?.titleImage && (
          <link
            rel="preload"
            as="image"
            href={`${post.titleImage}?w=600&format=avif&q=50`}
            media="(min-width: 768px)"
          />
        )}
        <style>{criticalCss}</style>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <PriorityContent post={post} readTime={readTime} />
          {hasFetched && post && (
            <Suspense fallback={<div style={{ minHeight: '400px' }} />}>
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
          <aside className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
            <Suspense fallback={<div style={{ minHeight: '200px' }} />}>
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
