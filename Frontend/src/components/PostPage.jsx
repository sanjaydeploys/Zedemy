import React, { useState, useEffect, useRef, memo, useMemo, useCallback, Suspense, useDeferredValue } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams, Link, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import DOMPurify from 'dompurify';
import { RingLoader } from 'react-spinners';
import { createSelector } from 'reselect';

// Lazy-loaded components
const Highlight = React.lazy(() => import('highlight.js'));
const Sidebar = React.lazy(() => import('./Sidebar'));
const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));

// Minimal CSS imports
import 'highlight.js/styles/vs.css';

// Slugify utility
const slugify = (text) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

// Shared styles
const sharedSectionStyles = `
  margin-top: 1rem;
  padding: 1rem;
  background: #f9f9f9;
  border-radius: 0.375rem;
`;

// Styled components
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: 'Roboto', system-ui, sans-serif;
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
  background: rgba(92, 6, 6, 0.7);
  z-index: 9999;
`;

const SkeletonHeader = styled.div`
  width: 60%;
  height: 2.25rem;
  background: #e0e0e0;
  border-radius: 0.375rem;
  margin: 0.75rem 0 1rem;
`;

const SkeletonText = styled.div`
  width: ${(props) => props.width || '100%'};
  height: 1rem;
  background: #e0e0e0;
  border-radius: 0.25rem;
  margin: 0.5rem 0;
`;

const PostHeader = styled.h1`
  font-size: 2.25rem;
  color: #111827;
  margin: 0.75rem 0 1rem;
  font-weight: 800;
  line-height: 1.2;
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
  @media (max-width: 480px) {
    font-size: 1.25rem;
  }
`;

const SubtitleHeader = styled.h2`
  font-size: 1.25rem;
  color: #011020;
  margin: 1rem 0 0.75rem;
  font-weight: 600;
  border-left: 4px solid #34db58;
  padding-left: 0.5rem;
  @media (max-width: 768px) {
    font-size: 1rem;
  }
  @media (max-width: 480px) {
    font-size: 0.875rem;
  }
`;

const CodeSnippetContainer = styled.div`
  position: relative;
  margin: 1rem 0;
  background: #1e1e1e;
  border-radius: 0.375rem;
  overflow: hidden;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #007bff;
  color: #fff;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.75rem;
  touch-action: manipulation;
  &:hover {
    background: #0056b3;
  }
`;

const CompleteButton = styled.button`
  position: sticky;
  bottom: 1rem;
  align-self: flex-end;
  margin: 1rem 0;
  padding: 0.5rem 1rem;
  background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#2c3e50')};
  color: #ecf0f1;
  border: none;
  border-radius: 0.375rem;
  cursor: ${({ isCompleted }) => (isCompleted ? 'not-allowed' : 'pointer')};
  font-size: 0.875rem;
  touch-action: manipulation;
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
`;

const VideoContainer = styled.figure`
  width: 100%;
  margin: 0.75rem 0;
`;

const Placeholder = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 0.375rem;
  font-size: 0.75rem;
`;

const ComparisonTableContainer = styled.section`
  ${sharedSectionStyles}
  overflow-x: auto;
`;

const ResponsiveContent = styled.div`
  overflow: auto;
`;

const ResponsiveTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  min-width: 500px;
`;

const ResponsiveHeader = styled.th`
  background: #34495e;
  color: #ecf0f1;
  padding: 0.5rem;
  border: 1px solid #34495e;
  font-size: 0.75rem;
`;

const ResponsiveCell = styled.td`
  border: 1px solid #34495e;
  padding: 0.5rem;
  vertical-align: top;
  font-size: 0.75rem;
  white-space: normal;
`;

const ReferencesSection = styled.section`
  ${sharedSectionStyles}
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
  touch-action: manipulation;
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
    touch-action: manipulation;
  }
