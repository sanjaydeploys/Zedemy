import React, { memo } from 'react';

const criticalCss = `
  .post-header {
    font-size: 1.5rem;
    color: #011020;
    margin: 0.5rem 0;
    width: 100%;
    font-weight: 700;
    line-height: 1.2;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.6;
    width: 100%;
    min-height: 200px;
    opacity: 1;
  }
  .content-section div {
    margin: 0.5rem 0;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 0.5rem 0;
    position: relative;
    aspect-ratio: 16 / 9;
    height: 157.5px;
  }
  .post-image {
    width: 100%;
    height: 157.5px;
    object-fit: contain;
    border-radius: 0.25rem;
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
  }
  .meta-info {
    color: #666;
    font-size: 0.75rem;
    margin-bottom: 0.5rem;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .skeleton-image {
    width: 100%;
    max-width: 280px;
    height: 157.5px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  .skeleton-header {
    width: 60%;
    height: 1.5rem;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  .skeleton-meta {
    width: 40%;
    height: 0.75rem;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  .skeleton-content {
    width: 100%;
    min-height: 200px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  @media (min-width: 768px) {
    .post-header {
      font-size: 1.7rem;
    }
    .content-section {
      font-size: 0.9rem;
      min-height: 300px;
    }
    .image-container {
      max-width: 600px;
      height: 337.5px;
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
      height: 2rem;
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
          <div className="skeleton-image" />
          <div className="skeleton-header" />
          <div className="skeleton-meta" />
        </header>
        <section className="content-section">
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
              src={`${post.titleImage}?w=280&format=avif&q=75`}
              srcSet={`
                ${post.titleImage}?w=280&format=avif&q=75 280w,
                ${post.titleImage}?w=600&format=avif&q=75 600w
              `}
              sizes="(max-width: 767px) 280px, 600px"
              alt={post.title || 'Post image'}
              className="post-image"
              width="280"
              height="157.5"
              decoding="async"
              loading="eager"
              fetchpriority="high"
              onError={(e) => {
                console.error('Title Image Failed:', post.titleImage);
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
      <section className="content-section">
        {post.preRenderedContent ? (
          <div dangerouslySetInnerHTML={{ __html: post.preRenderedContent }} />
        ) : post.content ? (
          <div>{post.content}</div>
        ) : (
          <div className="skeleton-content" />
        )}
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
