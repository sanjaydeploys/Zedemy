import React, { memo, useState, useEffect, useDeferredValue } from 'react';
import { minify } from 'csso';

const criticalCss = minify(`
*,*::before,*::after{box-sizing:border-box;}
body{font-family:system-ui,-apple-system,sans-serif;font-display:swap;margin:0;}
.post-header{font-size:0.875rem;color:#011020;font-weight:700;line-height:1.2;}
.content-section{font-size:0.875rem;line-height:1.4;width:100%;padding:0.25rem;contain:strict;overflow:hidden;}
.content-section > *:last-child{margin-bottom:0 !important;}
.content-section{padding-bottom:0 !important;}
.content-section p,.content-section div,.content-section ul,.content-section ol,.content-section pre,.content-section h1,.content-section h2,.content-section h3,.content-section h4,.content-section h5,.content-section h6,.content-section .subtitle,.content-section .super-title{margin-bottom:0.5rem;}
.content-section a{color:#0066cc;text-decoration:underline;}
.content-section img{max-width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;}
.image-container{max-width:100%;margin-bottom:0.5rem;}
.post-image{max-width:100%;height:auto;aspect-ratio:16/9;object-fit:cover;}
.meta-info{color:#666;font-size:0.75rem;padding:0.25rem;}
.skeleton{background:linear-gradient(90deg,#e0e0e0 25%,#f0f0f0 50%,#e0e0e0 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;}
@keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
.error-message{color:#d32f2f;font-size:0.75rem;padding:0.25rem;}
@media (max-width:320px){
    .post-header{font-size:0.8125rem;}
    .content-section{font-size:0.8125rem;line-height:1.3;}
    .content-section img,.post-image{max-width:220px;height:123.75px;}
    .image-container{max-width:220px;}
}
@media (min-width:361px){
    .content-section img,.post-image{max-width:240px;height:135px;}
    .image-container{max-width:240px;}
}
@media (min-width:481px){
    .post-header{font-size:0.9375rem;}
    .content-section{font-size:0.9375rem;line-height:1.5;}
    .content-section p,.content-section div,.content-section ul,.content-section ol,.content-section pre,.content-section h1,.content-section h2,.content-section h3,.content-section h4,.content-section h5,.content-section h6,.content-section .subtitle,.content-section .super-title{margin-bottom:0.5625rem;}
    .content-section img,.post-image{max-width:280px;height:157.5px;}
    .image-container{max-width:280px;margin-bottom:0.5625rem;}
    .meta-info{padding:0.3rem;}
}
@media (min-width:769px){
    .post-header{font-size:1rem;}
    .content-section{font-size:1rem;line-height:1.6;}
    .content-section p,.content-section div,.content-section ul,.content-section ol,.content-section pre,.content-section h1,.content-section h2,.content-section h3,.content-section h4,.content-section h5,.content-section h6,.content-section .subtitle,.content-section .super-title{margin-bottom:0.6rem;}
    .content-section img,.post-image{max-width:320px;height:180px;}
    .image-container{max-width:320px;margin-bottom:0.6rem;}
    .meta-info{padding:0.375rem;}
}
@media (min-width:1201px){
    .post-header{font-size:1.125rem;}
    .content-section{font-size:1.125rem;line-height:1.6;}
    .content-section img,.post-image{max-width:360px;height:202.5px;}
    .image-container{max-width:360px;}
}
@media (min-width:1601px){
    .post-header{font-size:1.25rem;}
    .content-section{font-size:1.25rem;line-height:1.7;}
    .content-section img,.post-image{max-width:400px;height:225px;}
    .image-container{max-width:400px;}
}
`).css;

