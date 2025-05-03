import React, { useState, useEffect, useRef, memo, useMemo, useCallback, Suspense, useDeferredValue } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts, markPostAsCompleted } from '../actions/postActions';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { parseLinks, slugify, truncateText } from './utils';

// Lazy-loaded dependencies
const loadDependencies = async () => {
  const [
    { Helmet, HelmetProvider },
    { ClipLoader },
    { createSelector },
  ] = await Promise.all([
    import('react-helmet-async'),
    import('react-spinners'),
    import('reselect'),
  ]);
  return { Helmet, HelmetProvider, ClipLoader, createSelector };
};

// Lazy-loaded components
const Sidebar = React.lazy(() => import('./Sidebar'));
const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));
const ComparisonTable = React.lazy(() => import('./ComparisonTable'));
const CodeHighlighter = React.lazy(() => import('./CodeHighlighter'));

// Minimal CSS imports
import 'highlight.js/styles/vs.css';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Styled components
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
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
    margin-right: 2px; /* Reserve space for sidebar */
    min-width: 0;
  }
  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
`;

const SkeletonHeader = styled.div`
  width: 60%;
  height: 2rem;
  background: #e0e0e0;
  border-radius: 0.375rem;
  margin: 0.75rem 0 1rem;
`;

const SkeletonText = styled.div`
  width: ${(props) => props.width || '100%'};
  height: 0.875rem;
  background: #e0e0e0;
  border-radius: 0.25rem;
  margin: 0.5rem 0;
`;

const PostHeader = styled.h1`
  font-size: clamp(1.5rem, 4vw, 2rem);
  color: #111827;
  margin: 0.75rem 0 1rem;
  font-weight: 800;
  line-height: 1.2;
`;

const SubtitleHeader = styled.h2`
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  color: #011020;
  margin: 1rem 0 0.75rem;
  font-weight: 700;
  border-left: 4px solid #34db58;
  padding-left: 0.5rem;
`;

const CompleteButton = styled.button`
  position: fixed;
  bottom: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#2c3e50')};
  color: #ecf0f1;
  border: none;
  border-radius: 0.375rem;
  cursor: ${({ isCompleted }) => (isCompleted ? 'not-allowed' : 'pointer')};
  font-size: 0.875rem;
  min-width: 48px;
  min-height: 48px;
  &:hover {
    background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#34495e')};
  }
  @media (max-width: 480px) {
    font-size: 0.75rem;
    padding: 0.5rem 0.75rem;
  }
`;

const ImageContainer = styled.figure`
  width: 100%;
  max-width: 100%;
  margin: 0.75rem 0;
  min-height: 270px;
  overflow: hidden;
`;

const PostImage = styled.img`
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 0.375rem;
`;

const VideoContainer = styled.figure`
  width: 100%;
  max-width: 100%;
  margin: 0.75rem 0;
  min-height: 270px;
`;

const PostVideo = styled.video`
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 60vh;
  border-radius: 0.375rem;
`;

const Placeholder = styled.div`
  width: 100%;
  min-height: ${(props) => props.minHeight || '270px'};
  aspect-ratio: 16 / 9;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.875rem;
`;

const ReferencesSection = styled.section`
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 0.375rem;
`;

const ReferenceLink = styled.a`
  display: block;
  color: #0645ad;
  text-decoration: none;
  margin: 0.25rem 0;
  padding: 0.25rem 0;
  font-size: 0.875rem;
  min-height: 44px;
  line-height: 1.5;
  &:hover {
    text-decoration: underline;
  }
  @media (max-width: 480px) {
    font-size: 0.75rem;
  }
`;

const NavigationLinks = styled.nav`
  margin: 1rem 0;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  & a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem;
  }
