import React, { useState, useRef, memo, Suspense, useDeferredValue } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createSelector } from 'reselect';
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
  }
  main {
    flex: 1;
    padding: 0;
    background: #f4f4f9;
    width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 600px;
  }
  .sidebar-wrapper {
    width: 250px;
    height: 100vh;
    position: sticky;
    top: 0;
  }
  .error-message {
    color: #d32f2f;
    font-size: 0.875rem;
    text-align: center;
    padding: 0.5rem;
    background: #ffebee;
    border-radius: 0.25rem;
    margin: 0;
    min-height: 50px;
  }
  @media (max-width: 767px) {
    .sidebar-wrapper {
      width: min(100%, 300px);
      position: fixed;
      top: 0;
      right: -300px;
      height: calc(100vh - 0.5rem);
      z-index: 1000;
    }
    .sidebar-wrapper.open {
      right: 0;
    }
  }
  @media (min-width: 768px) {
    .container {
      flex-direction: row;
    }
    .sidebar-wrapper {
      margin: 0;
    }
    main {
      min-height: 900px;
    }
  }
`;

const selectPost = createSelector([(state) => state.postReducer.post || {}], (post) => post);
const selectError = createSelector([(state) => state.postReducer.error], (error) => error);
const selectRelatedPosts = createSelector(
  [(state) => state.postReducer.posts || [], (state) => state.postReducer.post || {}],
  (posts, post) =>
    posts
      .filter((p) => p.postId !== post.postId && p.category?.toLowerCase() === post.category?.toLowerCase())
      .slice(0, 3)
);
const selectCompletedPosts = createSelector(
  [(state) => state.postReducer.completedPosts || []],
  (completedPosts) => completedPosts
);

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const deferredActiveSection = useDeferredValue(activeSection);
  const subtitlesListRef = useRef(null);

  const post = useSelector(selectPost);
  const error = useSelector(selectError);
  const relatedPosts = useSelector(selectRelatedPosts);
  const completedPosts = useSelector(selectCompletedPosts);

  const readTime = React.useMemo(() => {
    if (!post?.content) return 0;
    const text = post.content + (post.summary || '');
    return Math.ceil(text.split(/\s+/).filter((w) => w).length / 200);
  }, [post.content, post.summary]);

  React.useEffect(() => {
    if (!post?.postId) {
      console.log('[PostPage] No post found, fetching for slug:', slug);
      dispatch(fetchPostBySlug(slug)).catch((err) => {
        console.error('Fetch post failed:', err);
      });
    }
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(
        () => {
          Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]).catch((err) => {
            console.error('Deferred fetches failed:', err);
          });
        },
        { timeout: 500 }
      );
    }
  }, [dispatch, slug, post?.postId]);

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
          <link rel="canonical" href={`https://zedemy.com/post/${slug}`} />
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
        <title>{post.title ? `${post.title} | Zedemy` : 'Zedemy'}</title>
        <meta
          name="description"
          content={post.summary || post.content ? truncateText(post.summary || post.content, 160) : 'Loading post content...'}
        />
        <meta
          name="keywords"
          content={post.keywords ? `${post.keywords}, Zedemy, ${post.category || ''}` : `Zedemy, ${post.category || ''}`}
        />
        <meta name="author" content={post.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={post.title || 'Zedemy'} />
        <meta
          property="og:description"
          content={post.summary || post.content ? truncateText(post.summary || post.content, 160) : 'Loading post content...'}
        />
        <meta property="og:url" content={`https://zedemy.com/post/${slug}`} />
        {post.titleImage && <meta property="og:image" content={`${post.titleImage}?w=600&format=avif&q=40`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={post.title || 'Zedemy'} />
        <meta
          name="twitter:description"
          content={post.summary || post.content ? truncateText(post.summary || post.content, 160) : 'Loading post content...'}
        />
        {post.titleImage && <meta name="twitter:image" content={`${post.titleImage}?w=600&format=avif&q=40`} />}
        <link rel="canonical" href={`https://zedemy.com/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {post?.titleImage && (
          <link rel="preload" as="image" href={`${post.titleImage}?w=280&format=avif&q=40`} media="(max-width: 767px)" />
        )}
        {post?.titleImage && (
          <link rel="preload" as="image" href={`${post.titleImage}?w=600&format=avif&q=40`} media="(min-width: 768px)" />
        )}
        <style>{criticalCss}</style>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <PriorityContent post={post} readTime={readTime} />
          <Suspense fallback={<div style={{ minHeight: '300px', width: '100%' }} />}>
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
        </main>
        <aside className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <Suspense fallback={<div style={{ minHeight: '200px', width: '100%' }} />}>
            <Sidebar
              post={post}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={deferredActiveSection}
              scrollToSection={(id) => {
                const section = document.getElementById(id);
                if (section) {
                  section.scrollIntoView({ behavior: 'smooth' });
                  setActiveSection(id);
                  if (isSidebarOpen) setSidebarOpen(false);
                }
              }}
              subtitlesListRef={subtitlesListRef}
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
