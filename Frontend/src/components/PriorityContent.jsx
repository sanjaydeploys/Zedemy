import React, { memo, useMemo, useRef, useEffect } from 'react';
import DOMPurify from 'dompurify';

const criticalCss = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

.post-header{font-size:clamp(1.5rem,3vw,2rem);color:#011020;font-weight:700;line-height:1.2;min-height:48px;contain-intrinsic-size:100% 48px;}
.content-section{font-size:1.25rem;line-height:1.8;width:100%;margin-bottom:1rem;padding:1rem;transition:none;}
.content-section p,.content-section ul,.content-section li,.content-section div{margin-bottom:0.5rem;min-height:28px;contain-intrinsic-size:100% 28px;}
.content-section a{color:#0066cc;text-decoration:underline;}
.content-section img{width:100%;max-width:100%;height:auto;contain-intrinsic-size:100% 150px;}
.image-container{width:100%;max-width:280px;margin:1rem 0;aspect-ratio:16/9;min-height:157.5px;contain-intrinsic-size:280px 157.5px;}
.post-image{width:100%;max-width:280px;height:auto;aspect-ratio:16/9;object-fit:contain;}
.meta-info{color:#666;font-size:.875rem;margin:1rem 0;padding:1rem;display:grid;grid-template-columns:1fr;gap:1rem;min-height:84px;contain-intrinsic-size:100% 84px;}
.meta-info span{min-height:24px;contain-intrinsic-size:100% 24px;}
.skeleton{background:#e0e0e0;}
.error-message{color:#d32f2f;font-size:1rem;padding:1rem;}
@media (min-width:769px){
.content-section{font-size:1.375rem;padding:1rem;margin-bottom:1rem;}
.meta-info{grid-template-columns:repeat(3,auto);gap:1rem;min-height:32px;contain-intrinsic-size:100% 32px;}
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

const PriorityContent = memo(({ post: rawPost, readTime }) => {
  const post = rawPost || { preRenderedContent: '' };

  useEffect(() => {
    console.log('[PriorityContent] Post state:', { post, hasPreRenderedContent: !!post?.preRenderedContent });
    if (!post?.preRenderedContent) {
      console.warn('[PriorityContent] preRenderedContent is undefined or empty:', { post });
    }
  }, [post]);

  const isLoading = !post || post.title === 'Loading...';

  const contentHeight = useMemo(() => {
    if (!post?.preRenderedContent || isLoading) return 300;
    const charCount = post.preRenderedContent.length;
    const fontSize = window.innerWidth <= 768 ? 1.25 : 1.375; // rem
    const lineHeight = 1.8;
    const lineHeightPx = fontSize * 16 * lineHeight; // px
    const viewportWidth = Math.min(window.innerWidth, 800); // px
    const charsPerLine = Math.floor(viewportWidth / (fontSize * 10)); // Approx 80 chars at 800px
    const textLines = Math.ceil(charCount / charsPerLine);
    const textHeight = textLines * lineHeightPx;

    return Math.max(
      300,
      textHeight +
        (post.preRenderedContent.match(/<(img|ul|ol|p|div|h1|h2|h3|h4|h5|h6)/g)?.length || 0) * 40 +
        (post.preRenderedContent.match(/<img/g)?.length || 0) * 150 +
        (post.preRenderedContent.match(/<ul|<ol/g)?.length || 0) * 30 +
        (post.preRenderedContent.match(/<li/g)?.length || 0) * 20 +
        (post.preRenderedContent.match(/<h[1-6]/g)?.length || 0) * 40
    );
  }, [post?.preRenderedContent, isLoading]);

  const criticalContent = useMemo(() => {
    if (!post?.preRenderedContent || isLoading) return '';
    const criticalHtml = post.preRenderedContent.slice(0, 1000);
    const sanitized = DOMPurify.sanitize(criticalHtml, {
      FORBID_TAGS: ['script'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
    });
    console.log('[PriorityContent] Critical content sanitized:', { inputLength: criticalHtml.length, outputLength: sanitized.length });
    return sanitized;
  }, [post?.preRenderedContent, isLoading]);

  const nonCriticalRef = useRef(null);
  const [nonCriticalContent, setNonCriticalContent] = React.useState('');

  useEffect(() => {
    if (!post?.preRenderedContent || isLoading) {
      setNonCriticalContent('');
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const nonCriticalHtml = post.preRenderedContent.slice(1000);
          const sanitized = DOMPurify.sanitize(nonCriticalHtml, {
            FORBID_TAGS: ['script'],
            FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onmouseout'],
          });
          setNonCriticalContent(sanitized);
          console.log('[PriorityContent] Non-critical content sanitized:', { inputLength: nonCriticalHtml.length, outputLength: sanitized.length });
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );
    if (nonCriticalRef.current) observer.observe(nonCriticalRef.current);
    return () => observer.disconnect();
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
          href={`${post.titleImage}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=5`}
          as="image"
          fetchpriority="high"
        />
      )}
      {firstImageMatch && !isLoading && (
        <link
          rel="preload"
          href={`${firstImageMatch[1]}?w=${window.innerWidth <= 768 ? 400 : 480}&format=avif&q=5`}
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
          ) : !criticalContent && post?.preRenderedContent !== undefined ? (
            <p className="error-message">Content failed to render. Please try refreshing the page.</p>
          ) : (
            <>
              <div
                style={{
                  width: '100%',
                  minHeight: '150px',
                  containIntrinsicSize: '100% 150px',
                  fetchPriority: 'high',
                  contain: 'layout',
                }}
                dangerouslySetInnerHTML={{ __html: criticalContent }}
              />
              {post?.preRenderedContent?.length > 1000 && (
                <div
                  ref={nonCriticalRef}
                  style={{
                    width: '100%',
                    minHeight: `${contentHeight - 150}px`,
                    containIntrinsicSize: `100% ${contentHeight - 150}px`,
                    fetchPriority: 'low',
                    contain: 'layout',
                  }}
                  dangerouslySetInnerHTML={{ __html: nonCriticalContent }}
                />
              )}
            </>
          )}
        </section>
        <style>{criticalCss}</style>
      </article>
    </>
  );
});

export default PriorityContent;
