import React, { useState, useEffect, useRef, Suspense, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';
import { parseLinks, slugify, truncateText } from './utils';
import { Helmet, HelmetProvider } from 'react-helmet-async';

const loadDependencies = async () => {
  const [{ ClipLoader }] = await Promise.all([import('react-spinners')]);
  return { ClipLoader };
};

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const Sidebar = React.lazy(() => import('./Sidebar'));

const Container = styled.div`
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  @media (min-width: 769px) {
    flex-direction: row;
  }
`;

const MainContent = styled.main`
  flex: 1;
  padding: 1rem;
  background: #f4f4f9;
  @media (min-width: 769px) {
    margin-right: 250px;
    padding: 2rem;
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
  line-height: 1.3;
`;

const ImageContainer = styled.figure`
  width: 100%;
  max-width: 100%;
  margin: 1rem 0;
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

const criticalCSS = `
  html { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 16px; }
  main { flex: 1; padding: 1rem; background: #f4f4f9; }
  h1 { font-size: clamp(1.5rem, 4vw, 2rem); color: #111827; margin: 0.75rem 0 1rem; font-weight: 800; line-height: 1.3; }
  section { font-size: 1rem; line-height: 1.6; margin-bottom: 1.5rem; }
  @media (min-width: 769px) {
    main { margin-right: 250px; padding: 2rem; }
    section { font-size: 1.1rem; line-height: 1.7; }
  }
  @media (max-width: 480px) {
    section { font-size: 0.9rem; line-height: 1.5; }
  }
  @font-face {
    font-family: 'Segoe UI';
    src: local('Segoe UI'), local('BlinkMacSystemFont'), local('-apple-system');
    font-display: swap;
  }
`;

const PostContentCritical = ({ post, parsedTitle, calculateReadTimeAndWordCount }) => {
  const content = parseLinks(post?.content || '', post?.category || '', false);

  return (
    <>
      <header>
        <PostHeader>{parsedTitle || post.title}</PostHeader>
        <div style={{ marginBottom: '0.75rem', color: '#666', fontSize: '0.75rem' }}>
          Read time: {calculateReadTimeAndWordCount.readTime} min
        </div>
      </header>

      <section style={{
        fontSize: '1rem',
        lineHeight: '1.6',
        marginBottom: '1.5rem',
        '@media (min-width: 769px)': {
          fontSize: '1.1rem',
          lineHeight: '1.7'
        },
        '@media (max-width: 480px)': {
          fontSize: '0.9rem',
          lineHeight: '1.5'
        }
      }}>{content}</section>

      {post.titleImage && (
        <ImageContainer>
          <LQIPImage
            src={`${post.titleImage}?w=10&format=webp&q=1`}
            alt="Low quality placeholder"
            width="280"
            height="157.5"
            loading="lazy"
            decoding="async"
            fetchpriority="low"
          />
          <PostImage
            src={`${post.titleImage}?w=200&format=avif&q=40`}
            srcSet={`
              ${post.titleImage}?w=100&format=avif&q=40 100w,
              ${post.titleImage}?w=150&format=avif&q=40 150w,
              ${post.titleImage}?w=200&format=avif&q=40 200w,
              ${post.titleImage}?w=280&format=avif&q=40 280w,
              ${post.titleImage}?w=480&format=avif&q=40 480w
            `}
            sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
            alt={`Illustration for ${post.title}`}
            width="280"
            height="157.5"
            fetchpriority="low"
            loading="lazy"
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
            width="280"
            height="157.5"
            loading="lazy"
            decoding="async"
            aria-label={`Video for ${post.title}`}
            fetchpriority="low"
          >
            <source src={`${post.titleVideo}#t=0.1`} type="video/mp4" />
          </PostVideo>
        </VideoContainer>
      )}

      <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
        <time dateTime={post.date}>{post.date}</time> | Author: {post.author || 'Zedemy Team'}
      </p>
    </>
  );
};

