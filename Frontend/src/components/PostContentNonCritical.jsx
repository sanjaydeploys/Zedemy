import React, { useState, useEffect, useRef, memo, useCallback, Suspense, startTransition } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { parseLinks, slugify } from './utils';

const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));
const ComparisonTable = React.lazy(() => import('./ComparisonTable'));
const CodeHighlighter = React.lazy(() => import('./CodeHighlighter'));

const SubtitleHeader = styled.h2`
  font-size: clamp(1.1rem, 2.5vw, 1.25rem);
  color: #011020;
  margin: 1rem 0 0.5rem;
  font-weight: 700;
  border-left: 3px solid #34db58;
  padding-left: 0.4rem;
  @media (min-width: 769px) {
    font-size: clamp(1.25rem, 3vw, 1.5rem);
  }
`;

const CompleteButton = styled.button`
  position: fixed;
  bottom: 0.75rem;
  right: 0.75rem;
  padding: 0.4rem 0.8rem;
  background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#2c3e50')};
  color: #ecf0f1;
  border: none;
  border-radius: 0.25rem;
  cursor: ${({ isCompleted }) => (isCompleted ? 'not-allowed' : 'pointer')};
  font-size: 0.8rem;
  min-width: 40px;
  min-height: 40px;
  &:hover {
    background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#34495e')};
  }
  @media (max-width: 480px) {
    font-size: 0.7rem;
    padding: 0.3rem 0.6rem;
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

const ReferencesSection = styled.section`
  margin-top: 1rem;
  padding: 0.75rem;
  background: #f9f9f9;
  border-radius: 0.25rem;
`;

const ReferenceLink = styled.a`
  display: block;
  color: #0645ad;
  text-decoration: none;
  margin: 0.2rem 0;
  padding: 0.2rem 0;
  font-size: 0.8rem;
  min-height: 40px;
  line-height: 1.4;
  &:hover {
    text-decoration: underline;
  }
  @media (max-width: 480px) {
    font-size: 0.7rem;
  }
