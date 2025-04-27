import React, { useState, useEffect, useRef, memo, useMemo, useCallback, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams, Link } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import styled from 'styled-components';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import DOMPurify from 'dompurify';
import { RingLoader } from 'react-spinners';

// Lazy-loaded components (only load when needed)
const Toast = React.lazy(() => import('react-toastify').then(module => ({
  default: module.ToastContainer,
  toast: module.toast,
})));
const SyntaxHighlighter = React.lazy(() => import('react-syntax-highlighter').then(module => ({ default: module.Prism })));
const Zoom = React.lazy(() => import('react-medium-image-zoom'));
const Sidebar = React.lazy(() => import('./Sidebar'));
const RelatedPosts = React.lazy(() => import('./RelatedPosts'));
const AccessibleZoom = React.lazy(() => import('./AccessibleZoom'));

// Minimal CSS imports (non-critical deferred)
import 'react-toastify/dist/ReactToastify.min.css';
import 'react-medium-image-zoom/dist/styles.css';
import { vs } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Slugify utility
const slugify = text => text?.toLowerCase().replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-') || '';

// Shared styles
const sharedSectionStyles = `
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
`;

// Styled components (optimized for minimal CSS)
const Container = styled.div`
  display: flex;
  min-height: 100vh;
  font-family: 'Roboto', system-ui, sans-serif;
`;

const MainContent = styled.main`
  flex: 1;
  padding: 20px;
  background-color: #f4f4f9;
  contain: paint;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(92, 6, 6, 0.7);
  z-index: 9999;
`;

const PostHeader = styled.h1`
  font-size: 2.8rem;
  color: #111827;
  margin: 1rem 0 1.5rem;
  font-weight: 800;
  line-height: 1.3;
  @media (max-width: 768px) { font-size: 2rem; margin: 0.75rem 0 1.25rem; }
  @media (max-width: 480px) { font-size: 1.6rem; }
`;

const SubtitleHeader = styled.h2`
  font-size: 1.75rem;
  color: rgb(1, 16, 32);
  margin: 1.5rem 0 1rem;
  font-weight: 600;
  border-left: 4px solid #34db58;
  padding-left: 1rem;
  @media (max-width: 768px) { font-size: 1.5rem; }
  @media (max-width: 480px) { font-size: 1.2rem; }
`;

const CodeSnippetContainer = styled.div`
  position: relative;
  margin: 20px provoquer;
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
  &:hover { background: #0056b3; }
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
  &:hover { background-color: ${({ isCompleted }) => (isCompleted ? '#27ae60' : '#34495e')}; }
`;

const ImageContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 20px 0;
  aspect-ratio: 16 / 9;
`;

const VideoContainer = styled.div`
  width: 100%;
  max-width: 600px;
  margin: 20px 0;
  aspect-ratio: 16 / 9;
