import React, { memo, useState, useEffect } from 'react';
import { minify } from 'csso';
import { useMediaQuery } from 'react-responsive';

const criticalCss = minify(`
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;font-display:swap;}
.post-header{font-size:1rem;color:#011020;font-weight:700;line-height:1.2;min-height:24px;}
.content-section{font-size:0.875rem;line-height:1.5;width:100%;padding:0.25rem;margin:0;}
.content-section p,.content-section div{margin-bottom:0.5rem;}
.content-section ul,.content-section ol{padding-left:1.5rem;margin-bottom:0.5rem;}
.content-section pre,.content-section code{font-size:0.75rem;margin-bottom:0.5rem;}
.content-section h1,.content-section h2,.content-section h3,.content-section h4,.content-section h5,.content-section h6{font-size:1rem;margin-bottom:0.5rem;}
.content-section .subtitle,.content-section .super-title{font-size:0.875rem;margin-bottom:0.5rem;}
.content-section a{color:#0066cc;text-decoration:underline;}
.content-section img{width:100%;max-width:240px;height:135px;aspect-ratio:16/9;object-fit:contain;}
.image-container{width:100%;max-width:240px;margin:0.25rem 0;aspect-ratio:16/9;min-height:135px;}
.post-image{width:100%;max-width:240px;height:135px;aspect-ratio:16/9;object-fit:contain;}
.meta-info{color:#666;font-size:0.75rem;margin:0.25rem 0;padding:0.25rem;display:grid;grid-template-columns:1fr;gap:0.25rem;min-height:48px;}
.meta-info span{min-height:16px;}
.skeleton{background:#e0e0e0;}
.error-message{color:#d32f2f;font-size:0.75rem;padding:0.25rem;min-height:20px;}
@media (min-width:769px){
    .post-header{font-size:1.25rem;min-height:32px;}
    .content-section{font-size:1rem;line-height:1.6;}
    .content-section .subtitle,.content-section .super-title{font-size:1rem;}
    .content-section img,.post-image{max-width:320px;height:180px;}
    .image-container{max-width:320px;min-height:180px;}
    .meta-info{grid-template-columns:repeat(3,auto);min-height:20px;}
}
`).css;

const ProgressiveContent = ({ html }) => {
  const [content, setContent] = useState('');
  useEffect(() => {
    const firstChunk = html.slice(0, 1000);
    setContent(firstChunk);
    const renderRest = () => {
      setContent(html);
    };
    if (window.requestIdleCallback) {
      window.requestIdleCallback(renderRest, { timeout: 100 });
    } else {
      setTimeout(renderRest, 0);
    }
  }, [html]);
  return (
    <div
      style={{
        width: '100%',
        contain: 'layout',
        fetchPriority: 'high',
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
};

const PriorityContent = memo(({ post: rawPost, readTime }) => {
  const post = rawPost || { preRenderedContent: '', contentHeight: 100, title: 'Loading...' };
  const isLoading = !post || post.title === 'Loading...';
  const isDesktop = useMediaQuery({ minWidth: 769 });

  useEffect(() => {
    if (!post?.preRenderedContent && !isLoading) {
      console.error('[PriorityContent] preRenderedContent is empty:', post);
    }
  }, [post, isLoading]);

  const imageMatches = post?.preRenderedContent?.matchAll(/<img[^>]+src=["']([^"']+)["']/gi) || [];
  const preloadImages = [...imageMatches].slice(0, 2).map(match => match[1]);
  const headerHeight = isDesktop
    ? (post.titleImage ? 252 : 72) // Desktop: 180px img + 36px title + 20px meta + 16px margins
    : (post.titleImage ? 200 : 64); // Mobile: 135px img + 24px title + 48px meta + 16px margins
  const contentHeight = isLoading ? 300 : post?.preRenderedContent ? post.contentHeight : 100;

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
          href={`${post.titleImage}?w=${isDesktop ? 320 : 240}&format=avif&q=30`}
          as="image"
          fetchpriority="high"
        />
      )}
      {preloadImages.map((src, i) => (
        <link
          key={i}
          rel="preload"
          href={`${src}?w=${isDesktop ? 320 : 240}&format=avif&q=30`}
          as="image"
          fetchpriority="high"
        />
      ))}
      {isLoading ? (
        <header style={{ width: '100%', contain: 'layout', margin: 0 }}>
          <div className="image-container" aria-hidden="true">
            <div
              className="skeleton"
              style={{
                width: '100%',
                maxWidth: isDesktop ? '320px' : '240px',
                height: isDesktop ? '180px' : '135px',
                aspectRatio: '16/9',
              }}
            />
          </div>
          <div
            className="skeleton"
            style={{
              width: '80%',
              minHeight: isDesktop ? '32px' : '24px',
              margin: '0.25rem 0',
            }}
            aria-hidden="true"
          />
          <div className="meta-info" aria-hidden="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="skeleton"
                style={{ width: '80px', minHeight: '16px' }}
              />
            ))}
          </div>
        </header>
      ) : (
        <header style={{ width: '100%', contain: 'layout', margin: 0 }}>
          {post.titleImage && (
            <div className="image-container">
              <img
                src={`${post.titleImage}?w=${isDesktop ? 320 : 240}&format=avif&q=30`}
                srcSet={`
                  ${post.titleImage}?w=240&format=avif&q=30 240w,
                  ${post.titleImage}?w=320&format=avif&q=30 320w
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
          contain: 'layout',
          fetchPriority: 'high',
          margin: 0,
        }}
      >
        {isLoading ? (
          <div
            className="skeleton"
            style={{
              width: '100%',
              minHeight: '300px',
            }}
            aria-hidden="true"
          />
        ) : !post?.preRenderedContent ? (
          <p className="error-message">Content failed to render. Please try refreshing the page or contact support.</p>
        ) : (
          <ProgressiveContent html={post.preRenderedContent} />
        )}
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