`;

// Critical CSS (extracted to file in production)
const criticalCSS = `
  html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; }
  .container { display: flex; min-height: 100vh; }
  main { flex: 1; padding: 1rem; background: #f4f4f9; }
  h1 { font-size: clamp(1.5rem, 4vw, 2rem); color: #111827; font-weight: 800; }
  figure { width: 100%; max-width: 100%; margin: 0.75rem 0; min-height: 270px; }
  img { width: 100%; height: auto; max-width: 100%; max-height: 60vh; object-fit: contain; border-radius: 0.375rem; }
`;

// PostPage Component
const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const deferredActiveSection = useDeferredValue(activeSection);
  const subtitlesListRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [deps, setDeps] = useState(null);

  // Load dependencies
  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => loadDependencies().then(setDeps));
    } else {
      loadDependencies().then(setDeps);
    }
  }, []);

  // Define selectors after dependencies are loaded
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

  // Debounced Intersection Observer
  const debouncedObserve = useMemo(
    () =>
      debounce(entries => {
        let highestSection = null;
        let maxRatio = 0;
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            highestSection = entry.target.id;
            maxRatio = entry.intersectionRatio;
          }
        });
        if (highestSection) {
          setActiveSection(highestSection);
          const sidebarItem = subtitlesListRef.current?.querySelector(`[data-section="${highestSection}"]`);
          if (sidebarItem) {
            sidebarItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      }, 150),
    []
  );

  // Reset state and scroll to top
  useEffect(() => {
    setHasFetched(false);
    setActiveSection(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Fetch data with retry
  useEffect(() => {
    const fetchData = async (retries = 3) => {
      try {
        await dispatch(fetchPostBySlug(slug));
        setHasFetched(true);
        // Defer non-critical fetches
        setTimeout(() => {
          Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
        }, 1000);
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

  const subtitleSlugs = useMemo(() => {
    if (!post?.subtitles) return {};
    const slugs = {};
    post.subtitles.forEach((s, i) => {
      slugs[`subtitle-${i}`] = slugify(s.title);
    });
    if (post.summary) slugs.summary = 'summary';
    return slugs;
  }, [post]);

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const sectionId = Object.keys(subtitleSlugs).find(id => subtitleSlugs[id] === hash);
      if (sectionId) {
        setTimeout(() => scrollToSection(sectionId, false), 0);
      }
    }
  }, [subtitleSlugs]);

  const calculateReadTimeAndWordCount = useMemo(() => {
    if (!post) return { readTime: 0, wordCount: 0 };
    const text = [
      post.title || '',
      post.content || '',
      post.summary || '',
      ...(post.subtitles?.map(s => (s.title || '') + (s.bulletPoints?.map(b => b.text || '').join('') || '')) || []),
    ].join(' ');
    const words = text.split(/\s+/).filter(w => w).length;
    return { readTime: Math.ceil(words / 200), wordCount: words };
  }, [post]);

  const parsedTitle = useMemo(() => parseLinks(post?.title || '', post?.category || ''), [post?.title, post?.category]);
  const parsedContent = useMemo(() => parseLinks(post?.content || '', post?.category || ''), [post?.content, post?.category]);
  const parsedSummary = useMemo(() => parseLinks(post?.summary || '', post?.category || ''), [post?.summary, post?.category]);

  useEffect(() => {
    if (!post) return;
    const observer = new IntersectionObserver(debouncedObserve, {
      root: null,
      rootMargin: '0px',
      threshold: [0.1, 0.3, 0.5],
    });
    document.querySelectorAll('[id^="subtitle-"], #summary').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [post, debouncedObserve]);

  useEffect(() => {
    if (post?.titleImage) {
      if (typeof scheduler !== 'undefined' && scheduler.postTask) {
        scheduler.postTask(
          () => {
            const img = new Image();
            img.src = `${post.titleImage}?w=480&format=avif&q=75`;
            img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
          },
          { priority: 'background' }
        );
      } else {
        requestIdleCallback(
          () => {
            const img = new Image();
            img.src = `${post.titleImage}?w=480&format=avif&q=75`;
            img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
          },
          { timeout: 1000 }
        );
      }
    }
  }, [post?.titleImage]);

  const handleMarkAsCompleted = useCallback(() => {
    if (!post) return;
    dispatch(markPostAsCompleted(post.postId));
  }, [dispatch, post]);

  const scrollToSection = useCallback(
    (id, updateUrl = true) => {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        setActiveSection(id);
        if (isSidebarOpen) setSidebarOpen(false);
        if (updateUrl && subtitleSlugs[id]) {
          window.history.pushState(null, '', `#${subtitleSlugs[id]}`);
        }
      }
    },
    [isSidebarOpen, subtitleSlugs]
  );

  const structuredData = useMemo(() => {
    if (!post) return [];
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
        timeRequired: `PT${calculateReadTimeAndWordCount.readTime}M`,
        wordCount: calculateReadTimeAndWordCount.wordCount,
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
        duration: `PT${calculateReadTimeAndWordCount.readTime}M`,
        publisher: {
          '@type': 'Organization',
          name: 'Zedemy',
          logo: { '@type': 'ImageObject', url: ogImage },
        },
      });
    }
    return schemas;
  }, [post, slug, calculateReadTimeAndWordCount]);

  // Subtitle Section Component
  const SubtitleSection = memo(({ subtitle, index, category }) => {
    if (!subtitle) return null;

    return (
      <section id={`subtitle-${index}`} aria-labelledby={`subtitle-${index}-heading`}>
        <SubtitleHeader id={`subtitle-${index}-heading`}>{parseLinks(subtitle.title || '', category)}</SubtitleHeader>
        {subtitle.image && (
          <ImageContainer>
            <Suspense fallback={<Placeholder minHeight="270px">Loading image...</Placeholder>}>
              <AccessibleZoom caption={subtitle.title || ''}>
                <PostImage
                  src={`${subtitle.image}?w=480&format=avif&q=75`}
                  srcSet={`
                    ${subtitle.image}?w=320&format=avif&q=75 320w,
                    ${subtitle.image}?w=480&format=avif&q=75 480w,
                    ${subtitle.image}?w=768&format=avif&q=75 768w,
                    ${subtitle.image}?w=1024&format=avif&q=75 1024w
                  `}
                  sizes="(max-width: 480px) 320px, (max-width: 768px) 480px, (max-width: 1024px) 768px, 1024px"
                  alt={subtitle.title || 'Subtitle image'}
                  width="480"
                  height="270"
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                  onError={() => console.error('Subtitle Image Failed:', subtitle.image)}
                />
              </AccessibleZoom>
            </Suspense>
          </ImageContainer>
        )}
        {subtitle.video && (
          <VideoContainer>
            <PostVideo
              controls
              preload="none"
              poster={`${subtitle.videoPoster || subtitle.image}?w=480&format=webp&q=75`}
              width="480"
              height="270"
              loading="lazy"
              decoding="async"
              aria-label={`Video for ${subtitle.title || 'subtitle'}`}
              fetchpriority="low"
            >
              <source src={`${subtitle.video}#t=0.1`} type="video/mp4" />
            </PostVideo>
          </VideoContainer>
        )}
        <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
          {(subtitle.bulletPoints || []).map((point, j) => (
            <li key={j} style={{ marginBottom: '0.5rem' }}>
              {parseLinks(point.text || '', category)}
              {point.image && (
                <ImageContainer>
                  <Suspense fallback={<Placeholder minHeight="270px">Loading image...</Placeholder>}>
                    <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                      <PostImage
                        src={`${point.image}?w=480&format=avif&q=75`}
                        srcSet={`
                          ${point.image}?w=320&format=avif&q=75 320w,
                          ${point.image}?w=480&format=avif&q=75 480w,
                          ${point.image}?w=768&format=avif&q=75 768w,
                          ${point.image}?w=1024&format=avif&q=75 1024w
                        `}
                        sizes="(max-width: 480px) 320px, (max-width: 768px) 480px, (max-width: 1024px) 768px, 1024px"
                        alt={`Example for ${point.text || 'bullet point'}`}
                        width="480"
                        height="270"
                        loading="lazy"
                        decoding="async"
                        fetchpriority="low"
                        onError={() => console.error('Point Image Failed:', point.image)}
                      />
                    </AccessibleZoom>
                  </Suspense>
                </ImageContainer>
              )}
              {point.video && (
                <VideoContainer>
                  <PostVideo
                    controls
                    preload="none"
                    poster={`${point.videoPoster || point.image}?w=480&format=webp&q=75`}
                    width="480"
                    height="270"
                    loading="lazy"
                    decoding="async"
                    aria-label={`Video example for ${point.text || 'bullet point'}`}
                    fetchpriority="low"
                    onLoad={() => console.log('Point Video Loaded:', point.video)}
                  >
                    <source src={`${point.video}#t=0.1`} type="video/mp4" />
                  </PostVideo>
                </VideoContainer>
              )}
              {point.codeSnippet && (
                <Suspense fallback={<Placeholder>Loading code...</Placeholder>}>
                  <CodeHighlighter
                    code={point.codeSnippet}
                    language={point.language || 'javascript'}
                    onCopy={async () => {
                      try {
                        await navigator.clipboard.writeText(point.codeSnippet);
                        alert('Code copied!');
                      } catch {
                        alert('Failed to copy code');
                      }
                    }}
                  />
                </Suspense>
              )}
            </li>
          ))}
        </ul>
      </section>
    );
  });

  // Lazy Subtitle Section
  const LazySubtitleSection = memo(({ subtitle, index, category }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px', threshold: 0.1 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref}>
        {isVisible ? (
          <SubtitleSection subtitle={subtitle} index={index} category={category} />
        ) : (
          <Placeholder minHeight="200px">Loading section...</Placeholder>
        )}
      </div>
    );
  });

  // Lazy References Section
  const LazyReferencesSection = memo(({ post }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px', threshold: 0.1 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref}>
        {isVisible ? (
          <ReferencesSection aria-labelledby="references-heading">
            <SubtitleHeader id="references-heading">Further Reading</SubtitleHeader>
            {post.references?.length > 0 ? (
              post.references.map((ref, i) => (
                <ReferenceLink key={i} href={ref.url} target="_blank" rel="noopener" aria-label={`Visit ${ref.title}`}>
                  {ref.title}
                </ReferenceLink>
              ))
            ) : (
              <>
                <ReferenceLink
                  href={`https://www.geeksforgeeks.org/${post.category?.toLowerCase().replace(/\s+/g, '-') || 'tutorials'}-tutorials`}
                  target="_blank"
                  rel="noopener"
                  aria-label={`GeeksforGeeks ${post.category || 'Tutorials'} Tutorials`}
                >
                  GeeksforGeeks: {post.category || 'Tutorials'} Tutorials
                </ReferenceLink>
                <ReferenceLink
                  href={`https://developer.mozilla.org/en-US/docs/Web/${post.category?.replace(/\s+/g, '') || 'Guide'}`}
                  target="_blank"
                  rel="noopener"
                  aria-label={`MDN ${post.category || 'Documentation'} Documentation`}
                >
                  MDN: {post.category || 'Documentation'} Documentation
                </ReferenceLink>
              </>
            )}
          </ReferencesSection>
        ) : (
          <Placeholder minHeight="100px">Loading references...</Placeholder>
        )}
      </div>
    );
  });

  if (!deps) {
    return <LoadingOverlay><div>Loading dependencies...</div></LoadingOverlay>;
  }

  const { Helmet, HelmetProvider, ClipLoader } = deps;

  if (!post && !hasFetched) {
    return (
      <Container>
        <MainContent>
          <SkeletonHeader />
          <SkeletonText width="80%" />
          <SkeletonText width="60%" />
          <SkeletonText width="90%" />
        </MainContent>
        <Placeholder minHeight="300px">Loading sidebar...</Placeholder>
      </Container>
    );
  }

  if (!post) {
    return (
      <LoadingOverlay aria-live="polite">
        <ClipLoader color="#2c3e50" size={50} />
      </LoadingOverlay>
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
        <link rel="preload" href="/highlight.js/styles/vs.css" as="style" fetchpriority="high" />
        <link rel="stylesheet" href="/highlight.js/styles/vs.css" media="print" onLoad="this.media='all'" fetchpriority="low" />
        {post.titleImage && (
          <link
            rel="preload"
            as="image"
            href={`${post.titleImage}?w=480&format=avif&q=75`}
            fetchpriority="high"
            imagesrcset={`
              ${post.titleImage}?w=320&format=avif&q=75 320w,
              ${post.titleImage}?w=480&format=avif&q=75 480w,
              ${post.titleImage}?w=768&format=avif&q=75 768w,
              ${post.titleImage}?w=1024&format=avif&q=75 1024w
            `}
            imagesizes="(max-width: 480px) 320px, (max-width: 768px) 480px, (max-width: 1024px) 768px, 1024px"
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
            <header>
              <PostHeader>{parsedTitle}</PostHeader>
              <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.75rem' }}>
                Read time: {calculateReadTimeAndWordCount.readTime} min
              </div>
              <NavigationLinks aria-label="Page navigation">
                <Link to="/explore" aria-label="Back to blog">Blog</Link>
                {post.category && (
                  <Link to={`/category/${post.category.toLowerCase()}`} aria-label={`Explore ${post.category}`}>
                    {post.category}
                  </Link>
                )}
                <Link to="/" aria-label="Home">Home</Link>
              </NavigationLinks>
            </header>

            {post.titleImage && (
              <ImageContainer>
                <Suspense fallback={<Placeholder minHeight="270px">Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Illustration for ${post.title}`}>
                    <PostImage
                      src={`${post.titleImage}?w=480&format=avif&q=75`}
                      srcSet={`
                        ${post.titleImage}?w=320&format=avif&q=75 320w,
                        ${post.titleImage}?w=480&format=avif&q=75 480w,
                        ${post.titleImage}?w=768&format=avif&q=75 768w,
                        ${post.titleImage}?w=1024&format=avif&q=75 1024w
                      `}
                      sizes="(max-width: 480px) 320px, (max-width: 768px) 480px, (max-width: 1024px) 768px, 1024px"
                      alt={`Illustration for ${post.title}`}
                      width="480"
                      height="270"
                      fetchpriority="high"
                      loading="eager"
                      decoding="async"
                      onError={() => console.error('Title Image Failed:', post.titleImage)}
                    />
                  </AccessibleZoom>
                </Suspense>
              </ImageContainer>
            )}

            {post.titleVideo && (
              <VideoContainer>
                <PostVideo
                  controls
                  preload="metadata"
                  poster={`${post.titleVideoPoster || post.titleImage}?w=480&format=webp&q=75`}
                  width="480"
                  height="270"
                  loading="eager"
                  decoding="async"
                  aria-label={`Video for ${post.title}`}
                  fetchpriority="high"
                >
                  <source src={`${post.titleVideo}#t=0.1`} type="video/mp4" />
                </PostVideo>
              </VideoContainer>
            )}

            <p style={{ fontSize: '0.875rem' }}>
              <time dateTime={post.date}>{post.date}</time> | Author: {post.author || 'Zedemy Team'}
            </p>
            <section style={{ fontSize: '0.875rem' }}>{parsedContent}</section>

            {(post.subtitles || []).map((subtitle, i) => (
              <LazySubtitleSection key={i} subtitle={subtitle} index={i} category={post.category || ''} />
            ))}

            {post.superTitles?.length > 0 && (
              <Suspense fallback={<Placeholder minHeight="200px">Loading comparison...</Placeholder>}>
                <ComparisonTable superTitles={post.superTitles} category={post.category || ''} />
              </Suspense>
            )}

            {post.summary && (
              <section id="summary" aria-labelledby="summary-heading">
                <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
                <p style={{ fontSize: '0.875rem' }}>{parsedSummary}</p>
              </section>
            )}

            <CompleteButton
              onClick={handleMarkAsCompleted}
              disabled={completedPosts.some(p => p.postId === post.postId)}
              isCompleted={completedPosts.some(p => p.postId === post.postId)}
              aria-label={completedPosts.some(p => p.postId === post.postId) ? 'Post completed' : 'Mark as completed'}
            >
              {completedPosts.some(p => p.postId === post.postId) ? 'Completed' : 'Mark as Completed'}
            </CompleteButton>

            <section aria-labelledby="related-posts-heading">
              <Suspense fallback={<Placeholder minHeight="200px">Loading related posts...</Placeholder>}>
                <RelatedPosts relatedPosts={relatedPosts} />
              </Suspense>
            </section>

            <LazyReferencesSection post={post} />
          </article>
        </MainContent>
        <Suspense fallback={<Placeholder minHeight="300px">Loading sidebar...</Placeholder>}>
          <Sidebar
            post={post}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeSection={deferredActiveSection}
            scrollToSection={scrollToSection}
            subtitlesListRef={subtitlesListRef}
          />
        </Suspense>
      </Container>
    </HelmetProvider>
  );
});

export default PostPage;
