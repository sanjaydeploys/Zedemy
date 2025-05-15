import React, { memo, useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchPostSSR } from '../actions/postActions';
import { parseLinks } from './utils';

const PriorityContent = memo(({ readTime, slug }) => {
  const [post, setPost] = useState(null);
  const [error, setError] = useState(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const loadSSRData = async () => {
      console.log('[PriorityContent] Accessing window.__POST_DATA__ for slug:', slug);
      try {
        let postData = window.__POST_DATA__ && window.__POST_DATA__.slug === slug ? window.__POST_DATA__ : null;
        console.log('[PriorityContent] window.__POST_DATA__:', JSON.stringify(postData, null, 2));

        if (!postData || !postData.title || !postData.preRenderedContent || !postData.category || !postData.slug) {
          console.warn('[PriorityContent] window.__POST_DATA__ invalid or missing, fetching SSR HTML');
          postData = await dispatch(fetchPostSSR(slug));
          console.log('[PriorityContent] Fetched SSR postData:', JSON.stringify(postData, null, 2));
        }

        if (!postData || !postData.title || !postData.preRenderedContent || !postData.category || !postData.slug) {
          console.error('[PriorityContent] Invalid SSR data:', {
            hasTitle: !!postData?.title,
            hasPreRenderedContent: !!postData?.preRenderedContent,
            hasCategory: !!postData?.category,
            hasSlug: !!postData?.slug,
            slugMatch: postData?.slug === slug
          });
          setError('Missing critical SSR data');
          return;
        }

        setPost({
          title: postData.title,
          preRenderedContent: postData.preRenderedContent,
          titleImage: postData.titleImage || '',
          author: postData.author || 'Zedemy Team',
          date: postData.date || new Date().toISOString(),
          category: postData.category || 'General',
          slug: postData.slug,
          titleImageAspectRatio: postData.titleImageAspectRatio || '16:9'
        });
      } catch (err) {
        console.error('[PriorityContent] Error loading SSR data:', err.message);
        setError('Failed to load SSR data');
      }
    };

    loadSSRData();
  }, [slug, dispatch]);

  console.log('[PriorityContent] Post state:', JSON.stringify(post, null, 2));

  if (error) {
    console.warn('[PriorityContent] Rendering error state:', error);
    return (
      <div id="priority-content-ssr" data-hydration="ssr" style={{ minHeight: '600px', color: '#d32f2f', textAlign: 'center' }}>
        Error: {error}
      </div>
    );
  }

  if (!post) {
    console.warn('[PriorityContent] Rendering skeleton: waiting for SSR data');
    return (
      <div id="priority-content-ssr" data-hydration="ssr" className="skeleton-section skeleton" style={{ minHeight: '600px' }} />
    );
  }

  const {
    title,
    author,
    date,
    titleImage,
    preRenderedContent,
    category,
    titleImageAspectRatio
  } = post;

  const formattedDate = new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const [aspectWidth, aspectHeight] = (titleImageAspectRatio || '16:9').split(':').map(Number);
  const imageHeight = Math.round((240 / aspectWidth) * aspectHeight);

  console.log('[PriorityContent] Rendering with:', {
    title,
    author,
    formattedDate,
    readTime,
    titleImage,
    slug,
    category
  });

  return (
    <article id="priority-content" data-hydration="ssr" style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', margin: '0 auto', padding: 0 }}>
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
              height={imageHeight}
              decoding="sync"
              fetchPriority="high"
              style={{ width: '100%', height: 'auto', objectFit: 'contain', aspectRatio: `${aspectWidth}/${aspectHeight}` }}
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
