import React, { useState, useEffect, useRef, memo, useCallback, Suspense, startTransition } from 'react';
import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { slugify } from './utils';
import { markPostAsCompleted } from '../actions/postActions';

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
  width: 100%;
  max-width: 100%;
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
  font-weight: 500;
  min-width: 48px;
  min-height: 48px;
  transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
  z-index: 1000;
  will-change: transform;
  &:hover:not(:disabled) {
    background: #34495e;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  &:active:not(:disabled) {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  &:disabled {
    background: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  @media (min-width: 768px) {
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    border-radius: 0.5rem;
  }
  @media (max-width: 480px) {
    padding: 0.5rem 0.75rem;
    font-size: 0.75rem;
    min-width: 44px;
    min-height: 44px;
  }
`;

const ImageContainer = styled.figure`
  width: 100%;
  max-width: 280px;
  margin: 3rem 0;
  position: relative;
  aspect-ratio: 16 / 9;
  height: 157.5px;
  contain-intrinsic-size: 280px 157.5px;
  background: #e0e0e0;
  @media (min-width: 769px) {
    max-width: 480px;
    height: 270px;
    contain-intrinsic-size: 480px 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    height: 135

px;
    contain-intrinsic-size: 240px 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    height: 112.5px;
    contain-intrinsic-size: 200px 112.5px;
  }
`;

const ImageLoaded = styled.div`
  background: transparent;
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

const VideoContainer = styled.figure`
  width: 100%;
  max-width: 280px;
  margin: 1rem 0;
  aspect-ratio: 16 / 9;
  height: 157.5px;
  contain-intrinsic-size: 280px 157.5px;
  @media (min-width: 769px) {
    max-width: 480px;
    height: 270px;
    contain-intrinsic-size: 480px 270px;
  }
  @media (max-width: 480px) {
    max-width: 240px;
    height: 135px;
    contain-intrinsic-size: 240px 135px;
  }
  @media (max-width: 320px) {
    max-width: 200px;
    height: 112.5px;
    contain-intrinsic-size: 200px 112.5px;
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
  max-width: ${({ maxWidth }) => maxWidth || '280px'};
  height: ${({ height }) => height || '157.5px'};
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  @media (min-width: 769px) {
    max-width: ${({ maxWidth }) => (maxWidth === '280px' ? '480px' : maxWidth || '480px')};
    height: ${({ height }) => height === '450px' ? '600px' : (height === '157.5px' ? '270px' : height || '270px')};
  }
  @media (max-width: 480px) {
    max-width: ${({ maxWidth }) => (maxWidth === '280px' ? '240px' : maxWidth || '240px')};
    height: ${({ height }) => (height === '157.5px' ? '135px' : height || '135px')};
  }
  @media (max-width: 320px) {
    max-width: ${({ maxWidth }) => (maxWidth === '280px' ? '200px' : maxWidth || '200px')};
    height: ${({ height }) => (height === '157.5px' ? '112.5px' : height || '112.5px')};
  }
`;

const SectionPlaceholder = styled.div`
  width: 100%;
  max-width: 100%;
  min-height: ${({ minHeight }) => minHeight || '400px'};
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.875rem;
`;

const ReferencesPlaceholder = styled.div`
  width: 100%;
  max-width: 100%;
  min-height: 300px;
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
  width: 100%;
  max-width: 100%;
  min-height: 300px;
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
  width: 100%;
  max-width: 100%;
  & a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    padding: 0.5rem;
  }
`;

const RelatedPostsSection = styled.section`
  width: 100%;
  max-width: 100%;
  min-height: 450px;
  @media (min-width: 769px) {
    min-height: 600px;
  }
`;

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const parseInWorker = (text, category) => {
  return new Promise((resolve) => {
    const workerCode = `
      self.onmessage = function(e) {
        const { text, category } = e.data;
        const parseLinks = (text, category) => {
          if (!text) return [text];
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
        self.postMessage(parseLinks(text, category));
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
      resolve([text]);
      worker.terminate();
    };
    worker.postMessage({ text, category });
  });
};

const SubtitleSection = memo(({ subtitle, index, category }) => {
  const [parsedTitle, setParsedTitle] = useState(subtitle.title || '');
  const [parsedBulletPoints, setParsedBulletPoints] = useState(subtitle.bulletPoints || []);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isPointImageLoaded, setIsPointImageLoaded] = useState({});

  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        parseInWorker(subtitle.title || '', category).then(setParsedTitle);
        Promise.all(
          (subtitle.bulletPoints || []).map(point =>
            parseInWorker(point.text || '', category).then(parsedText => ({
              ...point,
              text: parsedText,
            }))
          )
        ).then(setParsedBulletPoints);
      }, { timeout: 6000 });
    } else {
      setTimeout(() => {
        parseInWorker(subtitle.title || '', category).then(setParsedTitle);
        Promise.all(
          (subtitle.bulletPoints || []).map(point =>
            parseInWorker(point.text || '', category).then(parsedText => ({
              ...point,
              text: parsedText,
            }))
          )
        ).then(setParsedBulletPoints);
      }, 6000);
    }
  }, [subtitle, category]);

  if (!subtitle) return null;

  return (
    <section id={`subtitle-${index}`} aria-labelledby={`subtitle-${index

}-heading`} style={{ minHeight: '400px' }}>
      < SubtitleHeader id={`subtitle-${index}-heading`} >
        { Array.isArray(parsedTitle) ? parsedTitle.map((elem, i) => (
          <React.Fragment key={i}>
            {typeof elem === 'string' ? elem : (
              elem.isInternal ? (
                <a href={elem.url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${elem.linkText}`}>
                  {elem.linkText}
                </a>
              ) : (
                <a
                  href={elem.url}
                  target={elem.url.startsWith('vscode://') ? '_self' : '_blank'}
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                  aria-label={`Visit ${elem.linkText}`}
                >
                  {elem.linkText}
                </a>
              )
            )}
          </React.Fragment>
        )) : parsedTitle}
      </SubtitleHeader>
      {subtitle.image && (
        <ImageContainer className={isImageLoaded ? 'image-loaded' : ''}>
          <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
            <AccessibleZoom caption={subtitle.title || ''}>
              <PostImage
                src={`${subtitle.image}?w=100&format=avif&q=1`}
                srcSet={`
                  ${subtitle.image}?w=100&format=avif&q=1 100w,
                  ${subtitle.image}?w=150&format=avif&q=1 150w,
                  ${subtitle.image}?w=200&format=avif&q=1 200w,
                  ${subtitle.image}?w=240&format=avif&q=1 240w,
                  ${subtitle.image}?w=280&format=avif&q=1 280w,
                  ${subtitle.image}?w=480&format=avif&q=1 480w
                `}
                sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                alt={`Illustration for ${subtitle.title || 'section'}`}
                width="280"
                height="157.5"
                loading={index === 0 ? 'eager' : 'lazy'}
                decoding="async"
                fetchpriority={index === 0 ? 'high' : 'low'}
                onLoad={() => setIsImageLoaded(true)}
                onError={() => {
                  console.error('Subtitle Image Failed:', subtitle.image);
                  setIsImageLoaded(true);
                }}
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
            aria-label={`Video for ${subtitle.title || 'section'}`}
            fetchpriority="low"
          >
            <source src={`${subtitle.video}#t=0.1`} type="video/mp4" />
          </PostVideo>
        </VideoContainer>
      )}
      <ul style={{ paddingLeft: '1.25rem', fontSize: '1.1rem', lineHeight: '1.7' }}>
        {parsedBulletPoints.map((point, j) => (
          <li key={j} style={{ marginBottom: '0.5rem' }}>
            <span>
              {Array.isArray(point.text) ? point.text.map((elem, k) => (
                <React.Fragment key={k}>
                  {typeof elem === 'string' ? elem : (
                    elem.isInternal ? (
                      <a href={elem.url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${elem.linkText}`}>
                        {elem.linkText}
                      </a>
                    ) : (
                      <a
                        href={elem.url}
                        target={elem.url.startsWith('vscode://') ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Visit ${elem.linkText}`}
                      >
                        {elem.linkText}
                      </a>
                    )
                  )}
                </React.Fragment>
              )) : point.text}
            </span>
            {point.image && (
              <ImageContainer className={isPointImageLoaded[j] ? 'image-loaded' : ''}>
                <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                    <PostImage
                      src={`${point.image}?w=100&format=avif&q=1`}
                      srcSet={`
                        ${point.image}?w=100&format=avif&q=1 100w,
                        ${point.image}?w=150&format=avif&q=1 150w,
                        ${point.image}?w=200&format=avif&q=1 200w,
                        ${point.image}?w=240&format=avif&q=1 240w,
                        ${point.image}?w=280&format=avif&q=1 280w,
                        ${point.image}?w=480&format=avif&q=1 480w
                      `}
                      sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                      alt={`Example illustration for ${point.text || 'point'}`}
                      width="280"
                      height="157.5"
                      loading="lazy"
                      decoding="async"
                      fetchpriority="low"
                      onLoad={() => setIsPointImageLoaded(prev => ({ ...prev, [j]: true }))}
                      onError={() => {
                        console.error('Point Image Failed:', point.image);
                        setIsPointImageLoaded(prev => ({ ...prev, [j]: true }));
                      }}
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
                  aria-label={`Video example for ${point.text || 'point'}`}
                  fetchpriority="low"
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

  const estimatedHeight = subtitle.bulletPoints?.length > 2 || subtitle.image || subtitle.video ? '600px' : '400px';

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          startTransition(() => setIsVisible(true));
          observer.disconnect();
        }
      },
      { rootMargin: '200px', threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: '100%', minHeight: estimatedHeight }}>
      {isVisible ? (
        <SubtitleSection subtitle={subtitle} index={index} category={category} />
      ) : (
        <SectionPlaceholder minHeight={estimatedHeight}>Loading section...</SectionPlaceholder>
      )}
    </div>
  );
});