`;

// Critical CSS
const criticalCSS = `
  html {
    font-family: 'Roboto', system-ui, sans-serif;
    font-size: 16px;
  }
  h1 {
    font-size: 2.25rem;
    color: #111827;
    font-weight: 800;
    margin: 0.75rem 0 1rem;
  }
  main {
    flex: 1;
    padding: 1rem;
    background: #f4f4f9;
  }
  @media (max-width: 768px) {
    h1 {
      font-size: 1.75rem;
    }
    main {
      padding: 0.75rem;
    }
  }
  @media (max-width: 480px) {
    h1 {
      font-size: 1.25rem;
    }
  }
`;

// Utility functions
const parseLinks = (text, category) => {
  if (!text) return [text];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  const elements = [];
  let lastIndex = 0;

  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    elements.push(text.slice(lastIndex, match.index));
    const isInternal = url.startsWith('/');
    elements.push(
      isInternal ? (
        <Link key={`${url}-${match.index}`} to={url} style={{ color: '#007bff' }} aria-label={`Navigate to ${linkText}`}>
          {linkText}
        </Link>
      ) : (
        <a
          key={`${url}-${match.index}`}
          href={url}
          target={url.startsWith('vscode://') ? '_self' : '_blank'}
          rel="noopener"
          style={{ color: '#007bff' }}
          aria-label={`Visit ${linkText}`}
        >
          {linkText}
        </a>
      )
    );
    lastIndex = match.index + fullMatch.length;
  }

  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  return elements.length ? elements : [text];
};

const parseLinksForHtml = (text, category) => {
  if (!text) return '';
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  return text.replace(linkRegex, (match, linkText, url) => {
    const isInternal = url.startsWith('/');
    return isInternal
      ? `<a href="${url}" style="color:#007bff" aria-label="Navigate to ${linkText}">${linkText}</a>`
      : `<a href="${url}" target="_blank" rel="noopener" style="color:#007bff" aria-label="Visit ${linkText}">${linkText}</a>`;
  });
};

const calculateReadTimeAndWordCount = (post) => {
  if (!post) return { readTime: 0, wordCount: 0 };
  const text = [
    post.title || '',
    post.content || '',
    post.summary || '',
    ...(post.subtitles?.map((s) => (s.title || '') + (s.bulletPoints?.map((b) => b.text || '').join('') || '')) || []),
  ].join(' ');
  const words = text.split(/\s+/).filter((w) => w).length;
  return { readTime: Math.ceil(words / 200), wordCount: words };
};

const sanitizeCode = (code) => {
  return DOMPurify.sanitize(code || '', { ALLOWED_TAGS: [] });
};

const truncateText = (text, max) => {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '...';
};

// Memoized selectors
const selectPostReducer = (state) => state.postReducer;
const selectPost = createSelector([selectPostReducer], (postReducer) => postReducer.post);
const selectPosts = createSelector([selectPostReducer], (postReducer) => postReducer.posts || []);
const selectCompletedPosts = createSelector([selectPostReducer], (postReducer) => postReducer.completedPosts || []);
const selectRelatedPosts = createSelector([selectPosts, selectPost], (posts, post) =>
  posts
    .filter((p) => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase())
    .slice(0, 3)
);

// Code Highlighter Component
const CodeHighlighter = memo(({ code, language = 'javascript' }) => {
  const [highlighted, setHighlighted] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) {
      setError(true);
      return;
    }
    import('highlight.js')
      .then((hljs) => {
        try {
          const result = hljs.default.highlight(sanitizeCode(code), { language });
          setHighlighted(result.value);
        } catch {
          setError(true);
        }
      })
      .catch(() => setError(true));
  }, [code, language]);

  if (error || !code) {
    return <pre><code>{code || 'No code available'}</code></pre>;
  }
  return (
    <pre>
      <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
    </pre>
  );
});

// Subtitle Section Component
const SubtitleSection = memo(({ subtitle, index, category, handleImageError }) => {
  if (!subtitle) return null;

  return (
    <section id={`subtitle-${index}`} aria-labelledby={`subtitle-${index}-heading`}>
      <SubtitleHeader id={`subtitle-${index}-heading`}>{parseLinks(subtitle.title || '', category)}</SubtitleHeader>
      {subtitle.image && (
        <ImageContainer>
          <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
            <AccessibleZoom caption={subtitle.title || ''}>
              <img
                src={`${subtitle.image}?w=320&format=webp`}
                srcSet={`${subtitle.image}?w=320&format=webp 320w, ${subtitle.image}?w=640&format=webp 640w, ${subtitle.image}?w=800&format=webp 800w, ${subtitle.image}?w=1200&format=webp 1200w`}
                sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, (max-width: 1024px) 800px, 1200px"
                alt={subtitle.title || 'Subtitle image'}
                loading="lazy"
                decoding="async"
                onError={() => handleImageError(subtitle.image)}
              />
            </AccessibleZoom>
          </Suspense>
        </ImageContainer>
      )}
      {subtitle.video && (
        <VideoContainer>
          <video
            controls
            preload="none"
            style={{ width: '100%', height: 'auto' }}
            loading="lazy"
            decoding="async"
            aria-label={`Video for ${subtitle.title || 'subtitle'}`}
          >
            <source src={subtitle.video} type="video/mp4" />
          </video>
        </VideoContainer>
      )}
      <ul style={{ paddingLeft: '1.25rem', fontSize: '0.875rem' }}>
        {(subtitle.bulletPoints || []).map((point, j) => (
          <li key={j} style={{ marginBottom: '0.5rem' }}>
            {parseLinks(point.text || '', category)}
            {point.image && (
              <ImageContainer>
                <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Example for ${point.text || ''}`}>
                    <img
                      src={`${point.image}?w=320&format=webp`}
                      srcSet={`${point.image}?w=320&format=webp 320w, ${point.image}?w=640&format=webp 640w, ${point.image}?w=800&format=webp 800w, ${point.image}?w=1200&format=webp 1200w`}
                      sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, (max-width: 1024px) 800px, 1200px"
                      alt={`Example for ${point.text || 'bullet point'}`}
                      loading="lazy"
                      decoding="async"
                      onError={() => handleImageError(point.image)}
                    />
                  </AccessibleZoom>
                </Suspense>
              </ImageContainer>
            )}
            {point.video && (
              <VideoContainer>
                <video
                  controls
                  preload="none"
                  style={{ width: '100%', height: 'auto' }}
                  loading="lazy"
                  decoding="async"
                  aria-label={`Video example for ${point.text || 'bullet point'}`}
                >
                  <source src={point.video} type="video/mp4" />
                </video>
              </VideoContainer>
            )}
            {point.codeSnippet && (
              <CodeSnippetContainer>
                <CopyButton
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(point.codeSnippet);
                      alert('Code copied!');
                    } catch {
                      alert('Failed to copy code');
                    }
                  }}
                  aria-label="Copy code"
                >
                  Copy
                </CopyButton>
                <Suspense fallback={<Placeholder>Loading code...</Placeholder>}>
                  <CodeHighlighter code={point.codeSnippet} />
                </Suspense>
              </CodeSnippetContainer>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
});

