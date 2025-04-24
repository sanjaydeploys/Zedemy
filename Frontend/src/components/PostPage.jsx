import React, { useState, useEffect, useRef, memo, useMemo, useCallback, Suspense, lazy } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled, { css } from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import DOMPurify from 'dompurify';
import LazyLoad from 'react-lazyload';
import { RingLoader } from 'react-spinners';

// Lazy-loaded dependencies
const Toast = lazy(() => import('react-toastify').then(module => ({
  default: module.ToastContainer,
  toast: module.toast
})));
const SyntaxHighlighter = lazy(() => import('react-syntax-highlighter').then(module => ({ default: module.Prism })));
const Zoom = lazy(() => import('react-medium-image-zoom'));
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'react-toastify/dist/ReactToastify.css';
import 'react-medium-image-zoom/dist/styles.css';

// Lazy-loaded components
const Sidebar = lazy(() => import('./Sidebar'));
const RelatedPosts = lazy(() => import('./RelatedPosts'));

// Error Boundary
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Please try again.</div>;
    }
    return this.props.children;
  }
}

const slugify = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Remove duplicate hyphens
};
// Shared styles
const sharedSectionStyles = css`
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
`;

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 100vh;
`;

const Content = styled.div`
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f4f4f9;
  contain: layout;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(92, 6, 6, 0.7);
  z-index: 9999;
`;

const PostHeader = styled.h1`
  font-size: 2.5em;
  color: #2c3e50;
  text-align: left;
  margin-bottom: 20px;
  @media (max-width: 768px) {
    font-size: 1.5em;
  }
`;

const SubtitleHeader = styled.h2`
  font-size: 2em;
  color: #34495e;
  margin: 20px 0 10px;
`;

const SummaryContainer = styled.div`
  margin-top: 20px;
`;

const CodeSnippetContainer = styled.div`
  position: relative;
  margin: 20px 0;
  background: #1e1e1e;
  border-radius: 5px;
  overflow: hidden;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: #007bff;
  color: #fff;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background: #0056b3;
  }
`;

const CompleteButton = styled.button`
  position: sticky;
  bottom: 20px;
  align-self: flex-end;
  margin: 20px;
  padding: 12px 24px;
  background-color: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#2c3e50')};
  color: #ecf0f1;
  border: none;
  border-radius: 5px;
  cursor: ${({ isCompleted }) => (isCompleted ? 'not-allowed' : 'pointer')};
  font-size: 1.1em;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
  transition: background-color 0.2s;
  &:hover {
    background-color: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#34495e')};
  }
`;

const ImageError = styled.div`
  color: red;
  margin: 10px 0;
`;

const ComparisonTableContainer = styled.div`
  ${sharedSectionStyles}
  overflow-x: auto;
`;

const ResponsiveContent = styled.div`
  overflow: auto;
  white-space: nowrap;
`;

const ResponsiveTable = styled.table`
  border-collapse: collapse;
  width: auto;
  min-width: 800px;
`;

const ResponsiveHeader = styled.th`
  background-color: #34495e;
  color: #ecf0f1;
  padding: 15px;
  border: 1px solid #34495e;
  min-width: 150px;
`;

const ResponsiveCell = styled.td`
  border: 1px solid #34495e;
  padding: 15px;
  vertical-align: top;
  min-width: 150px;
  max-width: 300px;
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: normal;
`;

const ReferencesSection = styled.div`
  ${sharedSectionStyles}
`;

const ReferenceLink = styled.a`
  display: block;
  color: #0645ad;
  text-decoration: none;
  margin: 5px 0;
  &:hover {
    text-decoration: underline;
  }
`;

const NavigationLinks = styled.nav`
  margin: 20px 0;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
