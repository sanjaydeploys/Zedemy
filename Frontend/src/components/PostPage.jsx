import React, { memo, Suspense, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Sidebar from './Sidebar';
import { useSelector } from 'react-redux';

const PostContentNonCritical = React.lazy(() => import('./PostContentNonCritical'));
const StructuredData = React.lazy(() => import('./StructuredData'));

const PostPage = memo(() => {
  const { slug } = useParams();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const initialPostData = window.__POST_DATA__ || {};
  const relatedPosts = window.__RELATED_POSTS__ || [];
  const completedPosts = window.__COMPLETED_POSTS__ || [];
  const readTime = initialPostData.readTime || 1;
  const error = useSelector((state) => state.postReducer.error);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setActiveSection(sectionId);
      setSidebarOpen(false);
    }
  };

  if (error) {
    console.log('[PostPage] Rendering error state:', error);
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
            <div style={{ color: '#d32f2f', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem', background: '#ffebee', borderRadius: '0.25rem', margin: 0, minHeight: '50px' }}>
              Failed to load the post: {error}. Please try again later.
            </div>
          </main>
        </div>
      </HelmetProvider>
    );
  }

  if (!initialPostData.title) {
    return (
      <HelmetProvider>
        <Helmet>
          <html lang="en" />
          <title>Loading... | Zedemy</title>
          <meta name="description" content="Loading post content..." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Helmet>
        <div className="container">
          <main>
            <div style={{ minHeight: '600px', background: '#e0e0e0', borderRadius: '0.375rem' }} />
          </main>
        </div>
      </HelmetProvider>
    );
  }

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{initialPostData.title} | Zedemy</title>
        <meta name="description" content={(initialPostData.preRenderedContent || '').slice(0, 160)} />
        <meta name="keywords" content={`${initialPostData.category || 'General'}, Zedemy`} />
        <meta name="author" content={initialPostData.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={initialPostData.title} />
        <meta property="og:description" content={(initialPostData.preRenderedContent || '').slice(0, 160)} />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        {initialPostData.titleImage && <meta property="og:image" content={`${initialPostData.titleImage.replace('q=30', 'q=50')}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={initialPostData.title} />
        <meta name="twitter:description" content={(initialPostData.preRenderedContent || '').slice(0, 160)} />
        {initialPostData.titleImage && <meta name="twitter:image" content={`${initialPostData.titleImage.replace('q=30', 'q=50')}`} />}
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://d2rq30ca0zyvzp.cloudfront.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {initialPostData.titleImage && <link rel="preload" as="image" href={`${initialPostData.titleImage}`} fetchPriority="high" media="(max-width: 767px)" />}
        {initialPostData.titleImage && <link rel="preload" as="image" href={`${initialPostData.titleImage.replace('w=240', 'w=280')}`} fetchPriority="high" media="(min-width: 768px)" />}
      </Helmet>
      <div className="container">
        <main role="main" aria-label="Main content">
          <div id="priority-content" style={{ minHeight: '600px' }} />
          <Suspense fallback={<div style={{ height: '200px', background: '#e0e0e0', borderRadius: '0.375rem', width: '100%' }} />}>
            <div id="non-critical-content">
              <PostContentNonCritical
                post={initialPostData}
                relatedPosts={relatedPosts}
                completedPosts={completedPosts}
              />
            </div>
          </Suspense>
        </main>
        <aside id="sidebar" className={`sidebar-wrapper ${isSidebarOpen ? 'open' : ''}`}>
          <Suspense fallback={<div style={{ height: '600px', background: '#e0e0e0', borderRadius: '0.375rem', width: '100%' }} />}>
            <Sidebar
              post={initialPostData}
              isSidebarOpen={isSidebarOpen}
              setSidebarOpen={setSidebarOpen}
              activeSection={activeSection}
              scrollToSection={scrollToSection}
            />
          </Suspense>
        </aside>
        <Suspense fallback={null}>
          <StructuredData post={initialPostData} readTime={readTime} slug={slug} />
        </Suspense>
      </div>
    </HelmetProvider>
  );
});

export default PostPage;
