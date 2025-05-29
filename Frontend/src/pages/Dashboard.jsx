import React, { useEffect, useState, useMemo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import LazyLoad from 'react-lazyload';
import { loadUser } from '../actions/authActions';
import { fetchUserPosts, fetchCompletedPosts } from '../actions/postActions';
import { fetchNotifications, followCategory, unfollowCategory, markNotificationAsRead, fetchFollowedCategories } from '../actions/notificationActions';
import { fetchCertificates } from '../actions/certificateActions';

// Reusable Styled Components
const BaseCard = styled(motion.div)`
  padding: 1.5rem;
  background: #4b5563;
  border-radius: 0.75rem;
  border: 2px solid transparent;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: #a855f7;
    box-shadow: 0 0 15px rgba(168, 85, 247, 0.4);
  }
`;

const BaseButton = styled.button`
  padding: 0.75rem;
  border-radius: 0.5rem;
  color: #ffffff;
  font-weight: 600;
  transition: background 0.2s ease;

  &:hover:not(:disabled) {
    filter: brightness(1.2);
  }

  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`;

// Main Styled Components
const DashboardContainer = styled.main`
  min-height: 100vh;
  background: #1a202c;
  padding: 2rem 1rem;
  overflow-x: hidden;
`;

const ContentWrapper = styled(motion.div)`
  max-width: 90rem;
  margin: 0 auto;
`;

const Header = styled(motion.h1)`
  font-size: 2.5rem;
  font-weight: 800;
  text-align: center;
  margin-bottom: 2rem;
  color: #c4b5fd;
`;

const UserInfo = styled(motion.section)`
  text-align: center;
  color: #d1d5db;
  margin-bottom: 2rem;
  font-size: 1.1rem;
  background: #2d3748;
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Section = styled(motion.section)`
  background: #2d3748;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  border: 1px solid #4b5563;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 700;
  color: #c4b5fd;
  margin-bottom: 1rem;
`;

const ScrollContainer = styled.div`
  max-height: 24rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #8b5cf6 #2d3748;

  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: #8b5cf6;
    border-radius: 3px;
  }
  &::-webkit-scrollbar-track {
    background: #2d3748;
  }
`;

const Card = styled(BaseCard)`
  margin-bottom: 1rem;
`;

const CardLink = styled(Link)`
  color: #60a5fa;
  font-weight: 600;
  text-decoration: none;

  &:hover, &:focus {
    text-decoration: underline;
    color: #93c5fd;
    outline: none;
  }
`;

const ExternalLink = styled.a`
  color: #60a5fa;
  font-weight: 600;
  text-decoration: none;

  &:hover, &:focus {
    text-decoration: underline;
    color: #93c5fd;
    outline: none;
  }
`;

const TextSm = styled.p`
  font-size: 0.875rem;
  color: #d1d5db;
  margin-top: 0.5rem;
`;

const PlaceholderText = styled.p`
  color: #9ca3af;
  font-style: italic;
`;

const CategoryButton = styled(BaseButton)`
  width: 100%;
  background: #8b5cf6;
`;

const CategoryCard = styled(BaseCard)`
  height: 5rem;
`;

const CategoryContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
`;

const UnfollowButton = styled.button`
  color: #f87171;
  font-weight: 600;
  background: none;
  border: none;

  &:hover, &:focus {
    color: #fca5a5;
    outline: none;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const ModalContent = styled(motion.div)`
  background: #2d3748;
  padding: 1.5rem;
  border-radius: 0.75rem;
  width: 90%;
  max-width: 24rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.4);
`;

const ModalTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 700;
  color: #c4b5fd;
  margin-bottom: 1rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem;
  background: #4b5563;
  border-radius: 0.5rem;
  color: #ffffff;
  margin-bottom: 1rem;
  outline: none;

  &:focus {
    box-shadow: 0 0 5px #a855f7;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
`;

const CancelButton = styled.button`
  color: #9ca3af;
  background: none;
  border: none;

  &:hover, &:focus {
    color: #d1d5db;
    outline: none;
  }
`;

const FollowButton = styled(BaseButton)`
  padding: 0.5rem 1rem;
  background: #8b5cf6;
`;

const NotificationCard = styled(BaseCard)`
  background: ${props => (props.isRead ? '#4b5563' : '#1e40af')};
`;

const ProgressGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ProgressSection = styled(Section)`
  @media (min-width: 768px) {
    grid-column: span 2;
  }
  @media (min-width: 1024px) {
    grid-column: span 1;
  }
`;

