import React, { memo, useMemo } from 'react';

const criticalCss = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    margin: 0;
    padding: 0;
  }
  .post-header {
    font-size: clamp(1.5rem, 3vw, 2rem);
    color: #011020;
    font-weight: 700;
    line-height: 1.2;
    text-rendering: optimizeSpeed;
    contain: layout;
    min-height: 32px;
    contain-intrinsic-size: 100% 32px;
    margin: 0.5rem 0;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    margin-bottom: 1rem;
    contain: strict;
    content-visibility: auto;
    will-change: transform;
  }
  .content-section p {
    margin-bottom: 0.5rem;
    min-height: 21px;
    contain-intrinsic-size: 100% 21px;
    contain: layout;
    overflow-wrap: break-word;
  }
  .content-section ul, .content-section ol {
    margin-bottom: 0.5rem;
    padding-left: 1.25rem;
    min-height: 30px;
    contain-intrinsic-size: 100% 30px;
    contain: layout;
  }
  .content-section li {
    margin-bottom: 0.25rem;
    min-height: 21px;
    contain-intrinsic-size: 100% 21px;
    contain: layout;
  }
  .content-section div {
    margin-bottom: 0.5rem;
    min-height: 21px;
    contain-intrinsic-size: 100% 21px;
    contain: layout;
    overflow-wrap: break-word;
  }
  .content-section a {
    color: #0066cc;
    text-decoration: underline;
  }
  .content-section a:hover {
    color: #0033cc;
  }
  .content-section img {
    width: 100%;
    max-width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    min-height: 112.5px;
    contain-intrinsic-size: 100% 112.5px;
    object-fit: contain;
    border-radius: 0.25rem;
    border: 1px solid #e0e0e0;
    contain: layout;
    will-change: transform;
  }
  .image-container {
    width: 100%;
    max-width: 100%;
    margin: 1rem 0 1.5rem;
    aspect-ratio: 16 / 9;
    min-height: 157.5px;
    contain-intrinsic-size: 100% 157.5px;
    contain: layout;
    will-change: transform;
  }
  .post-image {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 9;
    object-fit: contain;
    border-radius: 0.25rem;
    border: 1px solid #e0e0e0;
    contain: layout;
  }
  .meta-info {
    color: #666;
    font-size: 0.75rem;
    margin: 0.75rem 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    contain: layout;
    min-height: 60px;
    contain-intrinsic-size: 100% 60px;
  }
  .meta-info span {
    min-height: 16px;
    contain-intrinsic-size: 100% 16px;
  }
  .skeleton {
    background: #e0e0e0;
    border-radius: 0.25rem;
    contain: layout;
  }
  @media (min-width: 769px) {
    .post-header {
      font-size: clamp(1.75rem, 3vw, 2.25rem);
    }
    .content-section {
      font-size: 1rem;
      line-height: 1.5;
    }
    .content-section p {
      min-height: 24px;
      contain-intrinsic-size: 100% 24px;
    }
    .content-section ul, .content-section ol {
      min-height: 36px;
      contain-intrinsic-size: 100% 36px;
    }
    .content-section li {
      min-height: 24px;
      contain-intrinsic-size: 100% 24px;
    }
    .content-section div {
      min-height: 24px;
      contain-intrinsic-size: 100% 24px;
    }
    .content-section img {
      min-height: 450px;
      contain-intrinsic-size: 100% 450px;
    }
    .meta-info {
      flex-direction: row;
      gap: 1rem;
      min-height: 24px;
      contain-intrinsic-size: 100% 24px;
    }
    .image-container {
      min-height: 450px;
      contain-intrinsic-size: 100% 450px;
    }
  }
  @media (max-width: 480px) {
    .post-header {
      font-size: clamp(1.25rem, 3vw, 1.5rem);
    }
    .content-section {
      font-size: 0.75rem;
    }
    .content-section img {
      min-height: 225px;
      contain-intrinsic-size: 100% 225px;
    }
    .image-container {
      min-height: 225px;
      contain-intrinsic-size: 100% 225px;
    }
  }
  @media (max-width: 320px) {
    .content-section img {
      min-height: 157.5px;
      contain-intrinsic-size: 100% 157.5px;
    }
    .image-container {
      min-height: 157.5px;
      contain-intrinsic-size: 100% 157.5px;
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);

  const isLoading = !post || post.title === 'Loading...';

  const contentHeight = useMemo(() => {
    if (isLoading || !post?.preRenderedContent) return 150;

    const parser = new DOMParser();
    const doc = parser.parseFromString(post.preRenderedContent, 'text/html');
    let height = 0;

    // Mobile: font-size: 0.875rem, line-height: 1.5 (21px per line)
    // Desktop: font-size: 1rem, line-height: 1.5 (24px per line)
    const lineHeight = window.innerWidth <= 768 ? 21 : 24;
    const imageHeight = window.innerWidth <= 320 ? 157.5 : window.innerWidth <= 768 ? 225 : 450;
    const listHeight = window.innerWidth <= 768 ? 30 : 36;

    // Count paragraphs
    const paragraphs = doc.querySelectorAll('p');
    paragraphs.forEach((p) => {
      const textLength = p.textContent.length;
      const lines = Math.ceil(textLength / 80); // ~80 chars per line
      height += lines * lineHeight + 8; // +margin-bottom: 0.5rem
    });

    // Count lists
    const lists = doc.querySelectorAll('ul, ol');
    lists.forEach((list) => {
      const items = list.querySelectorAll('li');
      height += listHeight + items.length * lineHeight + 8; // +margin-bottom
    });

    // Count images
    const images = doc.querySelectorAll('img');
    height += images.length * (imageHeight + 24); // +margin: 1rem 0 1.5rem

    // Count divs
    const divs = doc.querySelectorAll('div:not([class*="skeleton"])');
    divs.forEach((div) => {
      const textLength = div.textContent.length;
      const lines = Math.ceil(textLength / 80);
      height += lines * lineHeight + 8; // +margin-bottom
    });

    return Math.max(150, height);
  }, [post, isLoading]);

  const skeletonItems = useMemo(() => {
    if (isLoading) {
      const items = [];
      const lineHeight = window.innerWidth <= 768 ? 21 : 24;
      const imageHeight = window.innerWidth <= 320 ? 157.5 : window.innerWidth <= 768 ? 225 : 450;
      // Header
      items.push({ type: 'header', width: '80%', minHeight: '32px' });
      // Meta
      items.push({ type: 'meta', width: '100px', minHeight: '16px', count: 3 });
      // Image
      items.push({ type: 'image', minHeight: `${imageHeight}px` });
      // Paragraphs (simulate 3 paragraphs)
      items.push({ type: 'paragraph', width: '100%', minHeight: `${lineHeight * 3}px` });
      // List (simulate 3 items)
      items.push({ type: 'list', width: '100%', minHeight: `${lineHeight * 3 + 8}px` });
      return items;
    }
    return [];
  }, [isLoading]);

  return (
    <>
      {post?.titleImage && !isLoading && (
        <link
          rel="preload"
          href={`${post.titleImage}?w=${window.innerWidth <= 768 ? 400 : 800}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
        />
      )}
      <article
        style={{
          contain: 'layout',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {isLoading ? (
          <header style={{ width: '100%', maxWidth: '800px' }}>
            {skeletonItems.map((item, index) => {
              if (item.type === 'image') {
                return (
                  <div key={index} className="image-container" aria-hidden="true">
                    <div className="skeleton" style={{ width: '100%', minHeight: item.minHeight, aspectRatio: '16 / 9' }} />
                  </div>
                );
              }
              if (item.type === 'meta') {
                return (
                  <div key={index} className="meta-info" aria-hidden="true">
                    {Array.from({ length: item.count }).map((_, i) => (
                      <div
                        key={i}
                        className="skeleton"
                        style={{ width: item.width, minHeight: item.minHeight }}
                      />
                    ))}
                  </div>
                );
              }
              return (
                <div
                  key={index}
                  className="skeleton"
                  style={{ width: item.width, minHeight: item.minHeight, margin: '0.5rem 0' }}
                  aria-hidden="true"
                />
              );
            })}
          </header>
        ) : (
          <header style={{ width: '100%', maxWidth: '800px' }}>
            {post.titleImage && (
              <div className="image-container">
                <img
                  src={`${post.titleImage}?w=${window.innerWidth <= 768 ? 400 : 800}&format=avif&q=5`}
                  srcSet={`
                    ${post.titleImage}?w=280&format=avif&q=5 280w,
                    ${post.titleImage}?w=320&format=avif&q=5 320w,
                    ${post.titleImage}?w=360&format=avif&q=5 360w,
                    ${post.titleImage}?w=400&format=avif&q=5 400w,
                    ${post.titleImage}?w=480&format=avif&q=5 480w,
                    ${post.titleImage}?w=800&format=avif&q=5 800w
                  `}
                  sizes="(max-width: 320px) 280px, (max-width: 480px) 400px, (max-width: 768px) 400px, 800px"
                  alt={post.title || 'Post image'}
                  className="post-image"
                  width={window.innerWidth <= 768 ? 400 : 800}
                  height={window.innerWidth <= 768 ? 225 : 450}
                  decoding="sync"
                  loading="eager"
                  fetchpriority="high"
                  onError={(e) => {
                    console.error('Image Failed:', post.titleImage);
                    e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
                  }}
                />
              </div>
            )}
            <h1 className="post-header">{post.title}</h1>
            <div className="meta-info">
              <span>By {post.author || 'Unknown'}</span>
              <span>
                {' | '}
                {post.date && !isNaN(new Date(post.date).getTime())
                  ? new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'Unknown Date'}
              </span>
              <span>
                {' | Read time: '}
                <span id="read-time">{readTime || '0'}</span> min
              </span>
            </div>
          </header>
        )}
        <section
          className="content-section"
          role="region"
          aria-label="Post content"
          style={{
            width: '100%',
            maxWidth: '800px',
            minHeight: `${contentHeight}px`,
            containIntrinsicSize: `100% ${contentHeight}px`,
          }}
        >
          {isLoading ? (
            <div aria-hidden="true">
              {skeletonItems
                .filter((item) => ['paragraph', 'list', 'image'].includes(item.type))
                .map((item, index) => (
                  <div
                    key={index}
                    className="skeleton"
                    style={{
                      width: item.width,
                      minHeight: item.minHeight,
                      margin: item.type === 'image' ? '1rem 0 1.5rem' : '0.5rem 0',
                      aspectRatio: item.type === 'image' ? '16 / 9' : undefined,
                    }}
                  />
                ))}
            </div>
          ) : (
            <div
              style={{
                contain: 'layout',
                width: '100%',
                minHeight: `${contentHeight}px`,
                containIntrinsicSize: `100% ${contentHeight}px`,
              }}
              dangerouslySetInnerHTML={{
                __html: post.preRenderedContent
                  ? post.preRenderedContent.replace(
                      /<img\s+([^>]*?)src=/g,
                      '<img $1loading="lazy" decoding="async" fetchpriority="low" src='
                    )
                  : '',
              }}
            />
          )}
        </section>
        <style>{criticalCss}</style>
      </article>
    </>
  );
});

export default PriorityContent;
