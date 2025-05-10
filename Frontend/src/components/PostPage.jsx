import React, { useState, useRef, memo, Suspense } from 'react';
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
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  .container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    width: 100%;
    contain: layout;
  }
  main {
    flex: 1;
    padding: 0;
    background: #f4f4f9;
    width: 100%;
    display: flex;
    flex-direction: column;
    min-height: 600px;
    contain-intrinsic-size: 100% 600px;
    contain: layout;
  }
  .sidebar-wrapper {
    width: 250px;
    height: 100vh;
    position: sticky;
    top: 0;
    min-height: 600px;
    contain-intrinsic-size: 250px 600px;
    contain: layout;
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
    contain-intrinsic-size: 100% 50px;
    contain: layout;
  }
  .skeleton {
    background: #e0e0e0;
    border-radius: 0.375rem;
    width: 100%;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .skeleton-section {
    min-height: 200px;
    margin: 1rem 0;
    contain-intrinsic-size: 100% 200px;
  }
  .skeleton-summary {
    min-height: 150px;
    margin: 1rem 0;
    contain-intrinsic-size: 100% 150px;
  }
  .skeleton-nav {
    min-height: 44px;
    margin: 1.5rem 0;
    contain-intrinsic-size: 100% 44px;
  }
  .skeleton-related {
    min-height: 450px;
    margin: 1rem 0;
    contain-intrinsic-size: 100% 450px;
  }
  .skeleton-references {
    min-height: 150px;
    margin: 1rem 0;
    contain-intrinsic-size: 100% 150px;
  }
  .skeleton-sidebar {
    min-height: 600px;
    width: 100%;
    contain-intrinsic-size: 250px 600px;
  }
  .skeleton-sidebar-item {
    min-height: 48px;
    margin: 0.5rem 0;
    contain-intrinsic-size: 100% 48px;
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  @media (max-width: 767px) {
    .sidebar-wrapper {
      width: min(100%, 300px);
      position: fixed;
      top: 0;
      right: -300px;
      height: calc(100vh - 0.5rem);
      z-index: 1000;
      contain-intrinsic-size: 300px 600px;
    }
    .sidebar-wrapper.open {
      right: 0;
    }
    .skeleton-sidebar {
      min-height: 600px;
      contain-intrinsic-size: 300px 600px;
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
      contain-intrinsic-size: 100% 900px;
    }
    .skeleton-sidebar {
      min-height: 600px;
      contain-intrinsic-size: 250px 600px;
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
    console.log('[PostPage] Fetching post for slug:', slug);
    const fetchData = async () => {
      try {
        await dispatch(fetchPostBySlug(slug));
        await Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
      } catch (err) {
        console.error('Fetch failed:', err);
      }
    };
    fetchData();
    return () => {};
  }, [dispatch, slug]);

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

  const skeletonLoader = (
    <div style={{ width: '100%', minHeight: '1000px', containIntrinsicSize: '100% 1000px', contain: 'layout' }}>
      <div className="skeleton-section skeleton" />
      <div className="skeleton-section skeleton" />
      <div className="skeleton-summary skeleton" />
      <div className="skeleton-nav skeleton" />
      <div className="skeleton-related skeleton" />
      <div className="skeleton-references skeleton" />
    </div>
  );

  const sidebarSkeleton = (
    <div className="skeleton-sidebar skeleton">
      <div className="skeleton" style={{ minHeight: '32px', margin: '1rem 0' }} />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton-sidebar-item skeleton" />
      ))}
    </div>
  );

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
          <Suspense fallback={skeletonLoader}>
            <PostContentNonCritical
              post={post}
              relatedPosts={relatedPosts}
              completedPosts={completedPosts}
              dispatch={dispatch}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              subtitlesListRef={subtitlesListRef}
            />
          </Suspense>
        </main>
        <aside className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <Suspense fallback={sidebarSkeleton}>
            <Sidebar
              post={post}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
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
