import React, { useState, useEffect, useRef, memo, useMemo, useCallback, Suspense, useDeferredValue, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts, markPostAsCompleted } from '../actions/postActions';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { parseLinks, slugify, truncateText } from './utils';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const loadDependencies = async () => {
  const [
    { ClipLoader },
    { createSelector },
  ] = await Promise.all([
    import('react-spinners'),
    import('reselect'),
  ]);
  return { ClipLoader, createSelector };
};

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Minimal critical CSS for LCP elements only
const criticalCSS = `
  html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; }
  .container { display: flex; min-height: 100vh; flex-direction: column; }
  main { flex: 1; padding: 1rem; background: #f4f4f9; min-height: 2000px; }
  h1 { font-size: clamp(1.25rem, 3vw, 1.75rem); color: #111827; font-weight: 800; margin: 0.5rem 0; line-height: 1.2; }
  .content-section { font-size: 0.95rem; line-height: 1.5; margin-bottom: 1rem; content-visibility: auto; contain-intrinsic-size: 1px 300px; }
  figure { width: 100%; max-width: 100%; margin: 0.5rem 0; position: relative; }
  img { width: 100%; max-width: 200px; aspect-ratio: 16 / 9; border-radius: 0.375rem; }
  @media (min-width: 769px) {
    .container { flex-direction: row; }
    main { padding: 1.5rem; margin-right: 250px; }
    h1 { font-size: clamp(1.5rem, 4vw, 2rem); }
    .content-section { font-size: 1rem; line-height: 1.6; }
    img { max-width: 480px; }
  }
  @media (max-width: 480px) {
    h1 { font-size: 1.25rem; }
    .content-section { font-size: 0.9rem; line-height: 1.4; }
    img { max-width: 180px; }
  }
  @media (max-width: 320px) {
    h1 { font-size: 1.1rem; }
    .content-section { font-size: 0.85rem; }
    img { max-width: 160px; }
  }
  @font-face {
    font-family: 'Segoe UI';
    src: local('Segoe UI'), local('BlinkMacSystemFont'), local('-apple-system');
    font-display: swap;
  }
`;

