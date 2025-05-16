import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { useTrail, animated } from '@react-spring/web';
import LazyLoad from 'react-lazyload';

const RelatedPostsContainer = styled.div`
  margin-top: 2rem;
  padding: 1.5rem 0;
`;

const RelatedPostsHeader = styled.h2`
  font-size: clamp(1.25rem, 3vw, 1.5rem);
  color: #011020;
  margin: 1.5rem 0 0.75rem;
  font-weight: 700;
  border-left: 4px solid #34db58;
  padding-left: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.25rem;
  }
`;

const RelatedPost = styled.div`
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RelatedPostImage = styled.img`
  width: 100%;
  max-width: 280px;
  height: auto;
  border-radius: 0.375rem;
  object-fit: cover;

  @media (max-width: 480px) {
    max-width: 100%;
  }
`;

const RelatedPostTitle = styled.h3`
  font-size: 1.1rem;
  margin: 0.5rem 0;
`;

const RelatedPostLink = styled(Link)`
  color: #0645ad;
  text-decoration: none;

  &:hover, &:focus {
    text-decoration: underline;
    outline: none;
  }
`;

const RelatedPosts = ({ relatedPosts }) => {
  const trail = useTrail(relatedPosts.length, {
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0)' },
    config: { duration: 500 },
    delay: 1000,
  });

  return (
    <RelatedPostsContainer aria-labelledby="related-posts-heading">
      <RelatedPostsHeader id="related-posts-heading">Related Posts</RelatedPostsHeader>
      {trail.map((style, index) => (
        <animated.div key={relatedPosts[index].postId} style={style}>
          <RelatedPost>
            {relatedPosts[index].titleImage && (
              <LazyLoad height={200} offset={100} once>
                <RelatedPostImage
                  src={`${relatedPosts[index].titleImage}?w=280&format=avif&q=50`}
                  srcSet={`${relatedPosts[index].titleImage}?w=200&format=avif&q=50 200w, ${relatedPosts[index].titleImage}?w=280&format=avif&q=50 280w`}
                  sizes="(max-width: 480px) 200px, 280px"
                  alt={relatedPosts[index].title}
                  loading="lazy"
                  decoding="async"
                  fetchpriority="low"
                />
              </LazyLoad>
            )}
            <RelatedPostTitle>
              <RelatedPostLink to={`/post/${relatedPosts[index].slug}`} aria-label={`Read ${relatedPosts[index].title}`}>
                {relatedPosts[index].title}
              </RelatedPostLink>
            </RelatedPostTitle>
          </RelatedPost>
        </animated.div>
      ))}
    </RelatedPostsContainer>
  );
};

export default RelatedPosts;
