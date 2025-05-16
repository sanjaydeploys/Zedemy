import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPostSSR, markPostAsCompleted, fetchCompletedPosts } from '../actions/postActions';
import styled from 'styled-components';
import { toast } from 'react-toastify';
import LazyLoad from 'react-lazyload';
import { RelatedPosts } from './RelatedPosts';
import { truncateText, slugify, parseLinks, escapeHTML } from './utils';

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  grid-template-columns: 1fr 250px;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 0.5rem;
  }
`;

const MainContent = styled.main`
  max-width: 100%;
`;

const TitleImage = styled.img`
  width: 100%;
  max-width: 800px;
  height: auto;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  object-fit: cover;
  aspect-ratio: 16 / 9;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const CompleteButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 1rem;
  padding: 0.75rem 1.5rem;
  background: #2c3e50;
  color: #ecf0f1;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1rem;
  z-index: 2000;
  transition: background 0.2s ease;

  &.completed, &:disabled {
    background: #27ae60;
    cursor: not-allowed;
  }

  &:hover:not(:disabled), &:focus:not(:disabled) {
    background: #34495e;
    outline: none;
  }

  @media (max-width: 768px) {
    bottom: 1rem;
    right: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
  }
`;

const SidebarWrapper = styled.aside`
  display: block;

  @media (max-width: 768px) {
    width: 0;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    transition: width 0.3s;
    z-index: 1000;
    overflow: hidden;
    height: auto;

    &.open {
      width: min(100%, 300px);
    }
  }
