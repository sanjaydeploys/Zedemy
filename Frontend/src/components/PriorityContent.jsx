import React, { memo, useState } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { parseLinks, truncateText } from './utils';

const css = `
  .post-header { 
    font-size: clamp(1.5rem, 3vw, 2rem); 
    color: #011020; 
    margin: 0.75rem 0; 
    width: 100%; 
    max-width: 100%; 
  }
  .content-section { 
    font-size: 0.875rem; 
    line-height: 1.7; 
    width: 100%; 
    max-width: 100%; 
    min-height: 200px; 
  }
  .content-section p { 
    margin: 0.5rem 0; 
  }
  .image-container { 
    width: 100%; 
    max-width: 280px; 
    margin: 1rem 0; 
    position: relative; 
    aspect-ratio: 16 / 9; 
    height: 157.5px; 
    background: #e0e0e0; 
  }
  .image-loaded { 
    background: transparent; 
  }
  .post-image { 
    width: 100%; 
    max-width: 280px; 
    height: 157.5px; 
    object-fit: contain; 
    border-radius: 0.375rem; 
    position: relative; 
    z-index: 2; 
  }
  .meta-info { 
    color: #666; 
    font-size: 0.75rem; 
    margin-bottom: 0.75rem; 
  }
  @media (min-width: 769px) {
    .image-container { 
      max-width: 480px; 
      height: 270px; 
    }
    .post-image { 
      max-width: 480px; 
      height: 270px; 
    }
  }
  @media (max-width: 480px) {
    .image-container { 
      max-width: 240px; 
      height: 135px; 
    }
    .post-image { 
      max-width: 240px; 
      height: 135px; 
    }
    .content-section { 
      min-height: 150px; 
    }
  }
  @media (max-width: 320px) {
    .image-container { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .post-image { 
      max-width: 200px; 
      height: 112.5px; 
    }
    .content-section { 
      min-height: 120px; 
    }
  }
`;

const PriorityContent = memo(({ post, slug, readTime, structuredData }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  const formattedDate = post?.date && !isNaN(new Date(post.date).getTime())
    ? new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown Date';

  const parsedContent = post?.content ? parseLinks(post.content) : 'Loading content...';

  return (
    <HelmetProvider>
      <Helmet>
        <html lang="en" />
        <title>{`${post?.title || 'Loading...'} | Zedemy`}</title>
        <meta name="description" content={truncateText(post?.summary || post?.content, 160) || 'Loading...'} />
        <meta
          name="keywords"
          content={post?.keywords ? `${post.keywords}, Zedemy, ${post?.category || ''}` : `Zedemy, ${post?.category || ''}`}
        />
        <meta name="author" content={post?.author || 'Zedemy Team'} />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href={`https://zedemy.vercel.app/post/${slug}`} />
        <link rel="preconnect" href="https://zedemy-media-2025.s3.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://se3fw2nzc2.execute-api.ap-south-1.amazonaws.com" crossOrigin="anonymous" />
        {post?.titleImage && (
          <link
            rel="preload"
            href={`${post.titleImage}?w=100&format=avif&q=1`}
            as="image"
            fetchpriority="high"
            imagesrcset={`
              ${post.titleImage}?w=100&format=avif&q=1 100w,
              ${post.titleImage}?w=150&format=avif&q=1 150w,
              ${post.titleImage}?w=200&format=avif&q=1 200w,
              ${post.titleImage}?w=240&format=avif&q=1 240w,
              ${post.titleImage}?w=280&format=avif&q=1 280w,
              ${post.titleImage}?w=480&format=avif&q=1 480w
            `}
            imagesizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
          />
        )}
        <meta property="og:title" content={`${post?.title || 'Loading...'} | Zedemy`} />
        <meta property="og:description" content={truncateText(post?.summary || post?.content, 160) || 'Loading...'} />
        <meta
          property="og:image"
          content={post?.titleImage ? `${post.titleImage}?w=1200&format=avif&q=1` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <meta property="og:image:alt" content={`${post?.title || 'Post'} tutorial`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="675" />
        <meta property="og:url" content={`https://zedemy.vercel.app/post/${slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="Zedemy" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${post?.title || 'Loading...'} | Zedemy`} />
        <meta name="twitter:description" content={truncateText(post?.summary || post?.content, 160) || 'Loading...'} />
        <meta
          name="twitter:image"
          content={post?.titleImage ? `${post.titleImage}?w=1200&format=avif&q=1` : 'https://zedemy-media-2025.s3.ap-south-1.amazonaws.com/zedemy-logo.png'}
        />
        <style>{css}</style>
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>
      <article>
        <header>
          {post?.titleImage && (
            <div className={`image-container ${isImageLoaded ? 'image-loaded' : ''}`}>
              <img
                src={`${post.titleImage}?w=100&format=avif&q=1`}
                srcSet={`
                  ${post.titleImage}?w=100&format=avif&q=1 100w,
                  ${post.titleImage}?w=150&format=avif&q=1 150w,
                  ${post.titleImage}?w=200&format=avif&q=1 200w,
                  ${post.titleImage}?w=240&format=avif&q=1 240w,
                  ${post.titleImage}?w=280&format=avif&q=1 280w,
                  ${post.titleImage}?w=480&format=avif&q=1 480w
                `}
                sizes="(max-width: 320px) 200px, (max-width: 480px) 240px, (max-width: 768px) 280px, 480px"
                alt={post.title || 'Post image'}
                className="post-image"
                width="280"
                height="157.5"
                fetchpriority="high"
                decoding="sync"
                loading="eager"
                onLoad={() => setIsImageLoaded(true)}
                onError={() => {
                  console.error('Title Image Failed:', post.titleImage);
                  setIsImageLoaded(true);
                }}
              />
            </div>
          )}
          <h1 className="post-header">{post?.title || 'Loading...'}</h1>
          <div className="meta-info">
            <span>By {post?.author || 'Unknown'}</span>
            <span> | {formattedDate}</span>
            <span> | Read time: <span id="read-time">{readTime || 'Calculating...'}</span> min</span>
          </div>
        </header>
        <section className="content-section">
          <div dangerouslySetInnerHTML={{ __html: parsedContent }} />
        </section>
      </article>
    </HelmetProvider>
  );
});

export default PriorityContent;
