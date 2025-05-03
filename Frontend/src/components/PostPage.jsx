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

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  flex-direction: column;
  @media (min-width: 769px) {
    flex-direction: row;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1rem;
  background: #f4f4f9;
  contain: paint;
  @media (min-width: 769px) {
    margin-right: 220px;
    padding: 1.5rem;
  }
`;

const SidebarWrapper = styled.aside`
  @media (min-width: 769px) {
    width: 220px;
    flex-shrink: 0;
  }
`;

const LoadingOverlay = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  min-height: 100vh;
  width: 100%;
`;

const SkeletonHeader = styled.div`
  width: 60%;
  height: 1.5rem;
  background: #e0e0e0;
  border-radius: 0.25rem;
  margin: 0.5rem 0 0.75rem;
`;

const PostHeader = styled.h1`
  font-size: clamp(1.25rem, 3.5vw, 1.75rem);
  color: #111827;
  margin: 0.5rem 0 0.75rem;
  font-weight: 800;
  line-height: 1.2;
  @media (min-width: 769px) {
    font-size: clamp(1.5rem, 4vw, 2rem);
  }
`;

const ContentSection = styled.section`
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 1rem;
  content-visibility: auto;
  contain-intrinsic-size: 100% 300px;
  @media (min-width: 769px) {
    font-size: 1rem;
    line-height: 1.6;
    contain-intrinsic-size: 100% 400px;
  }
`;

const ImageContainer = styled.figure`
  width: 100%;
  max-width: 100%;
  margin: 0.75rem 0;
  position: relative;
`;

const PostImage = styled.img`
  width: 100%;
  max-width: 240px;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 0.25rem;
  position: relative;
  z-index: 2;
  @media (min-width: 769px) {
    max-width: 400px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
  }
`;

const LQIPImage = styled.img`
  width: 100%;
  max-width: 240px;
  aspect-ratio: 16 / 9;
  object-fit: contain;
  border-radius: 0.25rem;
  filter: blur(8px);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  @media (min-width: 769px) {
    max-width: 400px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
  }
`;

const VideoContainer = styled.figure`
  width: 100%;
  max-width: 100%;
  margin: 0.75rem 0;
`;

const PostVideo = styled.video`
  width: 100%;
  max-width: 240px;
  aspect-ratio: 16 / 9;
  border-radius: 0.25rem;
  @media (min-width: 769px) {
    max-width: 400px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
  }
`;

const Placeholder = styled.div`
  width: 100%;
  min-height: ${(props) => props.minHeight || '150px'};
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.25rem;
  font-size: 0.75rem;
`;

const criticalCSS = `
  html {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 16px;
    line-height: 1.5;
  }
  body {
    margin: 0;
  }
  .container {
    display: flex;
    min-height: 100vh;
  }
  main {
    flex: 1;
    padding: 1rem;
    background: #f4f4f9;
  }
  aside {
    width: 220px;
    flex-shrink: 0;
  }
  h1 {
    font-size: clamp(1.25rem, 3.5vw, 1.75rem);
    color: #111827;
    font-weight: 800;
    margin: 0.5rem 0 0.75rem;
    line-height: 1.2;
  }
  section {
    font-size: 0.95rem;
    line-height: 1.5;
    margin-bottom: 1rem;
    content-visibility: auto;
    contain-intrinsic-size: 100% 300px;
  }
  figure {
    width: 100%;
    max-width: 100%;
    margin: 0.75rem 0;
    position: relative;
  }
  img {
    width: 100%;
    max-width: 240px;
    aspect-ratio: 16 / 9;
    border-radius: 0.25rem;
  }
  video {
    width: 100%;
    max-width: 240px;
    aspect-ratio: 16 / 9;
    border-radius: 0.25rem;
  }
  p {
    font-size: 0.85rem;
  }
  @media (min-width: 769px) {
    main {
      padding: 1.5rem;
      margin-right: 220px;
    }
    h1 {
      font-size: clamp(1.5rem, 4vw, 2rem);
    }
    section {
      font-size: 1rem;
      line-height: 1.6;
      contain-intrinsic-size: 100% 400px;
    }
    img, video {
      max-width: 400px;
    }
  }
  @media (max-width: 320px) {
    img, video {
      max-width: 200px;
    }
  }
`;

const PostContentCritical = memo(({ post, calculateReadTimeAndWordCount }) => {
  const [visibleContent, setVisibleContent] = useState([]);
  const [remainingContent, setRemainingContent] = useState(null);

  useEffect(() => {
    if (!post?.content) {
      setVisibleContent([]);
      return;
    }

    // Lightweight splitting: Extract plain text for above-the-fold content
    const paragraphs = post.content.split(/(<p[^>]*>.*?<\/p>)/gi).filter(p => p.trim());
    let wordCount = 0;
    const aboveFoldContent = [];
    const belowFoldContent = [];
    let isAboveFold = true;

    for (let i = 0; i < paragraphs.length; i++) {
      const para = paragraphs[i];
      const text = para.replace(/<[^>]+>/g, '');
      const words = text.split(/\s+/).filter(w => w).length;
      wordCount += words;

      if (isAboveFold && (wordCount < 200 || i < 1)) { // Reduced to 200 words for faster render
        aboveFoldContent.push(para);
      } else {
        isAboveFold = false;
        belowFoldContent.push(para);
      }
    }

    setVisibleContent(aboveFoldContent);

    if (belowFoldContent.length > 0) {
      if (typeof scheduler !== 'undefined' && scheduler.postTask) {
        scheduler.postTask(() => {
          setRemainingContent(belowFoldContent);
        }, { priority: 'background' });
      } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          setRemainingContent(belowFoldContent);
        }, { timeout: 3000 });
      } else {
        setTimeout(() => {
          setRemainingContent(belowFoldContent);
        }, 3000);
      }
    }
  }, [post?.content]);

  return (
    <>
      <header>
        <PostHeader>{post.title}</PostHeader>
        <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.7rem' }}>
          Read time: {calculateReadTimeAndWordCount.readTime} min
        </div>
      </header>

      {post.titleImage && (
        <ImageContainer>
          <LQIPImage
            src={`${post.titleImage}?w=20&format=webp&q=1`}
            alt="Low quality placeholder"
            width="240"
            height="135"
          />
          <PostImage
            src={`${post.titleImage}?w=200&format=avif&q=50`}
            srcSet={`
              ${post.titleImage}?w=100&format=avif&q=50 100w,
              ${post.titleImage}?w=150&format=avif&q=50 150w,
              ${post.titleImage}?w=200&format=avif&q=50 200w,
              ${post.titleImage}?w=240&format=avif&q=50 240w,
              ${post.titleImage}?w=400&format=avif&q=50 400w
            `}
            sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 240px, 400px"
            alt={`Illustration for ${post.title}`}
            width="240"
            height="135"
            fetchpriority="low" // Since LCP is the content section, not the image
            loading="eager"
            decoding="async"
            onError={() => console.error('Title Image Failed:', post.titleImage)}
          />
        </ImageContainer>
      )}

      {post.titleVideo && (
        <VideoContainer>
          <PostVideo
            controls
            preload="metadata"
            poster={`${post.titleVideoPoster || post.titleImage}?w=80&format=webp&q=5`}
            width="240"
            height="135"
            loading="eager"
            decoding="async"
            aria-label={`Video for ${post.title}`}
            fetchpriority="low"
          >
            <source src={`${post.titleVideo}#t=0.1`} type="video/mp4" />
          </PostVideo>
        </VideoContainer>
      )}

      <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
        <time dateTime={post.date}>{post.date}</time> | Author: {post.author || 'Zedemy Team'}
      </p>
      <ContentSection>
        {visibleContent.map((para, idx) => (
          <div key={idx} dangerouslySetInnerHTML={{ __html: para }} />
        ))}
      </ContentSection>
      {remainingContent && (
        <ContentSection>
          {remainingContent.map((para, idx) => (
            <div key={idx} dangerouslySetInnerHTML={{ __html: para }} />
          ))}
        </ContentSection>
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
    if (typeof scheduler !== 'undefined' && scheduler.postTask) {
      scheduler.postTask(() => loadDependencies().then(setDeps), { priority: 'background' });
    } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
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
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [slug]);

  useEffect(() => {
    const fetchData = async (retries = 3) => {
      try {
        await dispatch(fetchPostBySlug(slug));
        startTransition(() => setHasFetched(true));
        if (typeof scheduler !== 'undefined' && scheduler.postTask) {
          scheduler.postTask(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, { priority: 'background' });
        } else {
          setTimeout(() => {
            Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
          }, 3000);
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
    if (typeof scheduler !== 'undefined' && scheduler.postTask) {
      scheduler.postTask(() => {
        const text = [
          post.title || '',
          post.content || '',
          post.summary || '',
          ...(post.subtitles?.map(s => (s.title || '') + (s.bulletPoints?.map(b => b.text || '').join('') || '')) || []),
        ].join(' ');
        const words = text.split(/\s+/).filter(w => w).length;
        setReadTime(Math.ceil(words / 200));
      }, { priority: 'background' });
    } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        const text = [
          post.title || '',
          post.content || '',
          post.summary || '',
          ...(post.subtitles?.map(s => (s.title || '') + (s.bulletPoints?.map(b => b.text || '').join('') || '')) || []),
        ].join(' ');
        const words = text.split(/\s+/).filter(w => w).length;
        setReadTime(Math.ceil(words / 200));
      }, { timeout: 3000 });
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
      }, 3000);
    }
  }, [post]);

  useEffect(() => {
    if (!post) return;
    if (typeof scheduler !== 'undefined' && scheduler.postTask) {
      scheduler.postTask(() => {
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
      }, { priority: 'background' });
    } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
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
      }, { timeout: 3000 });
    }
  }, [post, slug, readTime]);

  useEffect(() => {
    if (post?.titleImage) {
      if (typeof scheduler !== 'undefined' && scheduler.postTask) {
        scheduler.postTask(() => {
          const img = new Image();
          img.src = `${post.titleImage}?w=200&format=avif&q=50`;
          img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
        }, { priority: 'background' });
      } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          const img = new Image();
          img.src = `${post.titleImage}?w=200&format=avif&q=50`;
          img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
        }, { timeout: 1000 });
      }
    }
  }, [post?.titleImage]);

  if (!post && !hasFetched) {
    return (
      <Container>
        <MainContent>
          <SkeletonHeader />
        </MainContent>
        <SidebarWrapper>
          <Placeholder minHeight="800px">Loading sidebar...</Placeholder>
        </SidebarWrapper>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container>
        <LoadingOverlay aria-live="polite">
          {deps?.ClipLoader ? <deps.ClipLoader color="#2c3e50" size={40} /> : <div>Loading...</div>}
        </LoadingOverlay>
      </Container>
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
            href={`${post.titleImage}?w=200&format=avif&q=50`}
            crossOrigin="anonymous"
            fetchpriority="low"
            imagesrcset={`
              ${post.titleImage}?w=100&format=avif&q=50 100w,
              ${post.titleImage}?w=150&format=avif&q=50 150w,
              ${post.titleImage}?w=200&format=avif&q=50 200w,
              ${post.titleImage}?w=240&format=avif&q=50 240w,
              ${post.titleImage}?w=400&format=avif&q=50 400w
            `}
            imagesizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 240px, 400px"
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
      <Container>
        <MainContent role="main" aria-label="Main content">
          <article>
            <PostContentCritical
              post={post}
              calculateReadTimeAndWordCount={calculateReadTimeAndWordCount}
            />
            <Suspense fallback={<Placeholder minHeight="400px">Loading additional content...</Placeholder>}>
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
        </MainContent>
        <SidebarWrapper>
          <Suspense fallback={<Placeholder minHeight="800px">Loading sidebar...</Placeholder>}>
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
        </SidebarWrapper>
      </Container>
    </HelmetProvider>
  );
});

export default PostPage;
