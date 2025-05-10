import React, { memo, useState, useEffect, useRef } from 'react';

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
    contain-intrinsic-size: 100% 24px;
    will-change: contents;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin: 0 0 1rem 0;
    padding: 0;
    min-height: 150px;
    contain-intrinsic-size: 100% 150px;
    will-change: contents;
  }
  .content-wrapper {
    width: 100%;
    min-height: 150px;
    contain-intrinsic-size: 100% 150px;
    will-change: contents;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 1rem 0;
    aspect-ratio: 16 / 9;
    position: relative;
    min-height: 157.5px;
    contain-intrinsic-size: 280px 157.5px;
    will-change: contents;
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
    will-change: contents;
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
    margin: 0 0 1rem 0;
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
    display: flex;
    flex-direction: column;
    gap: 10px;
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
      height: 32px;
      contain-intrinsic-size: 100% 32px;
    }
    .content-section {
      font-size: 1rem;
      min-height: 200px;
      contain-intrinsic-size: 100% 200px;
    }
    .content-wrapper {
      min-height: 200px;
      contain-intrinsic-size: 100% 200px;
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
    }
    .skeleton-paragraph {
      height: 80px;
      contain-intrinsic-size: 100% 80px;
    }
    .skeleton-content-container {
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

  const [contentHeight, setContentHeight] = useState(150); // Default height for mobile
  const contentRef = useRef(null);
  const isDesktop = window.matchMedia('(min-width: 768px)').matches;

  // Estimate number of skeleton paragraphs based on content length
  const estimateParagraphCount = (content) => {
    if (!content) return 3;
    const charCount = content.length;
    // Rough estimate: ~500 chars per paragraph, minimum 3, maximum 6
    return Math.max(3, Math.min(6, Math.ceil(charCount / 500)));
  };

  // ResizeObserver to measure content height after rendering
  useEffect(() => {
    if (!post || !contentRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const height = entry.contentRect.height;
        setContentHeight(height);
      }
    });

    observer.observe(contentRef.current);

    return () => observer.disconnect();
  }, [post]);

  if (!post || !post.title) {
    const skeletonParagraphCount = 3; // Default for skeleton
    const skeletonHeight = isDesktop
      ? skeletonParagraphCount * (80 + 10) + 10 // 80px per paragraph + 10px gap
      : skeletonParagraphCount * (60 + 10) + 10; // 60px per paragraph + 10px gap

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
        <section
          className="content-section"
          aria-hidden="true"
          style={{
            minHeight: `${skeletonHeight}px`,
            containIntrinsicSize: `100% ${skeletonHeight}px`,
          }}
        >
          <div
            className="skeleton skeleton-content"
            style={{
              minHeight: `${skeletonHeight}px`,
              containIntrinsicSize: `100% ${skeletonHeight}px`,
            }}
          >
            <div
              className="skeleton-content-container"
              style={{
                minHeight: `${skeletonHeight - 20}px`,
                containIntrinsicSize: `100% ${skeletonHeight - 20}px`,
              }}
            >
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

  const paragraphCount = estimateParagraphCount(post.preRenderedContent || post.content);
  const skeletonHeight = isDesktop
    ? paragraphCount * (80 + 10) + 10 // 80px per paragraph + 10px gap
    : paragraphCount * (60 + 10) + 10; // 60px per paragraph + 10px gap

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
      <section
        className="content-section"
        role="region"
        aria-label="Post content"
        style={{
          minHeight: `${contentHeight}px`,
          containIntrinsicSize: `100% ${contentHeight}px`,
        }}
      >
        <div
          ref={contentRef}
          className="content-wrapper"
          style={{
            minHeight: `${contentHeight}px`,
            containIntrinsicSize: `100% ${contentHeight}px`,
          }}
          dangerouslySetInnerHTML={{ __html: post.preRenderedContent || post.content || '' }}
        />
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
