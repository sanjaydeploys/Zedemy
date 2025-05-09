import React, { memo } from 'react';

const criticalCss = `
  .post-header {
    font-size: 1.25rem;
    color: #011020;
    margin: 0;
    width: 100%;
    font-weight: 700;
    line-height: 1.2;
    min-height: 24px;
    contain-intrinsic-size: 100% 24px;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin: 0 0 1rem 0;
    padding: 0;
    min-height: 150px;
    contain-intrinsic-size: 100% 150px;
  }
  .content-wrapper {
    width: 100%;
    min-height: 150px;
    contain-intrinsic-size: 100% 150px;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 1rem 0;
    aspect-ratio: 16 / 9;
    position: relative;
    min-height: 157.5px;
    contain-intrinsic-size: 280px 157.5px;
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
    margin: 0.5rem 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    min-height: 48px;
    contain-intrinsic-size: 100% 48px;
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
    contain-intrinsic-size: 280px 157.5px;
  }
  .skeleton-header {
    width: 80%;
    height: 24px;
    margin: 0;
    contain-intrinsic-size: 80% 24px;
  }
  .skeleton-content {
    width: 100%;
    min-height: 150px;
    margin: 0 0 1rem 0;
    contain-intrinsic-size: 100% 150px;
  }
  .skeleton-paragraph {
    width: 100%;
    height: 60px;
    margin-bottom: 10px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: pulse 1.5s ease-in-out infinite;
    contain-intrinsic-size: 100% 60px;
  }
  .skeleton-content-container {
    width: 100%;
    min-height: 130px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    contain-intrinsic-size: 100% 130px;
  }
  .skeleton-meta {
    width: 100px;
    height: 16px;
    margin: 0.25rem 0;
    contain-intrinsic-size: 100px 16px;
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
      contain-intrinsic-size: 100% 32px;
    }
    .content-section {
      font-size: 1rem;
      min-height: 220px;
      contain-intrinsic-size: 100% 220px;
    }
    .content-wrapper {
      min-height: 220px;
      contain-intrinsic-size: 100% 220px;
    }
    .image-container {
      max-width: 600px;
      min-height: 337.5px;
      contain-intrinsic-size: 600px 337.5px;
    }
    .post-image {
      max-width: 600px;
      height: 337.5px;
    }
    .skeleton-image {
      max-width: 600px;
      height: 337.5px;
      contain-intrinsic-size: 600px 337.5px;
    }
    .skeleton-header {
      height: 32px;
      contain-intrinsic-size: 80% 32px;
    }
    .skeleton-content {
      min-height: 220px;
      contain-intrinsic-size: 100% 220px;
    }
    .skeleton-paragraph {
      height: 100px;
      contain-intrinsic-size: 100% 100px;
    }
    .skeleton-content-container {
      min-height: 210px;
      contain-intrinsic-size: 100% 210px;
    }
    .skeleton-meta {
      width: 120px;
      height: 18px;
      contain-intrinsic-size: 120px 18px;
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

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
          <div className="skeleton skeleton-content">
            <div className="skeleton-content-container">
              <div className="skeleton-paragraph" />
              <div className="skeleton-paragraph" />
            </div>
          </div>
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
      <section className="content-section" role="region" aria-label="Post content">
        <div
          className="content-wrapper"
          dangerouslySetInnerHTML={{ __html: post.preRenderedContent || post.content || '' }}
        />
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
