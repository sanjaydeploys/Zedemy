import React, { useState, useEffect, useRef, memo, useMemo, useCallback, Suspense, useDeferredValue } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts, markPostAsCompleted } from '../actions/postActions';
import { useParams, Link } from 'react-router-dom';
import styled from 'styled-components';
import { parseLinks, slugify, truncateText } from './utils';

// Static imports for critical dependencies
import { Helmet, HelmetProvider } from 'react-helmet-async';

// Lazy-loaded dependencies (only non-critical ones)
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

// Lazy-loaded components
const Sidebar = React.lazy(() => import('./Sidebar'));
const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));
const ComparisonTable = React.lazy(() => import('./ComparisonTable'));
const CodeHighlighter = React.lazy(() => import('./CodeHighlighter'));

// Minimal CSS imports
import 'highlight.js/styles/vs.css';

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
  min-height: 2000px;
  @media (min-width: 769px) {
    margin-right: 250px;
    min-width: 0;
  }
  @media (max-width: 768px) {
    padding: 0.75rem;
  }
`;

const SidebarWrapper = styled.aside`
  @media (min-width: 769px) {
    width: 250px;
    min-height: 1200px;
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
  height: 2rem;
  background: #e0e0e0;
  border-radius: 0.375rem;
  margin: 0.75rem 0 1rem;
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
  aspect-ratio: 16 / 9;
  overflow: hidden;
  position: relative;
`;

const PostImage = styled.img`
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 0.375rem;
  aspect-ratio: 16 / 9;
  position: relative;
  z-index: 2;
`;

const LQIPImage = styled.img`
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  border-radius: 0.375rem;
  aspect-ratio: 16 / 9;
  filter: blur(10px);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
`;

const VideoContainer = styled.figure`
  width: 100%;
  max-width: 100%;
  margin: 0.75rem 0;
  aspect-ratio: 16 / 9;
`;

const PostVideo = styled.video`
  width: 100%;
  height: auto;
  max-width: 100%;
  max-height: 60vh;
  border-radius: 0.375rem;
  aspect-ratio: 16 / 9;
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

// Simplified Critical CSS
const criticalCSS = `
  html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; }
  .container { display: flex; min-height: 100vh; }
  main { flex: 1; padding: 1rem; background: #f4f4f9; min-height: 2000px; }
  h1 { font-size: 2rem; color: #111827; font-weight: 800; margin: 0.75rem 0 1rem; line-height: 1.2; }
  figure { width: 100%; max-width: 100%; margin: 0.75rem 0; aspect-ratio: 16 / 9; position: relative; }
  img { width: 100%; height: auto; max-width: 100%; max-height: 60vh; object-fit: contain; border-radius: 0.375rem; aspect-ratio: 16 / 9; }
  @font-face {
    font-family: 'Segoe UI';
    src: local('Segoe UI'), local('BlinkMacSystemFont'), local('-apple-system');
    font-display: swap;
  }
`;

// PostPage Component
const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [deps, setDeps] = useState(null);
  const [structuredData, setStructuredData] = useState([]);

  // Load non-critical dependencies with longer deferral
  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => loadDependencies().then(setDeps), { timeout: 3000 });
    } else {
      setTimeout(() => loadDependencies().then(setDeps), 3000);
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
  const deferredPost = useDeferredValue(post);
  const relatedPosts = useSelector(selectors?.selectRelatedPosts || (state => []));
  const completedPosts = useSelector(selectors?.selectCompletedPosts || (state => []));

  // Fetch data with retry
  useEffect(() => {
    const fetchData = async (retries = 3) => {
      try {
        await dispatch(fetchPostBySlug(slug));
        setTimeout(() => setHasFetched(true), 100); // Debounce state update
        // Defer non-critical fetches
        setTimeout(() => {
          Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
        }, 2000);
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
    if (!deferredPost?.subtitles) return {};
    const slugs = {};
    deferredPost.subtitles.forEach((s, i) => {
      slugs[`subtitle-${i}`] = slugify(s.title);
    });
    if (deferredPost.summary) slugs.summary = 'summary';
    return slugs;
  }, [deferredPost]);

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
    if (!deferredPost) return { readTime: 0, wordCount: 0 };
    const text = [
      deferredPost.title || '',
      deferredPost.content || '',
      deferredPost.summary || '',
    ].join(' ').slice(0, 1000); // Limit text length to reduce computation
    const words = text.split(/\s+/).filter(w => w).length;
    return { readTime: Math.ceil(words / 200), wordCount: words };
  }, [deferredPost]);

  const memoizedParseLinks = useMemo(() => {
    const cache = new Map();
    return (text, category) => {
      const key = `${text}::${category}`;
      if (cache.has(key)) return cache.get(key);
      const result = parseLinks(text, category);
      cache.set(key, result);
      return result;
    };
  }, []);

  const parsedTitle = useMemo(() => memoizedParseLinks(deferredPost?.title || '', deferredPost?.category || ''), [deferredPost?.title, deferredPost?.category, memoizedParseLinks]);
  const parsedContent = useMemo(() => memoizedParseLinks(deferredPost?.content || '', deferredPost?.category || ''), [deferredPost?.content, deferredPost?.category, memoizedParseLinks]);
  const parsedSummary = useMemo(() => memoizedParseLinks(deferredPost?.summary || '', deferredPost?.category || ''), [deferredPost?.summary, deferredPost?.category, memoizedParseLinks]);

  // Structured data generation
  useEffect(() => {
    if (!deferredPost) return;
    setTimeout(() => {
      const pageTitle = `${deferredPost.title} | Zedemy, India`;
      const pageDescription = truncateText(deferredPost.summary || deferredPost.content, 160) || `Learn ${deferredPost.title?.toLowerCase() || ''} with Zedemy's tutorials.`;
      const pageKeywords = deferredPost.keywords
        ? `${deferredPost.keywords}, Zedemy, ${deferredPost.category || ''}, ${deferredPost.title?.toLowerCase() || ''}`
        : `Zedemy, ${deferredPost.category || ''}, ${deferredPost.title?.toLowerCase() || ''}`;
      const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
      const ogImage = deferredPost.titleImage
        ? `${deferredPost.titleImage}?w=1200&format=webp&q=75`
        : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png';
      const schemas = [
        {
          '@context': 'https://schema.org',
          '@type': 'BlogPosting',
          headline: deferredPost.title || '',
          description: pageDescription,
          keywords: pageKeywords.split(', ').filter(Boolean),
          articleSection: deferredPost.category || 'Tech Tutorials',
          author: { '@type': 'Person', name: deferredPost.author || 'Zedemy Team' },
          publisher: {
            '@type': 'Organization',
            name: 'Zedemy',
            logo: { '@type': 'ImageObject', url: ogImage },
          },
          datePublished: deferredPost.date || new Date().toISOString(),
          dateModified: deferredPost.date || new Date().toISOString(),
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
              name: deferredPost.category || 'Blog',
              item: `https://zedemy.vercel.app/category/${deferredPost.category?.toLowerCase() || 'blog'}`,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: deferredPost.title || '',
              item: canonicalUrl,
            },
          ],
        },
      ];
      if (deferredPost.titleVideo) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'VideoObject',
          name: deferredPost.title || '',
          description: pageDescription,
          thumbnailUrl: deferredPost.titleVideoPoster || ogImage,
          contentUrl: deferredPost.titleVideo,
          uploadDate: deferredPost.date || new Date().toISOString(),
          duration: `PT${calculateReadTimeAndWordCount.readTime}M`,
          publisher: {
            '@type': 'Organization',
            name: 'Zedemy',
            logo: { '@type': 'ImageObject', url: ogImage },
          },
        });
      }
      setStructuredData(schemas);
    }, 3000); // Further deferred
  }, [deferredPost, slug, calculateReadTimeAndWordCount]);

  const handleMarkAsCompleted = useCallback(() => {
    if (!deferredPost) return;
    dispatch(markPostAsCompleted(deferredPost.postId));
  }, [dispatch, deferredPost]);

  const scrollToSection = useCallback(
    (id, updateUrl = true) => {
      const section = document.getElementById(id);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        if (isSidebarOpen) setSidebarOpen(false);
        if (updateUrl && subtitleSlugs[id]) {
          window.history.pushState(null, '', `#${subtitleSlugs[id]}`);
        }
      }
    },
    [isSidebarOpen, subtitleSlugs]
  );

  // Subtitle Section Component
  const SubtitleSection = memo(({ subtitle, index, category }) => {
    if (!subtitle) return null;

    return (
      <section id={`subtitle-${index}`} aria-labelledby={`subtitle-${index}-heading`}>
        <SubtitleHeader id={`subtitle-${index}-heading`}>{memoizedParseLinks(subtitle.title || '', category)}</SubtitleHeader>
        {subtitle.image && (
          <ImageContainer>
            <Suspense fallback={<Placeholder minHeight="270px">Loading image...</Placeholder>}>
              <AccessibleZoom caption={subtitle.title || ''}>
                <LQIPImage
                  src={`${subtitle.image}?w=20&format=webp&q=5`}
                  alt="Low quality placeholder"
                  width="480"
                  height="270"
                />
                <PostImage
                  src={`${subtitle.image}?w=120&format=avif&q=20`}
                  srcSet={`
                    ${subtitle.image}?w=120&format=avif&q=20 120w,
                    ${subtitle.image}?w=160&format=avif&q=20 160w,
                    ${subtitle.image}?w=240&format=avif&q=20 240w,
                    ${subtitle.image}?w=320&format=avif&q=20 320w
                  `}
                  sizes="(max-width: 320px) 120px, (max-width: 480px) 160px, (max-width: 768px) 240px, 320px"
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
              poster={`${subtitle.videoPoster || subtitle.image}?w=120&format=webp&q=20`}
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
              {memoizedParseLinks(point.text || '', category)}
              {point.image && (
                <ImageContainer>
                  <Suspense fallback={<Placeholder minHeight="270px">Loading image...</Placeholder>}>
                    <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                      <LQIPImage
                        src={`${point.image}?w=20&format=webp&q=5`}
                        alt="Low quality placeholder"
                        width="480"
                        height="270"
                      />
                      <PostImage
                        src={`${point.image}?w=120&format=avif&q=20`}
                        srcSet={`
                          ${point.image}?w=120&format=avif&q=20 120w,
                          ${point.image}?w=160&format=avif&q=20 160w,
                          ${point.image}?w=240&format=avif&q=20 240w,
                          ${point.image}?w=320&format=avif&q=20 320w
                        `}
                        sizes="(max-width: 320px) 120px, (max-width: 480px) 160px, (max-width: 768px) 240px, 320px"
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
                    poster={`${point.videoPoster || point.image}?w=120&format=webp&q=20`}
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
                <Suspense fallback={<Placeholder minHeight="150px">Loading code...</Placeholder>}>
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
        { rootMargin: '1500px', threshold: 0.1 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref} style={{ minHeight: '450px', transition: 'min-height 0.3s ease' }}>
        {isVisible ? (
          <SubtitleSection subtitle={subtitle} index={index} category={category} />
        ) : (
          <Placeholder minHeight="450px">Loading section...</Placeholder>
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
        { rootMargin: '1500px', threshold: 0.1 }
      );
      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref} style={{ minHeight: '250px', transition: 'min-height 0.3s ease' }}>
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
          <Placeholder minHeight="250px">Loading references...</Placeholder>
        )}
      </div>
    );
  });

  if (!deps) {
    return (
      <Container>
        <MainContent>
          <SkeletonHeader />
        </MainContent>
      </Container>
    );
  }

  const { ClipLoader } = deps;

  if (!post && !hasFetched) {
    return (
      <Container>
        <MainContent>
          <SkeletonHeader />
        </MainContent>
        <SidebarWrapper>
          <Placeholder minHeight="1200px">Loading sidebar...</Placeholder>
        </SidebarWrapper>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container>
        <LoadingOverlay aria-live="polite">
          <ClipLoader color="#2c3e50" size={50} />
        </LoadingOverlay>
      </Container>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{`${deferredPost.title} | Zedemy`}</title>
        <meta name="description" content={truncateText(deferredPost.summary || deferredPost.content, 160)} />
        <meta
          name="keywords"
          content={deferredPost.keywords ? `${deferredPost.keywords}, Zedemy, ${deferredPost.category || ''}` : `Zedemy, ${deferredPost.category || ''}`}
        />
        <meta name="author" content={deferredPost.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preload" href="/highlight.js/styles/vs.css" as="style" fetchpriority="low" />
        <link rel="stylesheet" href="/highlight.js/styles/vs.css" media="print" onLoad="this.media='all'" fetchpriority="low" />
        {deferredPost.titleImage && (
          <>
            <link
              rel="preload"
              as="image"
              href={`${deferredPost.titleImage}?w=20&format=webp&q=5`}
              fetchpriority="high"
            />
            <link
              rel="preload"
              as="image"
              href={`${deferredPost.titleImage}?w=120&format=avif&q=20`}
              fetchpriority="high"
              imagesrcset={`
                ${deferredPost.titleImage}?w=120&format=avif&q=20 120w,
                ${deferredPost.titleImage}?w=160&format=avif&q=20 160w,
                ${deferredPost.titleImage}?w=240&format=avif&q=20 240w,
                ${deferredPost.titleImage}?w=320&format=avif&q=20 320w
              `}
              imagesizes="(max-width: 320px) 120px, (max-width: 480px) 160px, (max-width: 768px) 240px, 320px"
            />
          </>
        )}
        <meta property="og:title" content={`${deferredPost.title} | Zedemy`} />
        <meta property="og:description" content={truncateText(deferredPost.summary || deferredPost.content, 160)} />
        <meta
          property="og:image"
          content={deferredPost.titleImage ? `${deferredPost.titleImage}?w=1200&format=webp&q=75` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <meta property="og:image:alt" content={`${deferredPost.title} tutorial`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="675" />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${deferredPost.title} | Zedemy`} />
        <meta name="twitter:description" content={truncateText(deferredPost.summary || deferredPost.content, 160)} />
        <meta
          name="twitter:image"
          content={deferredPost.titleImage ? `${deferredPost.titleImage}?w=1200&format=webp&q=75` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
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
            </header>

            {deferredPost.titleImage && (
              <ImageContainer>
                <Suspense fallback={<Placeholder minHeight="270px">Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Illustration for ${deferredPost.title}`}>
                    <LQIPImage
                      src={`${deferredPost.titleImage}?w=20&format=webp&q=5`}
                      alt="Low quality placeholder"
                      width="480"
                      height="270"
                    />
                    <PostImage
                      src={`${deferredPost.titleImage}?w=120&format=avif&q=20`}
                      srcSet={`
                        ${deferredPost.titleImage}?w=120&format=avif&q=20 120w,
                        ${deferredPost.titleImage}?w=160&format=avif&q=20 160w,
                        ${deferredPost.titleImage}?w=240&format=avif&q=20 240w,
                        ${deferredPost.titleImage}?w=320&format=avif&q=20 320w
                      `}
                      sizes="(max-width: 320px) 120px, (max-width: 480px) 160px, (max-width: 768px) 240px, 320px"
                      alt={`Illustration for ${deferredPost.title}`}
                      width="480"
                      height="270"
                      fetchpriority="high"
                      loading="eager"
                      decoding="async"
                      onError={() => console.error('Title Image Failed:', deferredPost.titleImage)}
                    />
                  </AccessibleZoom>
                </Suspense>
              </ImageContainer>
            )}

            {deferredPost.titleVideo && (
              <VideoContainer>
                <PostVideo
                  controls
                  preload="metadata"
                  poster={`${deferredPost.titleVideoPoster || deferredPost.titleImage}?w=120&format=webp&q=20`}
                  width="480"
                  height="270"
                  loading="eager"
                  decoding="async"
                  aria-label={`Video for ${deferredPost.title}`}
                  fetchpriority="high"
                >
                  <source src={`${deferredPost.titleVideo}#t=0.1`} type="video/mp4" />
                </PostVideo>
              </VideoContainer>
            )}

            <p style={{ fontSize: '0.875rem' }}>
              <time dateTime={deferredPost.date}>{deferredPost.date}</time> | Author: {deferredPost.author || 'Zedemy Team'}
            </p>
            <section style={{ fontSize: '0.875rem' }}>{parsedContent}</section>

            {(deferredPost.subtitles || []).map((subtitle, i) => (
              <LazySubtitleSection key={i} subtitle={subtitle} index={i} category={deferredPost.category || ''} />
            ))}

            {deferredPost.superTitles?.length > 0 && (
              <Suspense fallback={<Placeholder minHeight="350px">Loading comparison...</Placeholder>}>
                <ComparisonTable superTitles={deferredPost.superTitles} category={deferredPost.category || ''} />
              </Suspense>
            )}

            {deferredPost.summary && (
              <section id="summary" aria-labelledby="summary-heading">
                <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
                <p style={{ fontSize: '0.875rem' }}>{parsedSummary}</p>
              </section>
            )}

            <NavigationLinks aria-label="Page navigation">
              <Link to="/explore" aria-label="Back to blog">Blog</Link>
              {deferredPost.category && (
                <Link to={`/category/${deferredPost.category.toLowerCase()}`} aria-label={`Explore ${deferredPost.category}`}>
                  {deferredPost.category}
                </Link>
              )}
              <Link to="/" aria-label="Home">Home</Link>
            </NavigationLinks>

            <CompleteButton
              onClick={handleMarkAsCompleted}
              disabled={completedPosts.some(p => p.postId === deferredPost.postId)}
              isCompleted={completedPosts.some(p => p.postId === deferredPost.postId)}
              aria-label={completedPosts.some(p => p.postId === deferredPost.postId) ? 'Post completed' : 'Mark as completed'}
            >
              {completedPosts.some(p => p.postId === deferredPost.postId) ? 'Completed' : 'Mark as Completed'}
            </CompleteButton>

            <section aria-labelledby="related-posts-heading" style={{ minHeight: '450px' }}>
              <Suspense fallback={<Placeholder minHeight="450px">Loading related posts...</Placeholder>}>
                <RelatedPosts relatedPosts={relatedPosts} />
              </Suspense>
            </section>

            <LazyReferencesSection post={deferredPost} />
          </article>
        </MainContent>
        <SidebarWrapper>
          <Suspense fallback={<Placeholder minHeight="1200px">Loading sidebar...</Placeholder>}>
            <Sidebar
              post={deferredPost}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              scrollToSection={scrollToSection}
            />
          </Suspense>
        </SidebarWrapper>
      </Container>
    </HelmetProvider>
  );
});

export default PostPage;
