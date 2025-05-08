import React, { useState, useEffect, useRef, memo, useMemo, Suspense, useDeferredValue, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { parseLinks, slugify, truncateText } from './utils';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const loadDependencies = async () => {
  const [{ ClipLoader }] = await Promise.all([import('react-spinners')]);
  return { ClipLoader };
};

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));

const css = `
  .container { display: flex; min-height: 100vh; flex-direction: column; }
  main { flex: 1; padding: 1rem; background: #f4f4f9; }
  .post-header { font-size: clamp(1.5rem, 3vw, 2rem); color: #011020; margin: 0.75rem 0; width: 100%; max-width: 100%; }
  .content-section { font-size: 0.875rem; line-height: 1.7; width: 100%; max-width: 100%; }
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
  .video-container { width: 100%; max-width: 280px; margin: 1rem 0; aspect-ratio: 16 / 9; height: 157.5px; }
  .post-video { width: 100%; max-width: 280px; height: 157.5px; border-radius: 0.375rem; }
  .placeholder { width: 100%; max-width: 280px; height: 157.5px; background: #e0e0e0; display: flex; align-items: center; justify-content: center; color: #666; border-radius: 0.375rem; font-size: 0.875rem; }
  .skeleton { width: 60%; height: 2rem; background: #e0e0e0; border-radius: 0.375rem; margin: 0.75rem 0 1rem; }
  .loading-overlay { display: flex; justify-content: center; align-items: center; background: rgba(0, 0, 0, 0.5); min-height: 100vh; width: 100%; }
  .sidebar-wrapper { }
  .meta-info { color: #666; font-size: 0.75rem; margin-bottom: 0.75rem; }
  @media (min-width: 769px) {
    .container { flex-direction: row; }
    main { margin-right: 250px; padding: 2rem; }
    .image-container, .video-container, .placeholder { max-width: 480px; height: 270px; }
    .post-image, .post-video { max-width: 480px; height: 270px; }
    .sidebar-wrapper { width: 250px; min-height: 1200px; flex-shrink: 0; }
  }
  @media (max-width: 480px) {
    .image-container, .video-container, .placeholder { max-width: 240px; height: 135px; }
    .post-image, .post-video { max-width: 240px; height: 135px; }
    main { padding: 0.5rem; }
  }
  @media (max-width: 320px) {
    .image-container, .video-container, .placeholder { max-width: 200px; height: 112.5px; }
    .post-image, .post-video { max-width: 200px; height: 112.5px; }
    main { padding: 0.25rem; }
  }
`;

