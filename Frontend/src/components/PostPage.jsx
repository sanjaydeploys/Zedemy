import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPostSSR } from '../actions/postActions';

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const postData = window.__POST_DATA__ || {};
  const error = useSelector((state) => state.postReducer.error);
  const [ssrHtml, setSsrHtml] = useState('');

  useEffect(() => {
    if (!window.__POST_DATA__) {
      dispatch(fetchPostSSR(slug)).then(({ html }) => {
        setSsrHtml(html);
      }).catch(() => {
        setSsrHtml('');
      });
    }
  }, [slug, dispatch]);

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
            <div style={{ color: '#d32f2f', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem', background: '#ffebee', borderRadius: '0.25rem', margin: 0, minHeight: '50px' }}>
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
        <meta name="description" content={(postData.preRenderedContent || '').slice(0, 160)} />
        <meta name="keywords" content={`${postData.category || 'General'}, Zedemy`} />
        <meta name="author" content={postData.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={postData.title || 'Loading...'} />
        <meta property="og:description" content={(postData.preRenderedContent || '').slice(0, 160)} />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        {postData.titleImage && <meta property="og:image" content={`${postData.titleImage.replace('q=30', 'q=50')}`} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={postData.title || 'Loading...'} />
        <meta name="twitter:description" content={(postData.preRenderedContent || '').slice(0, 160)} />
        {postData.titleImage && <meta name="twitter:image" content={`${postData.titleImage.replace('q=30', 'q=50')}`} />}
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://d2rq30ca0zyvzp.cloudfront.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {postData.titleImage && <link rel="preload" as="image" href={`${postData.titleImage}`} fetchPriority="high" media="(max-width: 767px)" />}
        {postData.titleImage && <link rel="preload" as="image" href={`${postData.titleImage.replace('w=240', 'w=280')}`} fetchPriority="high" media="(min-width: 768px)" />}
      </Helmet>
      <div id="root" dangerouslySetInnerHTML={{ __html: ssrHtml || document.getElementById('root')?.innerHTML || '' }} />
    </HelmetProvider>
  );
});

export default PostPage;
