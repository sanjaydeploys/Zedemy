import React, { useState, useEffect, useRef, memo, useCallback, Suspense, startTransition } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { parseLinks, slugify } from './utils';

const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));
const ComparisonTable = React.lazy(() => import('./ComparisonTable'));
const CodeHighlighter = React.lazy(() => import('./CodeHighlighter'));

const SubtitleHeader = styled.h2`
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  color: #011020;
  margin: 1.5rem 0 0.75rem;
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
  margin: 3rem 0;
  position: relative;
  aspect-ratio: 16 / 9;
  height: 157.5px;
  @media (min-width: 769px) {
    height: 270px;
  }
  @media (max-width: 480px) {
    height: 135px;
  }
  @media (max-width: 320px) {
    height: 112.5px;
  }
`;

const PostImage = styled.img`
  width: 100%;
  max-width: 280px;
  height: 157.5px;
  object-fit: contain;
  border-radius: 0.375rem;
  position: relative;
  z-index: 2;
  @media (min-width: 769px) {
    max-width: 480px;
    height: 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    height: 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    height: 112.5px;
  }
`;

const LQIPImage = styled.img`
  width: 100%;
  max-width: 280px;
  height: 157.5px;
  object-fit: contain;
  border-radius: 0.375rem;
  filter: blur(10px);
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  @media (min-width: 769px) {
    max-width: 480px;
    height: 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    height: 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    height: 112.5px;
  }
`;

const VideoContainer = styled.figure`
  width: 100%;
  max-width: 100%;
  margin: 1rem 0;
  aspect-ratio: 16 / 9;
  height: 157.5px;
  @media (min-width: 769px) {
    height: 270px;
  }
  @media (max-width: 480px) {
    height: 135px;
  }
  @media (max-width: 320px) {
    height: 112.5px;
  }
`;

const PostVideo = styled.video`
  width: 100%;
  max-width: 280px;
  height: 157.5px;
  border-radius: 0.375rem;
  @media (min-width: 769px) {
    max-width: 480px;
    height: 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    height: 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    height: 112.5px;
  }
`;

const Placeholder = styled.div`
  width: 100%;
  height: ${(props) => props.height || '180px'};
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.875rem;
`;

const ReferencesSection = styled.section`
  margin-top: 1.5rem;
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
  margin: 1.5rem 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  & a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem;
  }
`;

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const SubtitleSection = memo(({ subtitle, index, category }) => {
  const [parsedTitle, setParsedTitle] = useState(subtitle.title || '');
  const [parsedBulletPoints, setParsedBulletPoints] = useState(subtitle.bulletPoints || []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        setParsedTitle(parseLinks(subtitle.title || '', category, false));
        setParsedBulletPoints((subtitle.bulletPoints || []).map(point => ({
          ...point,
          text: parseLinks(point.text || '', category, false),
        })));
      }, { timeout: 5000 });
    } else {
      setTimeout(() => {
        setParsedTitle(parseLinks(subtitle.title || '', category, false));
        setParsedBulletPoints((subtitle.bulletPoints || []).map(point => ({
          ...point,
          text: parseLinks(point.text || '', category, false),
        })));
      }, 5000);
    }
  }, [subtitle, category]);

  if (!subtitle) return null;

  return (
    <section id={`subtitle-${index}`} aria-labelledby={`subtitle-${index}-heading`}>
      <SubtitleHeader id={`subtitle-${index}-heading`}>{parsedTitle}</SubtitleHeader>
      {subtitle.image && (
        <ImageContainer>
          <Suspense fallback={<Placeholder height="157.5px">Loading image...</Placeholder>}>
            <AccessibleZoom caption={subtitle.title || ''}>
              <LQIPImage
                src={`${subtitle.image}?w=20&format=webp&q=1`}
                alt="Low quality placeholder"
                width="280"
                height="157.5"
                fetchpriority="low"
                decoding="async"
              />
              <PostImage
                src={`${subtitle.image}?w=200&format=avif&q=40`}
                srcSet={`
                  ${subtitle.image}?w=100&format=avif&q=40 100w,
                  ${subtitle.image}?w=150&format=avif&q=40 150w,
                  ${subtitle.image}?w=200&format=avif&q=40 200w,
                  ${subtitle.image}?w=280&format=avif&q=40 280w,
                  ${subtitle.image}?w=480&format=avif&q=40 480w
                `}
                sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                alt={subtitle.title || 'Subtitle image'}
                width="280"
                height="157.5"
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
            poster={`${subtitle.videoPoster || subtitle.image}?w=80&format=webp&q=5`}
            width="280"
            height="157.5"
            loading="lazy"
            decoding="async"
            aria-label={`Video for ${subtitle.title || 'subtitle'}`}
            fetchpriority="low"
          >
            <source src={`${subtitle.video}#t=0.1`} type="video/mp4" />
          </PostVideo>
        </VideoContainer>
      )}
      <ul style={{ paddingLeft: '1.25rem', fontSize: '1.1rem', lineHeight: '1.7' }}>
        {parsedBulletPoints.map((point, j) => (
          <li key={j} style={{ marginBottom: '0.5rem' }}>
            <span>{point.text}</span>
            {point.image && (
              <ImageContainer>
                <Suspense fallback={<Placeholder height="157.5px">Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                    <LQIPImage
                      src={`${point.image}?w=20&format=webp&q=1`}
                      alt="Low quality placeholder"
                      width="280"
                      height="157.5"
                      fetchpriority="low"
                      decoding="async"
                    />
                    <PostImage
                      src={`${point.image}?w=200&format=avif&q=40`}
                      srcSet={`
                        ${point.image}?w=100&format=avif&q=40 100w,
                        ${point.image}?w=150&format=avif&q=40 150w,
                        ${point.image}?w=200&format=avif&q=40 200w,
                        ${point.image}?w=280&format=avif&q=40 280w,
                        ${point.image}?w=480&format=avif&q=40 480w
                      `}
                      sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                      alt={`Example for ${point.text || 'bullet point'}`}
                      width="280"
                      height="157.5"
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
                  poster={`${point.videoPoster || point.image}?w=80&format=webp&q=5`}
                  width="280"
                  height="157.5"
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
              <Suspense fallback={<Placeholder height="150px">Loading code...</Placeholder>}>
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

const LazySubtitleSection = memo(({ subtitle, index, category }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => setIsVisible(true));
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
        <Placeholder height="450px">Loading section...</Placeholder>
      )}
    </div>
  );
});

const LazyReferencesSection = memo(({ post }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => setIsVisible(true));
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
        <Placeholder height="250px">Loading references...</Placeholder>
      )}
    </div>
  );
});

