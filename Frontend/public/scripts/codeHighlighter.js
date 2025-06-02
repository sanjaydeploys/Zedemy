const { createRoot } = ReactDOM;
const { lazy, Suspense } = React;
const SyntaxHighlighter = lazy(() => import('https://cdn.jsdelivr.net/npm/react-syntax-highlighter@15.5.0/dist/esm/prism.js').then(module => ({ default: module.Prism })));
const { CopyToClipboard } = lazy(() => import('https://cdn.jsdelivr.net/npm/react-copy-to-clipboard@5.1.0/build/react-copy-to-clipboard.js'));

const CodeSnippet = ({ snippetId, language, snippet }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-snippet-wrapper" id={snippetId}>
      <div className="code-header">
        <span className="code-language">{language.charAt(0).toUpperCase() + language.slice(1)}</span>
        <Suspense fallback={<button className="copy-button" disabled>Copy</button>}>
          <CopyToClipboard text={snippet} onCopy={handleCopy}>
            <button className={`copy-button ${copied ? 'copied' : ''}`} aria-label={`Copy ${language} code`}>
              {copied ? 'Copied' : 'Copy'}
            </button>
          </CopyToClipboard>
        </Suspense>
      </div>
      <Suspense fallback={<pre className="code-block"><code>{snippet}</code></pre>}>
        <SyntaxHighlighter
          language={language}
          style={ReactSyntaxHighlighterStyles.vs}
          customStyle={{ margin: 0, padding: '1rem', background: '#1f2937', fontSize: 'clamp(0.875rem, 1.8vw, 0.9375rem)' }}
          wrapLines={true}
          wrapLongLines={true}
        >
          {snippet}
        </SyntaxHighlighter>
      </Suspense>
    </div>
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
      root.render(<CodeSnippet snippetId={snippetId} language={language} snippet={snippet} />);
    }
  });
});
