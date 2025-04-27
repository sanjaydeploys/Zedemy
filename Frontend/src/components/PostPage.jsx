import React, { useState, useEffect, useRef, memo, useMemo, useCallback, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import DOMPurify from 'dompurify';
import { RingLoader } from 'react-spinners';

// Lazy-loaded components
const Toast = React.lazy(() => import('react-toastify').then(module => ({
  default: module.ToastContainer,
  toast: module.toast,
})));
const SyntaxHighlighter = React.lazy(() => import('react-syntax-highlighter').then(module => ({ default: module.Prism })));
const Zoom = React.lazy(() => import('react-medium-image-zoom'));
const Sidebar = React.lazy(() => import('./Sidebar'));
const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));

// Minimal CSS imports
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-medium-image-zoom/dist/styles.css';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Slugify utility
const slugify = text => text?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || '';

// Shared styles
const sharedSectionStyles = `
  margin-top: 1.5rem;
  padding: 1.5rem;
  background: #f9f9f9;
  border-radius: 0.375rem;
`;

// Styled components
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: 'Roboto', system-ui, sans-serif;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1.5rem;
  background: #f4f4f9;
  contain: paint;
  @media (max-width: 768px) { padding: 1rem; }
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

const PostHeader = styled.h1`
  font-size: 2.5rem;
  color: #111827;
  margin: 1rem 0 1.5rem;
  font-weight: 800;
  line-height: 1.2;
  @media (max-width: 768px) { font-size: 2rem; }
  @media (max-width: 480px) { font-size: 1.5rem; }
`;

const SubtitleHeader = styled.h2`
  font-size: 1.5rem;
  color: #011020;
  margin: 1.25rem 0 1rem;
  font-weight: 600;
  border-left: 4px solid #34db58;
  padding-left: 0.75rem;
  @media (max-width: 768px) { font-size: 1.25rem; }
  @media (max-width: 480px) { font-size: 1rem; }
`;

const CodeSnippetContainer = styled.div`
  position: relative;
  margin: 1.5rem 0;
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
  font-size: 0.875rem;
  &:hover { background: #0056b3; }
`;

const CompleteButton = styled.button`
  position: sticky;
  bottom: 1rem;
  align-self: flex-end;
  margin: 1rem;
  padding: 0.75rem 1.5rem;
  background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#2c3e50')};
  color: #ecf0f1;
  border: none;
  border-radius: 0.375rem;
  cursor: ${({ isCompleted }) => (isCompleted ? 'not-allowed' : 'pointer')};
  font-size: 1rem;
  &:hover { background: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#34495e')}; }
  @media (max-width: 480px) { font-size: 0.875rem; padding: 0.5rem 1rem; }
`;

const ImageContainer = styled.figure`
  width: 100%;
  margin: 1.5rem 0;
  aspect-ratio: 16 / 9;
`;

const VideoContainer = styled.figure`
  width: 100%;
  margin: 1.5rem 0;
  aspect-ratio: 16 / 9;
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
  font-size: 0.875rem;
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
  min-width: 600px;
`;

const ResponsiveHeader = styled.th`
  background: #34495e;
  color: #ecf0f1;
  padding: 0.75rem;
  border: 1px solid #34495e;
  font-size: 0.875rem;
`;

const ResponsiveCell = styled.td`
  border: 1px solid #34495e;
  padding: 0.75rem;
  vertical-align: top;
  font-size: 0.875rem;
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
  &:hover { text-decoration: underline; }
  @media (max-width: 480px) { font-size: 0.875rem; }
`;

const NavigationLinks = styled.nav`
  margin: 1.5rem 0;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.875rem;
`;

