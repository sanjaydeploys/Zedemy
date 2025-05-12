import React, { memo } from 'react';

const criticalCss = `
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
    font-family: 'Segoe UI', Roboto, sans-serif;
    font-display: swap;
  }
  .content-section p, .content-section ul, .content-section li, .content-section div {
    margin-bottom: 0.5rem;
    overflow-wrap: break-word;
    contain: layout;
    min-height: 24px;
    contain-intrinsic-size: 100% 24px;
  }
  .content-section ul {
    padding-left: 1.25rem;
    min-height: 48px;
    contain-intrinsic-size: 100% 48px;
  }
  .content-section a {
    color: #0066cc;
    text-decoration: underline;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 1.5rem 0 2rem;
    aspect-ratio: 16 / 9;
    contain: layout;
    min-height: 157.5px;
    contain-intrinsic-size: 280px 157.5px;
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
    .content-section img {
      aspect-ratio: 16 / 9;
      min-height: 270px;
      contain-intrinsic-size: 100% 270px;
    }
    .meta-info {
      flex-direction: row;
      gap: 1rem;
      min-height: 24px;
      contain-intrinsic-size: 100% 24px;
    }
    .image-container {
      max-width: 480px;
      min-height: 270px;
      contain-intrinsic-size: 480px 270px;
    }
  }
  @media (max-width: 480px) {
    .post-header {
      font-size: clamp(1.25rem, 3vw, 1.5rem);
    }
    .image-container {
      max-width: 400px;
      min-height: 225px;
      contain-intrinsic-size: 400px 225px;
    }
  }
  @media (max-width: 320px) {
    .image-container {
      max-width: 280px;
      min-height: 157.5px;
      contain-intrinsic-size: 280px 157.5px;
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  const isLoading = !post || post.title === 'Loading...';

  // Enhanced content height calculation
  const contentHeight = post?.preRenderedContent && !isLoading
    ? (post.estimatedContentHeight || Math.max(200, Math.ceil(post.preRenderedContent.length / 100) * 24)) +
      (post.preRenderedContent.includes('<img') ? (window.innerWidth <= 768 ? 225 : 270) : 0) +
      (post.preRenderedContent.includes('<ul') || post.preRenderedContent.includes('<ol') ? 48 : 0)
    : 200;

  return (
    <>
      {post?.titleImage && !isLoading && (
        <link
          rel="preload"
          href={`${post.titleImage}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=50`}
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
            <div className="image-container" aria-hidden="true">
              <div className="skeleton" style={{ width: '100%', minHeight: window.innerWidth <= 768 ? '225px' : '270px', aspectRatio: '16 / 9' }} />
            </div>
            <div
              className="skeleton"
              style={{ width: '80%', minHeight: '32px', margin: '0.5rem 0' }}
              aria-hidden="true"
            />
            <div className="meta-info" aria-hidden="true">
              <div className="skeleton" style={{ width: '100px', minHeight: '16px' }} />
              <div className="skeleton" style={{ width: '100px', minHeight: '16px' }} />
              <div className="skeleton" style={{ width: '100px', minHeight: '16px' }} />
            </div>
            <div
              className="skeleton"
              style={{ width: '100%', minHeight: `${contentHeight}px` }}
              aria-hidden="true"
            />
          </header>
        ) : (
          <>
            <header style={{ width: '100%', maxWidth: '800px' }}>
              {post.titleImage && (
                <div className="image-container">
                  <img
                    src={`${post.titleImage}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=50`}
                    srcSet={`
                      ${post.titleImage}?w=280&format=avif&q=50 280w,
                      ${post.titleImage}?w=320&format=avif&q=50 320w,
                      ${post.titleImage}?w=360&format=avif&q=50 360w,
                      ${post.titleImage}?w=400&format=avif&q=50 400w,
                      ${post.titleImage}?w=480&format=avif&q=50 480w
                    `}
                    sizes="(max-width: 320px) 280px, (max-width: 480px) 400px, (max-width: 768px) 400px, 480px"
                    alt={post.title || 'Post image'}
                    className="post-image"
                    width={window.innerWidth <= 768 ? 400 : 480}
                    height={window.innerWidth <= 768 ? 225 : 270}
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
            <section
              className="content-section"
              role="region"
              aria-label="Post content"
              style={{
                width: '100%',
                maxWidth: '800px',
                minHeight: `${contentHeight}px`,
                containIntrinsicSize: `100% ${contentHeight}px`,
              }}
            >
              <div
                style={{
                  contain: 'layout',
                  width: '100%',
                  minHeight: `${contentHeight}px`,
                  containIntrinsicSize: `100% ${contentHeight}px`,
                }}
                dangerouslySetInnerHTML={{ __html: post.preRenderedContent || '' }}
              />
            </section>
          </>
        )}
        <style>{criticalCss}</style>
      </article>
    </>
  );
});

export default PriorityContent;
