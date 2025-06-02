(function () {
  const initializeHighlighters = (attempts = 5, delay = 100) => {
    // Ensure dependencies are loaded
    if (
      !window.React ||
      !window.ReactDOM ||
      !window.ReactSyntaxHighlighter ||
      !window.CopyToClipboard ||
      !window.ReactSyntaxHighlighterStyles ||
      !window.ReactSyntaxHighlighterStyles.prism
    ) {
      if (attempts <= 0) {
        console.error('[codeHighlighter.js] Required dependencies (React, ReactDOM, ReactSyntaxHighlighter, CopyToClipboard, or Styles) not loaded after retries');
        return;
      }
      console.warn(`[codeHighlighter.js] Dependencies not ready, retrying (${attempts} attempts left)`);
      setTimeout(() => initializeHighlighters(attempts - 1, delay * 2), delay);
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

    const renderSnippets = () => {
      const wrappers = document.querySelectorAll('.code-snippet-wrapper');
      wrappers.forEach(wrapper => {
        const snippetId = wrapper.id;
        const language = wrapper.getAttribute('data-language') || 'javascript';
        const snippet = wrapper.getAttribute('data-snippet') || '';
        if (snippet) {
          try {
            const root = createRoot(wrapper);
            root.render(
              window.React.createElement(CodeSnippet, {
                snippetId,
                language,
                snippet,
              })
            );
          } catch (error) {
            console.error(`[codeHighlighter.js] Error rendering snippet ${snippetId}:`, error);
          }
        }
      });
    };

    // Run immediately and listen for DOM changes
    renderSnippets();
    document.addEventListener('DOMContentLoaded', renderSnippets);
  };

  // Start initialization
  initializeHighlighters();
})();