// Web Worker for parsing content
const parseContentInWorker = (content, category) => {
  return new Promise((resolve) => {
    const workerCode = `
      self.onmessage = function(e) {
        const { content, category } = e.data;
        const parseLinks = (text, category, isHtml = false) => {
          if (!text) return isHtml ? '' : [text];
          const linkRegex = /\\[([^\\]]+)\\]\\((https?:\\/\\/[^\\s)]+|vscode:\\/\\/[^\\s)]+|\\/[^\\s)]+)\\)/g;
          const elements = [];
          let lastIndex = 0;
          let match;
          while ((match = linkRegex.exec(text)) !== null) {
            const [fullMatch, linkText, url] = match;
            if (match.index > lastIndex) {
              elements.push(text.slice(lastIndex, match.index));
            }
            elements.push({ linkText, url, isInternal: url.startsWith('/') });
            lastIndex = match.index + fullMatch.length;
          }
          if (lastIndex < text.length) {
            elements.push(text.slice(lastIndex));
          }
          return elements.length ? elements : [text || ''];
        };
        const result = parseLinks(content, category, false);
        self.postMessage(result);
      };
    `;
    const blob = new Blob([workerCode], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    worker.onmessage = (e) => {
      resolve(e.data);
      worker.terminate();
    };
    worker.onerror = (err) => {
      console.error('Worker error:', err);
      resolve([content]); // Fallback to raw content
      worker.terminate();
    };
    worker.postMessage({ content, category });
  });
};

const PostContentCritical = memo(({ post, parsedTitle, calculateReadTimeAndWordCount }) => {
  const [contentElements, setContentElements] = useState([]);
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    if (!post?.content) {
      setContentElements([]);
      return;
    }
    // Initial render with first 500 characters to reduce LCP
    const initialContent = post.content.slice(0, 500);
    setContentElements([initialContent]);
    // Offload full parsing to Web Worker
    parseContentInWorker(post.content, post.category || '').then(elements => {
      setContentElements(elements);
    });
  }, [post]);

  const formattedDate = post?.date ? new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }) : '';

  return (
    <>
      <header>
        {post?.titleImage && (
          <div className={`image-container ${isImageLoaded ? 'image-loaded' : ''}`}>
            <img
              src={`${post.titleImage}?w=100&format=avif&q=1`}
              srcSet={`
                ${post.titleImage}?w=100&format=avif&q=1 100w,
                ${post.titleImage}?w=150&format=avif&q=1 150w,
                ${post.titleImage}?w=200&format=avif&q=1 200w,
                ${post.titleImage}?w=240&format=avif&q=1 240w,
                ${post.titleImage}?w=280&format=avif&q=1 280w,
                ${post.titleImage}?w=480&format=avif&q=1 480w
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
        <h1 className="post-header">{parsedTitle || post.title}</h1>
        <div className="meta-info">
          {post?.author && <span>By {post.author}</span>}
          {formattedDate && <span> | {formattedDate}</span>}
          <span> | Read time: {calculateReadTimeAndWordCount.readTime} min</span>
        </div>
      </header>
      <section className="content-section">
        {contentElements.map((element, index) => (
          <React.Fragment key={index}>
            {typeof element === 'string' ? (
              element
            ) : (
              element.isInternal ? (
                <a href={element.url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${element.linkText}`}>
                  {element.linkText}
                </a>
              ) : (
                <a
                  href={element.url}
                  target={element.url.startsWith('vscode://') ? '_self' : '_blank'}
                  rel="noopener"
                  className="text-blue-600 hover:text-blue-800"
                  aria-label={`Visit ${element.linkText}`}
                >
                  {element.linkText}
                </a>
              )
            )}
          </React.Fragment>
        ))}
      </section>
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
  const [parsedTitle, setParsedTitle] = useState('');
  const [readTime, setReadTime] = useState(0);

  const post = useSelector(state => state.postReducer.post);
  const relatedPosts = useSelector(state => state.postReducer.posts?.filter(p => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase()).slice(0, 3) || []);
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => loadDependencies().then(setDeps), { timeout: 8000 });
    } else {
      setTimeout(() => loadDependencies().then(setDeps), 8000);
    }
  }, []);

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
        if (typeof window !== 'undefined' && window.requestIdleCallback) {
          window.requestIdleCallback(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, { timeout: 9000 });
        } else {
          setTimeout(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, 9000);
        }
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
      }, { timeout: 8000 });
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
      }, 8000);
    }
  }, [post]);

  useEffect(() => {
    if (!post) return;
    setParsedTitle(post.title);
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
          ? `${post.titleImage}?w=1200&format=avif&q=1`
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
      }, { timeout: 9000 });
    }
  }, [post, slug, readTime]);

  if (!post && !hasFetched) {
    return (
      <div className="container">
        <main>
          <div className="skeleton" />
        </main>
        <aside className="sidebar-wrapper">
          <div className="placeholder" style={{ height: '1200px' }}>Loading sidebar...</div>
        </aside>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container">
        <div className="loading-overlay" aria-live="polite">
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
          <article>
            <PostContentCritical
              post={post}
              parsedTitle={parsedTitle}
              calculateReadTimeAndWordCount={calculateReadTimeAndWordCount}
            />
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
          </article>
        </main>
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
