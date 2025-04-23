import { Link } from 'react-router-dom';

export const parseLinks = (text, category) => {
  if (!text) return [text];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  const elements = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    const startIndex = match.index;
    const endIndex = startIndex + fullMatch.length;
    if (startIndex > lastIndex) {
      elements.push(text.slice(lastIndex, startIndex));
    }
    const isInternal = url.startsWith('/');
    elements.push(
      isInternal ? (
        <Link
          key={startIndex}
          to={url}
          style={{ color: '#007bff', textDecoration: 'underline' }}
          aria-label={`Navigate to ${linkText}`}
        >
          {linkText}
        </Link>
      ) : (
        <a
          key={startIndex}
          href={url}
          target={url.startsWith('vscode://') ? '_self' : '_blank'}
          rel={url.startsWith('vscode://') ? undefined : 'noopener noreferrer nofollow'}
          style={{ color: '#007bff', textDecoration: 'underline' }}
          aria-label={`Visit ${linkText}`}
        >
          {linkText}
        </a>
      )
    );
    lastIndex = endIndex;
  }
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  if (elements.length === 0) {
    elements.push(text);
  }
  return elements;
};

export const parseLinksForHtml = (text, category) => {
  if (!text) return text;
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  return text.replace(linkRegex, (match, linkText, url) => {
    const isInternal = url.startsWith('/');
    if (isInternal) {
      return `<a href="${url}" style="color: #007bff; text-decoration: underline;" aria-label="Navigate to ${linkText}">${linkText}</a>`;
    }
    const target = url.startsWith('vscode://') ? '_self' : '_blank';
    const rel = url.startsWith('vscode://') ? '' : ' rel="noopener noreferrer nofollow"';
    return `<a href="${url}" target="${target}"${rel} style="color: #007bff; text-decoration: underline;" aria-label="Visit ${linkText}">${linkText}</a>`;
  });
};