const LCPContent = ({ lcpContent, fullContent }) => {
  const startTime = performance.now();
  const lcpImage = lcpContent.match(/src=["']([^"']+)["']/i)?.[1];
  const lcpElement = lcpContent.startsWith('<p') ? (
    <p dangerouslySetInnerHTML={{ __html: lcpContent }} />
  ) : lcpContent.startsWith('<img') ? (
    <img
      src={lcpImage}
      width={lcpContent.match(/width=["'](\d+)["']/i)?.[1] || 240}
      height={lcpContent.match(/height=["'](\d+\.?\d*)["']/i)?.[1] || 135}
      alt="LCP image"
      loading="eager"
      fetchpriority="high"
      decoding="sync"
      style={{ objectFit: 'cover', maxWidth: '100%', height: 'auto' }}
      onError={(e) => console.error('LCP image failed:', e.target.src)}
    />
  ) : null;

  console.log('LCP render time:', performance.now() - startTime);

  return (
    <>
      {lcpImage && <link rel="preload" href={`${lcpImage}?w=240&format=avif&q=10`} as="image" fetchpriority="high" />}
      {lcpElement}
      {fullContent && (
        <div
          style={{
            width: '100%',
            willChange: 'contents',
            fetchPriority: 'low'
          }}
          dangerouslySetInnerHTML={{ __html: fullContent }}
        />
      )}
    </>
  );
};

const areEqual = (prev, next) => {
  return prev.post?.titleInitial === next.post?.titleInitial &&
         prev.post?.title === next.post?.title &&
         prev.post?.titleImageInitial === next.post?.titleImageInitial &&
         prev.post?.titleImage === next.post?.titleImage &&
         prev.post?.lcpContent === next.post?.lcpContent &&
         prev.post?.preRenderedContent === next.post?.preRenderedContent &&
         prev.post?.contentHeight === next.post?.contentHeight &&
         prev.readTime === next.readTime;
};

const PriorityContent = memo(({ post: rawPost, readTime }) => {
  const post = rawPost || {
    preRenderedContent: '',
    lcpContent: '',
    contentHeight: 100,
    titleInitial: 'Loading...',
    title: 'Loading...',
    titleImageInitial: null,
    titleImage: null
  };
  const [fullContent, setFullContent] = useState('');
  const deferredContent = useDeferredValue(fullContent);

  useEffect(() => {
    setFullContent(post.preRenderedContent);
  }, [post.preRenderedContent]);

  const isLoading = !post || (post.titleInitial === 'Loading...' && post.title === 'Loading...');
  const viewport = post.contentStyles?.viewport || 'mobile';
  const style = post.contentStyles?.[viewport] || {
    image: { width: 240, height: 135 },
    margin: 8,
    padding: 4
  };
  const headerHeight = viewport === 'small' ? ((post.titleImageInitial || post.titleImage) ? 185 : 50) :
                      viewport === 'mobile' ? ((post.titleImageInitial || post.titleImage) ? 195 : 60) :
                      viewport === 'tablet' ? ((post.titleImageInitial || post.titleImage) ? 229.5 : 72) :
                      viewport === 'desktop' ? ((post.titleImageInitial || post.titleImage) ? 248 : 80) :
                      ((post.titleImageInitial || post.titleImage) ? 272.5 : 88);
  const contentHeight = isLoading ? 100 : post.contentHeight || 100;

  return (
    <article
      style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        contain: 'layout',
        fetchPriority: 'high'
      }}
      aria-live="polite"
    >
      {(post.titleImageInitial || post.titleImage) && !isLoading && (
        <link
          rel="preload"
          href={`${post.titleImageInitial || post.titleImage}?w=${style.image.width}&format=avif&q=10`}
          as="image"
          fetchpriority="high"
        />
      )}
      {post.preRenderedContent && !isLoading && (
        [...(post.preRenderedContent.matchAll(/<img[^>]+src=["']([^"']+)["']/gi) || [])]
          .slice(0, 3)
          .map((match, i) => (
            <link
              key={i}
              rel="preload"
              href={`${match[1]}?w=${style.image.width}&format=avif&q=10`}
              as="image"
              fetchpriority="high"
            />
          ))
      )}
      {isLoading ? (
        <div
          className="skeleton"
          style={{
            width: '100%',
            height: `${contentHeight + headerHeight}px`,
            containIntrinsicSize: `auto ${contentHeight + headerHeight}px`,
            fetchPriority: 'high'
          }}
          aria-hidden="true"
        />
      ) : (
        <>
          <header style={{ width: '100%', contain: 'layout' }}>
            {(post.titleImageInitial || post.titleImage) && (
              <div
                className="image-container"
                style={{ containIntrinsicSize: `auto ${style.image.height}px` }}
              >
                <img
                  src={(post.titleImageInitial || post.titleImage) ? `${post.titleImageInitial || post.titleImage}?w=${style.image.width}&format=avif&q=10` : 'https://via.placeholder.com/240x135?text=Image+Not+Found'}
                  srcSet={(post.titleImageInitial || post.titleImage) ? `
                    ${post.titleImageInitial || post.titleImage}?w=220&format=avif&q=10 220w,
                    ${post.titleImageInitial || post.titleImage}?w=240&format=avif&q=10 240w,
                    ${post.titleImageInitial || post.titleImage}?w=280&format=avif&q=10 280w,
                    ${post.titleImageInitial || post.titleImage}?w=320&format=avif&q=10 320w,
                    ${post.titleImageInitial || post.titleImage}?w=360&format=avif&q=10 360w
                  ` : ''}
                  sizes="(max-width: 360px) 220px, (max-width: 480px) 240px, (max-width: 768px) 280px, (max-width: 1200px) 320px, 360px"
                  alt={post.titleInitial || post.title || 'Post image'}
                  className="post-image"
                  width={style.image.width}
                  height={style.image.height}
                  decoding="sync"
                  loading="eager"
                  fetchpriority="high"
                  style={{ containIntrinsicSize: `${style.image.width}px ${style.image.height}px`, objectFit: 'cover', maxWidth: '100%', height: 'auto' }}
                  onError={(e) => console.error('Title image failed:', e.target.src)}
                />
              </div>
            )}
            <h1
              className="post-header"
              style={{ willChange: 'contents', fetchPriority: 'high' }}
            >
              {post.titleInitial || post.title || 'Untitled'}
            </h1>
            <div className="meta-info">
              <span>By {post.author || 'Unknown'}</span>
              <span>
                {' | '}
                {post.date && !isNaN(new Date(post.date).getTime())
                  ? new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown Date'}
              </span>
              <span>
                {' | Read time: '}
                <span id="read-time">{readTime || '0'}</span> min
              </span>
            </div>
          </header>
          <section
            className="content-section"
            role="region"
            aria-label="Post content"
            style={{
              width: '100%',
              maxWidth: '800px',
              height: `${contentHeight}px`,
              contain: 'strict',
              containIntrinsicSize: `auto ${contentHeight}px`,
              fetchPriority: 'high',
              willChange: 'contents'
            }}
          >
            {!post.preRenderedContent ? (
              <p className="error-message">Content failed to render. Please try refreshing.</p>
            ) : (
              <LCPContent lcpContent={post.lcpContent} fullContent={deferredContent} />
            )}
          </section>
        </>
      )}
      <style>{criticalCss}</style>
    </article>
  );
}, areEqual);

export default PriorityContent;
