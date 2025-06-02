import React, { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { fetchPostSSR } from '../actions/postActions';
import { RingLoader } from 'react-spinners';

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const PostContent = styled.div`
  flex: 1;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f9fafb;
  animation: fadeIn 0.5s ease-in;

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: clamp(0.875rem, 2vw, 1rem);
  color: #1f2937;
  font-weight: 500;
  animation: pulse 1.5s ease-in-out infinite;

  @keyframes pulse {
    0%, 100% {
      opacity: 0.7;
    }
    50% {
      opacity: 1;
    }
  }
`;

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const [loading, setLoading] = useState(!window.__POST_DATA__);

  useEffect(() => {
    const scripts = [
      {
        src: 'https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js',
        check: () => typeof window.React === 'undefined',
        name: 'React',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
        check: () => typeof window.ReactDOM === 'undefined',
        name: 'ReactDOM',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/react-syntax-highlighter@15.5.0/dist/cjs/prism.min.js',
        check: () => typeof window.ReactSyntaxHighlighter === 'undefined',
        name: 'ReactSyntaxHighlighter',
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/react-copy-to-clipboard@5.1.0/build/react-copy-to-clipboard.min.js',
        check: () => typeof window.CopyToClipboard === 'undefined',
        name: 'CopyToClipboard',
      },
      {
        src: '/scripts/sidebar.js',
        check: () => typeof window.toggleSidebar !== 'function' || typeof window.scrollToSection !== 'function',
        name: 'sidebar.js',
      },
      {
        src: '/scripts/scrollToTop.js',
        check: () => !document.getElementById('scroll-to-top'),
        name: 'scrollToTop.js',
      },
      {
        src: '/scripts/copyCode.js',
        check: () => !document.querySelector('.copy-button'),
        name: 'copyCode.js',
      },
      {
        src: '/scripts/codeHighlighter.js',
        check: () => !document.querySelector('.code-snippet-wrapper'),
        name: 'codeHighlighter.js',
      },
    ];

    const loadScript = (script) => {
      if (script.check()) {
        console.log(`[PostPage.jsx] Loading ${script.name}`);
        const scriptElement = document.createElement('script');
        scriptElement.src = script.src;
        scriptElement.async = false; // Ensure synchronous loading for dependencies
        scriptElement.defer = true;
        scriptElement.onload = () => console.log(`[PostPage.jsx] ${script.name} loaded`);
        scriptElement.onerror = () => console.error(`[PostPage.jsx] Error loading ${script.name}`);
        document.head.appendChild(scriptElement);
        return scriptElement;
      } else {
        console.log(`[PostPage.jsx] ${script.name} already loaded or not needed`);
        return null;
      }
    };

    const loadedScripts = scripts.map(script => loadScript(script)).filter(Boolean);

    // Trigger script initialization after SSR HTML is set
    const initializeScripts = () => {
      // Manually trigger DOMContentLoaded for copyCode.js and scrollToTop.js
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);

      // Re-run codeHighlighter.js initialization
      if (window.React && window.ReactDOM && window.ReactSyntaxHighlighter) {
        const wrappers = document.querySelectorAll('.code-snippet-wrapper');
        wrappers.forEach(wrapper => {
          const snippetId = wrapper.id;
          const language = wrapper.getAttribute('data-language') || 'javascript';
          const snippet = wrapper.getAttribute('data-snippet') || '';
          if (snippet) {
            const root = window.ReactDOM.createRoot(wrapper);
            root.render(
              window.React.createElement(
                window.React.lazy(() => Promise.resolve({ default: window.ReactSyntaxHighlighter.Prism })),
                {
                  language,
                  style: window.ReactSyntaxHighlighterStyles?.vs || {},
                  customStyle: { margin: 0, padding: '1rem', background: '#1f2937', fontSize: 'clamp(0.875rem, 1.8vw, 0.9375rem)' },
                  wrapLines: true,
                  wrapLongLines: true,
                  children: snippet,
                }
              )
            );
          }
        });
      }
    };

    if (ssrHtml) {
      initializeScripts();
    }

    return () => {
      loadedScripts.forEach(scriptElement => {
        if (scriptElement && document.head.contains(scriptElement)) {
          document.head.removeChild(scriptElement);
        }
      });
    };
  }, [ssrHtml]);

  useEffect(() => {
    if (window.__POST_DATA__) {
      setSsrHtml(document.documentElement.outerHTML);
      setLoading(false);
      dispatch({ type: 'FETCH_POST_SUCCESS', payload: window.__POST_DATA__ });
    } else {
      dispatch(fetchPostSSR(slug))
        .then(({ html }) => {
          setSsrHtml(html);
          setLoading(false);
        })
        .catch((err) => {
          console.error('[PostPage.jsx] Error fetching SSR HTML:', err.message);
          setSsrHtml('');
          setLoading(false);
        });
    }
  }, [slug, dispatch]);

  if (loading) {
    return (
      <LoadingContainer>
        <RingLoader
          color="#22c55e"
          size={80}
          speedMultiplier={1.2}
          cssOverride={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            borderWidth: '4px',
          }}
        />
        <LoadingText>Loading your post...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <Layout>
      <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
    </Layout>
  );
});

export default PostPage;
