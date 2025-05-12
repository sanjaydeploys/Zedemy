import React, { memo, useMemo } from 'react';

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
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin-bottom: 1rem;
    contain: layout;
  }
  .content-section p, .content-section ul, .content-section li, .content-section div {
    margin-bottom: 0.5rem;
    overflow-wrap: break-word;
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
  }
  .meta-info span {
    min-height: 16px;
    contain-intrinsic-size: 100% 16px;
  }
  .skeleton {
    background: #e0e0e0;
    border-radius: 0.25rem;
  }
  @media (min-width: 768px) {
    .content-section {
      font-size: 1rem;
    }
    .meta-info {
      flex-direction: row;
      gap: 1rem;
    }
  }
  @media (max-width: 480px) {
    .post-header {
      font-size: clamp(1.25rem, 3vw, 1.5rem);
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  const calculateHeights = useMemo(() => {
    const imageHeight = post?.titleImage
      ? window.innerWidth <= 320
        ? 164.5
        : window.innerWidth <= 480
        ? 187
        : window.innerWidth <= 767
        ? 209.5
        : 322
      : 0;
    const imageMargin = post?.titleImage ? 40 : 0; // margin: 1rem 0 1.5rem
    const titleHeight = post?.title
      ? Math.ceil((post.title.length / 40) * (window.innerWidth <= 480 ? 24 : window.innerWidth <= 767 ? 30 : 48))
      : window.innerWidth <= 480
      ? 24
      : 32;
    const metaHeight = window.innerWidth <= 767
      ? Math.max(
          60,
          (3 * 16) + (2 * 8) +
          (post?.author && post.author.length > 30 ? 16 : 0) +
          (post?.date && post.date.length > 20 ? 16 : 0)
        )
      : Math.max(
          24,
          (post?.author && post.author.length > 30 ? 16 : 0) +
          (post?.date && post.date.length > 20 ? 16 : 0)
        );
    const contentHeight = post?.preRenderedContent
      ? (() => {
          if (post.estimatedContentHeight && post.estimatedContentHeight >= 150) {
            return post.estimatedContentHeight;
          }
          const div = document.createElement('div');
          div.innerHTML = post.preRenderedContent;
          const paragraphs = div.querySelectorAll('p').length || 1;
          const lists = div.querySelectorAll('ul, ol').length;
          const headings = div.querySelectorAll('h1, h2, h3').length;
          const images = div.querySelectorAll('img').length;
          const divs = div.querySelectorAll('div').length;
          const baseHeight = paragraphs * 50 + lists * 100 + headings * 40 + images * 200 + divs * 50;
          return Math.max(150, Math.min(1000, baseHeight));
        })()
      : 150;
    const contentMargin = 16; // margin-bottom: 1rem
    const totalHeight = imageHeight + imageMargin + titleHeight + metaHeight + contentHeight + contentMargin;

    return {
      imageHeight,
      imageMargin,
      titleHeight,
      metaHeight,
      contentHeight,
      contentMargin,
      totalHeight,
    };
  }, [post]);

  const isLoading = !post || post.title === 'Loading...';

  return (
    <>
      {post?.titleImage && !isLoading && (
        <link
          rel="preload"
          href={`${post.titleImage}?w=${window.innerWidth <= 767 ? 280 : 480}&format=avif&q=15`}
          as="image"
          fetchpriority="high"
        />
      )}
      <article
        style={{
          contain: 'layout',
          width: '100%',
          minHeight: `${calculateHeights.totalHeight}px`,
          containIntrinsicSize: `100% ${calculateHeights.totalHeight}px`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <header style={{ width: '100%', maxWidth: '800px' }}>
            <div
              className="image-container"
              style={{
                minHeight: `${calculateHeights.imageHeight}px`,
                containIntrinsicSize: `100% ${calculateHeights.imageHeight}px`,
              }}
              aria-hidden="true"
            >
              <div
                className="skeleton"
                style={{
                  width: '100%',
                  minHeight: `${calculateHeights.imageHeight}px`,
                }}
              />
            </div>
            <div
              className="skeleton"
              style={{
                width: '80%',
                minHeight: `${calculateHeights.titleHeight}px`,
                margin: '0.5rem 0',
              }}
              aria-hidden="true"
            />
            <div
              className="meta-info"
              style={{
                minHeight: `${calculateHeights.metaHeight}px`,
                containIntrinsicSize: `100% ${calculateHeights.metaHeight}px`,
              }}
              aria-hidden="true"
            >
              <div
                className="skeleton"
                style={{
                  width: `${Math.max(100, (post?.author?.length || 10) * 5)}px`,
                  minHeight: '16px',
                }}
              />
              <div
                className="skeleton"
                style={{
                  width: `${Math.max(100, (post?.date?.length || 15) * 5)}px`,
                  minHeight: '16px',
                }}
              />
              <div className="skeleton" style={{ width: '100px', minHeight: '16px' }} />
            </div>
          </header>
        ) : (
          <header style={{ width: '100%', maxWidth: '800px' }}>
            {post.titleImage && (
              <div
                className="image-container"
                style={{
                  minHeight: `${calculateHeights.imageHeight}px`,
                  containIntrinsicSize: `100% ${calculateHeights.imageHeight}px`,
                }}
              >
                <img
                  src={`${post.titleImage}?w=${window.innerWidth <= 767 ? 280 : 480}&format=avif&q=15`}
                  srcSet={`
                    ${post.titleImage}?w=200&format=avif&q=15 200w,
                    ${post.titleImage}?w=240&format=avif&q=15 240w,
                    ${post.titleImage}?w=280&format=avif&q=15 280w,
                    ${post.titleImage}?w=320&format=avif&q=15 320w,
                    ${post.titleImage}?w=360&format=avif&q=15 360w,
                    ${post.titleImage}?w=400&format=avif&q=15 400w,
                    ${post.titleImage}?w=440&format=avif&q=15 440w,
                    ${post.titleImage}?w=480&format=avif&q=15 480w
                  `}
                  sizes="(max-width: 320px) 200px, (max-width: 360px) 240px, (max-width: 480px) 280px, (max-width: 767px) 320px, 480px"
                  alt={post.title || 'Post image'}
                  className="post-image"
                  width={window.innerWidth <= 767 ? 280 : 480}
                  height={calculateHeights.imageHeight}
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
            <h1
              className="post-header"
              style={{
                minHeight: `${calculateHeights.titleHeight}px`,
                containIntrinsicSize: `100% ${calculateHeights.titleHeight}px`,
              }}
            >
              {post.title}
            </h1>
            <div
              className="meta-info"
              style={{
                minHeight: `${calculateHeights.metaHeight}px`,
                containIntrinsicSize: `100% ${calculateHeights.metaHeight}px`,
              }}
            >
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
            minHeight: `${calculateHeights.contentHeight}px`,
            containIntrinsicSize: `100% ${calculateHeights.contentHeight}px`,
            width: '100%',
            maxWidth: '800px',
          }}
        >
          {isLoading ? (
            <div
              className="skeleton"
              style={{ width: '100%', minHeight: `${calculateHeights.contentHeight}px` }}
              aria-hidden="true"
            />
          ) : (
            <div dangerouslySetInnerHTML={{ __html: post.preRenderedContent || '' }} />
          )}
        </section>
        <style>{criticalCss}</style>
      </article>
    </>
  );
});

export default PriorityContent;
