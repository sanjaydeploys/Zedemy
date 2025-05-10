import React, { memo } from 'react';

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
    .meta-info {
      flex-direction: row;
      min-height: 24px;
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  const contentHeight = post?.estimatedContentHeight || 150;

  if (!post || !post.title) {
    return (
      <article>
        <header>
          <div className="image-container" aria-hidden="true">
            <div style={{ width: '100%', maxWidth: '280px', height: '157.5px', background: '#e0e0e0', borderRadius: '0.25rem' }} />
          </div>
          <div style={{ width: '80%', height: '24px', background: '#e0e0e0', borderRadius: '0.25rem' }} aria-hidden="true" />
          <div className="meta-info" aria-hidden="true">
            <div style={{ width: '100px', height: '16px', background: '#e0e0e0', borderRadius: '0.25rem' }} />
            <div style={{ width: '100px', height: '16px', background: '#e0e0e0', borderRadius: '0.25rem' }} />
            <div style={{ width: '100px', height: '16px', background: '#e0e0e0', borderRadius: '0.25rem' }} />
          </div>
        </header>
        <section className="content-section" aria-hidden="true" style={{ minHeight: `${contentHeight}px` }}>
          <div style={{ width: '100%', minHeight: `${contentHeight}px`, background: '#e0e0e0', borderRadius: '0.25rem' }} />
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
        <div
          className="content-wrapper"
          style={{ minHeight: `${contentHeight}px` }}
          dangerouslySetInnerHTML={{ __html: post.preRenderedContent || '' }}
        />
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
