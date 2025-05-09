import React, { memo, useMemo } from 'react';

const criticalCss = `
  .post-header {
    font-size: 1.25rem;
    color: #011020;
    margin: 0.5rem 0;
    width: 100%;
    font-weight: 700;
    line-height: 1.2;
    min-height: 1.5rem;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    min-height: 100px;
    box-sizing: border-box;
    overflow: hidden;
    transition: none;
    margin: 0.5rem 0;
  }
  .content-wrapper {
    width: 100%;
    min-height: 100px;
    margin: 0.5rem 0;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 0.5rem 0;
    aspect-ratio: 16 / 9;
    position: relative;
    min-height: 157.5px;
  }
  .post-image {
    width: 100%;
    max-width: 280px;
    max-height: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 0.25rem;
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
    min-height: 1rem;
  }
  .skeleton-image {
    width: 100%;
    max-width: 280px;
    height: 157.5px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
    position: absolute;
    top: 0;
    left: 0;
  }
  .skeleton-header {
    width: 60%;
    height: 1.25rem;
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
      font-size: 1.5rem;
      min-height: 1.8rem;
    }
    .content-section {
      font-size: 0.9rem;
      min-height: 100px;
      margin: 0.25rem 0;
    }
    .content-wrapper {
      min-height: 100px;
    }
    .image-container {
      max-width: 600px;
      min-height: 337.5px;
    }
    .post-image {
      max-width: 600px;
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

const TextContent = ({ content, category }) => {
  const parsedContent = useMemo(() => {
    if (!content) return [];
    const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
    const elements = [];
    let lastIndex = 0;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const [fullMatch, linkText, url] = match;
      if (match.index > lastIndex) {
        elements.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex, match.index)}</span>);
      }
      elements.push(
        url.startsWith('/') ? (
          <a
            key={`link-${match.index}`}
            href={url}
            className="text-blue-600 hover:text-blue-800"
            aria-label={`Navigate to ${linkText}`}
          >
            {linkText}
          </a>
        ) : (
          <a
            key={`link-${match.index}`}
            href={url}
            target="_blank"
            rel="noopener"
            className="text-blue-600 hover:text-blue-800"
            aria-label={`Visit ${linkText}`}
          >
            {linkText}
          </a>
        )
      );
      lastIndex = match.index + fullMatch.length;
    }
    if (lastIndex < content.length) {
      elements.push(<span key={`text-${lastIndex}`}>{content.slice(lastIndex)}</span>);
    }
    return elements;
  }, [content, category]);

  return (
    <div className="content-wrapper" role="region" aria-label="Post content">
      {parsedContent}
    </div>
  );
};

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  if (!post) {
    return (
      <article>
        <header>
          <div className="image-container">
            <div className="skeleton-image" />
          </div>
          <div className="skeleton-header" />
          <div className="meta-info">
            <div className="skeleton-meta" />
          </div>
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
          day: 'numeric'
        })
      : 'Unknown Date';

  return (
    <article>
      <header>
        {post.titleImage && (
          <div className="image-container">
            <img
              src={`${post.titleImage}?w=280&format=avif&q=50`}
              srcSet={`
                ${post.titleImage}?w=280&format=avif&q=50 280w,
                ${post.titleImage}?w=600&format=avif&q=50 600w
              `}
              sizes="(max-width: 767px) 280px, 600px"
              alt={post.title || 'Post image'}
              className="post-image"
              width="280"
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
      <section className="content-section">
        <TextContent content={post.preRenderedContent || post.content || ''} category={post.category} />
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
