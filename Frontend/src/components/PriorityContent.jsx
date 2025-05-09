import React, { memo, useMemo, useState, useEffect } from 'react';
import { parseLinks } from './utils';

const criticalCss = `
  .post-header { 
    font-size: clamp(1.5rem, 3vw, 2rem); 
    color: #011020; 
    margin: 0.75rem 0; 
    width: 100%; 
    max-width: 100%; 
    font-weight: 700;
    line-height: 1.2;
  }
  .content-section { 
    font-size: 0.875rem; 
    line-height: 1.7; 
    width: 100%; 
    max-width: 100%; 
    height: 200px; 
    overflow: hidden; 
  }
  .content-section div { 
    margin: 0.5rem 0; 
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
    height: 200px; 
    background: #e0e0e0; 
    border-radius: 0.375rem; 
    margin: 0.5rem 0; 
  }
  @media (min-width: 769px) {
    .image-container { 
      max-width: 480px; 
      height: 270px; 
    }
    .post-image { 
      max-width: 480px; 
      height: 270px; 
    }
    .skeleton-image { 
      max-width: 480px; 
      height: 270px; 
    }
    .content-section { 
      height: 300px; 
    }
    .skeleton-content { 
      height: 300px; 
    }
  }
  @media (max-width: 480px) {
    .image-container { 
      max-width: 240px; 
      height: 135px; 
    }
    .post-image { 
      max-width: 240px; 
      height: 135px; 
    }
    .content-section { 
      height: 150px; 
    }
    .skeleton-image { 
      max-width: 240px; 
      height: 135px; 
    }
    .skeleton-content { 
      height: 150px; 
    }
  }
  @media (max-width: 320px) {
    .image-container { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .post-image { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .content-section { 
      height: 120px; 
    }
    .skeleton-image { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .skeleton-content { 
      height: 120px; 
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post?.title, 'readTime:', readTime);

  const [isContentReady, setContentReady] = useState(false);

  const formattedDate = useMemo(() => {
    return post?.date && !isNaN(new Date(post.date).getTime())
      ? new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'Unknown Date';
  }, [post?.date]);

  const parsedContent = useMemo(() => {
    return post?.content ? parseLinks(post.content, post?.category || '', true) : 'Loading content...';
  }, [post?.content, post?.category]);

  useEffect(() => {
    if (post?.content) {
      setContentReady(true);
    }
  }, [post?.content]);

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
          <span> | Read time: <span id="read-time">{readTime || 'Calculating...'}</span> min</span>
        </div>
      </header>
      <section className="content-section">
        {isContentReady ? (
          <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
        ) : (
          <div className="skeleton-content" />
        )}
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
