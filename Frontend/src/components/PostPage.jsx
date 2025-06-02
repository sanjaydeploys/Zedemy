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
        async: false,
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js',
        check: () => typeof window.ReactDOM === 'undefined',
        name: 'ReactDOM',
        async: false,
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/react-syntax-highlighter@15.5.0/dist/umd/react-syntax-highlighter.min.js',
        check: () => typeof window.ReactSyntaxHighlighter === 'undefined',
        name: 'ReactSyntaxHighlighter',
        async: false,
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/react-syntax-highlighter@15.5.0/dist/umd/styles/prism.min.js',
        check: () => typeof window.ReactSyntaxHighlighterStyles === 'undefined',
        name: 'SyntaxHighlighterStyles',
        async: false,
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/react-copy-to-clipboard@5.1.0/build/react-copy-to-clipboard.min.js',
        check: () => typeof window.CopyToClipboard === 'undefined',
        name: 'CopyToClipboard',
        async: false,
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/prettier@3.3.3/standalone.js',
        check: () => typeof window.prettier === 'undefined',
        name: 'Prettier',
        async: false,
      },
      {
        src: 'https://cdn.jsdelivr.net/npm/prettier@3.3.3/parser-babel.js',
        check: () => typeof window.prettierPlugins === 'undefined',
        name: 'PrettierParserBabel',
        async: false,
      },
      {
        src: '/scripts/sidebar.js',
        check: () => typeof window.toggleSidebar !== 'function' || typeof window.scrollToSection !== 'function',
        name: 'sidebar.js',
        defer: true,
      },
      {
        src: '/scripts/scrollToTop.js',
        check: () => !document.getElementById('scroll-to-top'),
        name: 'scrollToTop.js',
        defer: true,
      },
      {
        src: '/scripts/copyCode.js',
        check: () => !document.querySelector('.copy-button'),
        name: 'copyCode.js',
        defer: true,
      },
      {
        src: '/scripts/codeHighlighter.js',
        check: () => !document.querySelector('.code-snippet-wrapper'),
        name: 'codeHighlighter.js',
        defer: true,
      },
    ];

    const loadScript = (script) => {
      if (script.check()) {
        console.log(`[PostPage.jsx] Loading ${script.name}`);
        const scriptElement = document.createElement('script');
        scriptElement.src = script.src;
        scriptElement.async = script.async !== undefined ? script.async : false;
        if (script.defer) scriptElement.defer = true;
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

    const initializeScripts = (attempts = 10, delay = 200) => {
      if (attempts <= 0) {
        console.error('[PostPage.jsx] Failed to initialize code highlighters after retries');
        return;
      }

      if (
        window.React &&
        window.ReactDOM &&
        window.ReactSyntaxHighlighter &&
        window.ReactSyntaxHighlighterStyles &&
        window.ReactSyntaxHighlighterStyles.prism &&
        window.prettier &&
        window.prettierPlugins
      ) {
        console.log('[PostPage.jsx] Initializing code highlighters');
        const event = new Event('DOMContentLoaded');
        document.dispatchEvent(event);

        const wrappers = document.querySelectorAll('.code-snippet-wrapper');
        wrappers.forEach(wrapper => {
          const snippetId = wrapper.id;
          const language = wrapper.getAttribute('data-language') || 'javascript';
          let snippet = wrapper.getAttribute('data-raw-snippet') || wrapper.getAttribute('data-snippet') || '';
          if (snippet) {
            try {
              // Format snippet with Prettier
              let formattedSnippet = snippet;
              try {
                formattedSnippet = window.prettier.format(snippet, {
                  parser: language === 'javascript' ? 'babel' : language,
                  plugins: window.prettierPlugins,
                  tabWidth: 2,
                  useTabs: false,
                  semi: true,
                  singleQuote: true,
                  trailingComma: 'es5',
                });
              } catch (formatError) {
                console.warn(`[PostPage.jsx] Prettier formatting failed for snippet ${snippetId}:`, formatError);
              }

              const root = window.ReactDOM.createRoot(wrapper);
              root.render(
                window.React.createElement(
                  window.ReactSyntaxHighlighter,
                  {
                    language,
                    style: window.ReactSyntaxHighlighterStyles.prism,
                    customStyle: {
                      margin: 0,
                      padding: '1rem',
                      background: '#1f2937',
                      fontSize: 'clamp(0.875rem, 1.8vw, 0.9375rem)',
                    },
                    wrapLines: true,
                    wrapLongLines: true,
                    children: formattedSnippet,
                  }
                )
              );
            } catch (error) {
              console.error(`[PostPage.jsx] Error rendering snippet ${snippetId}:`, error);
            }
          }
        });
      } else {
        console.warn(`[PostPage.jsx] Dependencies not ready, retrying (${attempts} attempts left)`);
        setTimeout(() => initializeScripts(attempts - 1, delay), delay);
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