const PostContentCritical = memo(({ post, calculateReadTimeAndWordCount }) => {
  const [visibleContent, setVisibleContent] = useState('');
  const [remainingContent, setRemainingContent] = useState(null);
  const contentRef = useRef(null);

  useEffect(() => {
    if (!post?.content) return;

    // Split content based on words (first 100 words for above-the-fold)
    const content = post.content || '';
    const words = content.split(/\s+/).filter(w => w);
    let aboveFoldWords = words.slice(0, 100).join(' ');
    let belowFoldWords = words.slice(100).join(' ');

    // Wrap in a div to ensure valid HTML
    setVisibleContent(`<div>${aboveFoldWords}</div>`);

    if (belowFoldWords) {
      requestAnimationFrame(() => {
        setRemainingContent(`<div>${belowFoldWords}</div>`);
      });
    }
  }, [post?.content]);

  return (
    <>
      <header style={{ marginBottom: '0.5rem' }}>
        <h1 style={{
          fontSize: 'clamp(1.25rem, 3vw, 1.75rem)',
          color: '#111827',
          fontWeight: 800,
          margin: '0.5rem 0',
          lineHeight: 1.2,
        }}>{post.title}</h1>
        <div style={{ color: '#666', fontSize: '0.7rem' }}>
          Read time: {calculateReadTimeAndWordCount.readTime} min
        </div>
      </header>

      {post.titleImage && (
        <figure style={{ width: '100%', maxWidth: '100%', margin: '0.5rem 0', position: 'relative' }}>
          <img
            src={`${post.titleImage}?w=20&format=webp&q=1`}
            alt="Low quality placeholder"
            style={{
              width: '100%',
              maxWidth: '200px',
              aspectRatio: '16 / 9',
              borderRadius: '0.375rem',
              filter: 'blur(10px)',
              position: 'absolute',
              top: 0,
              left: 0,
              zIndex: 1,
            }}
            width="200"
            height="112.5"
          />
          <img
            src={`${post.titleImage}?w=160&format=avif&q=40`}
            srcSet={`
              ${post.titleImage}?w=100&format=avif&q=40 100w,
              ${post.titleImage}?w=160&format=avif&q=40 160w,
              ${post.titleImage}?w=200&format=avif&q=40 200w,
              ${post.titleImage}?w=480&format=avif&q=40 480w
            `}
            sizes="(max-width: 320px) 160px, (max-width: 480px) 180px, (max-width: 768px) 200px, 480px"
            alt={`Illustration for ${post.title}`}
            style={{
              width: '100%',
              maxWidth: '200px',
              aspectRatio: '16 / 9',
              borderRadius: '0.375rem',
              position: 'relative',
              zIndex: 2,
            }}
            width="200"
            height="112.5"
            fetchpriority="high"
            loading="eager"
            decoding="async"
            onError={() => console.error('Title Image Failed:', post.titleImage)}
          />
        </figure>
      )}

      {post.titleVideo && (
        <figure style={{ width: '100%', maxWidth: '100%', margin: '0.5rem 0' }}>
          <video
            controls
            preload="metadata"
            poster={`${post.titleVideoPoster || post.titleImage}?w=80&format=webp&q=5`}
            style={{
              width: '100%',
              maxWidth: '200px',
              aspectRatio: '16 / 9',
              borderRadius: '0.375rem',
            }}
            width="200"
            height="112.5"
            loading="eager"
            decoding="async"
            aria-label={`Video for ${post.title}`}
            fetchpriority="high"
          >
            <source src={`${post.titleVideo}#t=0.1`} type="video/mp4" />
          </video>
        </figure>
      )}

      <p style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }}>
        <time dateTime={post.date}>{post.date}</time> | Author: {post.author || 'Zedemy Team'}
      </p>
      <section
        className="content-section"
        ref={contentRef}
        style={{
          fontSize: '0.95rem',
          lineHeight: 1.5,
          marginBottom: '1rem',
        }}
        dangerouslySetInnerHTML={{ __html: visibleContent || post.content }}
      />
      {remainingContent && (
        <section
          className="content-section"
          style={{
            fontSize: '0.95rem',
            lineHeight: 1.5,
            marginBottom: '1rem',
          }}
          dangerouslySetInnerHTML={{ __html: remainingContent }}
        />
      )}
    </>
  );
});

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const deferredActiveSection = useDeferredValue(activeSection);
  const subtitlesListRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [deps, setDeps] = useState(null);
  const [structuredData, setStructuredData] = useState([]);
  const [readTime, setReadTime] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => loadDependencies().then(setDeps), { timeout: 3000 });
    } else {
      setTimeout(() => loadDependencies().then(setDeps), 3000);
    }
  }, []);

  const selectors = useMemo(() => {
    if (!deps?.createSelector) return null;

    const selectPostReducer = state => state.postReducer;
    const selectPost = deps.createSelector([selectPostReducer], postReducer => postReducer.post);
    const selectPosts = deps.createSelector([selectPostReducer], postReducer => postReducer.posts || []);
    const selectCompletedPosts = deps.createSelector([selectPostReducer], postReducer => postReducer.completedPosts || []);
    const selectRelatedPosts = deps.createSelector(
      [selectPosts, selectPost],
      (posts, post) =>
        posts
          .filter(p => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase())
          .slice(0, 3),
      { memoizeOptions: { resultEqualityCheck: (a, b) => JSON.stringify(a) === JSON.stringify(b) } }
    );

    return { selectPost, selectPosts, selectCompletedPosts, selectRelatedPosts };
  }, [deps]);

  const post = useSelector(selectors?.selectPost || (state => state.postReducer.post));
  const relatedPosts = useSelector(selectors?.selectRelatedPosts || (state => []));
  const completedPosts = useSelector(selectors?.selectCompletedPosts || (state => []));

  useEffect(() => {
    startTransition(() => {
      setHasFetched(false);
      setActiveSection(null);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    const fetchData = async (retries = 3) => {
      try {
        await dispatch(fetchPostBySlug(slug));
        startTransition(() => setHasFetched(true));
        setTimeout(() => {
          Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
        }, 3000);
      } catch (error) {
        console.error('Fetch failed:', error);
        if (retries > 0) {
          setTimeout(() => fetchData(retries - 1), 1000);
        }
      }
    };
    if (!hasFetched) {
      fetchData();
    }
  }, [dispatch, slug, hasFetched]);

  const calculateReadTimeAndWordCount = useMemo(() => {
    return { readTime, wordCount: 0 };
  }, [readTime]);

  useEffect(() => {
    if (!post) return;
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        const text = [
          post.title || '',
          post.content || '',
          post.summary || '',
          ...(post.subtitles?.map(s => (s.title || '') + (s.bulletPoints?.map(b => b.text || '').join('') || '')) || []),
        ].join(' ');
        const words = text.split(/\s+/).filter(w => w).length;
        setReadTime(Math.ceil(words / 200));
      }, { timeout: 4000 });
    } else {
      setTimeout(() => {
        const text = [
          post.title || '',
          post.content || '',
          post.summary || '',
          ...(post.subtitles?.map(s => (s.title || '') + (s.bulletPoints?.map(b => b.text || '').join('') || '')) || []),
        ].join(' ');
        const words = text.split(/\s+/).filter(w => w).length;
        setReadTime(Math.ceil(words / 200));
      }, 4000);
    }
  }, [post]);

  useEffect(() => {
    if (!post) return;
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        const pageTitle = `${post.title} | Zedemy, India`;
        const pageDescription = truncateText(post.summary || post.content, 160) || `Learn ${post.title?.toLowerCase() || ''} with Zedemy's tutorials.`;
        const pageKeywords = post.keywords
          ? `${post.keywords}, Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`
          : `Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`;
        const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
        const ogImage = post.titleImage
          ? `${post.titleImage}?w=1200&format=webp&q=75`
          : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png';
        const schemas = [
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
        if (post.titleVideo) {
          schemas.push({
            '@context': 'https://schema.org',
            '@type': 'VideoObject',
            name: post.title || '',
            description: pageDescription,
            thumbnailUrl: post.titleVideoPoster || ogImage,
            contentUrl: post.titleVideo,
            uploadDate: post.date || new Date().toISOString(),
            duration: `PT${readTime}M`,
            publisher: {
              '@type': 'Organization',
              name: 'Zedemy',
              logo: { '@type': 'ImageObject', url: ogImage },
            },
          });
        }
        startTransition(() => setStructuredData(schemas));
      }, { timeout: 4000 });
    }
  }, [post, slug, readTime]);

  useEffect(() => {
    if (post?.titleImage) {
      if (typeof scheduler !== 'undefined' && scheduler.postTask) {
        scheduler.postTask(
          () => {
            const img = new Image();
            img.src = `${post.titleImage}?w=160&format=avif&q=40`;
            img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
          },
          { priority: 'background' }
        );
      } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(
          () => {
            const img = new Image();
            img.src = `${post.titleImage}?w=160&format=avif&q=40`;
            img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
          },
          { timeout: 2000 }
        );
      }
    }
  }, [post?.titleImage]);

  if (!post && !hasFetched) {
    return (
      <div className="container">
        <main>
          <div style={{
            width: '60%',
            height: '2rem',
            background: '#e0e0e0',
            borderRadius: '0.375rem',
            margin: '0.75rem 0 1rem',
          }} />
        </main>
        <aside style={{ width: '250px', minHeight: '1200px', flexShrink: 0, display: 'none' }}>
          <div style={{
            width: '100%',
            minHeight: '1200px',
            background: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
          }}>
            Loading sidebar...
          </div>
        </aside>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container">
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.5)',
          minHeight: '100vh',
          width: '100%',
        }} aria-live="polite">
          {deps?.ClipLoader ? <deps.ClipLoader color="#2c3e50" size={50} /> : <div>Loading...</div>}
        </div>
      </div>
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
            as="image"
            href={`${post.titleImage}?w=160&format=avif&q=40`}
            crossOrigin="anonymous"
            fetchpriority="high"
            imagesrcset={`
              ${post.titleImage}?w=100&format=avif&q=40 100w,
              ${post.titleImage}?w=160&format=avif&q=40 160w,
              ${post.titleImage}?w=200&format=avif&q=40 200w,
              ${post.titleImage}?w=480&format=avif&q=40 480w
            `}
            imagesizes="(max-width: 320px) 160px, (max-width: 480px) 180px, (max-width: 768px) 200px, 480px"
          />
        )}
        <meta property="og:title" content={`${post.title} | Zedemy`} />
        <meta property="og:description" content={truncateText(post.summary || post.content, 160)} />
        <meta
          property="og:image"
          content={post.titleImage ? `${post.titleImage}?w=1200&format=webp&q=75` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
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
          content={post.titleImage ? `${post.titleImage}?w=1200&format=webp&q=75` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <style>{criticalCSS}</style>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <article>
            <PostContentCritical
              post={post}
              calculateReadTimeAndWordCount={calculateReadTimeAndWordCount}
            />
            <Suspense fallback={<div style={{
              width: '100%',
              minHeight: '500px',
              background: '#e0e0e0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#666',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
            }}>Loading additional content...</div>}>
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
          </article>
        </main>
        <aside style={{ width: '250px', minHeight: '1200px', flexShrink: 0, display: 'none' }}>
          <Suspense fallback={<div style={{
            width: '100%',
            minHeight: '1200px',
            background: '#e0e0e0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
          }}>Loading sidebar...</div>}>
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
                  const slugs = post?.subtitles?.reduce((acc, s, i) => {
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
      </div>
    </HelmetProvider>
  );
});

export default PostPage;