const PostContentNonCritical = memo(
  ({ post, relatedPosts, completedPosts, dispatch, isSidebarOpen, setSidebarOpen, activeSection, setActiveSection, subtitlesListRef }) => {
    const [parsedSummary, setParsedSummary] = useState(post.summary || '');

    const debouncedObserve = React.useMemo(
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
            startTransition(() => {
              setActiveSection(highestSection);
              const sidebarItem = subtitlesListRef.current?.querySelector(`[data-section="${highestSection}"]`);
              if (sidebarItem) {
                sidebarItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }
            });
          }
        }, 150),
      [setActiveSection, subtitlesListRef]
    );

    const subtitleSlugs = React.useMemo(() => {
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

    useEffect(() => {
      if (!post?.summary) return;
      if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          setParsedSummary(parseLinks(post.summary || '', post.category || '', false));
        }, { timeout: 5000 });
      } else {
        setTimeout(() => {
          setParsedSummary(parseLinks(post.summary || '', post.category || '', false));
        }, 5000);
      }
    }, [post]);

    useEffect(() => {
      if (!post) return;
      if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          const observer = new IntersectionObserver(debouncedObserve, {
            root: null,
            rootMargin: '0px',
            threshold: [0.1, 0.3, 0.5],
          });
          document.querySelectorAll('[id^="subtitle-"], #summary').forEach(section => observer.observe(section));
          return () => observer.disconnect();
        }, { timeout: 5000 });
      }
    }, [post, debouncedObserve]);

    const handleMarkAsCompleted = useCallback(() => {
      if (!post) return;
      dispatch({ type: 'MARK_POST_AS_COMPLETED', payload: post.postId });
    }, [dispatch, post]);

    const scrollToSection = useCallback(
      (id, updateUrl = true) => {
        const section = document.getElementById(id);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          startTransition(() => setActiveSection(id));
          if (isSidebarOpen) startTransition(() => setSidebarOpen(false));
          if (updateUrl && subtitleSlugs[id]) {
            window.history.pushState(null, '', `#${subtitleSlugs[id]}`);
          }
        }
      },
      [isSidebarOpen, setSidebarOpen, setActiveSection, subtitleSlugs]
    );

    return (
      <>
        {(post.subtitles || []).map((subtitle, i) => (
          <LazySubtitleSection key={i} subtitle={subtitle} index={i} category={post.category || ''} />
        ))}

        {post.superTitles?.length > 0 && (
          <Suspense fallback={<Placeholder height="350px">Loading comparison...</Placeholder>}>
            <ComparisonTable superTitles={post.superTitles} category={post.category || ''} />
          </Suspense>
        )}

        {post.summary && (
          <section id="summary" aria-labelledby="summary-heading">
            <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>{parsedSummary}</p>
          </section>
        )}

        <NavigationLinks aria-label="Page navigation">
          <Link to="/explore" aria-label="Back to blog">Blog</Link>
          {post.category && (
            <Link to={`/category/${post.category.toLowerCase()}`} aria-label={`Explore ${post.category}`}>
              {post.category}
            </Link>
          )}
          <Link to="/" aria-label="Home">Home</Link>
        </NavigationLinks>

        <CompleteButton
          onClick={handleMarkAsCompleted}
          disabled={completedPosts.some(p => p.postId === post.postId)}
          isCompleted={completedPosts.some(p => p.postId === post.postId)}
          aria-label={completedPosts.some(p => p.postId === post.postId) ? 'Post completed' : 'Mark as completed'}
        >
          {completedPosts.some(p => p.postId === post.postId) ? 'Completed' : 'Mark as Completed'}
        </CompleteButton>

        <section aria-labelledby="related-posts-heading" style={{ minHeight: '450px' }}>
          <Suspense fallback={<Placeholder height="450px">Loading related posts...</Placeholder>}>
            <RelatedPosts relatedPosts={relatedPosts} />
          </Suspense>
        </section>

        <LazyReferencesSection post={post} />
      </>
    );
  }
);

export default PostContentNonCritical;
