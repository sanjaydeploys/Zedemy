function initSearch() {
  var searchInput = document.getElementById('search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', function() {
    var query = searchInput.value.trim().toLowerCase();
    var sections = document.querySelectorAll('.subtitle-section');
    var firstMatch = null;

    sections.forEach(function(section) {
      section.classList.remove('highlight-section');
      if (!query) return;

      var title = section.querySelector('.section-heading');
      var bullets = section.querySelectorAll('.bullet-text');
      var hasMatch = false;

      if (title && title.textContent.toLowerCase().includes(query)) {
        hasMatch = true;
      }

      bullets.forEach(function(bullet) {
        if (bullet.textContent.toLowerCase().includes(query)) {
          hasMatch = true;
        }
      });

      if (hasMatch) {
        section.classList.add('highlight-section');
        if (!firstMatch) {
          firstMatch = section;
        }
      }
    });

    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

document.addEventListener('DOMContentLoaded', initSearch);