// Critical CSS
const criticalCSS = `
html{font-family:'Roboto',system-ui,sans-serif;font-size:16px}
h1{font-size:2.5rem;color:#111827;font-weight:800;margin:1rem 0 1.5rem}
h2{font-size:1.5rem;color:#011020;font-weight:600;margin:1.25rem 0 1rem}
main{flex:1;padding:1.5rem;background:#f4f4f9}
figure{width:100%;margin:1.5rem 0;aspect-ratio:16/9}
@media (max-width:768px){h1{font-size:2rem}h2{font-size:1.25rem}main{padding:1rem}}
@media (max-width:480px){h1{font-size:1.5rem}h2{font-size:1rem}}
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
        <Link key={match.index} to={url} style={{ color: '#007bff' }} aria-label={`Navigate to ${linkText}`}>
          {linkText}
        </Link>
      ) : (
        <a
          key={match.index}
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
  if (lastIndex < text.length) elements.push(text.slice(lastIndex));
  return elements.length ? elements : [text];
};

const parseLinksForHtml = (text, category) => {
  if (!text) return text;
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  return text.replace(linkRegex, (match, linkText, url) => {
    const isInternal = url.startsWith('/');
    return isInternal
      ? `<a href="${url}" style="color:#007bff" aria-label="Navigate to ${linkText}">${linkText}</a>`
      : `<a href="${url}" target="_blank" rel="noopener" style="color:#007bff" aria-label="Visit ${linkText}">${linkText}</a>`;
  });
};

const calculateReadTimeAndWordCount = post => {
  if (!post) return { readTime: 0, wordCount: 0 };
  const text = [
    post.title || '',
    post.content || '',
    post.summary || '',
    ...post.subtitles?.map(s => (s.title || '') + s.bulletPoints?.map(b => b.text || '').join('') || '')
  ].join('');
  const words = text.split(/\s+/).filter(w => w).length;
  return { readTime: Math.ceil(words / 200), wordCount: words };
};

const sanitizeCode = code => DOMPurify.sanitize(code, { ALLOWED_TAGS: [] });

const truncateText = (text, max) => {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '...';
};

const getRelatedPosts = (posts, currentPostId, category) => {
  return posts
    .filter(p => p.postId !== currentPostId && p.category?.toLowerCase() === category?.toLowerCase())
    .slice(0, 3);
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Error Boundary
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  if (hasError) return <div>Something went wrong. Please try again.</div>;
  return <React.Fragment unstable_onError={() => setHasError(true)}>{children}</React.Fragment>;
};

// PostPage Component
const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const post = useSelector(state => state.postReducer.post);
  const posts = useSelector(state => state.postReducer.posts || []);
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const subtitlesListRef = useRef(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    import('react-toastify').then(module => setToast(() => module.toast));
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchPosts()),
          dispatch(fetchPostBySlug(slug)),
          dispatch(fetchCompletedPosts()),
        ]);
      } catch (error) {
        toast?.error('Failed to load data');
      }
    };
    fetchData();
  }, [dispatch, slug, toast]);

  const subtitleSlugs = useMemo(() => {
    if (!post?.subtitles) return {};
    const slugs = {};
    post.subtitles.forEach((s, i) => { slugs[`subtitle-${i}`] = slugify(s.title); });
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

  const filteredPosts = useMemo(
    () => posts.filter(p => p.category?.toLowerCase() === post?.category?.toLowerCase()),
    [posts, post?.category]
  );
  const relatedPosts = useMemo(
    () => getRelatedPosts(filteredPosts, post?.postId, post?.category),
    [filteredPosts, post?.postId, post?.category]
  );
  const { readTime, wordCount } = useMemo(() => calculateReadTimeAndWordCount(post), [post]);
  const parsedTitle = useMemo(() => parseLinks(post?.title, post?.category), [post?.title, post?.category]);
  const parsedContent = useMemo(() => parseLinks(post?.content, post?.category), [post?.content, post?.category]);
  const parsedSummary = useMemo(() => parseLinks(post?.summary, post?.category), [post?.summary, post?.category]);

  useEffect(() => {
    if (!post) return;
    const observer = new IntersectionObserver(
      debounce(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            setActiveSection(sectionId);
            subtitlesListRef.current?.querySelector(`[data-section="${sectionId}"]`)?.scrollIntoView({
              behavior: 'smooth',
              block: 'nearest'
            });
          }
        });
      }, 200),
      { root: null, rootMargin: '-20% 0px', threshold: 0.6 }
    );
    document.querySelectorAll('[id^="subtitle-"], #summary').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [post]);

  useEffect(() => {
    if (post?.titleImage) {
      const img = new Image();
      img.src = `${post.titleImage}?w=800&format=webp`;
    }
  }, [post?.titleImage]);

  const handleMarkAsCompleted = useCallback(async () => {
    if (!post || completedPosts.some(p => p.postId === post.postId)) {
      toast?.info('Post already completed');
      return;
    }
    try {
      const response = await fetch(
        `https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/complete/${post.postId}`,
        { method: 'PUT', headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 && data.msg === 'Post already marked as completed') {
          toast?.info('Post already completed');
          dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: await (await fetch(
            'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/completed',
            { headers: { 'x-auth-token': localStorage.getItem('token') } }
          )).json() });
          return;
        }
        throw new Error(data.msg || 'Failed to mark as completed');
      }
      toast?.success('Post marked as completed!');
      if (data.certificateUrl) {
        toast?.success(`Certificate issued: ${data.certificateUrl}`, {
          autoClose: 5000,
          onClick: () => window.open(data.certificateUrl, '_blank')
        });
      }
      dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: await (await fetch(
        'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/completed',
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      )).json() });
    } catch (error) {
      toast?.error(`Error: ${error.message}`);
    }
  }, [post, dispatch, toast, completedPosts]);

  const scrollToSection = useCallback((id, updateUrl = true) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      if (isSidebarOpen) setSidebarOpen(false);
      if (updateUrl && subtitleSlugs[id]) {
        window.history.pushState(null, '', `#${subtitleSlugs[id]}`);
      }
    }
  }, [isSidebarOpen, subtitleSlugs]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash && window.gtag) {
        window.gtag('event', 'section_view', {
          event_category: 'Navigation',
          event_label: hash,
          page_path: window.location.pathname + window.location.hash
        });
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleCopyCode = useCallback(() => {
    toast?.success('Code copied!', { position: 'top-right', autoClose: 1500 });
  }, [toast]);

  const handleImageError = useCallback(url => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  }, []);

  if (!post) {
    return (
      <LoadingOverlay aria-live="polite">
        <RingLoader color="#2c3e50" size={80} />
      </LoadingOverlay>
    );
  }

  const pageTitle = `${post.title} | LearnX, India`;
  const pageDescription = truncateText(post.summary || post.content, 160) || `Learn ${post.title.toLowerCase()} with LearnX's tutorials.`;
  const pageKeywords = post.keywords
    ? `${post.keywords}, learnx, ${post.category}, ${post.title.toLowerCase()}`
    : `learnx, ${post.category}, ${post.title.toLowerCase()}`;
  const canonicalUrl = `https://learnx24.vercel.app/post/${slug}`;
  const ogImage = post.titleImage || 'https://d2rq30ca0zyvzp.cloudfront.net/images/default.webp';

  const faqData = post.subtitles
    .filter(s => s.isFAQ)
    .map(s => ({
      '@type': 'Question',
      name: s.title,
      acceptedAnswer: { '@type': 'Answer', text: s.bulletPoints.map(p => p.text).join(' ') },
      mainEntityOfPage: { '@type': 'WebPage', '@id': `${canonicalUrl}#${slugify(s.title)}` }
    }));

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: pageDescription,
      keywords: pageKeywords.split(', '),
      articleSection: post.category || 'Tech Tutorials',
      author: { '@type': 'Person', name: post.author || 'LearnX Team' },
      publisher: {
        '@type': 'Organization',
        name: 'LearnX',
        logo: { '@type': 'ImageObject', url: ogImage }
      },
      datePublished: post.date,
      dateModified: post.date,
      image: ogImage,
      url: canonicalUrl,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonicalUrl },
      timeRequired: `PT${readTime}M`,
      wordCount,
      inLanguage: 'en',
      isPartOf: { '@type': 'WebSite', name: 'LearnX', url: 'https://learnx24.vercel.app' }
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://learnx24.vercel.app/' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://learnx24.vercel.app/explore' },
        { '@type': 'ListItem', position: 3, name: post.category || 'Tech Tutorials', item: `https://learnx24.vercel.app/category/${post.category?.toLowerCase() || 'blog'}` },
        { '@type': 'ListItem', position: 4, name: post.title, item: canonicalUrl }
      ]
    },
    ...(faqData.length > 0 ? [{ '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqData }] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'LearnX',
      url: 'https://learnx24.vercel.app',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://learnx24.vercel.app/explore?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    }
  ];

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="keywords" content={pageKeywords} />
        <meta name="author" content={post.author || 'LearnX Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        {post.titleImage && (
          <link rel="preload" as="image" href={`${post.titleImage}?w=800&format=webp`} fetchpriority="high" />
        )}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:image:alt" content={`${post.title} tutorial`} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="LearnX" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={ogImage} />
        <style>{criticalCSS}</style>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600&display=swap" as="style" onload="this.rel='stylesheet'" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <Container>
        <ErrorBoundary>
          <MainContent role="main" aria-label="Main content">
            <Suspense fallback={null}>
              <Toast />
            </Suspense>
            <article>
              <header>
                <PostHeader>{parsedTitle}</PostHeader>
                <div style={{ marginBottom: '0.75rem', color: '#666', fontSize: '0.875rem' }}>
                  Read time: {readTime} min
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
                  <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                    <AccessibleZoom>
                      <img
                        src={`${post.titleImage}?w=800&format=webp`}
                        srcSet={`
                          ${post.titleImage}?w=320&format=webp 320w,
                          ${post.titleImage}?w=640&format=webp 640w,
                          ${post.titleImage}?w=800&format=webp 800w,
                          ${post.titleImage}?w=1200&format=webp 1200w
                        `}
                        sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, (max-width: 1024px) 800px, 1200px"
                        alt={`Illustration for ${post.title}`}
                        style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9' }}
                        fetchpriority="high"
                        decoding="async"
                        onError={() => handleImageError(post.titleImage)}
                      />
                    </AccessibleZoom>
                  </Suspense>
                  <figcaption style={{ fontSize: '0.875rem', color: '#666' }}>
                    Image for {post.title}
                  </figcaption>
                </ImageContainer>
              )}

              {post.titleVideo && (
                <VideoContainer>
                  <video
                    controls
                    preload="metadata"
                    style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9' }}
                    fetchpriority="high"
                    decoding="async"
                    aria-label={`Video for ${post.title}`}
                  >
                    <source src={post.titleVideo} type="video/mp4" />
                  </video>
                  <figcaption style={{ fontSize: '0.875rem', color: '#666' }}>
                    Video for {post.title}
                  </figcaption>
                </VideoContainer>
              )}

              <p style={{ fontSize: '0.875rem' }}>
                <time dateTime={post.date}>{post.date}</time> | Author: {post.author}
              </p>
              <section style={{ fontSize: '1rem' }}>{parsedContent}</section>

              {post.subtitles.map((subtitle, i) => (
                <section key={i} id={`subtitle-${i}`} aria-labelledby={`subtitle-${i}-heading`}>
                  <SubtitleHeader id={`subtitle-${i}-heading`}>
                    {parseLinks(subtitle.title, post.category)}
                  </SubtitleHeader>
                  {subtitle.image && (
                    <ImageContainer>
                      <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                        <AccessibleZoom>
                          <img
                            src={`${subtitle.image}?w=800&format=webp`}
                            srcSet={`
                              ${subtitle.image}?w=320&format=webp 320w,
                              ${subtitle.image}?w=640&format=webp 640w,
                              ${subtitle.image}?w=800&format=webp 800w,
                              ${subtitle.image}?w=1200&format=webp 1200w
                            `}
                            sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, (max-width: 1024px) 800px, 1200px"
                            alt={subtitle.title}
                            style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9' }}
                            loading="lazy"
                            decoding="async"
                            onError={() => handleImageError(subtitle.image)}
                          />
                        </AccessibleZoom>
                      </Suspense>
                      <figcaption style={{ fontSize: '0.875rem', color: '#666' }}>
                        {subtitle.title}
                      </figcaption>
                    </ImageContainer>
                  )}
                  {subtitle.video && (
                    <VideoContainer>
                      <video
                        controls
                        preload="metadata"
                        style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9' }}
                        loading="lazy"
                        decoding="async"
                        aria-label={`Video for ${subtitle.title}`}
                      >
                        <source src={subtitle.video} type="video/mp4" />
                      </video>
                      <figcaption style={{ fontSize: '0.875rem', color: '#666' }}>
                        Video for {subtitle.title}
                      </figcaption>
                    </VideoContainer>
                  )}
                  <ul style={{ paddingLeft: '1.5rem', fontSize: '1rem' }}>
                    {subtitle.bulletPoints.map((point, j) => (
                      <li key={j} style={{ marginBottom: '0.75rem' }}>
                        {parseLinks(point.text, post.category)}
                        {point.image && (
                          <ImageContainer>
                            <Suspense fallback={<Placeholder>Loading image...</Placeholder>}>
                              <AccessibleZoom>
                                <img
                                  src={`${point.image}?w=800&format=webp`}
                                  srcSet={`
                                    ${point.image}?w=320&format=webp 320w,
                                    ${point.image}?w=640&format=webp 640w,
                                    ${point.image}?w=800&format=webp 800w,
                                    ${point.image}?w=1200&format=webp 1200w
                                  `}
                                  sizes="(max-width: 480px) 320px, (max-width: 768px) 640px, (max-width: 1024px) 800px, 1200px"
                                  alt={`Example for ${point.text}`}
                                  style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9' }}
                                  loading="lazy"
                                  decoding="async"
                                  onError={() => handleImageError(point.image)}
                                />
                              </AccessibleZoom>
                              <figcaption style={{ fontSize: '0.875rem', color: '#666' }}>
                                Example for {point.text}
                              </figcaption>
                            </Suspense>
                          </ImageContainer>
                        )}
                        {point.video && (
                          <VideoContainer>
                            <video
                              controls
                              preload="metadata"
                              style={{ width: '100%', height: 'auto', aspectRatio: '16 / 9' }}
                              loading="lazy"
                              decoding="async"
                              aria-label={`Video example for ${point.text}`}
                            >
                              <source src={point.video} type="video/mp4" />
                            </video>
                            <figcaption style={{ fontSize: '0.875rem', color: '#666' }}>
                              Video example for {point.text}
                            </figcaption>
                          </VideoContainer>
                        )}
                        {point.codeSnippet && (
                          <CodeSnippetContainer>
                            <CopyToClipboard text={point.codeSnippet} onCopy={handleCopyCode}>
                              <CopyButton aria-label="Copy code">Copy</CopyButton>
                            </CopyToClipboard>
                            <Suspense fallback={<Placeholder>Loading code...</Placeholder>}>
                              <SyntaxHighlighter language="javascript" style={vs}>
                                {sanitizeCode(point.codeSnippet)}
                              </SyntaxHighlighter>
                            </Suspense>
                          </CodeSnippetContainer>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              ))}

              {post.superTitles?.some(st => st.superTitle.trim() && st.attributes?.some(attr => attr.attribute.trim() && attr.items?.some(item => item.title.trim() || item.bulletPoints?.some(p => p.trim())))) && (
                <ComparisonTableContainer aria-labelledby="comparison-heading">
                  <SubtitleHeader id="comparison-heading">Comparison</SubtitleHeader>
                  <ResponsiveContent>
                    <ResponsiveTable>
                      <caption style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                        Comparison of {post.category} features
                      </caption>
                      <thead>
                        <tr>
                          <ResponsiveHeader scope="col">Attribute</ResponsiveHeader>
                          {post.superTitles.map((st, i) => st.superTitle.trim() && (
                            <ResponsiveHeader
                              key={i}
                              scope="col"
                              dangerouslySetInnerHTML={{ __html: parseLinksForHtml(st.superTitle, post.category) }}
                            />
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {post.superTitles[0]?.attributes?.map((attr, attrIdx) => attr.attribute.trim() && attr.items?.some(item => item.title.trim() || item.bulletPoints?.some(p => p.trim())) && (
                          <tr key={attrIdx}>
                            <ResponsiveCell scope="row" dangerouslySetInnerHTML={{ __html: parseLinksForHtml(attr.attribute, post.category) }} />
                            {post.superTitles.map((st, stIdx) => st.attributes[attrIdx]?.items && (
                              <ResponsiveCell key={stIdx}>
                                {st.attributes[attrIdx].items.map((item, itemIdx) => (item.title.trim() || item.bulletPoints?.some(p => p.trim())) && (
                                  <div key={itemIdx}>
                                    <strong dangerouslySetInnerHTML={{ __html: parseLinksForHtml(item.title, post.category) }} />
                                    <ul style={{ paddingLeft: '1.5rem' }}>
                                      {item.bulletPoints?.map((point, pIdx) => point.trim() && (
                                        <li key={pIdx} dangerouslySetInnerHTML={{ __html: parseLinksForHtml(point, post.category) }} />
                                      ))}
                                    </ul>
                                  </div>
                                ))}
                              </ResponsiveCell>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </ResponsiveTable>
                  </ResponsiveContent>
                </ComparisonTableContainer>
              )}

              {post.summary && (
                <section id="summary" aria-labelledby="summary-heading">
                  <SubtitleHeader id="summary-heading">Summary</SubtitleHeader>
                  <p style={{ fontSize: '1rem' }}>{parsedSummary}</p>
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
                <Suspense fallback={<Placeholder>Loading related posts...</Placeholder>}>
                  <RelatedPosts relatedPosts={relatedPosts} />
                </Suspense>
              </section>

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
                      href={`https://www.geeksforgeeks.org/${post.category.toLowerCase().replace(/\s+/g, '-')}-tutorials`}
                      target="_blank"
                      rel="noopener"
                      aria-label={`GeeksforGeeks ${post.category} Tutorials`}
                    >
                      GeeksforGeeks: {post.category} Tutorials
                    </ReferenceLink>
                    <ReferenceLink
                      href={`https://developer.mozilla.org/en-US/docs/Web/${post.category.replace(/\s+/g, '')}`}
                      target="_blank"
                      rel="noopener"
                      aria-label={`MDN ${post.category} Documentation`}
                    >
                      MDN: {post.category} Documentation
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
                activeSection={activeSection}
                scrollToSection={scrollToSection}
                subtitlesListRef={subtitlesListRef}
              />
            </aside>
          </Suspense>
        </ErrorBoundary>
      </Container>
    </HelmetProvider>
  );
});

export default PostPage;
