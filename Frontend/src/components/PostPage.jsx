import React, { useState, useEffect, useRef, memo, Suspense, useDeferredValue, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { slugify, truncateText } from './utils';
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Lazy-loaded components
const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));

// Critical CSS for above-the-fold content
const criticalCSS = `
  .container { display: flex; min-height: 100vh; flex-direction: column; }
  main { flex: 1; padding: 1rem; background: #f4f4f9; }
  .post-header { font-size: clamp(1.5rem, 3vw, 2rem); color: #011020; margin: 0.75rem 0; width: 100%; max-width: 100%; }
  .content-section { font-size: 0.875rem; line-height: 1.7; width: 100%; max-width: 100%; min-height: 200px; }
  .content-section p { margin: 0.5rem 0; }
  .image-container { 
    width: 100%; 
    max-width: 280px; 
    margin: 1rem 0; 
    position: relative; 
    aspect-ratio: 16 / 9; 
    height: 157.5px; 
    background: #e0e0e0; 
  }
  .image-loaded { background: transparent; }
  .post-image { width: 100%; max-width: 280px; height: 157.5px; object-fit: contain; border-radius: 0.375rem; position: relative; z-index: 2; }
  .meta-info { color: #666; font-size: 0.75rem; margin-bottom: 0.75rem; }
  .content-skeleton { width: 100%; height: 20px; background: #e0e0e0; margin: 0.5rem 0; border-radius: 4px; }
  @media (min-width: 769px) {
    .container { flex-direction: row; }
    main { margin-right: 250px; padding: 2rem; }
    .image-container { max-width: 480px; height: 270px; }
    .post-image { max-width: 480px; height: 270px; }
  }
  @media (max-width: 480px) {
    .image-container { max-width: 240px; height: 135px; }
    .post-image { max-width: 240px; height: 135px; }
    main { padding: 0.5rem; }
    .content-section { min-height: 150px; }
  }
  @media (max-width: 320px) {
    .image-container { max-width: 200px; height: 112.5px; }
    .post-image { max-width: 200px; height: 112.5px; }
    main { padding: 0.25rem; }
    .content-section { min-height: 120px; }
  }
`;

// Non-critical CSS loaded asynchronously
const nonCriticalCSS = `
  .video-container { width: 100%; max-width: 280px; margin: 1rem 0; aspect-ratio: 16 / 9; height: 157.5px; }
  .post-video { width: 100%; max-width: 280px; height: 157.5px; border-radius: 0.375rem; }
  .placeholder { width: 100%; max-width: 280px; height: 157.5px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; color: #666; border-radius: 0.375rem; font-size: 0.875rem; }
  .skeleton { width: 60%; height: 2rem; background: #e0e0e0; border-radius: 0.375rem; margin: 0.75rem 0 1rem; }
  .loading-overlay { display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0.5); min-height: 100vh; width: 100%; }
  .spinner { width: 50px; height: 50px; border: 5px solid #2c3e50; border-top: 5px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; }
  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
  .sidebar-wrapper { }
  @media (min-width: 769px) {
    .video-container, .placeholder { max-width: 480px; height: 270px; }
    .post-video { max-width: 480px; height: 270px; }
    .sidebar-wrapper { width: 250px; min-height: 1200px; flex-shrink: 0; }
  }
  @media (max-width: 480px) {
    .video-container, .placeholder { max-width: 240px; height: 135px; }
    .post-video { max-width: 240px; height: 135px; }
  }
  @media (max-width: 320px) {
    .video-container, .placeholder { max-width: 200px; height: 112.5px; }
    .post-video { max-width: 200px; height: 112.5px; }
  }
`;

