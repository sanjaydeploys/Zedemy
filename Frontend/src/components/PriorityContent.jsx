import React, { memo, useEffect } from 'react';
import { minify } from 'csso';
import { useMediaQuery } from 'react-responsive';

const criticalCss = minify(`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;font-display:swap;}
.post-header{font-size:clamp(1.125rem,2vw,1.25rem);color:#011020;font-weight:700;line-height:1.2;min-height:32px;contain-intrinsic-size:100% 32px;}
.content-section{font-size:1rem;line-height:1.6;width:100%;padding:0.25rem;margin:0;min-height:100px;box-sizing:border-box;}
.content-section p:not(:last-child),.content-section div:not(:last-child),.content-section ul:not(:last-child),.content-section ol:not(:last-child),.content-section pre:not(:last-child),.content-section h1:not(:last-child),.content-section h2:not(:last-child),.content-section h3:not(:last-child),.content-section h4:not(:last-child),.content-section h5:not(:last-child),.content-section h6:not(:last-child),.content-section .subtitle:not(:last-child),.content-section .super-title:not(:last-child){margin-bottom:0.5rem;}
.content-section p,.content-section div{min-height:24px;contain-intrinsic-size:100% 24px;}
.content-section ul,.content-section ol{padding-left:1.5rem;min-height:24px;contain-intrinsic-size:100% 24px;}
.content-section pre,.content-section code{font-size:0.875rem;min-height:40px;contain-intrinsic-size:100% 40px;}
.content-section h1,.content-section h2,.content-section h3,.content-section h4,.content-section h5,.content-section h6{min-height:40px;contain-intrinsic-size:100% 40px;}
.content-section .subtitle,.content-section .super-title{font-size:1.125rem;min-height:28px;contain-intrinsic-size:100% 28px;}
.content-section a{color:#0066cc;text-decoration:underline;}
.content-section img{width:100%;max-width:100%;height:auto;aspect-ratio:16/9;contain-intrinsic-size:100% 135px;}
.image-container{width:100%;max-width:240px;margin:0.25rem 0;aspect-ratio:16/9;min-height:135px;contain-intrinsic-size:240px 135px;}
.post-image{width:100%;max-width:240px;height:auto;aspect-ratio:16/9;object-fit:contain;}
.meta-info{color:#666;font-size:.75rem;margin:0.25rem 0;padding:0.25rem;display:grid;grid-template-columns:1fr;gap:0.25rem;min-height:48px;contain-intrinsic-size:100% 48px;}
.meta-info span{min-height:16px;contain-intrinsic-size:100% 16px;}
.skeleton{background:#e0e0e0;}
.error-message{color:#d32f2f;font-size:0.75rem;padding:0.25rem;min-height:20px;contain-intrinsic-size:100% 20px;}
@media (min-width:769px){
    .content-section{font-size:1.125rem;}
    .post-header{font-size:clamp(1.25rem,2vw,1.5rem);}
    .meta-info{grid-template-columns:repeat(3,auto);gap:0.25rem;min-height:20px;contain-intrinsic-size:100% 20px;}
    .image-container{max-width:320px;min-height:180px;contain-intrinsic-size:320px 180px;}
    .post-image{max-width:320px;}
    .content-section img{contain-intrinsic-size:100% 180px;}
}
@media (max-width:480px){
    .post-header{font-size:clamp(1rem,2vw,1.125rem);}
    .image-container{max-width:240px;min-height:135px;contain-intrinsic-size:240px 135px;}
    .post-image{max-width:240px;}
}
`).css;

const PriorityContent = memo(({ post: rawPost, readTime }) => {
  const post = rawPost || { preRenderedContent: '', contentHeight: 100, title: 'Loading...' };
  const isLoading = !post || post.title === 'Loading...';
  const isDesktop = useMediaQuery({ minWidth: 769 });

  useEffect(() => {
    console.log('[PriorityContent] Rendering with post:', {
      postId: post.postId,
      title: post.title,
      hasPreRenderedContent: !!post?.preRenderedContent,
      contentHeight: post.contentHeight,
      isDesktop
    });
    if (!post?.preRenderedContent && !isLoading) {
      console.warn('[PriorityContent] preRenderedContent is empty:', post);
    }
  }, [post, isLoading, isDesktop]);

  const firstImageMatch = post?.preRenderedContent?.match(/<img[^>]+src=["']([^"']+)["']/i);
  const errorContentHeight = 100;
  const headerHeight = isDesktop
    ? (post.titleImage ? 252 : 72) // Desktop: 180px img + 36px title + 20px meta + 16px margins
    : (post.titleImage ? 215 : 68); // Mobile: 135px img + 32px title + 48px meta + 16px margins
  const contentHeight = isLoading ? 300 : post?.preRenderedContent ? post.contentHeight : errorContentHeight;

  return (
    <article
      style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '0.5rem',
        margin: 0,
        contain: 'layout',
        fetchPriority: 'high',
      }}
      aria-live="polite"
    >
      {post?.titleImage && !isLoading && (
        <link
          rel="preload"
          href={`${post.titleImage}?w=${isDesktop ? 320 : 240}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
          media={isDesktop ? '(min-width: 769px)' : '(max-width: 768px)'}
        />
      )}
      {firstImageMatch && !isLoading && (
        <link
          rel="preload"
          href={`${firstImageMatch[1]}?w=${isDesktop ? 320 : 240}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
          media={isDesktop ? '(min-width: 769px)' : '(max-width: 768px)'}
        />
      )}
      {isLoading ? (
        <header style={{ width: '100%', contain: 'layout', margin: 0 }}>
          <div className="image-container" aria-hidden="true">
            <div
              className="skeleton"
              style={{
                width: '100%',
                maxWidth: isDesktop ? '320px' : '240px',
                aspectRatio: '16/9',
                minHeight: isDesktop ? '180px' : '135px',
                containIntrinsicSize: isDesktop ? '320px 180px' : '240px 135px',
              }}
            />
          </div>
          <div
            className="skeleton"
            style={{
              width: '80%',
              minHeight: isDesktop ? '36px' : '32px',
              margin: '0.25rem 0',
              containIntrinsicSize: isDesktop ? '80% 36px' : '80% 32px',
            }}
            aria-hidden="true"
          />
          <div className="meta-info" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{
                  width: '80px',
                  minHeight: isDesktop ? '16px' : '16px',
                  containIntrinsicSize: '80px 16px',
                }}
              />
            ))}
          </div>
        </header>
      ) : (
        <header style={{ width: '100%', contain: 'layout', margin: 0 }}>
          {post.titleImage && (
            <div className="image-container">
              <img
                src={`${post.titleImage}?w=${isDesktop ? 320 : 240}&format=avif&q=5`}
                srcSet={`
                  ${post.titleImage}?w=240&format=avif&q=5 240w,
                  ${post.titleImage}?w=320&format=avif&q=5 320w
                `}
                sizes="(max-width: 768px) 240px, 320px"
                alt={post.title || 'Post image'}
                className="post-image"
                width={isDesktop ? 320 : 240}
                height={isDesktop ? 180 : 135}
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
          minHeight: `${contentHeight}px`,
          containIntrinsicSize: `100% ${contentHeight}px`,
          fetchPriority: 'high',
          contain: 'layout',
          boxSizing: 'border-box',
          margin: 0,
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
          <p className="error-message">Content failed to render. Please try refreshing the page or contact support.</p>
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
  );
});

export default PriorityContent;
