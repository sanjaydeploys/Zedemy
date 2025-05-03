import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../actions/postActions';
import { Link, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import '../styles/CategoryPage.css';

// Lazy-load ChatWindow
const ChatWindow = lazy(() => import('./ChatWindow'));

// Memoized PostItem to prevent unnecessary re-renders
const PostItem = React.memo(({ post, style, fallbackImage }) => (
  <motion.div
    style={style}
    className="post-item"
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <Link to={`/post/${post.slug}`} className="post-link">
      <div className="post-title-container">
        <img
          src={post.titleImage || fallbackImage}
          alt={`${post.title} thumbnail`}
          className="post-image"
          loading="lazy"
        />
        <h3 className="post-title">{post.title}</h3>
      </div>
    </Link>
  </motion.div>
));

const CategoryPage = () => {
  const { category } = useParams();
  const dispatch = useDispatch();
  const posts = useSelector(state => state.postReducer.posts);
  const [chatWindows, setChatWindows] = useState([]);

  // Fetch posts only once
  useEffect(() => {
    dispatch(fetchPosts());
  }, [dispatch]);

  // Normalize and memoize filtered posts
  const filteredPosts = useMemo(() => {
    console.log('Raw posts from Redux:', posts);
    console.log('Category from useParams:', category);
    return posts.filter(
      post => post.category?.toLowerCase() === category.toLowerCase()
    );
  }, [posts, category]);

  console.log('Filtered Posts for category', category, ':', filteredPosts);

  // Memoized getRelatedPosts
  const getRelatedPosts = useCallback((currentPostId) => {
    console.log('getRelatedPosts called with postId:', currentPostId);
    const related = filteredPosts
      .filter(
        post =>
          post.postId &&
          post.postId !== currentPostId &&
          post.title &&
          post.slug
      )
      .slice(0, 3);
    console.log('Related posts:', related);
    return related;
  }, [filteredPosts]);

  // Memoized event handlers
  const openNewChat = useCallback(() => {
    const newId = chatWindows.length + 1;
    const newPosition = {
      top: 100 + newId * 20,
      left: 100 + newId * 20,
    };
    setChatWindows(prev => [...prev, { id: newId, position: newPosition }]);
  }, [chatWindows.length]);

  const closeChat = useCallback((id) => {
    setChatWindows(prev => prev.filter(chat => chat.id !== id));
  }, []);

  if (!posts) {
    return <div>Loading...</div>;
  }

  // SEO metadata
  const capitalizedCategory = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
  const metaTitle = `Learn ${capitalizedCategory} - Zedemy by Sanjay Patidar`;
  const metaDescription = `Explore ${capitalizedCategory} courses on Zedemy, founded by Sanjay Patidar. Learn, code, and grow with our modern educational platform.`;
  const canonicalUrl = `https://zedemy.vercel.app/category/${category}`;
  const fallbackImage = 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png';

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${capitalizedCategory} Category`,
    description: metaDescription,
    url: canonicalUrl,
    publisher: {
      '@type': 'Organization',
      name: 'Zedemy',
      founder: {
        '@type': 'Person',
        name: 'Sanjay Patidar',
      },
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: filteredPosts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'CreativeWork',
          name: post.title,
          url: `https://zedemy.vercel.app/post/${post.slug}`,
          image: post.titleImage || fallbackImage,
          relatedLink: getRelatedPosts(post.postId).map(relatedPost => ({
            '@type': 'CreativeWork',
            name: relatedPost.title,
            url: `https://zedemy.vercel.app/post/${relatedPost.slug}`,
          })),
        },
      })),
    },
  };

  console.log('Structured Data:', structuredData);

  return (
    <motion.div
      className="category-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1 }}
    >
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <meta
          name="keywords"
          content={`${category.toLowerCase()}, zedemy, sanjay patidar, online learning, coding, education, courses`}
        />
        <meta name="author" content="Sanjay Patidar" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metaTitle} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={fallbackImage} />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={metaTitle} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={fallbackImage} />
        <link rel="icon" type="image/png" href={fallbackImage} />
        <link rel="sitemap" type="application/xml" href="/sitemap.xml" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <nav className="breadcrumbs">
        <Link to="/">Home</Link> &gt; <span>{capitalizedCategory}</span>
      </nav>
      <h2 className="category-title">Category: {capitalizedCategory}</h2>
      {filteredPosts.length === 0 ? (
        <p className="no-posts">No posts found in this category personally tailored by us.</p>
      ) : (
        <div className="post-list">
          <AnimatePresence>
            {filteredPosts.map((post, index) => (
              <PostItem
                key={post.postId}
                post={post}
                style={{}} // CSS animations handle transitions
                fallbackImage={fallbackImage}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
      <button className="chat-toggle-btn" onClick={openNewChat}>
        Open AI Help
      </button>
      <Suspense fallback={<div>Loading chat...</div>}>
        {chatWindows.map(chat => (
          <ChatWindow
            key={chat.id}
            id={chat.id}
            category={category}
            filteredPosts={filteredPosts}
            onClose={() => closeChat(chat.id)}
            initialPosition={chat.position}
          />
        ))}
      </Suspense>
    </motion.div>
  );
};

export default React.memo(CategoryPage);
