import React, { memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { markPostAsCompleted } from '../actions/postActions';

const criticalCss = `
  .post-header {
    font-size: 1.25rem;
    color: #011020;
    margin: 0.5rem 0;
    width: 100%;
    font-weight: 700;
    line-height: 1.2;
  }
  .content-section {
    font-size: 0.875rem;
    line-height: 1.5;
    width: 100%;
    min-height: 200px;
    box-sizing: border-box;
  }
  .content-section div {
    margin: 0.5rem 0;
  }
  .image-container {
    width: 100%;
    max-width: 280px;
    margin: 0.5rem 0;
    aspect-ratio: 16 / 9;
    height: 157.5px;
    position: relative;
  }
  .post-image {
    width: 100%;
    height: 157.5px;
    object-fit: cover;
    border-radius: 0.25rem;
    position: absolute;
    top: 0;
    left: 0;
  }
  .meta-info {
    color: #666;
    font-size: 0.75rem;
    margin: 0.5rem 0;
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .skeleton-image {
    width: 100%;
    max-width: 280px;
    height: 157.5px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  .skeleton-header {
    width: 60%;
    height: 1.25rem;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  .skeleton-meta {
    width: 40%;
    height: 0.75rem;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  .skeleton-content {
    width: 100%;
    min-height: 200px;
    background: #e0e0e0;
    border-radius: 0.25rem;
    margin: 0.5rem 0;
  }
  .complete-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #fff;
    background: #2c3e50;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
    margin: 0.5rem 0;
  }
  .complete-button:hover {
    background: #34495e;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  .complete-button:active {
    transform: translateY(0);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .complete-button:disabled {
    background: #95a5a6;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  @media (min-width: 768px) {
    .post-header {
      font-size: 1.5rem;
    }
    .content-section {
      font-size: 0.9rem;
      min-height: 300px;
    }
    .image-container {
      max-width: 600px;
      height: 337.5px;
    }
    .post-image {
      max-width: 600px;
      height: 337.5px;
    }
    .skeleton-image {
      max-width: 600px;
      height: 337.5px;
    }
    .skeleton-header {
      height: 1.5rem;
    }
    .skeleton-content {
      min-height: 300px;
    }
    .complete-button {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border-radius: 0.5rem;
    }
  }
`;

const PriorityContent = memo(({ post, readTime }) => {
  console.log('[PriorityContent] Rendering with post:', post);
  const dispatch = useDispatch();
  const completedPosts = useSelector(state => state.postReducer.completedPosts || []);

  if (!post) {
    return (
      <article>
        <header>
          <div className="skeleton-image" />
          <div className="skeleton-header" />
          <div className="skeleton-meta" />
        </header>
        <section className="content-section">
          <div className="skeleton-content" />
        </section>
        <style>{criticalCss}</style>
      </article>
    );
  }

  const formattedDate =
    post?.date && !isNaN(new Date(post.date).getTime())
      ? new Date(post.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'Unknown Date';

  const isCompleted = completedPosts.some(cp => cp.postId === post.postId);

  const handleMarkAsCompleted = () => {
    if (!isCompleted) {
      dispatch(markPostAsCompleted(post.postId));
    }
  };

  return (
    <article>
      <header>
        {post.titleImage && (
          <div className="image-container">
            <img
              src={`${post.titleImage}?w=280&format=avif&q=50`}
              srcSet={`
                ${post.titleImage}?w=280&format=avif&q=50 280w,
                ${post.titleImage}?w=600&format=avif&q=50 600w
              `}
              sizes="(max-width: 767px) 280px, 600px"
              alt={post.title || 'Post image'}
              className="post-image"
              width="280"
              height="157.5"
              decoding="async"
              loading="eager"
              fetchpriority="high"
              onError={(e) => {
                console.error('Image Failed:', post.titleImage);
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}
        <h1 className="post-header">{post.title}</h1>
        <div className="meta-info">
          <span>By {post.author || 'Unknown'}</span>
          <span> | {formattedDate}</span>
          <span> | Read time: <span id="read-time">{readTime || '0'}</span> min</span>
        </div>
      </header>
      <section className="content-section">
        <div dangerouslySetInnerHTML={{ __html: post.preRenderedContent || post.content || '' }} />
        <button
          className="complete-button"
          onClick={handleMarkAsCompleted}
          disabled={isCompleted}
          aria-label={isCompleted ? 'Post already marked as completed' : 'Mark post as completed'}
        >
          {isCompleted ? 'Completed' : 'Mark as Completed'}
        </button>
      </section>
      <style>{criticalCss}</style>
    </article>
  );
});

export default PriorityContent;
