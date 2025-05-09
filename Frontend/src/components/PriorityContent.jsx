import React, { memo } from 'react';

const criticalCss = `
  .post-header {
    font-size: 1.25rem;
    color: #011020;
    margin: 0;
    width: 100%;
    font-weight: 700;
    line-height: 1.2;
    min-height: 1.5rem;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin: 0;
    padding: 0;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 0;
    aspect-ratio: 16 / 9;
    position: relative;
    min-height: 157.5px;
  }
  .post-image {
    width: 100%;
    max-width: 280px;
    height: 157.5px;
    object-fit: contain;
    object-position: center;
    border-radius: 0.25rem;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: absolute;
    top: 0;
    left: 0;
  }
  .meta-info {
    color: #666;
    font-size: 0.75rem;
    margin: 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    min-height: 1rem;
  }
  .skeleton-image {
    width: 100%;
    max-width: 280px;
    height: 157.5px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0;
    position: absolute;
    top: 0;
    left: 0;
  }
  .skeleton-header {
    width: 80%;
    height: 1.25rem;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0;
  }
  .skeleton-content {
    width: 100%;
    min-height: 200px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0;
  }
  @media (min-width: 768px) {
    .post-header {
      font-size: 2rem;
      min-height: 2rem;
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
      height: 1.5rem;
    }
    .skeleton-content {
      min-height: 300px;
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  if (!post) {
    return (
      <article>
        <header>
          <div className="image-container" aria-hidden="true">
            <div className="skeleton-image" />
          </div>
          <div className="skeleton-header" aria-hidden="true" />
          <div className="meta-info" aria-hidden="true">
            <div className="skeleton-meta" />
          </div>
        </header>
        <section className="content-section" aria-hidden="true">
          <div className="skeleton-content" />
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
              fetchpriority="low"
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
      <section
        className="content-section"
        role="region"
        aria-label="Post content"
        dangerouslySetInnerHTML={{ __html: post.preRenderedContent || post.content || '' }}
      />
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
