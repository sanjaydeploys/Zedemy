import React, { useState, useEffect, useRef, memo, Suspense, useDeferredValue, startTransition, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { slugify, truncateText } from './utils';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import PriorityContent from './PriorityContent';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));

const css = `
  .container { display: flex; min-height: 100vh; flex-direction: column; }
  main { flex: 1; padding: 1rem; background: #f4f4f9; }
  .sidebar-wrapper { }
  .content-skeleton { width: 100%; height: 20px; background: #e0e0e0; margin: 0.5rem 0; border-radius: 4px; }
  .loading-overlay { display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0.5); min-height: 100vh; width: 100%; }
  .spinner { width: 50px; height: 50px; border: 5px solid #2c3e50; border-top: 5px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  @media (min-width: 769px) {
    .container { flex-direction: row; }
    main { margin-right: 250px; padding: 2rem; }
    .sidebar-wrapper { width: 250px; min-height: 1200px; flex-shrink: 0; }
  }
  @media (max-width: 480px) {
    main { padding: 0.5rem; }
  }
  @media (max-width: 320px) {
    main { padding: 0.25rem; }
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
  const [readTime, setReadTime] = useState(0);

  const post = useSelector(state => state.postReducer.post);
  const relatedPosts = useSelector(state => state.postReducer.posts?.filter(p => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase()).slice(0, 3) || []);
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);

  useEffect(() => {
    console.log('[PostPage] Starting fetch for slug:', slug);
    startTransition(() => {
      setHasFetched(false);
      setActiveSection(null);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    const fetchData = async (retries = 3) => {
      const startTime = performance.now();
      try {
        await dispatch(fetchPostBySlug(slug));
        setHasFetched(true);
        const endTime = performance.now();
        console.log('[PostPage] Fetch completed in', (endTime - startTime) / 1000, 'seconds');
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, { timeout: 10000 });
        } else {
          setTimeout(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, 10000);
        }
      } catch (error) {
        console.error('Fetch post failed:', error);
        if (retries > 0) {
          setTimeout(() => fetchData(retries - 1), 1000);
        }
      }
    };
    fetchData();
  }, [dispatch, slug]);

  const structuredData = useMemo(() => {
    if (!post) return [];
    const pageTitle = `${post.title} | Zedemy, India`;
    const pageDescription = truncateText(post.summary || post.content, 160) || `Learn ${post.title?.toLowerCase() || ''} with Zedemy's tutorials.`;
    const pageKeywords = post.keywords
      ? `${post.keywords}, Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`
      : `Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`;
    const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
    const ogImage = post.titleImage
      ? `${post.titleImage}?w=1200&format=avif&q=1`
      : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png';
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title || '',
        description: pageDescription,
        keywords: pageKeywords.split(', ').filter(Boolean),
        articleSection: post.category || 'Tech Tutorials',
        author: { '@type': 'Person', name: post.author || 'Zedemy Team' },
        publisher: {
          '@type': 'Organization',
          name: 'Zedemy',
          logo: { '@type': 'ImageObject', url: ogImage },
        },
        datePublished: post.date || new Date().toISOString(),
        dateModified: post.date || new Date().toISOString(),
        image: ogImage,
        url: canonicalUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        timeRequired: `PT${readTime}M`,
        wordCount: 0,
        inLanguage: 'en',
        sameAs: ['https://x.com/zedemy', 'https://linkedin.com/company/zedemy'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://zedemy.vercel.app/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: post.category || 'Blog',
            item: `https://zedemy.vercel.app/category/${post.category?.toLowerCase() || 'blog'}`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.title || '',
            item: canonicalUrl,
          },
        ],
      },
    ];
  }, [post, readTime, slug]);

  useEffect(() => {
    if (!post?.content) return;
    const calculateReadTime = () => {
      let totalText = post.content || '';
      if (post.summary) totalText += ' ' + post.summary;
      if (post.subtitles) {
        post.subtitles.forEach(sub => {
          if (sub.title) totalText += ' ' + sub.title;
          if (sub.content) totalText += ' ' + sub.content;
          if (sub.bulletPoints) {
            sub.bulletPoints.forEach(bp => {
              if (bp.text) totalText += ' ' + bp.text;
            });
          }
        });
      }
      const words = totalText.split(/\s+/).filter(w => w).length;
      const time = Math.ceil(words / 200);
      setReadTime(time);
      const readTimeElement = document.getElementById('read-time');
      if (readTimeElement) {
        readTimeElement.textContent = `${time}`;
      }
    };
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(calculateReadTime, { timeout: 10000 });
    } else {
      setTimeout(calculateReadTime, 10000);
    }
  }, [post]);

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
            <PriorityContent post={null} readTime={readTime} />
          </main>
          <aside className="sidebar-wrapper">
            <div className="placeholder" style={{ height: '1200px' }}>Loading sidebar...</div>
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
        {post.titleImage && (
          <link
            rel="preload"
            href={`${post.titleImage}?w=100&format=avif&q=1`}
            as="image"
            fetchpriority="high"
            imagesrcset={`
              ${post.titleImage}?w=100&format=avif&q=1 100w,
              ${post.titleImage}?w=150&format=avif&q=1 150w,
              ${post.titleImage}?w=200&format=avif&q=1 200w,
              ${post.titleImage}?w=240&format=avif&q=1 240w,
              ${post.titleImage}?w=280&format=avif&q=1 280w,
              ${post.titleImage}?w=480&format=avif&q=1 480w
            `}
            imagesizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
          />
        )}
        <meta property="og:title" content={`${post.title} | Zedemy`} />
        <meta property="og:description" content={truncateText(post.summary || post.content, 160)} />
        <meta
          property="og:image"
          content={post.titleImage ? `${post.titleImage}?w=1200&format=avif&q=1` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <meta property="og:image:alt" content={`${post.title} tutorial`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="675" />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} | Zedemy`} />
        <meta name="twitter:description" content={truncateText(post.summary || post.content, 160)} />
        <meta
          name="twitter:image"
          content={post.titleImage ? `${post.titleImage}?w=1200&format=avif&q=1` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <style>{css}</style>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <PriorityContent post={post} readTime={readTime} />
          {hasFetched && post && (
            <Suspense fallback={<div className="placeholder" style={{ height: '500px' }}>Loading additional content...</div>}>
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
            <Suspense fallback={<div className="placeholder" style={{ height: '1200px' }}>Loading sidebar...</div>}>
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
                    const slugs = post.subtitles?.reduce((acc, s, i) => {
                      acc[`subtitle-${i}`] = slugify(s.title);
                      return acc;
                    }, post.summary ? { summary: 'summary' } : {});
                    if (slugs[id]) {
                      window.history.pushState(null, '', `#${slugs[id]}`);
                    }
                  }
                }}
                subtitlesListRef={subtitlesListRef}
              />
            </Suspense>
          </aside>
        )}
      </div>
    </HelmetProvider>
  );
});

export default PostPage;
