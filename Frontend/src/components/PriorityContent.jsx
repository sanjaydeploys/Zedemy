import React, { memo } from 'react';

const criticalCss = `
  * {
    box-sizing: border-box;
  }
  .post-header {
    font-size: 1.25rem;
    color: #011020;
    margin: 0;
    width: 100%;
    font-weight: 700;
    line-height: 1.2;
    min-height: 24px;
    height: 24px;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin: 0 0 1rem 0;
    padding: 0;
    min-height: 150px;
  }
  .content-wrapper {
    width: 100%;
    min-height: 150px;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 1rem 0;
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
    margin: 0;
  }
  .skeleton-content {
    width: 100%;
    margin: 0 0 1rem 0;
    min-height: 150px;
  }
  .skeleton-paragraph {
    width: 100%;
    height: 60px;
    margin-bottom: 10px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    animation: pulse 1.5s ease-in-out infinite;
  }
  .skeleton-content-container {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-height: 130px;
  }
  .skeleton-meta {
    width: 100px;
    height: 16px;
    margin: 0.25rem 0;
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
      height: 32px;
    }
    .content-section {
      font-size: 1rem;
      min-height: 200px;
    }
    .content-wrapper {
      min-height: 200px;
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
    .skeleton-content {
      min-height: 200px;
    }
    .skeleton-paragraph {
      height: 80px;
    }
    .skeleton-content-container {
      min-height: 170px;
    }
    .skeleton-meta {
      width: 120px;
      height: 18px;
    }
    .meta-info {
      flex-direction: row;
      min-height: 48px;
    }
  }
`;

// Simple HTML parser to render content incrementally
const renderContent = (html) => {
  if (!html) return null;
  // Split content into paragraphs for progressive rendering
  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const elements = Array.from(doc.body.firstChild.childNodes);
  return elements.map((node, index) => {
    if (node.nodeType === Node.TEXT_NODE) {
      return <span key={index}>{node.textContent}</span>;
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const tag = node.tagName.toLowerCase();
      const props = {
        key: index,
        className: node.className,
        style: node.style.cssText ? { ...node.style } : undefined,
      };
      if (tag === 'a') {
        props.href = node.href;
        props.target = node.target || '_blank';
        props.rel = node.rel || 'noopener';
      }
      return React.createElement(tag, props, node.innerHTML);
    }
    return null;
  });
};

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  const contentHeight = post?.estimatedContentHeight || 150;
  const skeletonParagraphCount = post ? Math.max(2, Math.min(4, Math.ceil((post.preRenderedContent || post.content || '').length / 500))) : 2;
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;
  const skeletonHeight = isDesktop ? skeletonParagraphCount * (80 + 10) + 10 : skeletonParagraphCount * (60 + 10) + 10;

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
          <div className="skeleton skeleton-content" style={{ minHeight: `${skeletonHeight}px` }}>
            <div className="skeleton-content-container" style={{ minHeight: `${skeletonHeight - 20}px` }}>
              {Array.from({ length: skeletonParagraphCount }).map((_, i) => (
                <div key={i} className="skeleton-paragraph" />
              ))}
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
      <section className="content-section" role="region" aria-label="Post content" style={{ minHeight: `${contentHeight}px` }}>
        <div className="content-wrapper" style={{ minHeight: `${contentHeight}px` }}>
          {renderContent(post.preRenderedContent || post.content)}
        </div>
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
