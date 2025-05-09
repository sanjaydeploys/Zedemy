import React, { memo } from 'react';

const criticalCss = `
  .post-header { 
    font-size: 1.5rem; 
    color: #011020; 
    margin: 0.75rem 0; 
    width: 100%; 
    font-weight: 700;
    line-height: 1.2;
  }
  .content-section { 
    font-size: 0.875rem; 
    line-height: 1.7; 
    width: 100%; 
    min-height: 300px; 
    opacity: 1;
    transition: opacity 0.3s ease;
  }
  .content-section div { 
    margin: 0.5rem 0; 
  }
  .content-loading { 
    opacity: 0;
  }
  .image-container { 
    width: 100%; 
    max-width: 280px; 
    margin: 1rem 0; 
    position: relative; 
    aspect-ratio: 16 / 9; 
    height: 157.5px; 
    background: #e0e0e0; 
  }
  .post-image { 
    width: 100%; 
    max-width: 280px; 
    height: 157.5px; 
    object-fit: contain; 
    border-radius: 0.375rem; 
    position: absolute; 
    top: 0; 
    left: 0; 
    z-index: 2; 
  }
  .meta-info { 
    color: #666; 
    font-size: 0.75rem; 
    margin-bottom: 0.75rem; 
    display: flex; 
    gap: 0.5rem; 
    flex-wrap: wrap; 
  }
  .skeleton-image { 
    width: 100%; 
    max-width: 280px; 
    height: 157.5px; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 1rem 0; 
  }
  .skeleton-header { 
    width: 60%; 
    height: 2rem; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 0.75rem 0; 
  }
  .skeleton-meta { 
    width: 40%; 
    height: 1rem; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 0.5rem 0; 
  }
  .skeleton-content { 
    width: 100%; 
    min-height: 300px; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 0.5rem 0; 
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);
  console.log('[PriorityContent] preRenderedContent:', post?.preRenderedContent);
  console.log('[PriorityContent] raw content:', post?.content);

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
              src={`${post.titleImage}?w=280&format=avif&q=1`}
              alt={post.title || 'Post image'}
              className="post-image"
              width="280"
              height="157.5"
              decoding="async"
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
      <section className={`content-section ${!post.preRenderedContent && !post.content ? 'content-loading' : ''}`}>
        {post.preRenderedContent ? (
          <div dangerouslySetInnerHTML={{ __html: post.preRenderedContent }} />
        ) : post.content ? (
          <div>{post.content}</div>
        ) : (
          <div>Loading content...</div>
        )}
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