`;

const Placeholder = styled.div`
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #e0e0e0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  border-radius: 5px;
`;

// Critical CSS (minified further)
const criticalCSS = `
html{font-family:'Roboto',system-ui,sans-serif;font-size:16px}
h1{font-size:2.8rem;color:#111827;font-weight:800;margin:1rem 0 1.5rem}
h2{font-size:1.75rem;color:#011020;font-weight:600;margin:1.5rem 0 1rem}
main{flex:1;padding:20px;background:#f4f4f9}
@media (max-width:768px){h1{font-size:2rem}h2{font-size:1.5rem}}
@media (max-width:480px){h1{font-size:1.6rem}h2{font-size:1.2rem}}
`;

// Utility functions (optimized)
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

const calculateReadTime = post => {
  if (!post) return 0;
  const text = [post.title, post.content, post.summary, ...post.subtitles.map(s => s.title + s.bulletPoints.map(b => b.text).join(''))].join('');
  return Math.ceil(text.split(/\s+/).filter(w => w).length / 200);
};

const sanitizeCode = code => DOMPurify.sanitize(code, { ALLOWED_TAGS: [] });

const truncateText = (text, max) => {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '...';
};

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// PostPage Component
const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const post = useSelector(state => state.postReducer.post);
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [imageErrors, setImageErrors] = useState({});
  const [activeSection, setActiveSection] = useState(null);
  const subtitlesListRef = useRef(null);
  const [toast, setToast] = useState(null);

  // Load toast only when needed
  useEffect(() => {
    import('react-toastify').then(module => setToast(() => module.toast));
  }, []);

  // Fetch data with batched dispatches
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

  // Memoized subtitle slugs
  const subtitleSlugs = useMemo(() => {
    if (!post?.subtitles) return {};
    const slugs = {};
    post.subtitles.forEach((s, i) => { slugs[`subtitle-${i}`] = slugify(s.title); });
    if (post.summary) slugs.summary = 'summary';
    return slugs;
  }, [post]);

  // Handle fragment navigation
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (hash) {
      const sectionId = Object.keys(subtitleSlugs).find(id => subtitleSlugs[id] === hash);
      if (sectionId) {
        setTimeout(() => scrollToSection(sectionId, false), 0);
      }
    }
  }, [subtitleSlugs]);

  // Memoized computations
  const readTime = useMemo(() => calculateReadTime(post), [post]);
  const parsedTitle = useMemo(() => parseLinks(post?.title, post?.category), [post?.title, post?.category]);
  const parsedContent = useMemo(() => parseLinks(post?.content, post?.category), [post?.content, post?.category]);
  const parsedSummary = useMemo(() => parseLinks(post?.summary, post?.category), [post?.summary, post?.category]);

  // IntersectionObserver for active section
  useEffect(() => {
    if (!post) return;
    const observer = new IntersectionObserver(
      debounce(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const sectionId = entry.target.id;
            setActiveSection(sectionId);
            subtitlesListRef.current?.querySelector(`[data-section="${sectionId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        });
      }, 150),
      { root: null, rootMargin: '0px', threshold: 0.5 }
    );
    document.querySelectorAll('[id^="subtitle-"], #summary').forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [post]);

  // Preload LCP image
  useEffect(() => {
    if (post?.titleImage) {
      const img = new Image();
      img.src = `${post.titleImage}?w=600&format=webp`;
    }
  }, [post?.titleImage]);

  const handleMarkAsCompleted = useCallback(async () => {
    if (!post || completedPosts.some(p => p.postId === post.postId)) return;
    try {
      const response = await fetch(
        `https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/complete/${post.postId}`,
        { method: 'PUT', headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Failed to mark as completed');
      toast?.success('Post Marked as Completed!');
      if (data.certificateUrl) {
        toast?.success(`Certificate: ${data.certificateUrl}`, { onClick: () => window.open(data.certificateUrl, '_blank') });
      }
      const completedResponse = await fetch(
        'https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com/prod/api/posts/completed',
        { headers: { 'x-auth-token': localStorage.getItem('token') } }
      );
      dispatch({ type: 'FETCH_COMPLETED_POSTS_SUCCESS', payload: await completedResponse.json() });
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

  const handleCopyCode = useCallback(() => {
    toast?.success('Code copied!', { position: 'top-right', autoClose: 1500 });
  }, [toast]);

  const handleImageError = useCallback(url => {
    setImageErrors(prev => ({ ...prev, [url]: true }));
  }, []);

  if (!post) {
    return (
      <LoadingOverlay aria-live="polite">
        <RingLoader color="#2c3e50" size={100} />
      </LoadingOverlay>
    );
  }

  const pageTitle = `${post.title} | LearnX`;
  const pageDescription = truncateText(post.summary || post.content, 160) || `Learn ${post.title.toLowerCase()} with LearnX.`;
  const canonicalUrl = `https://learnx24.vercel.app/post/${slug}`;
  const ogImage = post.titleImage || 'https://d2rq30ca0zyvzp.cloudfront.net/images/default.webp';

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={canonicalUrl} />
        {post.titleImage && (
          <link rel="preload" as="image" href={`${post.titleImage}?w=600&format=webp`} fetchpriority="high" />
        )}
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <style>{criticalCSS}</style>
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;600&display=swap" as="style" onload="this.rel='stylesheet'" />
      </Helmet>
      <Container>
        <MainContent role="main">
          <Suspense fallback={null}>
            <Toast />
          </Suspense>
          <article>
            <header>
              <PostHeader>{parsedTitle}</PostHeader>
              <div style={{ color: '#666' }}>Read time: {readTime} min</div>
              <nav aria-label="Page navigation">
                <Link to="/explore">Blog</Link> |{' '}
                {post.category && <Link to={`/category/${post.category.toLowerCase()}`}>{post.category}</Link>} |{' '}
                <Link to="/">Home</Link>
              </nav>
            </header>

            {post.titleImage && (
              <ImageContainer>
                <Suspense fallback={<Placeholder>Loading...</Placeholder>}>
                  <AccessibleZoom>
                    <img
                      src={`${post.titleImage}?w=600&format=webp`}
                      srcSet={`${post.titleImage}?w=300&format=webp 300w, ${post.titleImage}?w=600&format=webp 600w`}
                      sizes="(max-width: 600px) 300px, 600px"
                      alt={`Illustration for ${post.title}`}
                      width="600"
                      height="337"
                      fetchpriority="high"
                      decoding="async"
                      onError={() => handleImageError(post.titleImage)}
                    />
                  </AccessibleZoom>
                </Suspense>
              </ImageContainer>
            )}

            {post.titleVideo && (
              <VideoContainer>
                <video controls preload="metadata" width="600" height="337" fetchpriority="high">
                  <source src={post.titleVideo} type="video/mp4" />
                </video>
              </VideoContainer>
            )}

            <p><time dateTime={post.date}>{post.date}</time> | Author: {post.author}</p>
            <section>{parsedContent}</section>

            {post.subtitles.map((subtitle, i) => (
              <section key={i} id={`subtitle-${i}`}>
                <SubtitleHeader>{parseLinks(subtitle.title, post.category)}</SubtitleHeader>
                {subtitle.image && (
                  <ImageContainer>
                    <Suspense fallback={<Placeholder>Loading...</Placeholder>}>
                      <AccessibleZoom>
                        <img
                          src={`${subtitle.image}?w=600&format=webp`}
                          srcSet={`${subtitle.image}?w=300&format=webp 300w, ${subtitle.image}?w=600&format=webp 600w`}
                          sizes="(max-width: 600px) 300px, 600px"
                          alt={subtitle.title}
                          width="600"
                          height="337"
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
                    <video controls preload="metadata" width="600" height="337" loading="lazy">
                      <source src={subtitle.video} type="video/mp4" />
                    </video>
                  </VideoContainer>
                )}
                <ul>
                  {subtitle.bulletPoints.map((point, j) => (
                    <li key={j}>
                      {parseLinks(point.text, post.category)}
                      {point.codeSnippet && (
                        <CodeSnippetContainer>
                          <CopyToClipboard text={point.codeSnippet} onCopy={handleCopyCode}>
                            <CopyButton>Copy</CopyButton>
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

            {post.summary && (
              <section id="summary">
                <SubtitleHeader>Summary</SubtitleHeader>
                <p>{parsedSummary}</p>
              </section>
            )}

            <CompleteButton
              onClick={handleMarkAsCompleted}
              disabled={completedPosts.some(p => p.postId === post.postId)}
              isCompleted={completedPosts.some(p => p.postId === post.postId)}
            >
              {completedPosts.some(p => p.postId === post.postId) ? 'Completed' : 'Mark as Completed'}
            </CompleteButton>

            <Suspense fallback={<Placeholder>Loading...</Placeholder>}>
              <RelatedPosts relatedPosts={[]} />
            </Suspense>
          </article>
        </MainContent>
        <Suspense fallback={<Placeholder>Loading...</Placeholder>}>
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
  );
});

export default PostPage;
