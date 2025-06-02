import { memo, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import styled from 'styled-components';
import { fetchPostSSR } from '../actions/postActions';
import { RingLoader } from 'react-spinners';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import python from 'highlight.js/lib/languages/python';

// Register languages
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('python', python);

// Styled Components
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
  background-color: #f9fafb;
`;

const LoadingText = styled.div`
  margin-top: 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #1f2937;
  font-weight: normal;
  animation: pulse 500ms ease-in-out infinite;

  @keyframes pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }
`;

const CodeSnippetWrapper = styled.div`
  margin: 1.5rem 0;
  border-radius: 12px;
  overflow: hidden;
  background: #1f2937;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 1rem;
  background: #374151;
  color: #fff;
  font-size: 0.875rem;
`;

const CodeLanguageLabel = styled.span`
  font-weight: bold;
`;

const CopyButton = styled.button`
  background: #4b5563;
  color: white;
  border: none;
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: .875rem;

  &:hover, &:focus {
    background: #22c55e;
    outline: 2px solid #1e40af;
    outline-offset: 2px;
  }

  &.copied {
    background: #22c55e;
  }
`;

const CodeBlock = styled.pre`
  background: #1f2937;
  padding: 1rem;
  margin: 0;
  overflow-x: auto;

  code {
    font-family: 'Consolas', 'Monaco', monospace;
    font-size: .875rem;
    white-space: pre-wrap;
    line-height: 1.6;
  }
`;

// CodeSnippet Component
const CodeSnippet = ({ snippet, language = 'javascript', snippetId }) => {
  const [highlighted, setHighlighted] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const result = hljs.highlight(snippet || '', { language });
      setHighlighted(result.value);
    } catch (error) {
      console.warn(`[CodeSnippet] Highlighting failed for ${snippetId}:`, error);
      setHighlighted(snippet);
    }
  }, [snippet, language, snippetId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <CodeSnippetWrapper id={snippetId} data-language={language} data-snippet={snippet}>
      <CodeHeader>
        <CodeLanguageLabel>{language.charAt(0).toUpperCase() + language.slice(1)}</CodeLanguageLabel>
        <CopyButton
          onClick={handleCopy}
          className={copied ? 'copied' : ''}
          aria-label={`Copy ${language} code`}
        >
          {copied ? 'Copied' : 'Copy'}
        </CopyButton>
      </CodeHeader>
      <CodeBlock>
        <code className={`hljs ${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </CodeBlock>
    </CodeSnippetWrapper>
  );
};

// Main Component
const PostPage = memo(() => {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const [ssrHtml, setSsrHtml] = useState('');
  const [loading, setLoading] = useState(!window.__post__post_DATA__);
  const [snippets, setSnippets] = useState([]);

  useEffect(() => {
    const scripts = [
      { src: '/scripts/sidebar.js', defer: true },
      { src: '/scripts/copyCode.js', defer: true },
      { src: '/scripts/scrollToTop.js', defer: true },
    ];

    scripts.forEach(({ src, defer }) => {
      const script = document.createElement('script');
      script.src = src;
      script.defer = defer;
      document.head.appendChild(script);
    });

    if (window.__post__post_DATA__) {
      setSsrHtml(document.documentElement.outerHTML);
      setLoading(false);
      dispatch({ type: 'FETCH_POST_SUCCESS', payload: window.__post__post_DATA__ });
    } else {
      dispatch(fetchPostSSR(slug))
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
        snippet: wrapper.getAttribute('data-snippet') || '',
      }));

      setSnippets(snippetData);
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
        <div dangerouslySetInnerHTML={{ __html: ssrHtml }} />
        {snippets.map(({ id, snippet, language }) => (
          <CodeSnippet key={id} snippetId={id} snippet={snippet} language={language} />
        ))}
      </PostContent>
    </Layout>
  );
});

export default PostPage;
