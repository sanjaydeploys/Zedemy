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
  max-width: 1280px;
  margin: 0 auto;
  padding: 1rem;
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
  position: relative;
  margin: 1.5rem 0;
  border-radius: 8px;
  overflow: hidden;
  background: #1e1e1e;
  font-family: 'Consolas', monospace;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
`;

const CodeHeader = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #2d2d2d;
  color: #d4d4d4;
  font-size: 0.875rem;
  align-items: center;
`;

const CodeLanguageLabel = styled.span`
  font-weight: 600;
  color: #d4d4d4;
`;

const CopyButton = styled.button`
  background: #3c3c3c;
  color: #d4d4d4;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: background 0.2s;

  &:hover, &:focus {
    background: #22c55e;
    color: #fff;
    outline: none;
  }

  &.copied {
    background: #22c55e;
    color: #fff;
  }
`;

const CodeBlock = styled.pre`
  background: #1e1e1e;
  padding: 1rem;
  margin: 0;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;

  code {
    font-family: 'Consolas', monospace;
    font-size: 0.875rem;
    color: #d4d4d4;
    white-space: pre-wrap;
    line-height: 1.6;
  }

  .hljs-comment,
  .hljs-quote { color: #6a9955; }
  .hljs-keyword,
  .hljs-selector-tag,
  .hljs-literal,
  .hljs-title,
  .hljs-name,
  .hljs-strong,
  .hljs-emphasis { color: #569cd6; }
  .hljs-string,
  .hljs-title,
  .hljs-name,
  .hljs-type,
  .hljs-attribute,
  .hljs-symbol,
  .hljs-built_in,
  .hljs-builtin-name,
  .hljs-link,
  .hljs-params,
  .hljs-meta { color: #ce9178; }
  .hljs-number,
  .hljs-hexcolor,
  .hljs-regexp,
  .hljs-literal { color: #b5cea8; }
  .hljs-class .hljs-title,
  .hljs-function .hljs-title,
  .hljs-tag .hljs-title,
  .hljs-attr,
  .hljs-subst,
  .hljs-variable,
  .hljs-template-variable,
  .hljs-property,
  .hljs-selector-class,
  .hljs-selector-id { color: #9cdcfe; }
  .hljs-section,
  .hljs-type,
  .hljs-function,
  .hljs-name,
  .hljs-built_in,
  .hljs-builtin-name,
  .hljs-doctag,
  .hljs-meta-keyword,
  .hljs-template-tag,
  .hljs-selector-attr,
  .hljs-selector-pseudo { color: #dcdcaa; }
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
      setHighlighted(snippet || '');
    }
  }, [snippet, language, snippetId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error(`[CodeSnippet] Copy failed for ${snippetId}:`, err);
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
  const [postData, setPostData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [snippets, setSnippets] = useState([]);

  useEffect(() => {
    // Load highlight.js stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css';
    document.head.appendChild(link);

    // Load scripts
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

    // Fetch post data
    if (window.__post__post_DATA__) {
      setPostData(window.__post__post_DATA__);
      setLoading(false);
    } else {
      dispatch(fetchPostSSR(slug))
        .then(({ data }) => {
          setPostData(data);
          setLoading(false);
        })
        .catch((error) => {
          console.error('[PostPage.jsx] Error fetching post data:', error);
          setLoading(false);
        });
    }
  }, [slug, dispatch]);

  useEffect(() => {
    if (postData && postData.subtitles) {
      const snippetData = postData.subtitles
        .flatMap((subtitle, index) =>
          (subtitle.bulletPoints || []).map((point, j) => ({
            id: `snippet-${index}-${j}`,
            language: point.language || 'javascript',
            snippet: point.codeSnippet || '',
          }))
        )
        .filter(snippet => snippet.snippet.trim());

      setSnippets(snippetData);
    }
  }, [postData]);

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
        {snippets.length > 0 ? (
          snippets.map(({ id, snippet, language }) => (
            <CodeSnippet key={id} snippetId={id} snippet={snippet} language={language} />
          ))
        ) : (
          <p>No code snippets available.</p>
        )}
      </PostContent>
    </Layout>
  );
});

export default PostPage;