const parseLinks = (text) => {
  if (!text) return '';
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  return text.replace(linkRegex, (match, linkText, url) => {
    const isInternal = url.startsWith('/');
    const target = url.startsWith('vscode://') ? '_self' : '_blank';
    const rel = isInternal ? '' : 'rel="noopener"';
    return `<a href="${url}" class="text-blue-600 hover:text-blue-800" ${rel} target="${target}" aria-label="${isInternal ? 'Navigate to' : 'Visit'} ${linkText}">${linkText}</a>`;
  });
};

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const deferredActiveSection = useDeferredValue(activeSection);
  const subtitlesListRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [structuredData, setStructuredData] = useState([]);
  const [readTime, setReadTime] = useState(0);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const post = useSelector(state => state.postReducer.post);
  const relatedPosts = useSelector(state => 
    state.postReducer.posts?.filter(p => 
      p.postId !== post?.postId && 
      p.category?.toLowerCase() === post?.category?.toLowerCase()
    ).slice(0, 3) || []
  );
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);

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
        setHasFetched(true);
        // Defer non-critical fetches
        if (typeof window !== 'undefined') {
          setTimeout(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, 2000);
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

  useEffect(() => {
    if (!post?.content) return;
    const calculate = () => {
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
    // Run immediately for critical content
    calculate();
  }, [post]);

  useEffect(() => {
    if (!post) return;
    const pageTitle = `${post.title} | Zedemy, India`;
    const pageDescription = truncateText(post.summary || post.content, 160) || `Learn ${post.title?.toLowerCase() || ''} with Zedemy's tutorials.`;
    const pageKeywords = post.keywords
      ? `${post.keywords}, Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`
      : `Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`;
    const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
    const ogImage = post.titleImage
      ? `${post.titleImage}?w=1200&format=avif&q=75`
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
    startTransition(() => setStructuredData(schemas));
  }, [post, slug, readTime]);

  const formattedDate = post?.date && !isNaN(new Date(post.date).getTime())
    ? new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown Date';

  const parsedContent = post?.content ? parseLinks(post.content) : 'Loading content...';

  // Load non-critical CSS asynchronously
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = nonCriticalCSS;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  if (!post && !hasFetched) {
    return (
      <div className="container">
        <main>
          <div className="content-skeleton" />
          <div className="content-skeleton" style={{ width: '80%' }} />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container">
        <div className="loading-overlay" aria-live="polite">
          <div className="spinner" />
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
            href={`${post.titleImage}?w=100&format=avif&q=75`}
            as="image"
            fetchpriority="high"
            imagesrcset={`
              ${post.titleImage}?w=100&format=avif&q=75 100w,
              ${post.titleImage}?w=150&format=avif&q=75 150w,
              ${post.titleImage}?w=200&format=avif&q=75 200w,
              ${post.titleImage}?w=240&format=avif&q=75 240w,
              ${post.titleImage}?w=280&format=avif&q=75 280w,
              ${post.titleImage}?w=480&format=avif&q=75 480w
            `}
            imagesizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
          />
        )}
        <meta property="og:title" content={`${post.title} | Zedemy`} />
        <meta property="og:description" content={truncateText(post.summary || post.content, 160)} />
        <meta
          property="og:image"
          content={post.titleImage ? `${post.titleImage}?w=1200&format=avif&q=75` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
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
          content={post.titleImage ? `${post.titleImage}?w=1200&format=avif&q=75` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <style>{criticalCSS}</style>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <article>
            <header>
              {post.titleImage && (
                <div className={`image-container ${isImageLoaded ? 'image-loaded' : ''}`}>
                  <img
                    src={`${post.titleImage}?w=100&format=avif&q=75`}
                    srcSet={`
                      ${post.titleImage}?w=100&format=avif&q=75 100w,
                      ${post.titleImage}?w=150&format=avif&q=75 150w,
                      ${post.titleImage}?w=200&format=avif&q=75 200w,
                      ${post.titleImage}?w=240&format=avif&q=75 240w,
                      ${post.titleImage}?w=280&format=avif&q=75 280w,
                      ${post.titleImage}?w=480&format=avif&q=75 480w
                    `}
                    sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                    alt={post.title || 'Post image'}
                    className="post-image"
                    width="280"
                    height="157.5"
                    fetchpriority="high"
                    decoding="async"
                    loading="eager"
                    onLoad={() => setIsImageLoaded(true)}
                    onError={() => {
                      console.error('Title Image Failed:', post.titleImage);
                      setIsImageLoaded(true);
                    }}
                  />
                </div>
              )}
              <h1 className="post-header">{post.title || 'Loading...'}</h1>
              <div className="meta-info">
                <span>By {post.author || 'Unknown'}</span>
                <span> | {formattedDate}</span>
                <span> | Read time: <span id="read-time">{readTime || 'Calculating...'}</span> min</span>
              </div>
            </header>
            <section className="content-section">
              <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
            </section>
            {hasFetched && post && (
              <Suspense fallback={<div className="content-skeleton" style={{ height: '200px' }} />}>
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
          </article>
        </main>
        {hasFetched && post && (
          <aside className="sidebar-wrapper">
            <Suspense fallback={<div className="content-skeleton" style={{ height: '300px' }} />}>
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
