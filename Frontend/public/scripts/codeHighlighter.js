import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { vscodeDark } from '@uiw/codemirror-theme-vscode';
import prettier from 'prettier/standalone';
import parserBabel from 'prettier/parser-babel';

(function () {
  const initializeHighlighters = () => {
    const renderSnippets = () => {
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
                console.warn(`[codeHighlighter.js] Prettier formatting failed for snippet ${snippetId}:`, formatError);
              }
            }

            const root = ReactDOM.createRoot(wrapper.querySelector('.code-block'));
            root.render(
              React.createElement(CodeMirror, {
                value: snippet,
                extensions: [javascript()],
                theme: vscodeDark,
                readOnly: true,
                basicSetup: {
                  lineNumbers: true,
                  foldGutter: false,
                  autocompletion: false,
                  highlightActiveLine: false,
                },
                style: {
                  fontSize: 'clamp(0.875rem, 1.8vw, 0.9375rem)',
                  background: '#1e1e1e',
                  borderRadius: '0 0 8px 8px',
                },
              })
            );

            // Attach copy button functionality
            const copyButton = wrapper.querySelector('.copy-button');
            if (copyButton) {
              copyButton.addEventListener('click', () => {
                navigator.clipboard.writeText(snippet).then(() => {
                  copyButton.textContent = 'Copied';
                  copyButton.classList.add('copied');
                  setTimeout(() => {
                    copyButton.textContent = 'Copy';
                    copyButton.classList.remove('copied');
                  }, 2000);
                }).catch(err => {
                  console.error(`[codeHighlighter.js] Copy failed for ${snippetId}:`, err);
                  copyButton.textContent = 'Error';
                  setTimeout(() => {
                    copyButton.textContent = 'Copy';
                  }, 2000);
                });
              });
            }
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
