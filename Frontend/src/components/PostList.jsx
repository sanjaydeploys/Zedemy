import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPosts } from '../actions/postActions';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import styled, { keyframes } from 'styled-components';
const SearchBlog = lazy(() => import('./SearchBlog'));

// Styled Components
const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 10px;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  text-align: center;
  font-size: 2em;
  color: #212121;
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
  background-color: #ffffff;
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
  border: 2px solid #1565c0;
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
  color: #1565c0;
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
    color: #003c8f;
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
  color: #212121;
  margin: 0 0 12px;
  text-align: center;
`;

const ReadMoreLink = styled(Link)`
  display: inline-block;
  margin-top: 12px;
  padding: 10px 16px;
  background-color: #1565c0;
  color: #ffffff;
  border-radius: 5px;
  text-decoration: none;
  font-size: 0.95em;
  transition: background-color 0.3s, transform 0.3s;
  min-height: 44px;
  min-width: 44px;

  &:hover {
    background-color: #003c8f;
    transform: scale(1.05);
  }

  &:focus {
    outline: 3px solid #1565c0;
    outline-offset: 2px;
  }
`;

const LoadMoreButton = styled.button`
  display: block;
  margin: 24px auto;
  padding: 12px 24px;
  background-color: #1565c0;
  color: #ffffff;
  border: none;
  border-radius: 25px;
  font-size: 1em;
  cursor: pointer;
  transition: background-color 0.3s, transform 0.3s;
  min-height: 44px;
  min-width: 44px;

  &:hover {
    background-color: #003c8f;
    transform: scale(1.1);
  }

  &:focus {
    outline: 3px solid #1565c0;
    outline-offset: 2px;
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  font-size: 1.2em;
  color: #212121;
  animation: ${keyframes`
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  `} 1s linear infinite;
`;

const FAQSection = styled.section`
  margin-top: 40px;
  padding: 20px;
  background-color: #f5f5f5;
  border-radius: 8px;
`;

const FAQTitle = styled.h3`
  font-size: 1.8em;
  color: #212121;
  margin-bottom: 20px;
  text-align: center;
`;

const FAQItem = styled.div`
  margin-bottom: 20px;
`;

const FAQQuestion = styled.h4`
  font-size: 1.2em;
  color: #1565c0;
  margin-bottom: 10px;
`;

const FAQAnswer = styled.p`
  font-size: 1em;
  color: #212121;
  line-height: 1.6;
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

  // FAQ Structured Data
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What types of blog posts are available on Zedemy?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Zedemy offers blog posts on various programming topics, including HTML, JavaScript, Python, React, and more, covering tutorials, tips, and best practices."
        }
      },
      {
        "@type": "Question",
        "name": "How can I search for specific blog posts on Zedemy?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Use the search bar at the top of the blog page to enter keywords related to the topic you're interested in, and relevant posts will be displayed."
        }
      },
      {
        "@type": "Question",
        "name": "Are the blog posts on Zedemy free to read?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, all blog posts on Zedemy are free to read, providing accessible learning resources for everyone."
        }
      }
    ]
  };

  return (
    <Container>
      <Helmet>
      <html lang="en" />

        <title>Latest Programming Blog Posts - Zedemy</title>
        <meta
          name="description"
          content="Explore the latest programming blog posts on Zedemy, covering HTML, JavaScript, Python, React, and more. Search and read tutorials, tips, and guides."
        />
        <meta
          name="keywords"
          content="programming blog, HTML, JavaScript, Python, React, Zedemy, Sanjay Patidar, coding tutorials, tech guides"
        />
        <meta name="author" content="Sanjay Patidar" />
        <meta name="robots" content="index, follow" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="canonical" href="https://zedemy.vercel.app/blog" />
        <meta property="og:title" content="Latest Programming Blog Posts - Zedemy" />
        <meta
          property="og:description"
          content="Explore the latest programming blog posts on Zedemy, covering HTML, JavaScript, Python, React, and more. Search and read tutorials, tips, and guides."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://zedemy.vercel.app/blog" />
        <meta property="og:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Latest Programming Blog Posts - Zedemy" />
        <meta
          name="twitter:description"
          content="Explore the latest programming blog posts on Zedemy, covering HTML, JavaScript, Python, React, and more. Search and read tutorials, tips, and guides."
        />
        <meta name="twitter:image" content="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <link rel="icon" type="image/png" href="https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": "Zedemy Blog",
            "description": "Explore the latest programming blog posts on Zedemy, covering HTML, JavaScript, Python, React, and more.",
            "url": "https://zedemy.vercel.app/blog",
            "publisher": {
              "@type": "Organization",
              "name": "Zedemy",
              "founder": {
                "@type": "Person",
                "name": "Sanjay Patidar"
              },
              "logo": {
                "@type": "ImageObject",
                "url": "https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png"
              }
            },
            "mainEntity": {
              "@type": "ItemList",
              "itemListElement": displayedPosts.map((post, index) => ({
                "@type": "ListItem",
                "position": index + 1,
                "item": {
                  "@type": "BlogPosting",
                  "headline": post.title,
                  "image": post.titleImage || fallbackImage,
                  "author": {
                    "@type": "Person",
                    "name": post.author
                  },
                  "url": `https://zedemy.vercel.app/post/${post.slug}`,
                  "datePublished": post.createdAt || new Date().toISOString(),
                  "publisher": {
                    "@type": "Organization",
                    "name": "Zedemy",
                    "logo": {
                      "@type": "ImageObject",
                      "url": "https://sanjaybasket.s3.ap-south-1.amazonaws.com/zedemy-logo.png"
                    }
                  }
                }
              }))
            }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(faqData)}
        </script>
      </Helmet>
      <Suspense fallback={<div>Loading...</div>}>
        <SearchBlog />
      </Suspense>
      <Title>{searchResults.length > 0 ? 'Search Results' : 'Latest Posts'}</Title>
      <PostListContainer>
        {displayedPosts.slice(0, page * 5).map(post => (
          <PostContainer key={post.postId}>
            <Link to={`/post/${post.slug}`} aria-label={`View post: ${post.title}`}>
              <PostImage
                src={post.titleImage || fallbackImage}
                alt={`Featured image for ${post.title} on Zedemy`}
                loading="lazy"
              />
            </Link>
            <PostTitle>
              <Link to={`/post/${post.slug}`} aria-label={`Read more about ${post.title}`}>
                {post.title}
              </Link>
            </PostTitle>
            <PostAuthor>Author: {post.author}</PostAuthor>
            <ReadMoreLink to={`/post/${post.slug}`} aria-label={`Read more about ${post.title}`}>
              Read More
            </ReadMoreLink>
          </PostContainer>
        ))}
      </PostListContainer>
      {loadingMore && <LoadingSpinner>Loading...</LoadingSpinner>}
      {!loadingMore && displayedPosts.length > page * 5 && (
        <LoadMoreButton onClick={loadMorePosts} aria-label="Load more blog posts">
          Load More
        </LoadMoreButton>
      )}
      <FAQSection>
        <FAQTitle>Frequently Asked Questions</FAQTitle>
        <FAQItem>
          <FAQQuestion>What types of blog posts are available on Zedemy?</FAQQuestion>
          <FAQAnswer>
            Zedemy offers blog posts on various programming topics, including HTML, JavaScript, Python, React, and more, covering tutorials, tips, and best practices.
          </FAQAnswer>
        </FAQItem>
        <FAQItem>
          <FAQQuestion>How can I search for specific blog posts on Zedemy?</FAQQuestion>
          <FAQAnswer>
            Use the search bar at the top of the blog page to enter keywords related to the topic you're interested in, and relevant posts will be displayed.
          </FAQAnswer>
        </FAQItem>
        <FAQItem>
          <FAQQuestion>Are the blog posts on Zedemy free to read?</FAQQuestion>
          <FAQAnswer>
            Yes, all blog posts on Zedemy are free to read, providing accessible learning resources for everyone.
          </FAQAnswer>
        </FAQItem>
      </FAQSection>
    </Container>
  );
};

export default PostList;
