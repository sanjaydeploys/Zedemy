(function () {
  // Ensure Prism is available (loaded via <script> in HTML)
  if (!window.Prism) {
    console.warn('[codeHighlighter.js] Prism.js not loaded');
    return;
  }

  const initializeHighlighters = () => {
    const renderSnippets = () => {
      const wrappers = document.querySelectorAll('.code-snippet-wrapper');
      wrappers.forEach(wrapper => {
        const snippetId = wrapper.id;
        const language = wrapper.getAttribute('data-language') || 'javascript';
        const codeElement = wrapper.querySelector('.code-block code');
        if (codeElement) {
          try {
            // Ensure code element has the correct language class
            codeElement.className = `language-${language}`;
            // Trigger Prism highlighting
            Prism.highlightElement(codeElement);
            console.log(`[codeHighlighter.js] Highlighted snippet ${snippetId}`);
          } catch (error) {
            console.error(`[codeHighlighter.js] Error highlighting snippet ${snippetId}:`, error);
          }
        }
      });
    };

    // Run immediately and on DOMContentLoaded
    renderSnippets();
    document.addEventListener('DOMContentLoaded', renderSnippets);
  };

  // Start initialization
  initializeHighlighters();
})();
