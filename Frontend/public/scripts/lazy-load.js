function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"').replace(/'/g, '');
}

function parseLinks(text, category, isHTML = false) {
  if (!text) return text;
  const linkRegex = /\[(.*?)\]\((.*?)\)/g;
  return text.replace(linkRegex, (match, text, url) => {
    const safeUrl = encodeURI(url.startsWith('http') ? url : `https://zedemy.vercel.app/${category.toLowerCase().replace(/\s+/g, '-')}/${url}`);
    return isHTML ? `<a href="${safeUrl}" class="content-link">${escapeHTML(text)}</a>` : text;
  });
}

function renderComparisonTable(superTitles, category) {
  if (!superTitles || superTitles.length === 0) return '';
  return `
    <section aria-labelledby="comparison-heading" class="comparison-section">
      <h2 id="comparison-heading" class="section-heading">Comparison</h2>
      <div class="table-wrapper">
        <table class="comparison-table">
          <caption class="table-caption">Comparison of ${escapeHTML(category || 'features')}</caption>
          <thead>
            <tr>
              <th scope="col" class="table-header">Attribute</th>
              ${superTitles.map(st => st.superTitle ? `<th scope="col" class="table-header">${parseLinks(escapeHTML(st.superTitle), category, true)}</th>` : '').join('')}
            </tr>
          </thead>
          <tbody>
            ${(superTitles[0]?.attributes || []).map((attr, index) => `
              <tr class="table-row">
                <td scope="row" class="table-cell">${parseLinks(escapeHTML(attr.attribute), category, true)}</td>
                ${superTitles.map(st => {
                  const itemGroup = st.attributes[index]?.items;
                  return `
                    <td class="table-cell">
                      ${itemGroup?.length > 0 ? itemGroup.map(item => `
                        <div class="item-group">
                          <strong class="item-title">${parseLinks(escapeHTML(item.title), category, true)}</strong>
                          ${item.bulletPoints?.length > 0 ? `
                            <ul class="item-bullets">
                              ${item.bulletPoints.map(point => `<li class="bullet-point">${parseLinks(escapeHTML(point), category, true)}</li>`).join('')}
                            </ul>
                          ` : ''}
                        </div>
                      `).join('') : 'N/A'}
                    </td>
                  `;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  const lazySections = document.querySelectorAll('[data-lazy="true"]');
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.visibility = 'visible';
        entry.target.style.opacity = '1';
        obs.unobserve(entry.target);
      }
    });
  }, { rootMargin: '200px' });

  lazySections.forEach(section => {
    section.style.visibility = 'hidden';
    section.style.opacity = '0';
    section.style.transition = 'opacity 0.3s ease';
    observer.observe(section);
  });

  const comparisonPlaceholder = document.getElementById('comparison-placeholder');
  if (comparisonPlaceholder) {
    const superTitles = JSON.parse(comparisonPlaceholder.dataset.supertitles || '[]');
    const category = comparisonPlaceholder.dataset.category || '';
    if (superTitles.length > 0) {
      comparisonPlaceholder.innerHTML = renderComparisonTable(superTitles, category);
      observer.observe(comparisonPlaceholder);
    }
  }
});

function toggleSidebar() {
  const sidebarWrapper = document.getElementById('sidebar-wrapper');
  sidebarWrapper.classList.toggle('open');
}

if (window.requestIdleCallback) {
  requestIdleCallback(() => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  });
} else {
  setTimeout(() => {
    document.dispatchEvent(new Event('DOMContentLoaded'));
  }, 0);
}
