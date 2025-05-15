import React, { memo } from 'react';
import { parseLinks } from './utils';

const PriorityContent = memo(({ readTime, post }) => {
  if (!post || !post.title || !post.preRenderedContent) {
    return (
      <div id="priority-content-ssr" className="skeleton-section skeleton" style={{ minHeight: '600px' }} />
    );
  }

  const { title, author, date, titleImage, preRenderedContent, summary, category } = post;
  const description = summary || (preRenderedContent ? preRenderedContent.slice(0, 160) : 'Loading...');
  const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <article id="priority-content" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', margin: '0 auto', padding: 0 }}>
      <header style={{ width: '100%', margin: 0, padding: 0 }}>
        {titleImage && (
          <div>
            <img
              src={titleImage}
              srcSet={`
                ${titleImage.replace('w=240', 'w=220')} 220w,
                ${titleImage} 240w,
                ${titleImage.replace('w=240', 'w=280')} 280w
              `}
              sizes="(max-width: 360px) 220px, (max-width: 768px) 240px, 280px"
              alt={title}
              width="240"
              height={Math.round((240 / 16) * 9)}
              decoding="sync"
              fetchPriority="high"
              style={{ width: '100%', height: 'auto', objectFit: 'contain', aspectRatio: '16/9' }}
            />
          </div>
        )}
        <h1 style={{ willChange: 'contents', fetchPriority: 'high' }}>{title}</h1>
        <div>
          <span>By {author}</span>
          <span> | {formattedDate}</span>
          <span> | Read time: {readTime} min</span>
        </div>
      </header>
      <section
        id="non-critical-section"
        role="region"
        aria-label="Priority content"
        style={{ width: '100%', maxWidth: '800px', margin: '0 auto', padding: '0.25rem 0' }}
      >
        <div
          className="non-critical-container"
          style={{ fetchPriority: 'low' }}
          dangerouslySetInnerHTML={{ __html: parseLinks(preRenderedContent, category || '') }}
        />
      </section>
    </article>
  );
});

export default PriorityContent;
