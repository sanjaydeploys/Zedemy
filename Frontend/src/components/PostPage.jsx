import { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { fetchPostPage } from '../actions/postActions';
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

const CodeSnippetWrapper = styled.div`
  position: relative;
  margin: 1rem 0;
  border-radius: 8px;
  overflow: hidden;
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #374151;
  color: #fff;
  font-size: 0.875rem;
`;

const CodeLanguage = styled.span`
  font-weight: 700;
`;

const CopyButton = styled.button`
  background: #4b5563;
  color: #fff;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  &:hover, &:focus {
    background: #22c55e;
    outline: 2px solid #1e40af;
    outline-offset: 2px;
  }
  &.copied {
    background: #22c55e;
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

const CodeSnippet = ({ snippet, language, snippetId }) => {
  const [formattedSnippet, setFormattedSnippet] = useState(snippet);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const formatted = prettier.format(snippet, {
        parser: language === 'javascript' ? 'babel' : language,
        plugins: [parserBabel],
        tabWidth: 2,
        useTabs: false,
        semi: true,
        singleQuote: true,
        trailingComma: 'es5',
      });
      setFormattedSnippet(formatted);
    } catch (error) {
      console.warn(`[CodeSnippet] Prettier formatting failed for ${snippetId}:`, error);
    }
  }, [snippet, language, snippetId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error(`[CodeSnippet] Copy failed for ${snippetId}:`, err);
    });
  };

  return (
    <CodeSnippetWrapper id={snippetId} data-language={language}>
      <CodeHeader>
        <CodeLanguage>{language.charAt(0).toUpperCase() + language.slice(1)}</CodeLanguage>
        <CopyButton className={copied ? 'copied' : ''} onClick={handleCopy}>
          {copied ? 'Copied' : 'Copy'}
        </CopyButton>
      </CodeHeader>
      <CodeMirror
        value={formattedSnippet}
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
    </CodeSnippetWrapper>
  );
};

const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const [loading, setLoading] = useState(!window.__POST_DATA__);
  const [snippets, setSnippets] = useState([]);

  useEffect(() => {
    const scripts = [
      { src: '/scripts/sidebar.js', name: 'sidebar.js', defer: true },
      { src: '/scripts/scrollToTop.js', name: 'scrollToTop.js', defer: true },
    ];

    const loadScript = (script) => {
      console.log(`[PostPage.jsx] Loading ${script.name}`);
      const scriptElement = document.createElement('script');
      scriptElement.src = script.src;
      scriptElement.async = false;
      if (script.defer) scriptElement.defer = true;
      scriptElement.onload = () => console.log(`[PostPage.jsx] ${script.name} loaded`);
      scriptElement.onerror = () => console.error(`[PostPage.jsx] Error loading ${script.name}`);
      document.head.appendChild(scriptElement);
      return scriptElement;
    };

    const loadedScripts = scripts.map(loadScript);

    return () => {
      loadedScripts.forEach(scriptElement => {
        if (scriptElement && document.head.contains(scriptElement)) {
          document.head.removeChild(scriptElement);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (window.__POST_DATA__) {
      setSsrHtml(document.documentElement.outerHTML);
      setLoading(false);
      dispatch({ type: 'FETCH_POST_SUCCESS', payload: window.__POST_DATA__ });
    } else {
      dispatch(fetchPostPage(slug))
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

  useEffect(() => {
    if (ssrHtml) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(ssrHtml, 'text/html');
      const wrappers = doc.querySelectorAll('.code-snippet-wrapper');
      const snippetData = Array.from(wrappers).map(wrapper => ({
        id: wrapper.id,
        language: wrapper.getAttribute('data-language') || 'javascript',
        snippet: wrapper.getAttribute('data-formatted-snippet') || wrapper.getAttribute('data-snippet') || '',
      }));
      setSnippets(snippetData);

      // Trigger DOMContentLoaded for other scripts
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
    }
  }, [ssrHtml]);

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
        <PostContent>
          <div dangerouslySetInnerHTML={{ __html: ssrHtml }} />
          {snippets.map(({ id, snippet, language }) => (
            snippet ? <CodeSnippet key={id} snippetId={id} snippet={snippet} language={language} /> : null
          ))}
        </PostContent>
      </Layout>
    </ErrorBoundary>
  );
});

export default PostPage;
