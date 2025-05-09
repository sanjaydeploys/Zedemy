import React, { memo } from 'react';

const criticalCss = `
  .post-header { 
    font-size: clamp(1.5rem, 3vw, 2rem); 
    color: #333; 
    margin: 0.5rem 0; 
    width: 100%; 
    font-weight: 700;
    line-height: 1.2;
  }
  .content-section { 
    font-size: 1rem; 
    line-height: 1.6; 
    width: 100%; 
    height: 200px; 
    margin: 0.5rem 0; 
  }
  .image-container { 
    width: 100%; 
    max-width: 280px; 
    margin: 0.5rem 0; 
    height: 157.5px; 
    background: #f0f0f0; 
  }
  .post-image { 
    width: 100%; 
    max-width: 280px; 
    height: 157.5px; 
    object-fit: cover; 
    border-radius: 4px; 
  }
  .meta-info { 
    color: #666; 
    font-size: 0.875rem; 
    margin: 0.5rem 0; 
    display: flex; 
    gap: 0.5rem; 
    flex-wrap: wrap; 
  }
  .skeleton-image { 
    width: 100%; 
    max-width: 280px; 
    height: 157.5px; 
    background: #f0f0f0; 
    border-radius: 4px; 
    margin: 0.5rem 0; 
  }
  .skeleton-header { 
    width: 60%; 
    height: 2rem; 
    background: #f0f0f0; 
    border-radius: 4px; 
    margin: 0.5rem 0; 
  }
  .skeleton-meta { 
    width: 40%; 
    height: 1rem; 
    background: #f0f0f0; 
    border-radius: 4px; 
    margin: 0.5rem 0; 
  }
  .skeleton-content { 
    width: 100%; 
    height: 200px; 
    background: #f0f0f0; 
    border-radius: 4px; 
    margin: 0.5rem 0; 
  }
  @media (min-width: 769px) {
    .image-container, .skeleton-image { 
      max-width: 480px; 
      height: 270px; 
    }
    .post-image { 
      max-width: 480px; 
      height: 270px; 
    }
    .content-section, .skeleton-content { 
      height: 300px; 
    }
  }
  @media (max-width: 480px) {
    .image-container, .skeleton-image { 
      max-width: 240px; 
      height: 135px; 
    }
    .post-image { 
      max-width: 240px; 
      height: 135px; 
    }
    .content-section, .skeleton-content { 
      height: 150px; 
    }
  }
  @media (max-width: 320px) {
    .image-container, .skeleton-image { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .post-image { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .content-section, .skeleton-content { 
      height: 120px; 
    }
  }
`;

const PriorityContent = memo(({ preRenderedContent, post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post?.title, 'readTime:', readTime);

  const formattedDate = post?.date && !isNaN(new Date(post.date).getTime())
    ? new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown Date';

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

  return (
    <article>
      <header>
        {post.titleImage && (
          <div className="image-container">
            <img
              src={`${post.titleImage}?w=100&format=avif&q=1`}
              srcSet={`
                ${post.titleImage}?w=100&format=avif&q=1 100w,
                ${post.titleImage}?w=150&format=avif&q=1 150w,
                ${post.titleImage}?w=200&format=avif&q=1 200w,
                ${post.titleImage}?w=240&format=avif&q=1 240w,
                ${post.titleImage}?w=280&format=avif&q=1 280w,
                ${post.titleImage}?w=480&format=avif&q=1 480w
              `}
              sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
              alt={post.title || 'Post image'}
              className="post-image"
              width="280"
              height="157.5"
              decoding="async"
              loading="lazy"
              onError={() => console.error('Title Image Failed:', post.titleImage)}
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
        <div>{preRenderedContent}</div>
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
