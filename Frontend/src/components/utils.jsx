
const linkCache = new Map();

export const parseLinks = (text, category, isHtml = false) => {
  if (!text) return isHtml ? '' : text;

  const cacheKey = `${text}-${category}-${isHtml}`;
  if (linkCache.has(cacheKey)) {
    return linkCache.get(cacheKey);
  }

  const linkRegex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+|vscode:\/\/[^\s)]+|\/[^\s)]+)\)/g;
  let result;

  if (isHtml) {
    result = text.replace(linkRegex, (match, linkText, url) => {
      const isInternal = url.startsWith('/');
      return isInternal
        ? `<a href="${url}" class="text-blue-500 hover:text-blue-700">${linkText}</a>`
        : `<a href="${url}" target="_blank" rel="noopener" class="text-blue-500 hover:text-blue-700">${linkText}</a>`;
    });
  } else {
    result = text.replace(linkRegex, '$1'); // Simply strip the markdown syntax, keep the link text
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
