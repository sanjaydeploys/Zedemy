import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import styled from 'styled-components';
import axios from 'axios';
import { loadUser } from '../actions/authActions';
import { fetchUserPosts, fetchCompletedPosts } from '../actions/postActions';
import { fetchNotifications, followCategory, unfollowCategory, markNotificationAsRead, fetchFollowedCategories } from '../actions/notificationActions';
import { fetchCertificates } from '../actions/certificateActions';

// Styled Components
const DashboardContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a202c, #2d3748);
    padding: 4rem 1rem;
  overflow: hidden;
  position: relative;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 50% 20%, rgba(124, 58, 237, 0.2), transparent 70%);
    z-index: 0;
  }
`;

const ContentWrapper = styled(motion.div)`
  max-width: 90rem;
  margin: 0 auto;
  position: relative;
  z-index: 1;
`;

const Header = styled(motion.h1)`
  font-size: 3rem;
  font-weight: 900;
  text-align: center;
  margin-bottom: 3rem;
  background: linear-gradient(90deg, #a855f7, #ec4899, #3b82f6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
`;

const UserInfo = styled(motion.div)`
  text-align: center;
  color: #94a3b8;
  margin-bottom: 4rem;
  font-size: 1.25rem;
  background: rgba(31, 41, 55, 0.8);
  padding: 1rem;
  border-radius: 1rem;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 2.5rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const Section = styled(motion.section)`
  background: #2d3748;
  padding: 2rem;
  border-radius: 1rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  border: 1px solid #4b5563;
  position: relative;
  overflow: hidden;

  &:after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(124, 58, 237, 0.1), transparent 70%);
    pointer-events: none;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  font-weight: 700;
  color: #c4b5fd;
  margin-bottom: 1.5rem;
  text-shadow: 0 0 10px rgba(196, 181, 253, 0.3);
`;

const ScrollContainer = styled.div`
  max-height: 28rem;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #8b5cf6 #2d3748;

  &::-webkit-scrollbar {
    width: 8px;
  }
  &::-webkit-scrollbar-thumb {
    background: #8b5cf6;
    border-radius: 4px;
  }
  &::-webkit-scrollbar-track {
    background: #2d3748;
  }
`;

const Card = styled(motion.div)`
  padding: 1.5rem;
  background: linear-gradient(45deg, #4b5563, #6b7280);
  border-radius: 0.75rem;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    border-color: #a855f7;
    box-shadow: 0 0 20px rgba(168, 85, 247, 0.5);
  }

  &:before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(168, 85, 247, 0.2), transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover:before {
    opacity: 1;
  }
`;

const CardLink = styled(Link)`
  color: #60a5fa;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
    color: #93c5fd;
  }
`;

const ExternalLink = styled.a`
  color: #60a5fa;
  font-weight: 600;
  &:hover {
    text-decoration: underline;
    color: #93c5fd;
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

const CategoryButton = styled.button`
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(to right, #8b5cf6, #3b82f6);
  border-radius: 0.5rem;
  color: #ffffff;
  font-weight: 600;
  &:hover {
    background: linear-gradient(to right, #a78bfa, #60a5fa);
  }
`;

const CategoryCard = styled(motion.div)`
  width: 100%;
  height: 6rem;
  background: #4b5563;
  border-radius: 0.5rem;
  transform-style: preserve-3d;
`;

const CategoryContent = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  backface-visibility: hidden;
`;

const UnfollowButton = styled.button`
  color: #f87171;
  font-weight: 600;
  &:hover {
    color: #fca5a5;
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
  padding: 2rem;
  border-radius: 1rem;
  width: 100%;
  max-width: 28rem;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.5);
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
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
  gap: 1rem;
`;

const CancelButton = styled.button`
  color: #9ca3af;
  &:hover {
    color: #d1d5db;
  }
`;

const FollowButton = styled.button`
  padding: 0.5rem 1rem;
  background: #8b5cf6;
  border-radius: 0.5rem;
  color: #ffffff;
  &:hover {
    background: #a78bfa;
  }
  &:disabled {
    background: #6b7280;
    cursor: not-allowed;
  }
`;

const NotificationCard = styled(motion.div)`
  padding: 1.5rem;
  border-radius: 0.75rem;
  background: ${props => (props.isRead ? '#4b5563' : '#1e40af')};
`;

const ProgressGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

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
  const [isDataLoading, setIsDataLoading] = useState(true); // New loading state
  const API_BASE_URL = 'https://urgwdthmkk.execute-api.ap-south-1.amazonaws.com/prod/api';
  const availableCategories = ['React', 'Node.js', 'AWS', 'Python', 'JavaScript', 'VS Code'];

  // Load auth state on mount
 // Handle URL parameters and initialize auth
 useEffect(() => {
  const initializeAuth = async () => {
    const query = new URLSearchParams(location.search);
    const userParam = query.get('user');
    const tokenParam = query.get('token');

    if (userParam && tokenParam) {
      try {
        const userFromUrl = JSON.parse(decodeURIComponent(userParam));
        localStorage.setItem('user', JSON.stringify(userFromUrl));
        localStorage.setItem('token', tokenParam);
        dispatch({ 
          type: 'FETCH_USER_SUCCESS', 
          payload: { user: userFromUrl, token: tokenParam } 
        });
      } catch (error) {
        console.error('Error parsing URL parameters:', error);
        await dispatch(loadUser());
      }
    } else {
      const storedToken = localStorage.getItem('token');
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedToken && storedUser) {
        dispatch({ 
          type: 'FETCH_USER_SUCCESS', 
          payload: { user: storedUser, token: storedToken } 
        });
      } else {
        await dispatch(loadUser());
      }
    }
  };
  initializeAuth();
}, [dispatch, location.search]);
  // Fetch initial data when token and user are available
  useEffect(() => {
    const fetchInitialData = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
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
        console.log('[Dashboard] Initial data fetched, followedCategories:', followedCategories);
      } catch (error) {
        console.error('[Dashboard] Error fetching initial data:', error);
      } finally {
        setIsDataLoading(false); // Set loading to false after fetch completes
      }
    };

    if (token && user?._id) {
      fetchInitialData();
    } else {
      setIsDataLoading(false);
    }
  }, [dispatch, token, user]);

  // Fetch category totals when followedCategories changes
  useEffect(() => {
    const fetchCategoryTotals = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken || followedCategories.length === 0) return;

      try {
        const totals = {};
        for (const category of followedCategories) {
          const res = await axios.get(`${API_BASE_URL}/posts/category?category=${encodeURIComponent(category)}`, {
            headers: { 'x-auth-token': storedToken },
          });
          totals[category] = res.data.length;
          console.log(`[Dashboard] Fetched total for ${category}: ${res.data.length}`);
        }
        setCategoryTotals(totals);
        console.log('[Dashboard] Category totals updated:', totals);
      } catch (error) {
        console.error('[Dashboard] Error fetching category totals:', error);
      }
    };

    if (!isDataLoading) {
      fetchCategoryTotals();
    }
  }, [followedCategories, token, isDataLoading]);

  const filteredUserPosts = userPosts.filter(post => post.userId === user?._id);
  const unreadNotifications = notifications.filter(notif => !notif.isRead);

  const handleFollow = async () => {
    if (categoryInput && !followedCategories.includes(categoryInput)) {
      await dispatch(followCategory(categoryInput));
      const storedToken = localStorage.getItem('token');
      try {
        const res = await axios.get(`${API_BASE_URL}/posts/category?category=${encodeURIComponent(categoryInput)}`, {
          headers: { 'x-auth-token': storedToken },
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

  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.2, duration: 0.8 } } };
  const itemVariants = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } } };
  const cardVariants = { hidden: { opacity: 0, scale: 0.9 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } } };
  const progressVariants = {
    animate: (percent) => ({
      strokeDasharray: '251',
      strokeDashoffset: 251 - (251 * percent) / 100,
      transition: { duration: 1.5, ease: 'easeInOut' },
    }),
  };

  if (authLoading || postsLoading || isDataLoading) {
    return <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem' }}>Loading...</div>;
  }
  if (!isAuthenticated && !localStorage.getItem('token')) {
    return <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem' }}>Please log in to view this page.</div>;
  }
  if (!user) {
    return <div style={{ textAlign: 'center', color: '#fff', fontSize: '1.5rem' }}>Error loading user data.</div>;
  }

  return (
    <DashboardContainer>
      <ContentWrapper variants={containerVariants} initial="hidden" animate="visible">
        <Header variants={itemVariants}>Welcome to Your LearnSphere, {user.name}!</Header>
        <UserInfo variants={itemVariants}>
          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
        </UserInfo>

        <Grid>
          {/* User Posts */}
          <Section variants={itemVariants}>
            <SectionTitle>Your Creations</SectionTitle>
            {filteredUserPosts.length === 0 ? (
              <PlaceholderText>No posts yet—create something amazing!</PlaceholderText>
            ) : (
              <ScrollContainer>
                {filteredUserPosts.map(post => (
                  <Card key={post.postId} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}>
                    <CardLink to={`/post/${post.slug}`}>{post.title}</CardLink>
                    <TextSm>{post.content.slice(0, 80)}...</TextSm>
                  </Card>
                ))}
              </ScrollContainer>
            )}
          </Section>

          {/* Categories Explorer */}
          <Section variants={itemVariants}>
            <SectionTitle>Explore Categories</SectionTitle>
            <CategoryButton onClick={() => setIsCategoryModalOpen(true)}>Add Category</CategoryButton>
            {followedCategories.length === 0 ? (
              <PlaceholderText style={{ marginTop: '1rem' }}>Follow categories to start exploring!</PlaceholderText>
            ) : (
              <ScrollContainer style={{ marginTop: '1rem' }}>
                {followedCategories.map(category => (
                  <motion.div key={category} whileHover={{ scale: 1.05 }} style={{ position: 'relative', perspective: '1000px' }}>
                    <CategoryCard animate="front" variants={{ front: { rotateY: 0 }, back: { rotateY: 180 } }} transition={{ duration: 0.5 }}>
                      <CategoryContent>
                        <CardLink to={`/category/${category}`}>{category}</CardLink>
                        <UnfollowButton onClick={() => handleUnfollow(category)}>Unfollow</UnfollowButton>
                      </CategoryContent>
                    </CategoryCard>
                  </motion.div>
                ))}
              </ScrollContainer>
            )}
            <AnimatePresence>
              {isCategoryModalOpen && (
                <ModalOverlay initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <ModalContent initial={{ scale: 0.8, y: 50 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.8, y: 50 }}>
                    <ModalTitle>Follow a Category</ModalTitle>
                    <Input
                      type="text"
                      value={categoryInput}
                      onChange={(e) => setCategoryInput(e.target.value)}
                      placeholder="Enter category name"
                      list="category-suggestions"
                    />
                    <datalist id="category-suggestions">
                      {availableCategories.map(cat => <option key={cat} value={cat} />)}
                    </datalist>
                    <ButtonGroup>
                      <CancelButton onClick={() => setIsCategoryModalOpen(false)}>Cancel</CancelButton>
                      <FollowButton onClick={handleFollow} disabled={!categoryInput || followedCategories.includes(categoryInput)}>
                        Follow
                      </FollowButton>
                    </ButtonGroup>
                  </ModalContent>
                </ModalOverlay>
              )}
            </AnimatePresence>
          </Section>

          {/* Completed Posts */}
          <Section variants={itemVariants}>
            <SectionTitle>Completed Journeys</SectionTitle>
            {completedPosts.length === 0 ? (
              <PlaceholderText>No completed posts yet—keep learning!</PlaceholderText>
            ) : (
              <ScrollContainer>
                {completedPosts.map(post => (
                  <Card key={post.postId} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.05 }}>
                    <span style={{ color: '#60a5fa' }}>{post.title}</span>
                    <TextSm>Category: {post.category}</TextSm>
                  </Card>
                ))}
              </ScrollContainer>
            )}
          </Section>

          {/* Notifications */}
          <Section variants={itemVariants}>
            <SectionTitle>Updates ({unreadNotifications.length} unread)</SectionTitle>
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
                    whileHover={{ scale: 1.05 }}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <TextSm>{notif.message}</TextSm>
                    <TextSm>{new Date(notif.createdAt).toLocaleString()}</TextSm>
                  </NotificationCard>
                ))}
              </ScrollContainer>
            )}
            <CardLink to="/notifications" style={{ display: 'block', marginTop: '1rem' }}>See All</CardLink>
          </Section>

          {/* Certificates */}
          <Section variants={itemVariants}>
            <SectionTitle>Your Achievements</SectionTitle>
            {certificates.length === 0 ? (
              <PlaceholderText>No certificates yet—complete a category!</PlaceholderText>
            ) : (
              <ScrollContainer>
                {certificates.map(cert => (
                  <Card key={cert.certificateId} variants={cardVariants} initial="hidden" animate="visible" whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' }}>
                    <ExternalLink href={cert.filePath} target="_blank" rel="noopener noreferrer">{cert.category} Certificate</ExternalLink>
                    <TextSm>Earned: {new Date(cert.createdAt).toLocaleDateString()}</TextSm>
                    <TextSm>Unique ID: {cert.uniqueId}</TextSm>
                  </Card>
                ))}
              </ScrollContainer>
            )}
          </Section>

          {/* Progress Tracker */}
          <ProgressSection variants={itemVariants}>
            <SectionTitle>Learning Progress</SectionTitle>
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
                      <svg style={{ width: '6rem', height: '6rem', margin: '0 auto' }} viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="40" fill="none" stroke="#4B5563" strokeWidth="10" />
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="#8B5CF6"
                          strokeWidth="10"
                          custom={percent}
                          variants={progressVariants}
                          initial={{ strokeDashoffset: 251 }}
                          animate="animate"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}
                        />
                        <text x="50" y="55" textAnchor="middle" fill="#e2e8f0" fontSize="20">{percent}%</text>
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
  );
};

export default Dashboard;
