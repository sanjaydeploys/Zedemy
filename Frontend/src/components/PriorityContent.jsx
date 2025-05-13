import React, { memo } from 'react';
import DOMPurify from 'dompurify';

const criticalCss = `
*,*::before,*::after{box-sizing:borderbox;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;font-display:swap;}
.post-header{font-size:clamp(1.5rem,3vw,2rem);color:#011020;font-weight:700;line-height:1.2;min-height:48px;contain-intrinsic-size:100% 48px;}
.content-section{font-size:1.2rem;line-height:1.8;width:100%;margin-bottom:2rem;padding:1rem;}
.content-section p,.content-section ul,.content-section li,.content-section div{margin-bottom:1rem;min-height:30px;contain-intrinsic-size:100% 30px;}
.content-section a{color:#0066cc;text-decoration:underline;}
.content-section img{width:100%;max-width:100%;height:auto;}
.image-container{width:100%;max-width:280px;margin:1.5rem 0 2rem;aspect-ratio:16/9;min-height:157.5px;contain-intrinsic-size:280px 157.5px;}
.post-image{width:100%;max-width:280px;height:auto;aspect-ratio:16/9;object-fit:contain;border-radius:.25rem;}
.meta-info{color:#666;font-size:.875rem;margin:1.5rem 0;padding:1rem;display:grid;grid-template-columns:1fr;gap:1rem;min-height:84px;contain-intrinsic-size:100% 84px;}
.meta-info span{min-height:24px;contain-intrinsic-size:100% 24px;}
.skeleton{background:#e0e0e0;border-radius:.25rem;}
.error-message{color:#d32f2f;font-size:1rem;padding:1rem;}
@media (min-width:769px){
.content-section{font-size:1.375rem;padding:2rem;}
.meta-info{grid-template-columns:repeat(3,auto);gap:2rem;min-height:32px;contain-intrinsic-size:100% 32px;}
.image-container{max-width:480px;min-height:270px;contain-intrinsic-size:480px 270px;}
.post-image{max-width:480px;}
}
@media (max-width:480px){
.post-header{font-size:clamp(1.25rem,3vw,1.5rem);}
.image-container{max-width:400px;min-height:225px;contain-intrinsic-size:400px 225px;}
.post-image{max-width:400px;}
}
@media (max-width:320px){
.image-container{max-width:280px;min-height:157.5px;contain-intrinsic-size:280px 157.5px;}
.post-image{max-width:280px;}
}
`;

const PriorityContent = memo(({ post, readTime }) => {
  React.useEffect(() => {
    if (window.requestIdleCallback) {
      window.requestIdleCallback(() => {
        console.log('[PriorityContent] Rendering with post:', { title: post?.title, hasContent: !!post?.preRenderedContent });
      });
    } else {
      console.log('[PriorityContent] Rendering with post:', { title: post?.title, hasContent: !!post?.preRenderedContent });
    }
  }, [post]);

  const isLoading = !post || post.title === 'Loading...';

  const contentHeight = post?.preRenderedContent && !isLoading
    ? Math.max(
        400,
        (post.estimatedContentHeight || 0) +
          (post.preRenderedContent.match(/<(img|ul|ol|p|div)/g)?.length || 0) * 50 +
          (post.preRenderedContent.match(/<img/g)?.length || 0) * 150 +
          (post.preRenderedContent.match(/<ul|<ol/g)?.length || 0) * 30 +
          (post.preRenderedContent.match(/<li/g)?.length || 0) * 20
      )
    : 400;

  const sanitizedContent = React.useMemo(() => {
    if (!post?.preRenderedContent || isLoading) return '';
    const sanitized = DOMPurify.sanitize(post.preRenderedContent, {
      FORBID_TAGS: ['script', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick'],
    });
    console.log('[PriorityContent] Sanitized content:', { inputLength: post.preRenderedContent.length, outputLength: sanitized.length });
    if (!sanitized && post.preRenderedContent) {
      console.warn('[PriorityContent] Sanitized content is empty:', post.preRenderedContent);
    }
    return sanitized;
  }, [post?.preRenderedContent, isLoading]);

  return (
    <>
      <link
        rel="preload"
        href="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif"
        as="font"
        type="font/woff2"
        crossOrigin="anonymous"
      />
      {post?.titleImage && !isLoading && (
        <link
          rel="preload"
          href={`${post.titleImage}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
        />
      )}
      <article
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          contain: 'layout',
          fetchPriority: 'high',
        }}
      >
        {isLoading ? (
          <header style={{ width: '100%', maxWidth: '800px', contain: 'layout' }}>
            <div className="image-container" aria-hidden="true">
              <div
                className="skeleton"
                style={{
                  width: '100%',
                  maxWidth: '280px',
                  aspectRatio: '16/9',
                  minHeight: '157.5px',
                  containIntrinsicSize: '280px 157.5px',
                }}
              />
            </div>
            <div
              className="skeleton"
              style={{
                width: '80%',
                minHeight: '48px',
                margin: '1rem 0',
                containIntrinsicSize: '80% 48px',
              }}
              aria-hidden="true"
            />
            <div className="meta-info" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    width: '120px',
                    minHeight: '24px',
                    containIntrinsicSize: '120px 24px',
                  }}
                />
              ))}
            </div>
          </header>
        ) : (
          <header style={{ width: '100%', maxWidth: '800px', contain: 'layout' }}>
            {post.titleImage && (
              <div className="image-container">
                <img
                  src={`${post.titleImage}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=5`}
                  srcSet={`
                    ${post.titleImage}?w=280&format=avif&q=5 280w,
                    ${post.titleImage}?w=320&format=avif&q=5 320w,
                    ${post.titleImage}?w=360&format=avif&q=5 360w,
                    ${post.titleImage}?w=400&format=avif&q=5 400w,
                    ${post.titleImage}?w=480&format=avif&q=5 480w
                  `}
                  sizes="(max-width: 320px) 280px, (max-width: 480px) 400px, (max-width: 768px) 400px, 480px"
                  alt={post.title || 'Post image'}
                  className="post-image"
                  width={window.innerWidth <= 768 ? 400 : 480}
                  height={window.innerWidth <= 768 ? 225 : 270}
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
            fetchPriority: 'high',
            contain: 'layout',
          }}
        >
          {isLoading ? (
            <div
              className="skeleton"
              style={{
                width: '100%',
                minHeight: `${contentHeight}px`,
                containIntrinsicSize: `100% ${contentHeight}px`,
              }}
              aria-hidden="true"
            />
          ) : !sanitizedContent && post?.preRenderedContent ? (
            <p className="error-message">Content failed to render. Please try refreshing the page.</p>
          ) : (
            <div
              style={{
                width: '100%',
                minHeight: `${contentHeight}px`,
                containIntrinsicSize: `100% ${contentHeight}px`,
                fetchPriority: 'high',
                contain: 'layout',
              }}
              dangerouslySetInnerHTML={{ __html: sanitizedContent }}
            />
          )}
        </section>
        <style>{criticalCss}</style>
      </article>
    </>
  );
});

export default PriorityContent;
