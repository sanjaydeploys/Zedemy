(function() {
  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    if (sidebar && toggleButton) {
      sidebar.classList.toggle('open');
      const isOpen = sidebar.classList.contains('open');
      toggleButton.textContent = isOpen ? '✕' : '☰';
      toggleButton.setAttribute('aria-label', isOpen ? 'Close Sidebar' : 'Open Sidebar');
      console.log('[sidebar.js] Sidebar toggled, open:', isOpen);
    } else {
      console.warn('[sidebar.js] Sidebar or toggle button not found');
    }
  }

  function scrollToSection(sectionId) {
    const element = document.getElementById(sectionId);
    const sidebar = document.getElementById('sidebar-wrapper');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      if (sidebar && window.innerWidth < 1024 && sidebar.classList.contains('open')) {
        sidebar.classList.remove('open');
        const toggleButton = document.getElementById('toggle-button');
        if (toggleButton) {
          toggleButton.textContent = '☰';
          toggleButton.setAttribute('aria-label', 'Open Sidebar');
        }
        console.log('[sidebar.js] Sidebar closed after scrolling');
      }
    }
  }

  function initSidebar() {
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!toggleButton) {
      console.warn('[sidebar.js] Toggle button not found');
      return;
    }

    toggleButton.addEventListener('click', toggleSidebar);
    console.log('[sidebar.js] Toggle button listener attached');

    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('href')?.slice(1) || '';
        scrollToSection(sectionId);
      });
    });
    console.log('[sidebar.js] Sidebar links initialized');
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSidebar();
  } else {
    document.addEventListener('DOMContentLoaded', initSidebar);
  }
})();
