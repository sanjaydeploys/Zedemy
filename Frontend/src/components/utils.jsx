const linkCache = new Map();

export const parseLinks = (text, category, isHtml = false) => {
  if (!text) return isHtml ? '' : text;

  const cacheKey = `${text.slice(0, 100)}-${category}-${isHtml}`; // Limit cache key size
  if (linkCache.has(cacheKey)) {
    return linkCache.get(cacheKey);
  }

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^)\s]+|vscode:\/\/[^)\s]+|\/[^)\s]+)\)/g;
  let result = text;

  if (isHtml) {
    result = text.replace(linkRegex, (match, linkText, url) => {
      const isInternal = url.startsWith('/');
      return isInternal
        ? `<a href="${url}" class="content-link">${linkText}</a>`
        : `<a href="${url}" target="_blank" rel="noopener" class="content-link">${linkText}</a>`;
    });
  } else {
    result = text.replace(linkRegex, '$1');
  }

  // Limit cache size
  if (linkCache.size > 1000) {
    linkCache.clear();
  }
  linkCache.set(cacheKey, result);
  return result;
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
