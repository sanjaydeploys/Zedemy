import React, { memo } from 'react';

const criticalCss = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    font-display: swap;
  }
  .post-header {
    font-size: clamp(1.5rem, 3vw, 2rem);
    color: #011020;
    font-weight: 700;
    line-height: 1.2;
    text-rendering: optimizeSpeed;
    contain: layout;
    min-height: 32px;
    contain-intrinsic-size: 100% 32px;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin-bottom: 1rem;
    contain: layout;
    contain-intrinsic-size: 100% 150px;
  }
  .content-section p, .content-section ul, .content-section li, .content-section div {
    margin-bottom: 0.5rem;
    overflow-wrap: break-word;
    contain: layout;
  }
  .content-section a {
    color: #0066cc;
    text-decoration: underline;
  }
  .content-section a:hover {
    color: #0033cc;
  }
  .content-section img {
    width: 100%;
    max-width: 100%;
    height: auto;
    contain: layout;
  }
  .image-container {
    width: 100%;
    max-width: 100%;
    margin: 1rem 0 1.5rem;
    aspect-ratio: 16 / 9;
    contain: layout;
    min-height: 164.5px;
    contain-intrinsic-size: 100% 164.5px;
  }
  .post-image {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    border-radius: 0.25rem;
    border: 1px solid #e0e0e0;
    contain: layout;
  }
  .meta-info {
    color: #666;
    font-size: 0.75rem;
    margin: 0.75rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    contain: layout;
    min-height: 60px;
    contain-intrinsic-size: 100% 60px;
  }
  .meta-info span {
    min-height: 16px;
    contain-intrinsic-size: 100% 16px;
  }
  .skeleton {
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain: layout;
  }
  @media (min-width: 769px) {
    .content-section {
      font-size: 1rem;
    }
    .meta-info {
      flex-direction: row;
      gap: 1rem;
      min-height: 24px;
      contain-intrinsic-size: 100% 24px;
    }
    .image-container {
      min-height: 322px;
      contain-intrinsic-size: 100% 322px;
    }
  }
  @media (max-width: 480px) {
    .post-header {
      font-size: clamp(1.25rem, 3vw, 1.5rem);
    }
    .image-container {
      min-height: 187px;
      contain-intrinsic-size: 100% 187px;
    }
  }
  @media (max-width: 320px) {
    .image-container {
      min-height: 164.5px;
      contain-intrinsic-size: 100% 164.5px;
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  const isLoading = !post || post.title === 'Loading...';

  return (
    <>
      {post?.titleImage && !isLoading && (
        <link
          rel="preload"
          href={`${post.titleImage}?w=${window.innerWidth <= 768 ? 200 : 480}&format=avif&q=10`}
          as="image"
          fetchpriority="high"
        />
      )}
      <article
        style={{
          contain: 'layout',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <header style={{ width: '100%', maxWidth: '800px' }}>
            <div
              className="image-container"
              aria-hidden="true"
            >
              <div
                className="skeleton"
                style={{
                  width: '100%',
                  aspectRatio: '16 / 9',
                }}
              />
            </div>
            <div
              className="skeleton"
              style={{
                width: '80%',
                minHeight: '32px',
                margin: '0.5rem 0',
              }}
              aria-hidden="true"
            />
            <div
              className="meta-info"
              aria-hidden="true"
            >
              <div className="skeleton" style={{ width: '100px', minHeight: '16px' }} />
              <div className="skeleton" style={{ width: '100px', minHeight: '16px' }} />
              <div className="skeleton" style={{ width: '100px', minHeight: '16px' }} />
            </div>
          </header>
        ) : (
          <header style={{ width: '100%', maxWidth: '800px' }}>
            {post.titleImage && (
              <div className="image-container">
                <img
                  src={`${post.titleImage}?w=${window.innerWidth <= 768 ? 200 : 480}&format=avif&q=10`}
                  srcSet={`
                    ${post.titleImage}?w=120&format=avif&q=10 120w,
                    ${post.titleImage}?w=160&format=avif&q=10 160w,
                    ${post.titleImage}?w=200&format=avif&q=10 200w,
                    ${post.titleImage}?w=240&format=avif&q=10 240w,
                    ${post.titleImage}?w=280&format=avif&q=10 280w,
                    ${post.titleImage}?w=320&format=avif&q=10 320w,
                    ${post.titleImage}?w=480&format=avif&q=10 480w
                  `}
                  sizes="(max-width: 320px) 120px, (max-width: 360px) 160px, (max-width: 480px) 200px, (max-width: 768px) 240px, 480px"
                  alt={post.title || 'Post image'}
                  className="post-image"
                  width={window.innerWidth <= 768 ? 200 : 480}
                  height={window.innerWidth <= 768 ? 112.5 : 270}
                  decoding="sync"
                  loading="eager"
                  fetchpriority="high"
                  onError={(e) => {
                    console.error('Image Failed:', post.titleImage);
                    e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
                  }}
                />
              </div>
            )}
            <h1 className="post-header">{post.title}</h1>
            <div className="meta-info">
              <span>By {post.author || 'Unknown'}</span>
              <span>
                {' | '}
                {post.date && !isNaN(new Date(post.date).getTime())
                  ? new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown Date'}
              </span>
              <span>
                {' | Read time: '}
                <span id="read-time">{readTime || '0'}</span> min
              </span>
            </div>
          </header>
        )}
        <section
          className="content-section"
          role="region"
          aria-label="Post content"
          style={{
            width: '100%',
            maxWidth: '800px',
          }}
        >
          {isLoading ? (
            <div
              className="skeleton"
              style={{
                width: '100%',
                minHeight: '150px',
                aspectRatio: '16 / 9',
              }}
              aria-hidden="true"
            />
          ) : (
            <div
              style={{
                contain: 'layout',
                width: '100%',
              }}
              dangerouslySetInnerHTML={{ __html: post.preRenderedContent || '' }}
            />
          )}
        </section>
        <style>{criticalCss}</style>
      </article>
    </>
  );
});

export default PriorityContent;
