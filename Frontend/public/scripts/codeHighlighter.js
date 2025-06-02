(function () {
  // Ensure dependencies are loaded
  if (!window.React || !window.ReactDOM || !window.ReactSyntaxHighlighter || !window.CopyToClipboard || !window.ReactSyntaxHighlighterStyles) {
    console.error('[codeHighlighter.js] Required dependencies (React, ReactDOM, ReactSyntaxHighlighter, CopyToClipboard, or Styles) not loaded');
    return;
  }

  const { createRoot } = window.ReactDOM;
  const { useState } = window.React;

  const CodeSnippet = ({ snippetId, language, snippet }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return window.React.createElement(
      'div',
      { className: 'code-snippet-wrapper', id: snippetId },
      window.React.createElement(
        'div',
        { className: 'code-header' },
        window.React.createElement(
          'span',
          { className: 'code-language' },
          language.charAt(0).toUpperCase() + language.slice(1)
        ),
        window.React.createElement(
          window.CopyToClipboard,
          { text: snippet, onCopy: handleCopy },
          window.React.createElement(
            'button',
            {
              className: `copy-button ${copied ? 'copied' : ''}`,
              'aria-label': `Copy ${language} code`,
            },
            copied ? 'Copied' : 'Copy'
          )
        )
      ),
      window.React.createElement(
        window.ReactSyntaxHighlighter,
        {
          language,
          style: window.ReactSyntaxHighlighterStyles.prism,
          customStyle: {
            margin: '0',
            padding: '1rem',
            background: '#1f2937',
            fontSize: 'clamp(0.875rem, 1.8vw, 0.9375rem)',
          },
          wrapLines: true,
          wrapLongLines: true,
        },
        snippet
      )
    );
  };

  document.addEventListener('DOMContentLoaded', () => {
    const wrappers = document.querySelectorAll('.code-snippet-wrapper');
    wrappers.forEach(wrapper => {
      const snippetId = wrapper.id;
      const language = wrapper.getAttribute('data-language') || 'javascript';
      const snippet = wrapper.getAttribute('data-snippet') || '';
      if (snippet) {
        const root = createRoot(wrapper);
        root.render(
          window.React.createElement(CodeSnippet, {
            snippetId,
            language,
            snippet,
          })
        );
      }
    });
  });
})();
