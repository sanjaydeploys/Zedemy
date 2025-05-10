import React, { memo, Suspense, lazy } from 'react';

const criticalCss = `
  * {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }
  .post-header {
    font-size: 1.25rem;
    color: #011020;
    font-weight: 700;
    line-height: 1.2;
    min-height: 24px;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin-bottom: 1rem;
  }
  .content-wrapper {
    width: 100%;
  }
  .content-block {
    margin-bottom: 0.5rem;
  }
  .content-link {
    color: #0066cc;
    text-decoration: underline;
  }
  .content-link:hover {
    color: #0033cc;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 1rem 0;
    aspect-ratio: 16 / 9;
    min-height: 157.5px;
  }
  .post-image {
    width: 100%;
    max-width: 280px;
    height: 157.5px;
    object-fit: contain;
    border-radius: 0.25rem;
    border: 1px solid #e0e0e0;
  }
  .meta-info {
    color: #666;
    font-size: 0.75rem;
    margin: 0.75rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    min-height: 60px;
  }
  .skeleton {
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .skeleton-image {
    width: 100%;
    max-width: 280px;
    height: 157.5px;
    margin: 1rem 0;
  }
  .skeleton-header {
    width: 80%;
    height: 24px;
  }
  .skeleton-content {
    width: 100%;
    margin-bottom: 1rem;
  }
  @keyframes pulse {
    0% { opacity: 1; }
    50% { opacity: 0.5; }
    100% { opacity: 1; }
  }
  @media (min-width: 768px) {
    .post-header {
      font-size: 2rem;
      min-height: 32px;
    }
    .content-section {
      font-size: 1rem;
    }
    .image-container {
      max-width: 600px;
      min-height: 337.5px;
    }
    .post-image {
      max-width: 600px;
      height: 337.5px;
    }
    .skeleton-image {
      max-width: 600px;
      height: 337.5px;
    }
    .skeleton-header {
      height: 32px;
    }
    .meta-info {
      flex-direction: row;
      min-height: 24px;
    }
  }
`;

// Lazy-load non-critical content blocks
const LazyContentBlocks = lazy(() =>
  Promise.resolve({
    default: ({ blocks, contentHeight }) => (
      <div className="content-wrapper" style={{ minHeight: `${contentHeight}px` }}>
        {blocks.map((block, index) => {
          switch (block.type) {
            case 'paragraph':
              return (
                <p key={index} className="content-block">
                  {block.content}
                </p>
              );
            case 'link':
              return (
                <a
                  key={index}
                  href={block.url}
                  className="content-link"
                  target={block.url.startsWith('/') ? '_self' : '_blank'}
                  rel={block.url.startsWith('/') ? undefined : 'noopener'}
                >
                  {block.text}
                </a>
              );
            default:
              return null;
          }
        })}
      </div>
    ),
  })
);

// Render initial content block for instant paint
const renderInitialBlock = (blocks, contentHeight) => {
  if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
    return <div className="content-wrapper" style={{ minHeight: `${contentHeight}px` }} />;
  }
  const firstBlock = blocks[0];
  return (
    <div className="content-wrapper" style={{ minHeight: `${contentHeight}px` }}>
      {firstBlock.type === 'paragraph' ? (
        <p className="content-block">{firstBlock.content}</p>
      ) : firstBlock.type === 'link' ? (
        <a
          href={firstBlock.url}
          className="content-link"
          target={firstBlock.url.startsWith('/') ? '_self' : '_blank'}
          rel={firstBlock.url.startsWith('/') ? undefined : 'noopener'}
        >
          {firstBlock.text}
        </a>
      ) : null}
    </div>
  );
};

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  const contentHeight = post?.estimatedContentHeight || 150;
  const skeletonHeight = contentHeight;

  if (!post || !post.title) {
    return (
      <article>
        <header>
          <div className="image-container" aria-hidden="true">
            <div className="skeleton skeleton-image" />
          </div>
          <div className="skeleton skeleton-header" aria-hidden="true" />
          <div className="meta-info" aria-hidden="true">
            <div className="skeleton skeleton-meta" />
            <div className="skeleton skeleton-meta" />
            <div className="skeleton skeleton-meta" />
          </div>
        </header>
        <section className="content-section" aria-hidden="true">
          <div className="skeleton skeleton-content" style={{ minHeight: `${skeletonHeight}px` }} />
        </section>
        <style>{criticalCss}</style>
      </article>
    );
  }

  const formattedDate =
    post?.date && !isNaN(new Date(post.date).getTime())
      ? new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Unknown Date';

  return (
    <article>
      <header>
        {post.titleImage && (
          <div className="image-container">
            <img
              src={`${post.titleImage}?w=280&format=avif&q=40`}
              srcSet={`${post.titleImage}?w=280&format=avif&q=40 280w, ${post.titleImage}?w=600&format=avif&q=40 600w`}
              sizes="(max-width: 767px) 280px, 600px"
              alt={post.title || 'Post image'}
              className="post-image"
              width="280"
              height="157.5"
              decoding="async"
              loading="eager"
              fetchpriority="high"
              onError={(e) => {
                console.error('Image Failed:', post.titleImage);
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <h1 className="post-header">{post.title}</h1>
        <div className="meta-info">
          <span>By {post.author || 'Unknown'}</span>
          <span> | {formattedDate}</span>
          <span> | Read time: <span id="read-time">{readTime || '0'}</span> min</span>
        </div>
      </header>
      <section className="content-section" role="region" aria-label="Post content" style={{ minHeight: `${contentHeight}px` }}>
        {renderInitialBlock(post.contentBlocks, contentHeight)}
        {post.contentBlocks && post.contentBlocks.length > 1 && (
          <Suspense fallback={<div className="skeleton skeleton-content" style={{ minHeight: `${contentHeight}px` }} />}>
            <LazyContentBlocks blocks={post.contentBlocks.slice(1)} contentHeight={contentHeight} />
          </Suspense>
        )}
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent; 
