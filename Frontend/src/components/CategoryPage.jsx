import React, { useEffect, useState, useCallback, useMemo, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts, markPostAsCompleted, fetchCompletedPosts } from '../actions/postActions';
import { loadUser } from '../actions/authActions'; // Import loadUser
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { toast } from 'react-toastify';
import '../styles/CategoryPage.css';

// Lazy-load ChatWindow
const ChatWindow = lazy(() => import('./ChatWindow'));

// Memoized PostItem
const PostItem = React.memo(({ post, fallbackImage }) => {
  const dispatch = useDispatch();
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);
  const isCompleted = completedPosts.some(cp => cp.postId === post.postId);

  const handleMarkAsCompleted = () => {
    if (!post?.postId) {
      console.error('[PostItem] Invalid postId:', post);
      toast.error('Cannot mark post as completed: Invalid post ID.', { position: 'top-right', autoClose: 2000 });
      return;
    }
    if (!isCompleted) {
      console.log('[PostItem] Marking post as completed:', post.postId);
      dispatch(markPostAsCompleted(post.postId));
    }
  };

  const handlePostClick = () => {
    console.log('[PostItem] Navigating to post:', post.slug);
    window.location.href = `/post/${post.slug}`; // Force full page reload
  };

  return (
    <motion.div
      className="post-item"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="post-content">
        <a href={`/post/${post.slug}`} onClick={handlePostClick} className="post-link">
          <div className="post-title-container">
            <img
              src={post.titleImage || fallbackImage}
              alt={`${post.title} thumbnail`}
              className="post-image"
              loading="lazy"
            />
            <h3 className="post-title">{post.title}</h3>
          </div>
        </a>
        <button
          className={`complete-button ${isCompleted ? 'completed' : ''}`}
          onClick={handleMarkAsCompleted}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Post already marked as completed' : 'Mark post as completed'}
        >
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </button>
      </div>
    </motion.div>
  );
});

const CategoryPage = () => {
  const { category } = useParams();
  const dispatch = useDispatch();
  const posts = useSelector(state => state.postReducer.posts || []);
  const { user, isAuthenticated, loading: authLoading } = useSelector(state => state.auth);
  const [chatWindows, setChatWindows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Ensure user is loaded
        await dispatch(loadUser());
        await Promise.all([
          dispatch(fetchPosts()),
          dispatch(fetchCompletedPosts())
        ]);
      } catch (error) {
        console.error('[CategoryPage] Error fetching data:', error);
        toast.error('Failed to load category data.', { position: 'top-right', autoClose: 2000 });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch]);

  const filteredPosts = useMemo(() => {
    console.log('[CategoryPage] Raw posts from Redux:', posts);
    console.log('[CategoryPage] Category from useParams:', category);
    return posts.filter(
      post => post.category?.toLowerCase() === category?.toLowerCase() && post.postId && post.slug
    );
  }, [posts, category]);

  console.log('[CategoryPage] Filtered Posts for category', category, ':', filteredPosts);

  const getRelatedPosts = useCallback((currentPostId) => {
    console.log('[CategoryPage] getRelatedPosts called with postId:', currentPostId);
    const related = filteredPosts
      .filter(
        post =>
          post.postId &&
          post.postId !== currentPostId &&
          post.title &&
          post.slug
      )
      .slice(0, 3);
    console.log('[CategoryPage] Related posts:', related);
    return related;
  }, [filteredPosts]);

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

  if (authLoading || isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>Please log in to view this page.</div>;
  }

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

  console.log('[CategoryPage] Structured Data:', structuredData);
  console.log('[CategoryPage] User:', user);

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
        <a href="/" onClick={() => window.location.href = '/'}>Home</a> <span>{capitalizedCategory}</span>
      </nav>
      <h2 className="category-title">Category: {capitalizedCategory}</h2>
      {filteredPosts.length === 0 ? (
        <p className="no-posts">No posts found in this category personally tailored by us.</p>
      ) : (
        <div className="post-list">
          <AnimatePresence>
            {filteredPosts.map(post => (
              <PostItem
                key={post.postId}
                post={post}
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