const Dashboard = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user, loading: authLoading, isAuthenticated, token } = useSelector(state => state.auth);
  const { userPosts, completedPosts, loading: postsLoading } = useSelector(state => state.postReducer);
  const { followedCategories, notifications } = useSelector(state => state.notifications);
  const { certificates } = useSelector(state => state.certificates);
  const [categoryInput, setCategoryInput] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [isDataLoading, setIsDataLoading] = useState(true);
  const API_BASE_URL = 'https://g3u06ptici.execute-api.ap-south-1.amazonaws.com/prod/api';
  const availableCategories = ['React', 'Node.js', 'AWS', 'Python', 'JavaScript', 'VS Code'];

  // Combined useEffect for auth initialization
  useEffect(() => {
    const initializeAuth = async () => {
      setIsDataLoading(true);
      const query = new URLSearchParams(location.search);
      const userParam = query.get('user');
      const tokenParam = query.get('token');

      try {
        if (userParam && tokenParam) {
          const userFromUrl = JSON.parse(decodeURIComponent(userParam));
          localStorage.setItem('user', JSON.stringify(userFromUrl));
          localStorage.setItem('token', tokenParam);
          dispatch({ type: 'FETCH_USER_SUCCESS', payload: { user: userFromUrl, token: tokenParam } });
        } else {
          const storedToken = localStorage.getItem('token');
          const storedUser = JSON.parse(localStorage.getItem('user'));
          if (storedToken && storedUser) {
            dispatch({ type: 'FETCH_USER_SUCCESS', payload: { user: storedUser, token: storedToken } });
          } else {
            await dispatch(loadUser());
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      }
    };

    initializeAuth();
  }, [dispatch, location.search]);

  // Fetch initial data when token and user are available
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!token || !user?._id) {
        setIsDataLoading(false);
        return;
      }

      try {
        await Promise.all([
          dispatch(fetchFollowedCategories()),
          dispatch(fetchUserPosts()),
          dispatch(fetchCompletedPosts()),
          dispatch(fetchNotifications()),
          dispatch(fetchCertificates()),
        ]);
      } catch (error) {
        console.error('Error fetching initial data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchInitialData();
  }, [dispatch, token, user]);

  // Fetch category totals
  useEffect(() => {
    const fetchCategoryTotals = async () => {
      if (!token || followedCategories.length === 0) return;

      try {
        const totals = {};
        for (const category of followedCategories) {
          const res = await axios.get(`${API_BASE_URL}/posts/category?category=${encodeURIComponent(category)}`, {
            headers: { 'x-auth-token': token },
          });
          totals[category] = res.data.length;
        }
        setCategoryTotals(totals);
      } catch (error) {
        console.error('Error fetching category totals:', error);
      }
    };

    if (!isDataLoading) {
      fetchCategoryTotals();
    }
  }, [followedCategories, token, isDataLoading]);

  // Memoized filtered posts and notifications
  const filteredUserPosts = useMemo(() => userPosts.filter(post => post.userId === user?._id), [userPosts, user]);
  const unreadNotifications = useMemo(() => notifications.filter(notif => !notif.isRead), [notifications]);

  const handleFollow = async () => {
    if (categoryInput && !followedCategories.includes(categoryInput)) {
      await dispatch(followCategory(categoryInput));
      try {
        const res = await axios.get(`${API_BASE_URL}/posts/category?category=${encodeURIComponent(categoryInput)}`, {
          headers: { 'x-auth-token': token },
        });
        setCategoryTotals(prev => ({ ...prev, [categoryInput]: res.data.length }));
      } catch (error) {
        console.error('Error fetching new category total:', error);
        setCategoryTotals(prev => ({ ...prev, [categoryInput]: 0 }));
      }
      setCategoryInput('');
      setIsCategoryModalOpen(false);
    }
  };

  const handleUnfollow = async (category) => {
    await dispatch(unfollowCategory(category));
    setCategoryTotals(prev => {
      const newTotals = { ...prev };
      delete newTotals[category];
      return newTotals;
    });
  };

  const handleMarkAsRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  // Animation variants
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };
  const cardVariants = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.4 } } };
  const progressVariants = {
    animate: (percent) => ({
      strokeDasharray: '251',
      strokeDashoffset: 251 - (251 * percent) / 100,
      transition: { duration: 1, ease: 'easeInOut' },
    }),
  };

  // Structured data for SEO
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Zedemy Dashboard',
    description: 'Personalized dashboard for Zedemy users to track learning progress, manage posts, certificates, and notifications.',
    url: 'https://zedemy.vercel.app/dashboard',
    publisher: {
      '@type': 'Organization',
      name: 'Zedemy',
      logo: {
        '@type': 'ImageObject',
        url: 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png',
      },
    },
  };

  if (authLoading || postsLoading || isDataLoading) {
    return <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem', padding: '2rem' }}>Loading...</div>;
  }
  if (!isAuthenticated || !token) {
    return <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem', padding: '2rem' }}>Please log in to view this page.</div>;
  }
  if (!user) {
    return <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem', padding: '2rem' }}>Error loading user data.</div>;
  }

  return (
    <>
      <Helmet>
        <html lang="en" />
        <title>Zedemy Dashboard - Track Your Learning Progress</title>
        <meta
          name="description"
          content="Manage your Zedemy learning journey: track posts, certificates, notifications, and progress in your personalized dashboard."
        />
        <meta
          name="keywords"
          content="Zedemy dashboard, learning progress, tech education, certificates, notifications, user posts, category tracking"
        />
        <meta name="author" content="Sanjay Patidar" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" type="image/png" />
        <link rel="canonical" href="https://zedemy.vercel.app/dashboard" />
        <link rel="preload" as="image" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />
        <meta property="og:title" content="Zedemy Dashboard - Track Your Learning Progress" />
        <meta
          property="og:description"
          content="Manage your Zedemy learning journey: track posts, certificates, notifications, and progress."
        />
        <meta property="og:image" content="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <meta property="og:url" content="https://zedemy.vercel.app/dashboard" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Zedemy Dashboard - Track Your Learning Progress" />
        <meta name="twitter:image" content="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <DashboardContainer role="main" aria-label="User Dashboard">
        <ContentWrapper variants={containerVariants} initial="hidden" animate="visible">
          <Header variants={itemVariants}>Welcome, {user.name}!</Header>
          <UserInfo variants={itemVariants}>
            <p>Email: {user.email}</p>
            <p>Role: {user.role}</p>
          </UserInfo>

          <Grid>
            {/* User Posts */}
            <Section variants={itemVariants} aria-labelledby="user-posts">
              <SectionTitle id="user-posts">Your Creations</SectionTitle>
              {filteredUserPosts.length === 0 ? (
                <PlaceholderText>No posts yet—create something amazing!</PlaceholderText>
              ) : (
                <ScrollContainer>
                  {filteredUserPosts.map(post => (
                    <Card key={post.postId} variants={cardVariants} whileHover={{ scale: 1.03 }}>
                      <CardLink to={`/post/${post.slug}`}>{post.title}</CardLink>
                      <TextSm>{post.content.slice(0, 80)}...</TextSm>
                    </Card>
                  ))}
                </ScrollContainer>
              )}
            </Section>

            {/* Categories Explorer */}
            <Section variants={itemVariants} aria-labelledby="categories">
              <SectionTitle id="categories">Explore Categories</SectionTitle>
              <CategoryButton onClick={() => setIsCategoryModalOpen(true)} aria-label="Add a new category">
                Add Category
              </CategoryButton>
              {followedCategories.length === 0 ? (
                <PlaceholderText style={{ marginTop: '1rem' }}>Follow categories to start exploring!</PlaceholderText>
              ) : (
                <ScrollContainer style={{ marginTop: '1rem' }}>
                  {followedCategories.map(category => (
                    <CategoryCard key={category} variants={cardVariants} whileHover={{ scale: 1.03 }}>
                      <CategoryContent>
                        <CardLink to={`/category/${category}`}>{category}</CardLink>
                        <UnfollowButton onClick={() => handleUnfollow(category)} aria-label={`Unfollow ${category}`}>
                          Unfollow
                        </UnfollowButton>
                      </CategoryContent>
                    </CategoryCard>
                  ))}
                </ScrollContainer>
              )}
              <AnimatePresence>
                {isCategoryModalOpen && (
                  <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ModalContent initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                      <ModalTitle>Follow a Category</ModalTitle>
                      <Input
                        type="text"
                        value={categoryInput}
                        onChange={(e) => setCategoryInput(e.target.value)}
                        placeholder="Enter category name"
                        list="category-suggestions"
                        aria-label="Category name"
                      />
                      <datalist id="category-suggestions">
                        {availableCategories.map(cat => <option key={cat} value={cat} />)}
                      </datalist>
                      <ButtonGroup>
                        <CancelButton onClick={() => setIsCategoryModalOpen(false)} aria-label="Cancel">Cancel</CancelButton>
                        <FollowButton
                          onClick={handleFollow}
                          disabled={!categoryInput || followedCategories.includes(categoryInput)}
                          aria-label="Follow category"
                        >
                          Follow
                        </FollowButton>
                      </ButtonGroup>
                    </ModalContent>
                  </ModalOverlay>
                )}
              </AnimatePresence>
            </Section>

            {/* Completed Posts */}
            <LazyLoad height={300} offset={100} once>
              <Section variants={itemVariants} aria-labelledby="completed-posts">
                <SectionTitle id="completed-posts">Completed Journeys</SectionTitle>
                {completedPosts.length === 0 ? (
                  <PlaceholderText>No completed posts yet—keep learning!</PlaceholderText>
                ) : (
                  <ScrollContainer>
                    {completedPosts.map(post => (
                      <Card key={post.postId} variants={cardVariants} whileHover={{ scale: 1.03 }}>
                        <span style={{ color: '#60a5fa' }}>{post.title}</span>
                        <TextSm>Category: {post.category}</TextSm>
                      </Card>
                    ))}
                  </ScrollContainer>
                )}
              </Section>
            </LazyLoad>

            {/* Notifications */}
            <LazyLoad height={300} offset={100} once>
              <Section variants={itemVariants} aria-labelledby="notifications">
                <SectionTitle id="notifications">Updates ({unreadNotifications.length} unread)</SectionTitle>
                {notifications.length === 0 ? (
                  <PlaceholderText>No updates yet.</PlaceholderText>
                ) : (
                  <ScrollContainer>
                    {notifications.slice(0, 5).map(notif => (
                      <NotificationCard
                        key={notif.notificationId}
                        isRead={notif.isRead}
                        drag="x"
                        dragConstraints={{ left: -100, right: 0 }}
                        onDragEnd={(e, { offset }) => { if (offset.x < -50) handleMarkAsRead(notif.notificationId); }}
                        variants={cardVariants}
                        whileHover={{ scale: 1.03 }}
                      >
                        <TextSm>{notif.message}</TextSm>
                        <TextSm>{new Date(notif.createdAt).toLocaleString()}</TextSm>
                      </NotificationCard>
                    ))}
                  </ScrollContainer>
                )}
                <CardLink to="/notifications" style={{ display: 'block', marginTop: '1rem' }} aria-label="View all notifications">
                  See All
                </CardLink>
              </Section>
            </LazyLoad>

            {/* Certificates */}
            <LazyLoad height={300} offset={100} once>
              <Section variants={itemVariants} aria-labelledby="certificates">
                <SectionTitle id="certificates">Your Achievements</SectionTitle>
                {certificates.length === 0 ? (
                  <PlaceholderText>No certificates yet—complete a category!</PlaceholderText>
                ) : (
                  <ScrollContainer>
                    {certificates.map(cert => (
                      <Card key={cert.certificateId} variants={cardVariants} whileHover={{ scale: 1.03 }}>
                        <ExternalLink href={cert.filePath} target="_blank" rel="noopener noreferrer">
                          {cert.category} Certificate
                        </ExternalLink>
                        <TextSm>Earned: {new Date(cert.createdAt).toLocaleDateString()}</TextSm>
                        <TextSm>Unique ID: {cert.uniqueId}</TextSm>
                      </Card>
                    ))}
                  </ScrollContainer>
                )}
              </Section>
            </LazyLoad>

            {/* Progress Tracker */}
            <ProgressSection variants={itemVariants} aria-labelledby="progress">
              <SectionTitle id="progress">Learning Progress</SectionTitle>
              {followedCategories.length === 0 ? (
                <PlaceholderText>Follow categories to see your progress!</PlaceholderText>
              ) : (
                <ProgressGrid>
                  {followedCategories.map(category => {
                    const completed = completedPosts.filter(p => p.category === category).length;
                    const total = categoryTotals[category] || 0;
                    const percent = total > 0 ? Math.round((completed / total) * 100) : completed > 0 ? 100 : 0;

                    return (
                      <div key={category} style={{ textAlign: 'center' }}>
                        <svg style={{ width: '5rem', height: '5rem', margin: '0 auto' }} viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" fill="none" stroke="#4B5563" strokeWidth="8" />
                          <motion.circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#8B5CF6"
                            strokeWidth="8"
                            custom={percent}
                            variants={progressVariants}
                            initial={{ strokeDashoffset: 251 }}
                            animate="animate"
                            style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                          />
                          <text x="50" y="55" textAnchor="middle" fill="#e2e8f0" fontSize="18">{percent}%</text>
                        </svg>
                        <p style={{ marginTop: '0.5rem', color: '#d1d5db' }}>{category}</p>
                        <TextSm>{completed}/{total}</TextSm>
                      </div>
                    );
                  })}
                </ProgressGrid>
              )}
            </ProgressSection>
          </Grid>
        </ContentWrapper>
      </DashboardContainer>
    </>
  );
};

export default Dashboard;
