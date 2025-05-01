import React, { memo, useState, useEffect, useMemo } from 'react';
import styled from 'styled-components';
import DOMPurify from 'dompurify';

// Styled components
const CodeSnippetContainer = styled.div`
  position: relative;
  margin: 0.5rem 0;
  background: #1a1a1a;
  border-radius: 0.5rem;
  overflow: hidden;
  max-width: 100%;
  box-sizing: border-box;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  min-width: 60px;
  min-height: 36px;
  &:hover {
    background: #2563eb;
  }
  &:focus {
    outline: 2px solid #60a5fa;
  }
`;

const CodeHighlighter = memo(({ code, language = 'javascript', onCopy }) => {
  const [highlighted, setHighlighted] = useState('');
  const [error, setError] = useState(false);

  const sanitizedCode = useMemo(() => DOMPurify.sanitize(code || '', { ALLOWED_TAGS: [] }), [code]);

  useEffect(() => {
    if (!sanitizedCode) {
      setError(true);
      return;
    }

    const loadHighlighter = async () => {
      try {
        const hljs = await import('highlight.js/lib/core');
        const langModule = await import(`highlight.js/lib/languages/${language}.js`);
        hljs.default.registerLanguage(language, langModule.default);
        const result = hljs.default.highlight(sanitizedCode, { language });
        setHighlighted(result.value);
      } catch {
        setError(true);
      }
    };

    if (typeof scheduler !== 'undefined' && scheduler.postTask) {
      scheduler.postTask(loadHighlighter, { priority: 'background' });
    } else {
      requestIdleCallback(loadHighlighter, { timeout: 300 });
    }
  }, [sanitizedCode, language]);

  if (error || !code) {
    return (
      <CodeSnippetContainer>
        <CopyButton onClick={onCopy} aria-label="Copy code">Copy</CopyButton>
        <pre>
          <code>{code || 'No code available'}</code>
        </pre>
      </CodeSnippetContainer>
    );
  }

  return (
    <CodeSnippetContainer>
      <CopyButton onClick={onCopy} aria-label="Copy code">Copy</CopyButton>
      <pre>
        <code className={`hljs language-${language}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
      </pre>
    </CodeSnippetContainer>
  );
});

export default CodeHighlighter;
