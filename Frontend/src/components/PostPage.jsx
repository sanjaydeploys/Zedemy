import React, { useState, useEffect, useRef, memo, Suspense, useDeferredValue, startTransition } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPostBySlug, fetchCompletedPosts, fetchPosts } from '../actions/postActions';
import { useParams } from 'react-router-dom';
import { slugify, truncateText } from './utils';

// Lazy-load components
const PriorityContent = React.lazy(() => import('./PriorityContent'));
const LowPriorityContent = React.lazy(() => import('./LowPriorityContent'));
const Sidebar = React.lazy(() => import('./Sidebar'));

const css = `
  .container { 
    display: flex; 
    min-height: 100vh; 
    flex-direction: row; 
    width: 100%; 
    max-width: 100%;
  }
  main { 
    flex: 1; 
    padding: 1rem; 
    background: #f4f4f9; 
    display: flex; 
    flex-direction: column; 
  }
  .skeleton { 
    width: 60%; 
    height: 2rem; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 0.75rem 0 1rem; 
  }
  .skeleton-image { 
    width: 100%; 
    max-width: 280px; 
    height: 157.5px; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 1rem 0; 
  }
  .skeleton-meta { 
    width: 40%; 
    height: 1rem; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 0.5rem 0; 
  }
  .skeleton-content { 
    width: 100%; 
    height: 200px; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 0.5rem 0; 
  }
  .loading-overlay { 
    display: flex; 
    justify-content: center; 
    align-items: center; 
    background: rgba(0, 0, 0, 0.5); 
    min-height: 100vh; 
    width: 100%; 
  }
  .spinner { 
    width: 50px; 
    height: 50px; 
    border: 5px solid #2c3e50; 
    border-top: 5px solid transparent; 
    border-radius: 50%; 
    animation: spin 1s linear infinite; 
  }
  @keyframes spin { 
    0% { transform: rotate(0deg); } 
    100% { transform: rotate(360deg); } 
  }
  .placeholder { 
    width: 100%; 
    max-width: 280px; 
    height: 20px; 
    background: #e0e0e0; 
    display: flex; 
    align-items: center; 
    justify-content: center; 
    color: #666; 
    border-radius: 0.375rem; 
    font-size: 0.875rem; 
  }
  @media (min-width: 769px) {
    main { 
      margin-right: 250px; 
      padding: 2rem; 
    }
    .skeleton-image { 
      max-width: 480px; 
      height: 270px; 
    }
  }
  @media (max-width: 768px) {
    .container { 
      flex-direction: column; 
    }
    main {
      margin-right: 0;
    }
  }
  @media (max-width: 480px) {
    main { 
      padding: 0.5rem; 
    }
    .skeleton-image { 
      max-width: 240px; 
      height: 135px; 
    }
    .skeleton-content { 
      height: 150px; 
    }
  }
  @media (max-width: 320px) {
    main { 
      padding: 0.25rem; 
    }
    .skeleton-image { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .skeleton-content { 
      height: 120px; 
    }
  }
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(null);
  const deferredActiveSection = useDeferredValue(activeSection);
  const subtitlesListRef = useRef(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [structuredData, setStructuredData] = useState([]);
  const [readTime, setReadTime] = useState(0);

  const post = useSelector((state) => state.postReducer.post);
  const relatedPosts = useSelector(
    (state) =>
      state.postReducer.posts?.filter(
        (p) => p.postId !== post?.postId && p.category?.toLowerCase() === post?.category?.toLowerCase()
      ).slice(0, 3) || []
  );
  const completedPosts = useSelector((state) => state.postReducer.completedPosts || []);

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
        setHasFetched(true);
        // Defer non-critical fetches
        setTimeout(() => {
          Promise.all([dispatch(fetchPosts()), dispatch(fetchCompletedPosts())]);
        }, 2000); // Delay to prioritize LCP
      } catch (error) {
        console.error('Fetch post failed:', error);
        if (retries > 0) {
          setTimeout(() => fetchData(retries - 1), 1000);
        }
      }
    };
    fetchData();
  }, [dispatch, slug]);

  useEffect(() => {
    if (!post?.content) return;
    const calculate = () => {
      let totalText = post.content || '';
      if (post.summary) totalText += ' ' + post.summary;
      if (post.subtitles) {
        post.subtitles.forEach((sub) => {
          if (sub.title) totalText += ' ' + sub.title;
          if (sub.content) totalText += ' ' + sub.content;
          if (sub.bulletPoints) {
            sub.bulletPoints.forEach((bp) => {
              if (bp.text) totalText += ' ' + bp.text;
            });
          }
        });
      }
      const words = totalText.split(/\s+/).filter((w) => w).length;
      const time = Math.ceil(words / 200);
      setReadTime(time);
    };
    // Defer read time calculation
    setTimeout(calculate, 2000);
  }, [post]);

  useEffect(() => {
    if (!post) return;
    const generateStructuredData = () => {
      const pageTitle = `${post.title} | Zedemy, India`;
      const pageDescription = truncateText(post.summary || post.content, 160) || `Learn ${post.title?.toLowerCase() || ''} with Zedemy's tutorials.`;
      const pageKeywords = post.keywords
        ? `${post.keywords}, Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`
        : `Zedemy, ${post.category || ''}, ${post.title?.toLowerCase() || ''}`;
      const canonicalUrl = `https://zedemy.vercel.app/post/${slug}`;
      const ogImage = post.titleImage
        ? `${post.titleImage}?w=1200&format=avif&q=1`
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
      startTransition(() => setStructuredData(schemas));
    };
    // Defer structured data generation
    setTimeout(generateStructuredData, 2000);
  }, [post, slug, readTime]);

  if (!post && !hasFetched) {
    return (
      <div className="container">
        <style>{css}</style>
        <main>
          <div className="skeleton-image" />
          <div className="skeleton" />
          <div className="skeleton-meta" />
          <div className="skeleton-content" />
        </main>
        <div className="placeholder" style={{ height: '1200px', width: '250px' }}>Loading sidebar...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container">
        <style>{css}</style>
        <div className="loading-overlay" aria-live="polite">
          <div className="spinner" />
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <style>{css}</style>
      <main>
        <Suspense
          fallback={
            <>
              <div className="skeleton-image" />
              <div className="skeleton" />
              <div className="skeleton-meta" />
              <div className="skeleton-content" />
            </>
          }
        >
          <PriorityContent post={post} slug={slug} readTime={readTime} structuredData={structuredData} />
        </Suspense>
        {hasFetched && post && (
          <Suspense fallback={<div className="placeholder" style={{ height: '100px' }}>Loading additional content...</div>}>
            <LowPriorityContent
              post={post}
              relatedPosts={relatedPosts}
              completedPosts={completedPosts}
              dispatch={dispatch}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={deferredActiveSection}
              setActiveSection={setActiveSection}
              subtitlesListRef={subtitlesListRef}
            />
          </Suspense>
        )}
      </main>
      {hasFetched && post && (
        <Suspense fallback={<div className="placeholder" style={{ height: '1200px', width: '250px' }}>Loading sidebar...</div>}>
          <Sidebar
            post={post}
            isSidebarOpen={isSidebarOpen}
            setSidebarOpen={setSidebarOpen}
            activeSection={deferredActiveSection}
            scrollToSection={(id) => {
              const section = document.getElementById(id);
              if (section) {
                section.scrollIntoView({ behavior: 'smooth' });
                setActiveSection(id);
                if (isSidebarOpen) setSidebarOpen(false);
                const slugs = post.subtitles?.reduce(
                  (acc, s, i) => {
                    acc[`subtitle-${i}`] = slugify(s.title);
                    return acc;
                  },
                  post.summary ? { summary: 'summary' } : {}
                );
                if (slugs[id]) {
                  window.history.pushState(null, '', `#${slugs[id]}`);
                }
              }
            }}
            subtitlesListRef={subtitlesListRef}
          />
        </Suspense>
      )}
    </div>
  );
});

export default PostPage;
