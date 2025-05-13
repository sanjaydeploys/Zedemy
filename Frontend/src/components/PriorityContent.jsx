import React, { memo, useMemo } from 'react';

const criticalCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;font-display:swap;}
.post-header{font-size:clamp(1.25rem,2.5vw,1.5rem);color:#011020;font-weight:700;line-height:1.2;min-height:40px;contain-intrinsic-size:100% 40px;}
.content-section{font-size:1rem;line-height:1.6;width:100%;margin-bottom:0.5rem;padding:0.5rem;}
.content-section p,.content-section ul,.content-section li,.content-section div{margin-bottom:0.5rem;min-height:24px;contain-intrinsic-size:100% 24px;}
.content-section a{color:#0066cc;text-decoration:underline;}
.content-section img{width:100%;max-width:100%;height:auto;aspect-ratio:16/9;contain-intrinsic-size:100% 120px;}
.image-container{width:100%;max-width:280px;margin:0.5rem 0;aspect-ratio:16/9;min-height:157.5px;contain-intrinsic-size:280px 157.5px;}
.post-image{width:100%;max-width:280px;height:auto;aspect-ratio:16/9;object-fit:contain;}
.meta-info{color:#666;font-size:.875rem;margin:0.5rem 0;padding:0.5rem;display:grid;grid-template-columns:1fr;gap:0.5rem;min-height:60px;contain-intrinsic-size:100% 60px;}
.meta-info span{min-height:20px;contain-intrinsic-size:100% 20px;}
.skeleton{background:#e0e0e0;}
.error-message{color:#d32f2f;font-size:0.875rem;padding:0.5rem;min-height:24px;contain-intrinsic-size:100% 24px;}
@media (min-width:769px){
.content-section{font-size:1.125rem;padding:0.5rem;margin-bottom:0.5rem;}
.post-header{font-size:clamp(1.5rem,2.5vw,1.75rem);}
.meta-info{grid-template-columns:repeat(3,auto);gap:0.5rem;min-height:24px;contain-intrinsic-size:100% 24px;}
.image-container{max-width:360px;min-height:202.5px;contain-intrinsic-size:360px 202.5px;}
.post-image{max-width:360px;}
}
@media (max-width:480px){
.post-header{font-size:clamp(1.125rem,2.5vw,1.25rem);}
.image-container{max-width:280px;min-height:157.5px;contain-intrinsic-size:280px 157.5px;}
.post-image{max-width:280px;}
}
`;

const PriorityContent = memo(({ post: rawPost, readTime }) => {
  const post = rawPost || { preRenderedContent: '' };
  const isLoading = !post || post.title === 'Loading...';

  console.log('[PriorityContent] Post state:', { post, hasPreRenderedContent: !!post?.preRenderedContent });
  if (!post?.preRenderedContent && !isLoading) {
    console.warn('[PriorityContent] preRenderedContent is empty:', { post });
  }

  const contentHeight = useMemo(() => {
    if (!post?.preRenderedContent || isLoading) return 300;
    const charCount = post.preRenderedContent.length;
    const imageCount = (post.preRenderedContent.match(/<img/g)?.length || 0);
    return Math.max(300, Math.ceil(charCount / 80) * 25.6 + imageCount * 120); // 16px * 1.6 line-height
  }, [post?.preRenderedContent, isLoading]);

  const firstImageMatch = post?.preRenderedContent?.match(/<img[^>]+src=["']([^"']+)["']/i);

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
          href={`${post.titleImage}?w=${window.innerWidth <= 768 ? 280 : 360}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
        />
      )}
      {firstImageMatch && !isLoading && (
        <link
          rel="preload"
          href={`${firstImageMatch[1]}?w=${window.innerWidth <= 768 ? 280 : 360}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
        />
      )}
      <article
        style={{
          width: '100%',
          maxWidth: '800px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          contain: 'layout',
          fetchPriority: 'high',
        }}
      >
        {isLoading ? (
          <header style={{ width: '100%', contain: 'layout' }}>
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
                minHeight: '40px',
                margin: '0.5rem 0',
                containIntrinsicSize: '80% 40px',
              }}
              aria-hidden="true"
            />
            <div className="meta-info" aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{
                    width: '100px',
                    minHeight: '20px',
                    containIntrinsicSize: '100px 20px',
                  }}
                />
              ))}
            </div>
          </header>
        ) : (
          <header style={{ width: '100%', contain: 'layout' }}>
            {post.titleImage && (
              <div className="image-container">
                <img
                  src={`${post.titleImage}?w=${window.innerWidth <= 768 ? 280 : 360}&format=avif&q=5`}
                  srcSet={`
                    ${post.titleImage}?w=280&format=avif&q=5 280w,
                    ${post.titleImage}?w=360&format=avif&q=5 360w
                  `}
                  sizes="(max-width: 768px) 280px, 360px"
                  alt={post.title || 'Post image'}
                  className="post-image"
                  width={window.innerWidth <= 768 ? 280 : 360}
                  height={window.innerWidth <= 768 ? 157.5 : 202.5}
                  decoding="sync"
                  loading="eager"
                  fetchpriority="high"
                  onError={(e) => {
                    console.error('[PriorityContent] Image Failed:', post.titleImage);
                    e.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
                  }}
                />
              </div>
            )}
            <h1 className="post-header">{post.title || 'Untitled'}</h1>
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
            minHeight: isLoading ? '300px' : `${contentHeight}px`,
            containIntrinsicSize: isLoading ? '100% 300px' : `100% ${contentHeight}px`,
            fetchPriority: 'high',
            contain: 'layout',
          }}
        >
          {isLoading ? (
            <div
              className="skeleton"
              style={{
                width: '100%',
                minHeight: '300px',
                containIntrinsicSize: '100% 300px',
              }}
              aria-hidden="true"
            />
          ) : !post?.preRenderedContent ? (
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
              dangerouslySetInnerHTML={{ __html: post.preRenderedContent }}
            />
          )}
        </section>
        <style>{criticalCss}</style>
      </article>
    </>
  );
});

export default PriorityContent;
