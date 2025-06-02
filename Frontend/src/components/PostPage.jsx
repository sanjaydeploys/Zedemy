import  { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { fetchPostSSR } from '../actions/postActions';
import { RingLoader } from 'react-spinners';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';

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

const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => {
    const errorHandler = (error) => {
      console.error('[ErrorBoundary] Rendering error:', error);
      setHasError(true);
    };
    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);
  if (hasError) return <div>Error rendering content. Please refresh.</div>;
  return children;
};

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const [loading, setLoading] = useState(!window.__POST_DATA__);

  useEffect(() => {
    const scripts = [
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
        scriptElement.async = false;
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

    const initializeCodeSnippets = () => {
      const wrappers = document.querySelectorAll('.code-snippet-wrapper');
      wrappers.forEach(wrapper => {
        const snippetId = wrapper.id;
        const language = wrapper.getAttribute('data-language') || 'javascript';
        let snippet = wrapper.getAttribute('data-formatted-snippet') || wrapper.getAttribute('data-snippet') || '';
        if (snippet) {
          try {
            // Format snippet if not pre-formatted
            if (!wrapper.getAttribute('data-formatted-snippet')) {
              try {
                snippet = prettier.format(snippet, {
                  parser: language === 'javascript' ? 'babel' : language,
                  plugins: [parserBabel],
                  tabWidth: 2,
                  useTabs: false,
                  semi: true,
                  singleQuote: true,
                  trailingComma: 'es5',
                });
              } catch (formatError) {
                console.warn(`[PostPage.jsx] Prettier formatting failed for snippet ${snippetId}:`, formatError);
              }
            }

            const root = ReactDOM.createRoot(wrapper);
            root.render(
              <CodeMirror
                value={snippet}
                extensions={[javascript()]}
                theme={vscodeDark}
                readOnly={true}
                basicSetup={{
                  lineNumbers: true,
                  foldGutter: false,
                  autocompletion: false,
                  highlightActiveLine: false,
                }}
                style={{
                  fontSize: 'clamp(0.875rem, 1.8vw, 0.9375rem)',
                  background: '#1e1e1e',
                  borderRadius: '0 0 8px 8px',
                }}
              />
            );
          } catch (error) {
            console.error(`[PostPage.jsx] Error rendering snippet ${snippetId}:`, error);
          }
        }
      });
    };

    if (ssrHtml) {
      initializeCodeSnippets();
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
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
    <ErrorBoundary>
      <Layout>
        <PostContent dangerouslySetInnerHTML={{ __html: ssrHtml }} />
      </Layout>
    </ErrorBoundary>
  );
});

export default PostPage;