const LazyRelatedPostsSection = memo(({ relatedPosts }) => {
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
      { rootMargin: '300px', threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: '100%' }}>
      {isVisible ? (
        <RelatedPostsSection aria-labelledby="related-posts-heading">
          <Suspense fallback={<Placeholder height="450px">Loading related posts...</Placeholder>}>
            <RelatedPosts relatedPosts={relatedPosts} />
          </Suspense>
        </RelatedPostsSection>
      ) : (
        <Placeholder height="450px">Loading related posts...</Placeholder>
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
      { rootMargin: '200px', threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} style={{ width: '100%', maxWidth: '100%', minHeight: '300px' }}>
      {isVisible ? (
        <ReferencesSection aria-labelledby="references-heading">
          <SubtitleHeader id="references-heading">Further Reading</SubtitleHeader>
          {post.references?.length > 0 ? (
            post.references.map((ref, i) => (
              <ReferenceLink key={i} href={ref.url} target="_blank" rel="noopener noreferrer" aria-label={`Visit ${ref.title}`}>
                {ref.title}
              </ReferenceLink>
            ))
          ) : (
            <>
              <ReferenceLink
                href={`https://www.geeksforgeeks.org/${post.category?.toLowerCase().replace(/\s+/g, '-') || 'tutorials'}-tutorials`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`GeeksforGeeks ${post.category || 'Tutorials'} Tutorials`}
              >
                GeeksforGeeks: {post.category || 'Tutorials'} Tutorials
              </ReferenceLink>
              <ReferenceLink
                href={`https://developer.mozilla.org/en-US/docs/Web/${post.category?.replace(/\s+/g, '') || 'Guide'}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`MDN ${post.category || 'Documentation'} Documentation`}
              >
                MDN: {post.category || 'Documentation'} Documentation
              </ReferenceLink>
            </>
          )}
        </ReferencesSection>
      ) : (
        <ReferencesPlaceholder>Loading references...</ReferencesPlaceholder>
      )}
    </div>
  );
});

const PostContentNonCritical = memo(
  ({ post, relatedPosts, completedPosts, dispatch, isSidebarOpen, setSidebarOpen, activeSection, setActiveSection, subtitlesListRef }) => {
    const [parsedSummary, setParsedSummary] = useState(post.summary || '');
    const completedPostsSelector = useSelector(state => state.postReducer.completedPosts || []);
    const isCompleted = completedPostsSelector.some(cp => cp.postId === post.postId);

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
        }, 80),
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
          parseInWorker(post.summary || '', post.category || '').then(setParsedSummary);
        }, { timeout: 6000 });
      } else {
        setTimeout(() => {
          parseInWorker(post.summary || '', post.category || '').then(setParsedSummary);
        }, 6000);
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
        }, { timeout: 6000 });
      }
    }, [post, debouncedObserve]);

    const handleMarkAsCompleted = useCallback(() => {
      if (!isCompleted && post) {
        dispatch(markPostAsCompleted(post.postId));
      }
    }, [dispatch, post, isCompleted]);

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
          <section id="summary" aria-labelledby="summary-heading" style={{ minHeight: '200px' }}>
            <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>
              {Array.isArray(parsedSummary) ? parsedSummary.map((elem, i) => (
                <React.Fragment key={i}>
                  {typeof elem === 'string' ? elem : (
                    elem.isInternal ? (
                      <a href={elem.url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${elem.linkText}`}>
                        {elem.linkText}
                      </a>
                    ) : (
                      <a
                        href={elem.url}
                        target={elem.url.startsWith('vscode://') ? '_self' : '_blank'}
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                        aria-label={`Visit ${elem.linkText}`}
                      >
                        {elem.linkText}
                      </a>
                    )
                  )}
                </React.Fragment>
              )) : parsedSummary}
            </p>
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
          isCompleted={isCompleted}
          onClick={handleMarkAsCompleted}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Post already marked as completed' : 'Mark post as completed'}
        >
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </CompleteButton>

        <LazyRelatedPostsSection relatedPosts={relatedPosts} />

        <LazyReferencesSection post={post} />
      </>
    );
  }
);

export default PostContentNonCritical;