`;

const ToggleButton = styled.button`
  display: none;

  @media (max-width: 768px) {
    display: block;
    background: #d32f2f;
    color: #ffffff;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    position: fixed;
    top: 0.5rem;
    left: 0.5rem;
    z-index: 1010;
    border-radius: 0.25rem;

    &:hover, &:focus {
      background: #b71c1c;
      outline: none;
    }
  }
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const postData = window.__POST_DATA__ || {};
  const error = useSelector((state) => state.postReducer.error);
  const completedPosts = useSelector((state) => state.postReducer.completedPosts || []);
  const isCompleted = completedPosts.some((cp) => cp.postId === postData.postId);
  const [ssrHtml, setSsrHtml] = useState('');

  useEffect(() => {
    dispatch(fetchCompletedPosts());
    if (!window.__POST_DATA__) {
      dispatch(fetchPostSSR(slug))
        .then(({ html }) => {
          setSsrHtml(html);
        })
        .catch(() => {
          setSsrHtml('');
        });
    }
  }, [slug, dispatch]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  const handleMarkAsCompleted = () => {
    if (!isCompleted && postData.postId) {
      dispatch(markPostAsCompleted(postData.postId));
    }
  };

  if (error || (!postData.title && !ssrHtml)) {
    return (
      <HelmetProvider>
        <Helmet>
          <html lang="en" />
          <title>Error | Zedemy</title>
          <meta name="description" content="An error occurred while loading the post." />
          <meta name="keywords" content="Zedemy" />
          <meta name="author" content="Zedemy Team" />
          <meta name="robots" content="noindex" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        </Helmet>
        <div className="container">
          <main>
            <div
              style={{
                color: '#d32f2f',
                fontSize: '0.875rem',
                textAlign: 'center',
                padding: '0.5rem',
                background: '#ffebee',
                borderRadius: '0.25rem',
                margin: 0,
                minHeight: '50px',
              }}
            >
              Failed to load the post: {error || 'Not found'}. Please try again later.
            </div>
          </main>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{postData.title || 'Loading...'} | Zedemy</title>
        <meta
          name="description"
          content={truncateText(postData.summary || postData.preRenderedContent || '', 160)}
        />
        <meta
          name="keywords"
          content={
            postData.keywords ||
            `${postData.category || 'General'}, Zedemy, ${postData.title?.toLowerCase() || 'tech tutorials'}`
          }
        />
        <meta name="author" content={postData.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={postData.title || 'Loading...'} />
        <meta
          property="og:description"
          content={truncateText(postData.summary || postData.preRenderedContent || '', 160)}
        />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        <meta
          property="og:image"
          content={
            postData.titleImage
              ? `${postData.titleImage}?w=1200&format=avif&q=50`
              : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'
          }
        />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postData.title || 'Loading...'} />
        <meta
          name="twitter:description"
          content={truncateText(postData.summary || postData.preRenderedContent || '', 160)}
        />
        <meta
          name="twitter:image"
          content={
            postData.titleImage
              ? `${postData.titleImage}?w=1200&format=avif&q=50`
              : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'
          }
        />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://d2rq30ca0zyvzp.cloudfront.net" crossOrigin="anonymous" />
        <link
          rel="preconnect"
          href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com"
          crossOrigin="anonymous"
        />
        {postData.titleImage && (
          <>
            <link
              rel="preload"
              as="image"
              href={`${postData.titleImage}?w=280&format=avif&q=50`}
              fetchPriority="high"
              media="(max-width: 767px)"
            />
            <link
              rel="preload"
              as="image"
              href={`${postData.titleImage}?w=480&format=avif&q=50`}
              fetchPriority="high"
              media="(min-width: 768px)"
            />
          </>
        )}
      </Helmet>
      <Container>
        <MainContent role="main" aria-label="Main content">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <a href="/" aria-label="Home">
              Home
            </a>{' '}
            &gt;{' '}
            <a
              href={`/category/${postData.category?.toLowerCase() || 'blog'}`}
              aria-label={`Explore ${postData.category || 'Blog'}`}
            >
              {postData.category || 'Blog'}
            </a>{' '}
            &gt; <span>{postData.title || 'Untitled'}</span>
          </nav>
          <h1>{postData.title || 'Untitled'}</h1>
          {postData.titleImage && (
            <LazyLoad height={200} offset={100} once>
              <TitleImage
                src={`${postData.titleImage}?w=800&format=avif&q=50`}
                srcSet={`${postData.titleImage}?w=400&format=avif&q=50 400w, ${postData.titleImage}?w=600&format=avif&q=50 600w, ${postData.titleImage}?w=800&format=avif&q=50 800w`}
                sizes="(max-width: 480px) 400px, (max-width: 768px) 600px, 800px"
                alt={`Featured image for ${postData.title || 'post'}`}
                loading="eager"
                decoding="sync"
                fetchpriority="high"
              />
            </LazyLoad>
          )}
          <div
            className="post-content"
            dangerouslySetInnerHTML={{ __html: ssrHtml || postData.preRenderedContent || '' }}
          />
          {postData.relatedPosts?.length > 0 && <RelatedPosts relatedPosts={postData.relatedPosts} />}
          <CompleteButton
            className={isCompleted ? 'completed' : ''}
            onClick={handleMarkAsCompleted}
            disabled={isCompleted}
            aria-label={isCompleted ? 'Post already marked as completed' : 'Mark post as completed'}
          >
            {isCompleted ? 'Completed' : 'Mark as Completed'}
          </CompleteButton>
        </MainContent>
        <SidebarWrapper id="sidebar-wrapper" className={isSidebarOpen ? 'open' : ''}>
          <ToggleButton onClick={toggleSidebar} aria-label="Toggle sidebar">
            Menu
          </ToggleButton>
          <div className="sidebar" dangerouslySetInnerHTML={{ __html: renderSidebar(postData) }} />
        </SidebarWrapper>
      </Container>
    </HelmetProvider>
  );
});

// Client-side renderSidebar to match SSR
const renderSidebar = (post) => {
  const subtitles = post.subtitles || [];
  const slugs = subtitles.reduce((acc, s, i) => {
    acc[`subtitle-${i}`] = slugify(s.title || `Section ${i + 1}`);
    return acc;
  }, post.summary ? { summary: 'summary' } : {});
  return `
    <aside id="sidebar" class="sidebar">
      <div class="sidebar-header">Contents</div>
      <ul class="sidebar-list">
        ${
          subtitles.length === 0
            ? `
          <div class="sidebar-empty">No sections available</div>
        `
            : subtitles
                .map(
                  (subtitle, index) => `
          <li class="sidebar-item" data-section="subtitle-${index}">
            <a href="#${slugs[`subtitle-${index}`]}" class="sidebar-link" onclick="scrollToSection('subtitle-${index}'); return false;" aria-label="Navigate to ${escapeHTML(
              subtitle.title || `Section ${index + 1}`,
            )}">${parseLinks(escapeHTML(subtitle.title || `Section ${index + 1}`), post.category || '')}</a>
          </li>
        `,
                )
                .join('')
        }
        ${
          post.summary
            ? `
          <li class="sidebar-item" data-section="summary">
            <a href="#summary" class="sidebar-link" onclick="scrollToSection('summary'); return false;" aria-label="Navigate to summary">Summary</a>
          </li>
        `
            : ''
        }
      </ul>
    </aside>
  `;
};

export default PostPage;
