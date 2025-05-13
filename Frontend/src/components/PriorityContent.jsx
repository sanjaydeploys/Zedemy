import { memo, useMemo, useState } from 'react';

const criticalCss = `
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Open Sans','Helvetica Neue',sans-serif;font-display:swap;}
.post-header{font-size:0.85rem;color:#011020;font-weight:700;line-height:1.2;}
.content-section{font-size:0.85rem;line-height:1.5;width:100%;padding:0.25rem;}
.content-section :where(p,div,ul,ol,pre,h1,h2,h3,h4,h5,h6,.subtitle,.super-title){margin-bottom:0.5rem;}
.content-section ul,.content-section ol{padding-left:1rem;}
.content-section pre,.content-section code{font-size:0.7rem;}
.content-section :where(h1,h2,h3,h4,h5,h6,.subtitle,.super-title){font-size:0.85rem;}
.content-section a{color:#0066cc;text-decoration:underline;}
.content-section img,.post-image{width:100%;max-width:180px;height:101px;aspect-ratio:16/9;object-fit:contain;}
.image-container{max-width:180px;margin:0.25rem 0;aspect-ratio:16/9;}
.meta-info{color:#666;font-size:0.7rem;padding:0.25rem;display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:0.25rem;}
.skeleton{background:#e0e0e0;animation:fade 1s infinite;}
.error-message{color:#d32f2f;font-size:0.7rem;padding:0.25rem;}
@keyframes fade{0%{opacity:0.8;}50%{opacity:1;}100%{opacity:0.8;}}
@media (min-width:376px){
  .post-header,.content-section,.content-section :where(h1,h2,h3,h4,h5,h6,.subtitle,.super-title){font-size:0.875rem;}
  .content-section img,.post-image{max-width:200px;height:112px;}
  .image-container{max-width:200px;}
}
@media (min-width:412px){
  .post-header,.content-section,.content-section :where(h1,h2,h3,h4,h5,h6,.subtitle,.super-title){font-size:0.9rem;}
  .content-section img,.post-image{max-width:220px;height:124px;}
  .image-container{max-width:220px;}
}
@media (min-width:481px){
  .post-header,.content-section,.content-section :where(h1,h2,h3,h4,h5,h6,.subtitle,.super-title){font-size:0.9375rem;}
  .content-section{line-height:1.55;}
  .content-section img,.post-image{max-width:280px;height:157px;}
  .image-container{max-width:280px;}
}
@media (min-width:769px){
  .post-header,.content-section,.content-section :where(h1,h2,h3,h4,h5,h6,.subtitle,.super-title){font-size:1rem;}
  .content-section{line-height:1.6;}
  .content-section img,.post-image{max-width:320px;height:180px;}
  .image-container{max-width:320px;}
}`;

const VirtualizedContent = memo(({ html }) => {
  const [nodes, setNodes] = useState([]);
  useMemo(() => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html || '<p>Loading content...</p>', 'text/html');
    const elements = Array.from(doc.body.childNodes);
    const chunkSize = 200;
    const chunks = [];
    let currentSize = 0;
    let currentChunk = [];

    elements.forEach(node => {
      const outerHTML = node.outerHTML || node.textContent || '';
      const size = outerHTML.length;
      if (currentSize + size > chunkSize && currentChunk.length) {
        chunks.push(currentChunk);
        currentChunk = [];
        currentSize = 0;
      }
      currentChunk.push(outerHTML);
      currentSize += size;
    });
    if (currentChunk.length) chunks.push(currentChunk);

    setNodes(chunks[0] || ['<p>Loading content...</p>']);
    let index = 1;
    const appendNext = () => {
      if (index >= chunks.length) return;
      setNodes(prev => [...prev, ...chunks[index]]);
      index++;
      requestAnimationFrame(appendNext);
    };
    if (chunks.length > 1) requestAnimationFrame(appendNext);
  }, [html]);

  return (
    <div style={{ width: '100%', fetchPriority: 'high' }}>
      {nodes.map((html, i) => (
        <div key={i} dangerouslySetInnerHTML={{ __html: html }} />
      ))}
    </div>
  );
});

const PriorityContent = memo(({ post: rawPost, readTime }) => {
  const post = rawPost || {
    preRenderedContent: '',
    contentHeight: { mobileSmall: 100, mobile: 100, tablet: 100, desktop: 100 },
    title: 'Loading...',
  };
  const isLoading = !post || post.title === 'Loading...';

  const viewport = useMemo(() => {
    if (typeof window === 'undefined') return 'mobile';
    const media = window.matchMedia;
    if (media('(max-width: 375px)').matches) return 'mobileSmall';
    if (media('(min-width: 376px) and (max-width: 768px)').matches) return 'mobile';
    if (media('(min-width: 769px) and (max-width: 1024px)').matches) return 'tablet';
    return 'desktop';
  }, []);

  const contentHeight = post.contentHeight?.[viewport] || 100;
  const firstImageMatch = post.preRenderedContent?.match(/<img[^>]+src=["']([^"']+)["']/i);
  const imageWidth = viewport === 'mobileSmall' ? 180 : viewport === 'mobile' ? 200 : viewport === 'tablet' ? 280 : 320;
  const imageHeight = imageWidth / (16 / 9);

  return (
    <article
      style={{
        width: '100%',
        maxWidth: '800px',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        margin: 0,
        fetchPriority: 'high',
      }}
      aria-live="polite"
    >
      {firstImageMatch && !isLoading && (
        <link
          rel="preload"
          href={`${firstImageMatch[1]}?w=${imageWidth}&format=avif&q=10`}
          as="image"
          fetchpriority="high"
        />
      )}
      {isLoading ? (
        <header style={{ width: '100%', margin: 0 }}>
          <div
            className="skeleton"
            style={{
              width: '100%',
              maxWidth: imageWidth,
              height: imageHeight,
              aspectRatio: '16/9',
            }}
          />
          <div className="skeleton" style={{ width: '80%', height: '1rem', margin: '0.25rem 0' }} />
          <div className="skeleton" style={{ width: '100%', height: '2rem' }} />
        </header>
      ) : (
        <header style={{ width: '100%', margin: 0 }}>
          {post.titleImage && (
            <div className="image-container">
              <img
                src={`${post.titleImage}?w=${imageWidth}&format=avif&q=10`}
                srcSet={`
                  ${post.titleImage}?w=180&format=avif&q=10 180w,
                  ${post.titleImage}?w=200&format=avif&q=10 200w,
                  ${post.titleImage}?w=280&format=avif&q=10 280w,
                  ${post.titleImage}?w=320&format=avif&q=10 320w
                `}
                sizes="(max-width: 375px) 180px, (max-width: 768px) 200px, (max-width: 1024px) 280px, 320px"
                alt={post.title || 'Post image'}
                className="post-image"
                width={imageWidth}
                height={imageHeight}
                decoding="sync"
                loading="eager"
                fetchpriority="high"
                onError={(e) => {
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
            <span>{' | Read time: '}{readTime || '0'} min</span>
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
          fetchPriority: 'high',
          margin: 0,
        }}
      >
        {isLoading ? (
          <div className="skeleton" style={{ width: '100%', minHeight: '300px' }} />
        ) : (
          <VirtualizedContent html={post.preRenderedContent} />
        )}
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