const PostPage = () => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const subtitlesListRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [deps, setDeps] = useState(null);
  const [structuredData, setStructuredData] = useState([]);
  const [parsedTitle, setParsedTitle] = useState('');
  const [readTime, setReadTime] = useState(0);

  const post = useSelector(state => state.postReducer.post);
  const relatedPosts = useSelector(state => state.postReducer.posts?.filter(p => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase()).slice(0, 3) || []);
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => loadDependencies().then(setDeps), { timeout: 3000 });
    } else {
      setTimeout(() => loadDependencies().then(setDeps), 3000);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      setHasFetched(false);
      setActiveSection(null);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  useEffect(() => {
    const fetchData = async (retries = 3) => {
      try {
        await dispatch(fetchPostBySlug(slug));
        startTransition(() => setHasFetched(true));
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

  useEffect(() => {
    if (!hasFetched || !post) return;
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
      }, { timeout: 5000 });
    } else {
      setTimeout(() => {
        Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
      }, 5000);
    }
  }, [dispatch, hasFetched, post]);

  const calculateReadTimeAndWordCount = { readTime, wordCount: 0 };

  useEffect(() => {
    if (!post) return;
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        const text = [
          post.title || '',
          post.content || '',
          post.summary || '',
          ...(post.subtitles?.map(s => (s.title || '') + (s.bulletPoints?.map(b => b.text || '').join('') || '')) || []),
        ].join(' ');
        const words = text.split(/\s+/).filter(w => w).length;
        setReadTime(Math.ceil(words / 200));
      }, { timeout: 4000 });
    } else {
      setTimeout(() => {
        const text = [
          post.title || '',
          post.summary || '',
          ...(post.subtitles?.map(s => (s.title || '') + (s.bulletPoints?.map(b => b.text || '').join('') || '')) || []),
        ].join(' ');
        const words = text.split(/\s+/).filter(w => w).length;
        setReadTime(Math.ceil(words / 200));
      }, 4000);
    }
  }, [post]);

  useEffect(() => {
    if (!post) return;
    setParsedTitle(post.title);
  }, [post]);

  useEffect(() => {
    if (!post) return;
    if (typeof window !== 'undefined' && window.requestIdleCallback) {
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
      }, { timeout: 5000 });
    }
  }, [post, slug, readTime]);

  useEffect(() => {
    if (post?.titleImage) {
      if (typeof scheduler !== 'undefined' && scheduler.postTask) {
        scheduler.postTask(
          () => {
            const img = new Image();
            img.src = `${post.titleImage}?w=200&format=avif&q=40`;
            img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
          },
          { priority: 'background' }
        );
      } else if (typeof window !== 'undefined' && window.requestIdleCallback) {
        window.requestIdleCallback(
          () => {
            const img = new Image();
            img.src = `${post.titleImage}?w=200&format=avif&q=40`;
            img.onerror = () => console.error('Title Image Preload Failed:', post.titleImage);
          },
          { timeout: 2000 }
        );
      }
    }
  }, [post?.titleImage]);

  if (!post && !hasFetched) {
    return (
      <Container className="container">
        <MainContent>
          <SkeletonHeader className="skeleton" />
        </MainContent>
        <SidebarWrapper>
          <Placeholder height="1200px">Loading sidebar...</Placeholder>
        </SidebarWrapper>
      </Container>
    );
  }

  if (!post) {
    return (
      <Container className="container">
        <LoadingOverlay aria-live="polite">
          {deps?.ClipLoader ? <deps.ClipLoader color="#2c3e50" size={50} /> : <div>Loading...</div>}
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
      <Container className="container">
        <MainContent role="main" aria-label="Main content">
          <article>
            <PostContentCritical
              post={post}
              parsedTitle={parsedTitle}
              calculateReadTimeAndWordCount={calculateReadTimeAndWordCount}
            />
            <Suspense fallback={<Placeholder height="500px">Loading additional content...</Placeholder>}>
              <PostContentNonCritical
                post={post}
                relatedPosts={relatedPosts}
                completedPosts={completedPosts}
                dispatch={dispatch}
                isSidebarOpen={isSidebarOpen}
                setSidebarOpen={setSidebarOpen}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                subtitlesListRef={subtitlesListRef}
              />
            </Suspense>
          </article>
        </MainContent>
        <SidebarWrapper>
          <Suspense fallback={<Placeholder height="1200px">Loading sidebar...</Placeholder>}>
            <Sidebar
              post={post}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
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
};

export default PostPage;
