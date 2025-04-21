import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../actions/postActions';
import { Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
const SearchBlog = lazy(() => import('./SearchBlog'));

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  font-size: 2em;
  color: #333;
  margin-bottom: 20px;
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const PostListContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  grid-gap: 24px;
  animation: ${fadeIn} 0.5s ease-in-out;
`;

const PostContainer = styled.div`
  padding: 24px;
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    padding: 20px;
  }

  @media (max-width: 600px) {
    padding: 16px;
  }
`;

const PostImage = styled.img`
  width: 100%;
  max-width: 200px;
  height: 120px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #007BFF;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 16px;
  transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;

  ${PostContainer}:hover & {
    transform: scale(1.05);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
  }

  @media (max-width: 768px) {
    max-width: 160px;
    height: 100px;
  }

  @media (max-width: 600px) {
    max-width: 140px;
    height: 80px;
  }
`;

const PostTitle = styled.h3`
  font-size: 1.4em;
  color: #007BFF;
  margin: 0 0 12px;
  text-align: center;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s;

  a {
    color: inherit;
    text-decoration: none;
  }

  ${PostContainer}:hover & {
    color: #0056b3;
  }

  @media (max-width: 768px) {
    font-size: 1.3em;
  }

  @media (max-width: 600px) {
    font-size: 1.2em;
  }
`;

const PostAuthor = styled.p`
  font-size: 0.95em;
  color: #555;
  margin: 0 0 12px;
  text-align: center;
`;

const ReadMoreLink = styled(Link)`
  display: inline-block;
  margin-top: 12px;
  padding: 10px 16px;
  background-color: #007BFF;
  color: #fff;
  border-radius: 5px;
  text-decoration: none;
  font-size: 0.95em;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.05);
  }
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 24px auto;
  padding: 12px 24px;
  background-color: #007BFF;
  color: #fff;
  border: none;
  border-radius: 25px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;

  &:hover {
    background-color: #0056b3;
    transform: scale(1.1);
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  font-size: 1.2em;
  color: #555;
  animation: ${keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `} 1s linear infinite;
`;

const PostList = () => {
  const dispatch = useDispatch();
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const posts = useSelector(state => state.postReducer.posts || []);
  const searchResults = useSelector(state => state.postReducer.searchResults || []);

  useEffect(() => {
    dispatch(fetchPosts(page));
  }, [dispatch, page]);

  const loadMorePosts = () => {
    setPage(prevPage => prevPage + 1);
    setLoadingMore(true);
  };

  useEffect(() => {
    setLoadingMore(false);
  }, [posts]);

  // Use searchResults if available, otherwise use posts
  const displayedPosts = searchResults.length > 0 ? searchResults : posts;

  // Fallback image URL
  const fallbackImage = 'https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png';

  return (
    <Container>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchBlog />
      </Suspense>
      <Title>{searchResults.length > 0 ? 'Search Results' : 'Latest Posts'}</Title>
      <PostListContainer>
        {displayedPosts.slice(0, page * 5).map(post => (
          <PostContainer key={post.postId}>
            <Link to={`/post/${post.slug}`}>
              <PostImage
                src={post.titleImage || fallbackImage}
                alt={`Featured image for ${post.title} on Zedemy`}
                loading="lazy"
              />
            </Link>
            <PostTitle><Link to={`/post/${post.slug}`}>{post.title}</Link></PostTitle>
            <PostAuthor>Author: {post.author}</PostAuthor>
            <ReadMoreLink to={`/post/${post.slug}`}>Read More</ReadMoreLink>
          </PostContainer>
        ))}
      </PostListContainer>
      {loadingMore && <LoadingSpinner>Loading...</LoadingSpinner>}
      {!loadingMore && displayedPosts.length > page * 5 && (
        <LoadMoreButton onClick={loadMorePosts}>Load More</LoadMoreButton>
      )}
    </Container>
  );
};

export default PostList;
