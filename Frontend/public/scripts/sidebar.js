(function() {
  window.toggleSidebar = function() {
    const sidebar = document.getElementById('sidebarWrapper');
    const toggleBtn = document.querySelector('.toggleButton');
    if (sidebar && toggleBtn) {
      sidebar.classList.toggle('open');
      toggleBtn.textContent = sidebar.classList.contains('open') ? '×' : '☰';
      toggleBtn.setAttribute('aria-label', sidebar.classList.contains('open') ? 'Close Sidebar' : 'Open Sidebar');
      console.log('[sidebar.js] Toggled sidebar, open:', sidebar.classList.contains('open'));
    } else {
      console.warn('[sidebar.js] Sidebar or toggle button not found');
    }
  };

  window.scrollToSection = function(sectionId) {
    const element = document.getElementById(sectionId);
    const sidebar = document.getElementById('sidebarWrapper');
    const toggleBtn = document.querySelector('.toggleButton');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      if (sidebar && sidebar.classList.contains('open') && window.innerWidth < 1024) {
        sidebar.classList.remove('open');
        if (toggleBtn) {
          toggleBtn.textContent = '☰';
          toggleBtn.setAttribute('aria-label', 'Open Sidebar');
          console.log('[sidebar.js] Closed sidebar on section click');
        }
      }
    } else {
      console.warn('[sidebar.js] Section not found:', sectionId);
    }
  };

  // Initialize toggle button state
  document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.querySelector('.toggleButton');
    const sidebar = document.getElementById('sidebarWrapper');
    if (toggleBtn && sidebar) {
      toggleBtn.textContent = sidebar.classList.contains('open') ? '×' : '☰';
      toggleBtn.setAttribute('aria-label', sidebar.classList.contains('open') ? 'Close Sidebar' : 'Open Sidebar');
      console.log('[sidebar.js] Initialized toggle button');
    }
  });
})();