`;

const NavigationLinks = styled.nav`
  margin: 1rem 0;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  font-size: 0.7rem;
  & a {
    min-height: 40px;
    display: inline-flex;
    align-items: center;
    padding: 0.4rem;
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
    if (typeof scheduler !== 'undefined' && scheduler.postTask) {
      scheduler.postTask(() => {
        setParsedTitle(parseLinks(subtitle.title || '', category));
        setParsedBulletPoints((subtitle.bulletPoints || []).map(point => ({
          ...point,
          text: parseLinks(point.text || '', category),
        })));
      }, { priority: 'background' });
    } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        setParsedTitle(parseLinks(subtitle.title || '', category));
        setParsedBulletPoints((subtitle.bulletPoints || []).map(point => ({
          ...point,
          text: parseLinks(point.text || '', category),
        })));
      }, { timeout: 3000 });
    } else {
      setTimeout(() => {
        setParsedTitle(parseLinks(subtitle.title || '', category));
        setParsedBulletPoints((subtitle.bulletPoints || []).map(point => ({
          ...point,
          text: parseLinks(point.text || '', category),
        })));
      }, 3000);
    }
  }, [subtitle, category]);

  if (!subtitle) return null;

  return (
    <section id={`subtitle-${index}`} aria-labelledby={`subtitle-${index}-heading`}>
      <SubtitleHeader id={`subtitle-${index}-heading`}>{parsedTitle}</SubtitleHeader>
      {subtitle.image && (
        <ImageContainer>
          <Suspense fallback={<Placeholder minHeight="150px">Loading image...</Placeholder>}>
            <AccessibleZoom caption={subtitle.title || ''}>
              <LQIPImage
                src={`${subtitle.image}?w=20&format=webp&q=1`}
                alt="Low quality placeholder"
                width="240"
                height="135"
              />
              <PostImage
                src={`${subtitle.image}?w=200&format=avif&q=50`}
                srcSet={`
                  ${subtitle.image}?w=100&format=avif&q=50 100w,
                  ${subtitle.image}?w=150&format=avif&q=50 150w,
                  ${subtitle.image}?w=200&format=avif&q=50 200w,
                  ${subtitle.image}?w=240&format=avif&q=50 240w,
                  ${subtitle.image}?w=400&format=avif&q=50 400w
                `}
                sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 240px, 400px"
                alt={subtitle.title || 'Subtitle image'}
                width="240"
                height="135"
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
            width="240"
            height="135"
            loading="lazy"
            decoding="async"
            aria-label={`Video for ${subtitle.title || 'subtitle'}`}
            fetchpriority="low"
          >
            <source src={`${subtitle.video}#t=0.1`} type="video/mp4" />
          </PostVideo>
        </VideoContainer>
      )}
      <ul style={{ paddingLeft: '1rem', fontSize: '0.95rem', lineHeight: '1.5' }}>
        {parsedBulletPoints.map((point, j) => (
          <li key={j} style={{ marginBottom: '0.4rem' }}>
            <span dangerouslySetInnerHTML={{ __html: point.text }} />
            {point.image && (
              <ImageContainer>
                <Suspense fallback={<Placeholder minHeight="150px">Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                    <LQIPImage
                      src={`${point.image}?w=20&format=webp&q=1`}
                      alt="Low quality placeholder"
                      width="240"
                      height="135"
                    />
                    <PostImage
                      src={`${point.image}?w=200&format=avif&q=50`}
                      srcSet={`
                        ${point.image}?w=100&format=avif&q=50 100w,
                        ${point.image}?w=150&format=avif&q=50 150w,
                        ${point.image}?w=200&format=avif&q=50 200w,
                        ${point.image}?w=240&format=avif&q=50 240w,
                        ${point.image}?w=400&format=avif&q=50 400w
                      `}
                      sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 240px, 400px"
                      alt={`Example for ${point.text || 'bullet point'}`}
                      width="240"
                      height="135"
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
                  width="240"
                  height="135"
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
              <Suspense fallback={<Placeholder minHeight="120px">Loading code...</Placeholder>}>
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
      { rootMargin: '500px', threshold: 0.1 } // Reduced rootMargin for better deferral
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: '300px', transition: 'min-height 0.2s ease' }}>
      {isVisible ? (
        <SubtitleSection subtitle={subtitle} index={index} category={category} />
      ) : (
        <Placeholder minHeight="300px">Loading section...</Placeholder>
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
      { rootMargin: '500px', threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ minHeight: '200px', transition: 'min-height 0.2s ease' }}>
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
        <Placeholder minHeight="200px">Loading references...</Placeholder>
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
        }, 100),
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
      if (typeof scheduler !== 'undefined' && scheduler.postTask) {
        scheduler.postTask(() => {
          setParsedSummary(parseLinks(post.summary || '', post.category || ''));
        }, { priority: 'background' });
      } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          setParsedSummary(parseLinks(post.summary || '', post.category || ''));
        }, { timeout: 3000 });
      } else {
        setTimeout(() => {
          setParsedSummary(parseLinks(post.summary || '', post.category || ''));
        }, 3000);
      }
    }, [post]);

    useEffect(() => {
      if (!post) return;
      if (typeof scheduler !== 'undefined' && scheduler.postTask) {
        scheduler.postTask(() => {
          const observer = new IntersectionObserver(debouncedObserve, {
            root: null,
            rootMargin: '0px',
            threshold: [0.1, 0.3, 0.5],
          });
          document.querySelectorAll('[id^="subtitle-"], #summary').forEach(section => observer.observe(section));
          return () => observer.disconnect();
        }, { priority: 'background' });
      } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(() => {
          const observer = new IntersectionObserver(debouncedObserve, {
            root: null,
            rootMargin: '0px',
            threshold: [0.1, 0.3, 0.5],
          });
          document.querySelectorAll('[id^="subtitle-"], #summary').forEach(section => observer.observe(section));
          return () => observer.disconnect();
        }, { timeout: 3000 });
      }
    }, [post, debouncedObserve]);

    const handleMarkAsCompleted = useCallback(() => {
      if (!post) return;
      dispatch(markPostAsCompleted(post.postId));
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
          <Suspense fallback={<Placeholder minHeight="250px">Loading comparison...</Placeholder>}>
            <ComparisonTable superTitles={post.superTitles} category={post.category || ''} />
          </Suspense>
        )}

        {post.summary && (
          <section id="summary" aria-labelledby="summary-heading">
            <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
            <p style={{ fontSize: '0.95rem', lineHeight: '1.5' }} dangerouslySetInnerHTML={{ __html: parsedSummary }} />
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

        <section aria-labelledby="related-posts-heading" style={{ minHeight: '300px' }}>
          <Suspense fallback={<Placeholder minHeight="300px">Loading related posts...</Placeholder>}>
            <RelatedPosts relatedPosts={relatedPosts} />
          </Suspense>
        </section>

        <LazyReferencesSection post={post} />
      </>
    );
  }
);

export default PostContentNonCritical;