// PostPage Component
const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const location = useLocation();
  const post = useSelector(selectPost);
  const relatedPosts = useSelector(selectRelatedPosts);
  const completedPosts = useSelector(selectCompletedPosts);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const deferredActiveSection = useDeferredValue(activeSection);
  const subtitlesListRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Reset state and scroll to top on slug change
  useEffect(() => {
    setHasFetched(false);
    setImageErrors({});
    setActiveSection(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  // Fetch data when slug changes or hasFetched is false
  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchPostBySlug(slug));
        await Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
        setHasFetched(true);
      } catch (error) {
        console.error('Failed to load data:', error);
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
      const sectionId = Object.keys(subtitleSlugs).find((id) => subtitleSlugs[id] === hash);
      if (sectionId) {
        setTimeout(() => scrollToSection(sectionId, false), 0);
      }
    }
  }, [subtitleSlugs]);

  const { readTime, wordCount } = useMemo(() => calculateReadTimeAndWordCount(post), [post]);
  const parsedTitle = useMemo(() => parseLinks(post?.title || '', post?.category || ''), [post]);
  const parsedContent = useMemo(() => parseLinks(post?.content || '', post?.category || ''), [post]);
  const parsedSummary = useMemo(() => parseLinks(post?.summary || '', post?.category || ''), [post]);

  useEffect(() => {
    if (!post) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            setActiveSection(sectionId);
            subtitlesListRef.current
              ?.querySelector(`[data-section="${sectionId}"]`)
              ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      },
      { root: null, rootMargin: '-20% 0px', threshold: 0.7 }
    );
    document.querySelectorAll('[id^="subtitle-"], #summary').forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [post]);

  useEffect(() => {
    if (post?.titleImage) {
      const img = new Image();
      img.src = `${post.titleImage}?w=320&format=webp`;
    }
  }, [post?.titleImage]);

  const handleMarkAsCompleted = useCallback(async () => {
    if (!post || completedPosts.some((p) => p.postId === post.postId)) return;
    try {
      const response = await fetch(
        `https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/complete/${post.postId}`,
        { method: 'PUT', headers: { 'x-auth-token': localStorage.getItem('token') || '' } }
      );
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 && data.msg === 'Post already marked as completed') {
          dispatch({
            type: 'FETCH_COMPLETED_POSTS_SUCCESS',
            payload: await (
              await fetch('https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/completed', {
                headers: { 'x-auth-token': localStorage.getItem('token') || '' },
              })
            ).json(),
          });
          return;
        }
        throw new Error(data.msg || 'Failed to mark as completed');
      }
      dispatch({
        type: 'FETCH_COMPLETED_POSTS_SUCCESS',
        payload: await (
          await fetch('https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/completed', {
            headers: { 'x-auth-token': localStorage.getItem('token') || '' },
          })
        ).json(),
      });
    } catch (error) {
      console.error('Error marking post as completed:', error);
    }
  }, [post, dispatch, completedPosts]);

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

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && window.gtag) {
        window.gtag('event', 'section_view', {
          event_category: 'Navigation',
          event_label: hash,
          page_path: window.location.pathname + window.location.hash,
        });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleImageError = useCallback((url) => {
    setImageErrors((prev) => ({ ...prev, [url]: true }));
  }, []);

  const structuredData = useMemo(() => {
    if (!post) return [];
    const pageTitle = `${post.title} | Zedemy, India`;
    const pageDescription =
      truncateText(post.summary || post.content, 160) || `Learn ${post.title?.toLowerCase() || ''} with Zedemy's tutorials.`;
    const pageKeywords = post.keywords
      ? `${post.keywords}, Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`
      : `Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`;
    const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
    const ogImage = post.titleImage || 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png';
    const faqData = (post.subtitles || [])
      .filter((s) => s.isFAQ)
      .map((s) => ({
        '@type': 'Question',
        name: s.title || '',
        acceptedAnswer: { '@type': 'Answer', text: (s.bulletPoints || []).map((p) => p.text || '').join(' ') },
        mainEntityOfPage: { '@type': 'WebPage', '@id': `${canonicalUrl}#${slugify(s.title || '')}` },
      }));

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
        datePublished: post.date || '',
        dateModified: post.date || '',
        image: ogImage,
        url: canonicalUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
        timeRequired: `PT${readTime}M`,
        wordCount,
        inLanguage: 'en',
        isPartOf: { '@type': 'WebSite', name: 'Zedemy', url: 'https://zedemy.vercel.app/' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://zedemy.vercel.app/' },
          { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://zedemy.vercel.app/explore' },
          {
            '@type': 'ListItem',
            position: 3,
            name: post.category || 'Tech Tutorials',
            item: `https://zedemy.vercel.app/category/${post.category?.toLowerCase() || 'blog'}`,
          },
          { '@type': 'ListItem', position: 4, name: post.title || '', item: canonicalUrl },
        ],
      },
      ...(faqData.length > 0 ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqData }] : []),
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Zedemy',
        url: 'https://zedemy.vercel.app/',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://zedemy.vercel.app/explore?search={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
    ];
  }, [post, slug, readTime, wordCount]);

  if (!post && !hasFetched) {
    return (
      <Container>
        <MainContent>
          <SkeletonHeader />
          <SkeletonText width="80%" />
          <SkeletonText width="60%" />
          <SkeletonText width="90%" />
        </MainContent>
      </Container>
    );
  }

  if (!post) {
    return (
      <LoadingOverlay aria-live="polite">
        <RingLoader color="#2c3e50" size={60} />
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
        {post.titleImage && (
          <link rel="preload" as="image" href={`${post.titleImage}?w=320&format=webp`} fetchpriority="high" />
        )}
        <meta property="og:title" content={`${post.title} | Zedemy`} />
        <meta property="og:description" content={truncateText(post.summary || post.content, 160)} />
        <meta
          property="og:image"
          content={post.titleImage || 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <meta property="og:image:alt" content={`${post.title} tutorial`} />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post.title} | Zedemy`} />
        <meta name="twitter:description" content={truncateText(post.summary || post.content, 160)} />
        <meta
          name="twitter:image"
          content={post.titleImage || 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <style>{criticalCSS}</style>
        <link
          rel="preload"
          as="style"
          onload="this.rel='stylesheet'"
        />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <Container>
        <MainContent role="main" aria-label="Main content">
          <article>
            <header>
              <PostHeader>{parsedTitle}</PostHeader>
              <div style={{ marginBottom: '0.5rem', color: '#666', fontSize: '0.75rem' }}>
                Read time: {readTime} min
              </div>
              <NavigationLinks aria-label="Page navigation">
                <Link to="/explore" aria-label="Back to blog">
                  Blog
                </Link>
                {post.category && (
                  <Link to={`/category/${post.category.toLowerCase()}`} aria-label={`Explore ${post.category}`}>
                    {post.category}
                  </Link>
                )}
                <Link to="/" aria-label="Home">
                  Home
                </Link>
              </NavigationLinks>
            </header>

            {post.titleImage && !imageErrors[post.titleImage] && (
              <ImageContainer>
                <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                  <AccessibleZoom caption={`Illustration for ${post.title}`}>
                    <img
                      src={`${post.titleImage}?w=320&format=webp`}
                      srcSet={`${post.titleImage}?w=320&format=webp 320w, ${post.titleImage}?w=640&format=webp 640w, ${post.titleImage}?w=800&format=webp 800w, ${post.titleImage}?w=1200&format=webp 1200w`}
                      sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, (max-width: 1024px) 800px, 1200px"
                      alt={`Illustration for ${post.title}`}
                      fetchpriority="high"
                      loading="eager"
                      decoding="async"
                      onError={() => handleImageError(post.titleImage)}
                    />
                  </AccessibleZoom>
                </Suspense>
              </ImageContainer>
            )}

            {post.titleVideo && (
              <VideoContainer>
                <video
                  controls
                  preload="metadata"
                  style={{ width: '100%', height: 'auto' }}
                  loading="eager"
                  decoding="async"
                  aria-label={`Video for ${post.title}`}
                >
                  <source src={post.titleVideo} type="video/mp4" />
                </video>
              </VideoContainer>
            )}

            <p style={{ fontSize: '0.875rem' }}>
              <time dateTime={post.date}>{post.date}</time> | Author: {post.author || 'Zedemy Team'}
            </p>
            <section style={{ fontSize: '0.875rem' }}>{parsedContent}</section>

            {(post.subtitles || []).map((subtitle, i) => (
              <SubtitleSection
                key={i}
                subtitle={subtitle}
                index={i}
                category={post.category || ''}
                handleImageError={handleImageError}
              />
            ))}

            {(post.superTitles || []).some(
              (st) =>
                st.superTitle?.trim() &&
                st.attributes?.some((attr) =>
                  attr.attribute?.trim() && attr.items?.some((item) => item.title?.trim() || item.bulletPoints?.some((p) => p.trim()))
                )
            ) && (
              <ComparisonTableContainer aria-labelledby="comparison-heading">
                <SubtitleHeader id="comparison-heading">Comparison</SubtitleHeader>
                <ResponsiveContent>
                  <ResponsiveTable>
                    <caption style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                      Comparison of {post.category || 'features'}
                    </caption>
                    <thead>
                      <tr>
                        <ResponsiveHeader scope="col">Attribute</ResponsiveHeader>
                        {(post.superTitles || []).map(
                          (st, i) =>
                            st.superTitle?.trim() && (
                              <ResponsiveHeader
                                key={i}
                                scope="col"
                                dangerouslySetInnerHTML={{ __html: parseLinksForHtml(st.superTitle, post.category || '') }}
                              />
                            )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(post.superTitles[0]?.attributes || []).map(
                        (attr, attrIdx) =>
                          attr.attribute?.trim() &&
                          attr.items?.some((item) => item.title?.trim() || item.bulletPoints?.some((p) => p.trim())) && (
                            <tr key={attrIdx}>
                              <ResponsiveCell
                                scope="row"
                                dangerouslySetInnerHTML={{ __html: parseLinksForHtml(attr.attribute, post.category || '') }}
                              />
                              {(post.superTitles || []).map(
                                (st, stIdx) =>
                                  st.attributes?.[attrIdx]?.items && (
                                    <ResponsiveCell key={stIdx}>
                                      {st.attributes[attrIdx].items.map(
                                        (item, itemIdx) =>
                                          (item.title?.trim() || item.bulletPoints?.some((p) => p.trim())) && (
                                            <div key={itemIdx}>
                                              <strong
                                                dangerouslySetInnerHTML={{
                                                  __html: parseLinksForHtml(item.title || '', post.category || ''),
                                                }}
                                              />
                                              <ul style={{ paddingLeft: '1.25rem' }}>
                                                {(item.bulletPoints || []).map(
                                                  (point, pIdx) =>
                                                    point?.trim() && (
                                                      <li
                                                        key={pIdx}
                                                        dangerouslySetInnerHTML={{
                                                          __html: parseLinksForHtml(point, post.category || ''),
                                                        }}
                                                      />
                                                    )
                                                )}
                                              </ul>
                                            </div>
                                          )
                                      )}
                                    </ResponsiveCell>
                                  )
                              )}
                            </tr>
                          )
                      )}
                    </tbody>
                  </ResponsiveTable>
                </ResponsiveContent>
              </ComparisonTableContainer>
            )}

            {post.summary && (
              <section id="summary" aria-labelledby="summary-heading">
                <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
                <p style={{ fontSize: '0.875rem' }}>{parsedSummary}</p>
              </section>
            )}

            <CompleteButton
              onClick={handleMarkAsCompleted}
              disabled={completedPosts.some((p) => p.postId === post.postId)}
              isCompleted={completedPosts.some((p) => p.postId === post.postId)}
              aria-label={completedPosts.some((p) => p.postId === post.postId) ? 'Post completed' : 'Mark as completed'}
            >
              {completedPosts.some((p) => p.postId === post.postId) ? 'Completed' : 'Mark as Completed'}
            </CompleteButton>

            <section aria-labelledby="related-posts-heading">
              <Suspense fallback={<Placeholder>Loading related posts...</Placeholder>}>
                <RelatedPosts relatedPosts={relatedPosts} />
              </Suspense>
            </section>

            <ReferencesSection aria-labelledby="references-heading">
              <SubtitleHeader id="references-heading">Further Reading</SubtitleHeader>
              {post.references?.length > 0 ? (
                post.references.map((ref, i) => (
                  <ReferenceLink
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noopener"
                    aria-label={`Visit ${ref.title}`}
                  >
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
          </article>
        </MainContent>
        <Suspense fallback={<Placeholder>Loading sidebar...</Placeholder>}>
          <aside>
            <Sidebar
              post={post}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={deferredActiveSection}
              scrollToSection={scrollToSection}
              subtitlesListRef={subtitlesListRef}
            />
          </aside>
        </Suspense>
      </Container>
    </HelmetProvider>
  );
});

export default PostPage;