`;

// Custom AccessibleZoom component
const AccessibleZoom = ({ children, ...props }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current) return;

    const removeAriaOwns = () => {
      const wrapper = ref.current.querySelector('[data-rmiz]');
      if (wrapper && wrapper.hasAttribute('aria-owns')) {
        wrapper.removeAttribute('aria-owns');
      }
    };

    removeAriaOwns();

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'aria-owns') {
          removeAriaOwns();
        }
      });
    });

    const wrapper = ref.current.querySelector('[data-rmiz]');
    if (wrapper) {
      observer.observe(wrapper, { attributes: true });
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      <Suspense fallback={<div>Loading zoom...</div>}>
        <Zoom {...props}>{children}</Zoom>
      </Suspense>
    </div>
  );
};

// Utility functions
export const parseLinks = (text, category) => {
  if (!text) return [text];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  const elements = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    if (startIndex > lastIndex) {
      elements.push(text.slice(lastIndex, startIndex));
    }
    const isInternal = url.startsWith('/');
    elements.push(
      isInternal ? (
        <Link
          key={startIndex}
          to={url}
          style={{ color: '#007bff', textDecoration: 'underline' }}
          aria-label={`Navigate to ${linkText}`}
        >
          {linkText}
        </Link>
      ) : (
        <a
          key={startIndex}
          href={url}
          target={url.startsWith('vscode://') ? '_self' : '_blank'}
          rel={url.startsWith('vscode://') ? undefined : 'noopener noreferrer nofollow'}
          style={{ color: '#007bff', textDecoration: 'underline' }}
          aria-label={`Visit ${linkText}`}
        >
          {linkText}
        </a>
      )
    );
    lastIndex = endIndex;
  }
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  if (elements.length === 0) {
    elements.push(text);
  }
  return elements;
};

export const parseLinksForHtml = (text, category) => {
  if (!text) return text;
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  return text.replace(linkRegex, (match, linkText, url) => {
    const isInternal = url.startsWith('/');
    if (isInternal) {
      return `<a href="${url}" style="color: #007bff; text-decoration: underline;" aria-label="Navigate to ${linkText}">${linkText}</a>`;
    }
    const target = url.startsWith('vscode://') ? '_self' : '_blank';
    const rel = url.startsWith('vscode://') ? '' : ' rel="noopener noreferrer nofollow"';
    return `<a href="${url}" target="${target}"${rel} style="color: #007bff; text-decoration: underline;" aria-label="Visit ${linkText}">${linkText}</a>`;
  });
};

const calculateReadTimeAndWordCount = (post) => {
  if (!post) return { readTime: 0, wordCount: 0 };
  const textContent = (
    (post.title || '') +
    (post.content || '') +
    (post.summary || '') +
    post.subtitles.map(s => (s.title || '') + s.bulletPoints.map(b => b.text || '').join('')).join('')
  );
  const words = textContent.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const readTime = Math.ceil(wordCount / 200);
  return { readTime, wordCount };
};

const sanitizeCodeSnippet = (code) => {
  return DOMPurify.sanitize(code, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  let truncated = text.slice(0, maxLength);
  const lastTagIndex = truncated.lastIndexOf('>');
  if (lastTagIndex !== -1 && truncated.lastIndexOf('<') > lastTagIndex) {
    truncated = truncated.slice(0, lastTagIndex + 1);
  } else {
    truncated = truncated + '...';
  }
  return truncated;
};

const getRelatedPosts = (filteredPosts, currentPostId) => {
  return filteredPosts
    .filter(post => post.postId && post.postId !== currentPostId && post.title && post.slug)
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

  // Load toast dynamically
  useEffect(() => {
    import('react-toastify').then(module => {
      setToast(() => module.toast);
    });
  }, []);

  // Combined API calls
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchPosts()),
          dispatch(fetchPostBySlug(slug)),
          dispatch(fetchCompletedPosts())
        ]);
      } catch (error) {
        if (toast) {
          toast.error('Failed to load data');
        }
      }
    };
    fetchData();
  }, [dispatch, slug, toast]);

// Map subtitles to slugged IDs
const subtitleSlugs = useMemo(() => {
  if (!post || !post.subtitles) return {};
  const slugs = {};
  post.subtitles.forEach((subtitle, index) => {
    slugs[`subtitle-${index}`] = slugify(subtitle.title);
  });
  if (post.summary) slugs['summary'] = 'summary';
  return slugs;
}, [post]);

// Handle fragment on page load
useEffect(() => {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    // Find the section ID corresponding to the slugged hash
    const sectionId = Object.keys(subtitleSlugs).find(
      (id) => subtitleSlugs[id] === hash
    );
    if (sectionId) {
      setTimeout(() => {
        scrollToSection(sectionId, false); // Scroll without updating URL
      }, 0);
    }
  }
}, [subtitleSlugs]);


  // Memoized computations
  const filteredPosts = useMemo(
    () => posts.filter(p => p.category?.toLowerCase() === post?.category?.toLowerCase()),
    [posts, post?.category]
  );
  const relatedPosts = useMemo(() => getRelatedPosts(filteredPosts, post?.postId), [filteredPosts, post?.postId]);
  const { readTime, wordCount } = useMemo(() => calculateReadTimeAndWordCount(post), [post]);
  const parsedTitle = useMemo(() => parseLinks(post?.title, post?.category), [post?.title, post?.category]);
  const parsedContent = useMemo(() => parseLinks(post?.content, post?.category), [post?.content, post?.category]);
  const parsedSummary = useMemo(() => parseLinks(post?.summary, post?.category), [post?.summary, post?.category]);

  // IntersectionObserver for active section
  useEffect(() => {
    if (!post) return;
    const observerOptions = { root: null, rootMargin: '0px', threshold: 0.5 };
    const observer = new IntersectionObserver(
      debounce((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            setActiveSection(sectionId);
            const sidebarItem = subtitlesListRef.current?.querySelector(`[data-section="${sectionId}"]`);
            if (sidebarItem) {
              sidebarItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
          }
        });
      }, 100),
      observerOptions
    );
    const sections = document.querySelectorAll('[id^="subtitle-"], #summary');
    sections.forEach(section => observer.observe(section));
    return () => sections.forEach(section => observer.unobserve(section));
  }, [post]);

  const handleMarkAsCompleted = useCallback(async () => {
    if (!post) {
      toast?.error('No post data available');
      return;
    }
    try {
      const response = await fetch(`https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/complete/${post.postId}`, {
        method: 'PUT',
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 400 && data.msg === 'Post already marked as completed') {
          toast?.info('This post is already marked as completed');
          const completedResponse = await fetch('https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/pro/api/posts/completed', {
            headers: { 'x-auth-token': localStorage.getItem('token') }
          });
          const updatedCompletedPosts = await completedResponse.json();
          dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: updatedCompletedPosts });
          return;
        }
        throw new Error(data.msg || 'Failed to mark post as completed');
      }
      toast?.success('Post marked as completed!');
      if (data.certificateUrl) {
        toast?.success(`Category completed! Certificate issued: ${data.certificateUrl}`, {
          autoClose: 5000,
          onClick: () => window.open(data.certificateUrl, '_blank')
        });
      }
      const completedResponse = await fetch('https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/completed', {
        headers: { 'x-auth-token': localStorage.getItem('token') }
      });
      const updatedCompletedPosts = await completedResponse.json();
      dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: updatedCompletedPosts });
    } catch (error) {
      toast?.error(`Failed to mark post as completed: ${error.message}`);
    }
  }, [post, dispatch, toast]);

  const scrollToSection = useCallback((id, updateUrl = true) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(id);
      if (isSidebarOpen) setSidebarOpen(false);
      // Append slugged subtitle to URL
      if (updateUrl && subtitleSlugs[id]) {
        const fragment = subtitleSlugs[id];
        window.history.pushState(null, '', `#${fragment}`);
      }
    }
  }, [isSidebarOpen, subtitleSlugs]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
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
    toast?.success('Code copied to clipboard!', {
      position: 'top-right',
      autoClose: 2000,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    });
  }, [toast]);

  const handleImageError = useCallback((url) => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  }, []);

  if (!post) {
    return (
      <LoadingOverlay>
        <RingLoader color="#2c3e50" size={150} />
      </LoadingOverlay>
    );
  }

  // SEO-related data
  const pageTitle = `${post.title} | Zedemy, India`;
  const pageDescription = post.summary
    ? truncateText(post.summary, 160)
    : (post.content
        ? truncateText(post.content, 160)
        : `Learn ${post.title.toLowerCase()} with Zedemy's expert-led tutorials for Indian students.`);
  const pageKeywords = post.keywords
    ? `${post.keywords}, online tech tutorials India, learn coding India, tech education India, Zedemy, ${post.category}, ${post.title.toLowerCase()}`
    : `${post.title}, online tech tutorials India, learn coding India, tech education India, Zedemy, ${post.category}`;
  const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
  const ogImage = post.titleImage || 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png';

  // Enhanced structured data
  const faqData = post.subtitles
  .filter(subtitle => subtitle.isFAQ)
  .map((subtitle, index) => ({
    '@type': 'Question',
    name: subtitle.title,
    acceptedAnswer: {
      '@type': 'Answer',
      text: subtitle.bulletPoints.map(point => point.text).join(' ')
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#${slugify(subtitle.title)}`
    }
  }));
  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: pageDescription,
      keywords: pageKeywords.split(', ').map(k => k.trim()),
      articleSection: post.category || 'Tech Tutorials',
      author: {
        '@type': 'Person',
        name: post.author || 'Zedemy Team'
      },
      publisher: {
        '@type': 'Organization',
        name: 'Zedemy',
        logo: {
          '@type': 'ImageObject',
          url: 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png'
        }
      },
      datePublished: post.date,
      dateModified: post.date,
      image: ogImage,
      url: canonicalUrl,
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': canonicalUrl
      },
      timeRequired: `PT${readTime}M`,
      wordCount: wordCount,
      inLanguage: 'en',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Zedemy',
        url: 'https://zedemy.vercel.app'
      },
      relatedLink: relatedPosts.map(relatedPost => ({
        '@type': 'CreativeWork',
        name: relatedPost.title,
        url: `https://zedemy.vercel.app/post/${relatedPost.slug}`
      }))
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://zedemy.vercel.app/'
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: 'https://zedemy.vercel.app/explore'
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.category || 'Tech Tutorials',
          item: `https://zedemy.vercel.app/category/${post.category?.toLowerCase() || 'blog'}`
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: post.title,
          item: canonicalUrl
        }
      ]
    },
    ...(faqData.length > 0 ? [{
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqData
    }] : []),
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Zedemy',
      url: 'https://zedemy.vercel.app',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://zedemy.vercel.app/explore?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    }
  ];
  console.log(JSON.stringify(structuredData, null, 2));




  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Helmet>
          <html lang="en" />
          <title>{pageTitle}</title>
          <meta name="description" content={pageDescription} />
          <meta name="keywords" content={pageKeywords} />
          <meta name="author" content={post.author || 'Zedemy Team'} />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <link rel="canonical" href={canonicalUrl} />
          {post.titleImage && <link rel="preload" as="image" href={post.titleImage} />}
          <meta property="og:title" content={pageTitle} />
          <meta property="og:description" content={pageDescription} />
          <meta property="og:image" content={ogImage} />
          <meta property="og:image:alt" content={`${post.title} tutorial on Zedemy`} />
          <meta property="og:url" content={canonicalUrl} />
          <meta property="og:type" content="article" />
          <meta property="og:site_name" content="Zedemy" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={pageTitle} />
          <meta name="twitter:description" content={pageDescription} />
          <meta name="twitter:image" content={ogImage} />
          <meta name="twitter:image:alt" content={`${post.title} tutorial on Zedemy`} />
          <meta name="twitter:site" content="@sanjaypatidar" />
          <meta name="twitter:creator" content="@sanjaypatidar" />
          <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
        </Helmet>

        <Container>
          <Content>
            <Suspense fallback={<div>Loading...</div>}>
              <Toast />
            </Suspense>
            <PostHeader>{parsedTitle}</PostHeader>
            <div style={{ marginBottom: '10px', color: '#666' }}>
              Estimated read time: {readTime} min
            </div>
            <NavigationLinks>
              <Link to="/explore" aria-label="Back to all blog posts">Back to Blog</Link>
              {post.category && (
                <Link to={`/category/${post.category.toLowerCase()}`} aria-label={`Explore more in ${post.category}`}>
                  Explore {post.category}
                </Link>
              )}
              <Link to="/" aria-label="Go to homepage">Home</Link>
            </NavigationLinks>

            {post.titleImage && (
              <LazyLoad height={200} offset={100}>
                <img
                  src={post.titleImage}
                  srcSet={`${post.titleImage}?w=300 300w, ${post.titleImage}?w=600 600w`}
                  sizes="(max-width: 600px) 300px, 600px"
                  alt={`Learn ${post.title.toLowerCase()} online in India`}
                  style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}
                  loading="lazy"
                  onError={() => handleImageError(post.titleImage)}
                />
                {imageErrors[post.titleImage] && (
                  <ImageError>Failed to load image: {post.titleImage}</ImageError>
                )}
              </LazyLoad>
            )}
            {post.titleVideo && (
              <video
                controls
                preload="metadata"
                style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}
                loading="lazy"
                aria-label={`Video tutorial for ${post.title}`}
              >
                <source src={post.titleVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            <p>Date Published: {post.date}</p>
            <p>Author: {post.author}</p>
            <p>{parsedContent}</p>

            {post.subtitles.map((subtitle, index) => (
              <div key={index} id={`subtitle-${index}`}>
                <SubtitleHeader>{parseLinks(subtitle.title, post.category)}</SubtitleHeader>
                {subtitle.image && (
                  <AccessibleZoom>
                    <img
                      src={subtitle.image}
                      srcSet={`${subtitle.image}?w=300 300w, ${subtitle.image}?w=600 600w`}
                      sizes="(max-width: 600px) 300px, 600px"
                      alt={subtitle.title}
                      aria-label={subtitle.title}
                      loading="lazy"
                      style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}
                      onError={() => handleImageError(subtitle.image)}
                    />
                    {imageErrors[subtitle.image] && (
                      <ImageError>Failed to load image: {subtitle.image}</ImageError>
                    )}
                  </AccessibleZoom>
                )}
                {subtitle.video && (
                  <video
                    controls
                    preload="metadata"
                    style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}
                    loading="lazy"
                    aria-label={`Video for ${subtitle.title}`}
                  >
                    <source src={subtitle.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                )}
                <ul>
                  {subtitle.bulletPoints.map((point, pointIndex) => (
                    <li key={pointIndex} style={{ marginBottom: '10px' }}>
                      <span>{parseLinks(point.text, post.category)}</span>
                      {point.image && (
                        <AccessibleZoom>
                          <img
                            src={point.image}
                            srcSet={`${point.image}?w=300 300w, ${point.image}?w=600 600w`}
                            sizes="(max-width: 600px) 300px, 600px"
                            alt={`${point.text} example for tech learning in India`}
                            loading="lazy"
                            style={{ width: '100%', maxWidth: '600px', margin: '20px 0' }}
                            onError={() => handleImageError(point.image)}
                          />
                          {imageErrors[point.image] && (
                            <ImageError>Failed to load image: {point.image}</ImageError>
                          )}
                        </AccessibleZoom>
                      )}
                      {point.video && (
                        <video
                          controls
                          preload="metadata"
                          style={{ width: '100%', maxWidth: '400px', margin: '10px 0' }}
                          loading="lazy"
                          aria-label={`Video example for ${point.text}`}
                        >
                          <source src={point.video} type="video/mp4" />
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {point.codeSnippet && (
                        <CodeSnippetContainer>
                          <CopyToClipboard text={point.codeSnippet} onCopy={handleCopyCode}>
                            <CopyButton>Copy</CopyButton>
                          </CopyToClipboard>
                          <Suspense fallback={<div>Loading code...</div>}>
                            <SyntaxHighlighter language="javascript" style={vs}>
                              {sanitizeCodeSnippet(point.codeSnippet)}
                            </SyntaxHighlighter>
                          </Suspense>
                        </CodeSnippetContainer>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {post.superTitles &&
              post.superTitles.length > 0 &&
              post.superTitles.some(superTitle =>
                superTitle.superTitle.trim() !== '' &&
                superTitle.attributes &&
                superTitle.attributes.length > 0 &&
                superTitle.attributes.some(attr =>
                  attr.attribute.trim() !== '' &&
                  attr.items &&
                  attr.items.length > 0 &&
                  attr.items.some(item =>
                    item.title.trim() !== '' &&
                    item.bulletPoints &&
                    item.bulletPoints.length > 0 &&
                    item.bulletPoints.some(point => point.trim() !== '')
                  )
                )
              ) && (
                <ComparisonTableContainer>
                  <SubtitleHeader>Comparison</SubtitleHeader>
                  <ResponsiveContent>
                    <ResponsiveTable>
                      <thead>
                        <tr>
                          <ResponsiveHeader>Attribute</ResponsiveHeader>
                          {post.superTitles.map((superTitle, index) => (
                            superTitle.superTitle.trim() !== '' && superTitle.attributes && superTitle.attributes.length > 0 && (
                              <ResponsiveHeader key={index} dangerouslySetInnerHTML={{ __html: parseLinksForHtml(superTitle.superTitle, post.category) }} />
                            )
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {post.superTitles[0].attributes.map((attr, attrIndex) => (
                          attr.attribute.trim() !== '' && attr.items && attr.items.length > 0 && attr.items.some(item => item.title.trim() !== '' || (item.bulletPoints && item.bulletPoints.length > 0 && item.bulletPoints.some(point => point.trim() !== ''))) && (
                            <tr key={attrIndex}>
                              <ResponsiveCell dangerouslySetInnerHTML={{ __html: parseLinksForHtml(attr.attribute, post.category) }} />
                              {post.superTitles.map((superTitle, superIndex) => (
                                superTitle.attributes[attrIndex] && superTitle.attributes[attrIndex].items && superTitle.attributes[attrIndex].items.length > 0 && (
                                  <ResponsiveCell key={superIndex}>
                                    {superTitle.attributes[attrIndex].items.map((item, itemIndex) => (
                                      (item.title.trim() !== '' || (item.bulletPoints && item.bulletPoints.length > 0 && item.bulletPoints.some(point => point.trim() !== ''))) && (
                                        <div key={itemIndex}>
                                          <strong dangerouslySetInnerHTML={{ __html: parseLinksForHtml(item.title, post.category) }} />
                                          <ul>
                                            {item.bulletPoints.map((point, pointIndex) => (
                                              point.trim() !== '' && <li key={pointIndex} dangerouslySetInnerHTML={{ __html: parseLinksForHtml(point, post.category) }} />
                                            ))}
                                          </ul>
                                        </div>
                                      )
                                    ))}
                                  </ResponsiveCell>
                                )
                              ))}
                            </tr>
                          )
                        ))}
                      </tbody>
                    </ResponsiveTable>
                  </ResponsiveContent>
                </ComparisonTableContainer>
              )}

            {post.summary && (
              <SummaryContainer id="summary">
                <SubtitleHeader>Summary</SubtitleHeader>
                <p>{parsedSummary}</p>
              </SummaryContainer>
            )}

            <CompleteButton
              onClick={handleMarkAsCompleted}
              disabled={completedPosts.some(p => p.postId === post.postId)}
              isCompleted={completedPosts.some(p => p.postId === post.postId)}
              aria-label={completedPosts.some(p => p.postId === post.postId) ? 'Post already completed' : 'Mark post as completed'}
            >
              {completedPosts.some(p => p.postId === post.postId) ? 'Completed' : 'Mark as Completed'}
            </CompleteButton>

            <Suspense fallback={<div>Loading related posts...</div>}>
              <RelatedPosts relatedPosts={relatedPosts} />
            </Suspense>

            <ReferencesSection>
              <SubtitleHeader>Further Reading</SubtitleHeader>
              {post.references?.length > 0 ? (
                post.references.map((ref, index) => (
                  <ReferenceLink
                    key={index}
                    href={ref.url}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={`Visit ${ref.title}`}
                  >
                    {ref.title}
                  </ReferenceLink>
                ))
              ) : (
                <>
                  <ReferenceLink
                    href={`https://www.geeksforgeeks.org/${post.category.toLowerCase().replace(/\s+/g, '-')}-tutorials`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={`GeeksforGeeks ${post.category} Tutorials`}
                  >
                    GeeksforGeeks: {post.category} Tutorials
                  </ReferenceLink>
                  <ReferenceLink
                    href={`https://developer.mozilla.org/en-US/docs/Web/${post.category.replace(/\s+/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    aria-label={`MDN ${post.category} Documentation`}
                  >
                    MDN: {post.category} Documentation
                  </ReferenceLink>
                </>
              )}
            </ReferencesSection>
          </Content>

          <Suspense fallback={<div>Loading sidebar...</div>}>
            <Sidebar
              post={post}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
              scrollToSection={scrollToSection}
              subtitlesListRef={subtitlesListRef}
            />
          </Suspense>
        </Container>
      </HelmetProvider>
    </ErrorBoundary>
  );
});

export default PostPage;
