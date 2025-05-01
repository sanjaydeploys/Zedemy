import React from 'react';
import { Link } from 'react-router-dom';

export const parseLinks = (text, category, isHtml = false) => {
  if (!text) return isHtml ? '' : [text];
  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  if (isHtml) {
    return text.replace(linkRegex, (match, linkText, url) => {
      const isInternal = url.startsWith('/');
      return isInternal
        ? `<a href="${url}" class="text-blue-600 hover:text-blue-800" aria-label="Navigate to ${linkText}">${linkText}</a>`
        : `<a href="${url}" target="_blank" rel="noopener" class="text-blue-600 hover:text-blue-800" aria-label="Visit ${linkText}">${linkText}</a>`;
    });
  }
  const elements = [];
  let lastIndex = 0;
  let match;
  while ((match = linkRegex.exec(text)) !== null) {
    const [fullMatch, linkText, url] = match;
    elements.push(text.slice(lastIndex, match.index));
    const isInternal = url.startsWith('/');
    elements.push(
      isInternal ? (
        <Link key={`${url}-${match.index}`} to={url} className="text-blue-600 hover:text-blue-800" aria-label={`Navigate to ${linkText}`}>
          {linkText}
        </Link>
      ) : (
        <a
          key={`${url}-${match.index}`}
          href={url}
          target={url.startsWith('vscode://') ? '_self' : '_blank'}
          rel="noopener"
          className="text-blue-600 hover:text-blue-800"
          aria-label={`Visit ${linkText}`}
        >
          {linkText}
        </a>
      )
    );
    lastIndex = match.index + fullMatch.length;
  }
  if (lastIndex < text.length) {
    elements.push(text.slice(lastIndex));
  }
  return elements.length ? elements : [text];
};

export const slugify = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};

export const truncateText = (text, max) => {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '...';
};
