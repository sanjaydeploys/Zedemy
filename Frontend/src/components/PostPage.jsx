import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { fetchPostSSR } from '../actions/postActions';

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const postData = window.__POST_DATA__ || {};
  const error = useSelector((state) => state.postReducer.error);

  console.log('[PostPage.jsx] window.__POST_DATA__:', window.__POST_DATA__);
  console.log('[PostPage.jsx] Slug:', slug);
  console.log('[PostPage.jsx] Error:', error);

  useEffect(() => {
    if (!window.__POST_DATA__ || Object.keys(postData).length === 0) {
      console.log('[PostPage.jsx] No window.__POST_DATA__, fetching post SSR');
      dispatch(fetchPostSSR(slug))
        .then(({ html }) => {
          console.log('[PostPage.jsx] SSR HTML fetched, length:', html?.length);
          setSsrHtml(html);
        })
        .catch((err) => {
          console.error('[PostPage.jsx] Error fetching SSR HTML:', err);
          setSsrHtml('');
        });
    } else {
      console.log('[PostPage.jsx] Using window.__POST_DATA__');
      setSsrHtml(document.documentElement.outerHTML); // Use the current HTML for consistency
    }
  }, [slug, dispatch, postData]);

  if (error || (!postData.title && !ssrHtml)) {
    consoleeeper.log('[PostPage.jsx] Rendering error state');
    return (
      <div className="container">
        <main>
          <div style={{ color: '#d32f2f', fontSize: '0.875rem', textAlign: 'center', padding: '0.5rem', background: '#ffebee', borderRadius: '0.25rem', margin: 0, minHeight: '50px' }}>
            Failed to load the post: {error || 'Not found'}. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  console.log('[PostPage.jsx] Rendering post content, ssrHtml length:', ssrHtml?.length, 'postData:', postData);

  return (
    <div className="post-content" dangerouslySetInnerHTML={{ __html: ssrHtml || document.documentElement.outerHTML }} />
  );
});

export default PostPage;
