import React from 'react';

const PriorityContent = ({ post, readTime }) => {
  // Get the viewport and styles from post.contentStyles
  const viewport = post.contentStyles?.viewport || 'mobile';
  const imageStyles = post.contentStyles?.[viewport]?.image || { width: 240, height: 135 }; // Fallback to mobile defaults

  // Get the aspect ratio from the post, default to '16:9'
  const aspectRatio = post.titleImageAspectRatio || '16:9';
  const [aspectWidth, aspectHeight] = aspectRatio.split(':').map(Number);

  // Use backend-provided width and calculate height based on aspect ratio
  const imageWidth = imageStyles.width; // e.g., 240 for mobile, 320 for desktop
  const imageHeight = Math.round((imageStyles.width / aspectWidth) * aspectHeight);

  // Format the date if available
  const formattedDate = post.date && !isNaN(new Date(post.date).getTime())
    ? new Date(post.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Unknown Date';

  // Critical CSS with dynamic aspect ratio and backend-provided dimensions
  const criticalCss = `
    .priority-container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 1rem;
    }
    .lcp-image-wrapper {
      width: 100%;
      max-width: ${imageWidth}px; /* Use backend-provided width */
      margin: 0 auto; /* Center the image */
      aspect-ratio: ${aspectWidth} / ${aspectHeight};
      contain-intrinsic-size: ${imageWidth}px ${imageHeight}px;
      background-color: #e0e0e0;
    }
    .lcp-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .lcp-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin: 0.5rem 0;
      min-height: 32px;
      contain-intrinsic-size: 100% 32px;
    }
    .meta-info {
      font-size: 0.875rem;
      color: #666;
      margin: 0.25rem 0;
      min-height: 20px;
      contain-intrinsic-size: 100% 20px;
    }
    .meta-info span {
      margin-right: 0.5rem;
    }
    .lcp-content {
      font-size: 1rem;
      line-height: 1.5;
      min-height: 48px;
      contain-intrinsic-size: 100% 48px;
    }
    .read-time {
      font-size: 0.875rem;
      color: #666;
      margin: 0.5rem 0;
      min-height: 20px;
      contain-intrinsic-size: 100% 20px;
    }
    @media (min-width: 768px) {
      .lcp-title {
        font-size: 2rem;
        min-height: 40px;
        contain-intrinsic-size: 100% 40px;
      }
      .lcp-content {
        font-size: 1.125rem;
        min-height: 54px;
        contain-intrinsic-size: 100% 54px;
      }
    }
  `;

  return (
    <div className="priority-container">
      <style>{criticalCss}</style>
      <div className="lcp-image-wrapper">
        <img
          src={post.titleImage || 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='}
          alt={post.title || 'Loading...'}
          className="lcp-image"
          fetchPriority="high"
          loading="eager"
          width={imageWidth}
          height={imageHeight}
        />
      </div>
      <h1 className="lcp-title">{post.title || 'Loading...'}</h1>
      <div className="meta-info">
        <span>By {post.author || 'Unknown'}</span>
        <span>| {formattedDate}</span>
        {readTime > 0 && <span>| Read time: {readTime} min</span>}
      </div>
      <div
        className="lcp-content"
        dangerouslySetInnerHTML={{ __html: post.lcpContent || '<p>Loading content...</p>' }}
      />
    </div>
  );
};

export default PriorityContent;
