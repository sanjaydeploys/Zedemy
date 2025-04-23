import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTrail, animated } from 'react-spring';

const RelatedPostsContainer = styled.div`
  margin-top: 20px;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 5px;
  color: #1a1a1a;
`;

const RelatedPostsHeader = styled.h2`
  font-size: 1.8em;
  color: #0a0a0a;
  margin-bottom: 10px;
`;

const RelatedPostLink = styled(Link)`
  display: block;
  color: #0645ad;
  text-decoration: none;
  margin: 5px 0;
  font-size: 1rem;
  &:hover,
  &:focus {
    text-decoration: underline;
    color: #0b3d91;
    outline: 2px dashed #0b3d91;
    outline-offset: 2px;
  }
`;

const RelatedPosts = ({ relatedPosts }) => {
  const trail = useTrail(relatedPosts.length, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { duration: 500 },
    delay: 1000
  });

  return (
    <RelatedPostsContainer>
      <RelatedPostsHeader>Related Posts</RelatedPostsHeader>
      {trail.map((style, index) => (
        <animated.div key={relatedPosts[index].postId} style={style}>
          <RelatedPostLink to={`/post/${relatedPosts[index].slug}`} aria-label={`Read ${relatedPosts[index].title}`}>
            {relatedPosts[index].title}
          </RelatedPostLink>
        </animated.div>
      ))}
    </RelatedPostsContainer>
  );
};

export default RelatedPosts;
