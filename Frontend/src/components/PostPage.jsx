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
  display: #f9fafb;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f9fafb;
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
  font-family: 'Inter', sans-serif;
  font-size: .875rem;
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
  &:hover,
  &:focus {
    background: #22c55e;
    outline: 2px solid #1e40af;
    outline-offset: 2px;
  }
  &.copied {
    background: #22c55e;
  }
`;

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
      setFormattedSnippet(snippet);
    }
  }, [snippet, language, snippetId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedSnippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <CodeSnippetWrapper id={snippetId} data-language={language} data-snippet={snippet}>
      <CodeHeader>
        <CodeLanguage>{language.charAt(0).toUpperCase() + language.slice(1)}</CodeLanguage>
        <CopyButton
          className={copied ? 'copied' : ''}
          onClick={handleCopy}
          data-snippet-id={snippetId}
          aria-label={`Copy ${language} code`}
        >
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
          fontSize: '0.9375rem',
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
      { src: '/scripts/copyCode.js', name: 'copyCode.js', defer: true },
    ];

    scripts.forEach(script => {
      const scriptElement = document.createElement('script');
      scriptElement.src = script.src;
      scriptElement.defer = script.defer;
      document.head.appendChild(scriptElement);
    });

    if (window.__POST_DATA__) {
      setSsrHtml(document.documentElement.outerHTML);
      setLoading(false);
      dispatch({ type: 'FETCH_POST_SUCCESS', payload: window.__POST_DATA__ });
    } else {
      dispatch(fetchPostPage(slugs))
        .then(({ html }) => {
          setSsrHtml(html);
          setLoading(false);
        })
        .catch((error) => {
          console.error('[PostPage.jsx] Error fetching SSR HTML:', error);
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
        wrapper.getAttribute('data-snippet') || '',
      }));
      setSnippets(snippetData);

      // Trigger DOMContentLoaded for copyCode.js
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }
  }, [ssrHtml]);

  if (loading) {
    return (
      <LoadingContainer>
        <RingLoader color="#22c55e" size={80} />
        <LoadingText>Loading post...</LoadingText>
      </LoadingContainer>
    );
  }

  return (
    <Layout>
      <PostContent>
        <div
          dangerouslySetInnerHTML={{ __html: ssrHtml }}
          ref={(el) => {
            if (el) {
              // Replace .code-snippet-wrapper to prevent duplication
              el.querySelectorAll('.code-snippet-wrapper').forEach(wrapper => {
                const placeholder = document.createElement('div');
                placeholder.id = wrapper.id;
                wrapper.parentNode.replaceChild(placeholder, wrapper);
              });
            }
          }}
        />
        {snippets.map(({ id, snippet, language }) => (
          <CodeSnippet key={id} snippetId={id} snippet={snippet} language={language} />
        ))}
      </PostContent>
    </Layout>
  );
});

export default PostPage;
