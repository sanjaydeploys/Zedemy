(function() {
  function initSidebar(attempts = 5) {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    // Exit if elements missing and attempts remain
    if (!sidebarWrapper || !toggleButton) {
      if (attempts > 0) {
        requestAnimationFrame(() => initSidebar(attempts - 1));
      }
      return;
    }

    // Prevent re-initialization
    if (sidebarWrapper.dataset.sidebarInitialized) return;
    sidebarWrapper.dataset.sidebarInitialized = 'true';

    let isSidebarOpen = window.innerWidth >= 1024;

    const toggleSidebar = () => {
      if (window.innerWidth < 1024) {
        isSidebarOpen = !isSidebarOpen;
        sidebarWrapper.classList.toggle('open', isSidebarOpen);
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
      }
    };

    const highlightActiveSection = () => {
      const sections = document.querySelectorAll('section[id]');
      let activeSectionId = '';
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < window.innerHeight / 2) {
          activeSectionId = section.id;
        }
      });
      sidebarLinks.forEach(link => {
        const href = link.getAttribute('href')?.slice(1) || '';
        link.classList.toggle('active', href === activeSectionId);
      });
    };

    // Clean up existing listeners
    toggleButton.removeEventListener('click', window._toggleSidebarHandler);
    sidebarLinks.forEach(link => link.removeEventListener('click', window._sidebarLinkHandler));
    window.removeEventListener('scroll', window._highlightActiveSection);
    window.removeEventListener('resize', window._resizeHandler);

    // Attach toggle event
    window._toggleSidebarHandler = toggleSidebar;
    toggleButton.addEventListener('click', toggleSidebar);

    // Attach link events
    window._sidebarLinkHandler = (e) => {
      e.preventDefault();
      const sectionId = e.currentTarget.getAttribute('href')?.slice(1) || '';
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        if (window.innerWidth < 1024 && isSidebarOpen) {
          toggleSidebar();
        }
      }
    };
    sidebarLinks.forEach(link => link.addEventListener('click', window._sidebarLinkHandler));

    // Attach scroll event
    window._highlightActiveSection = highlightActiveSection;
    window.addEventListener('scroll', highlightActiveSection);

    // Handle resize (only update if crossing 1024px)
    let lastWidth = window.innerWidth;
    window._resizeHandler = () => {
      const currentWidth = window.innerWidth;
      if ((lastWidth < 1024 && currentWidth >= 1024) || (lastWidth >= 1024 && currentWidth < 1024)) {
        isSidebarOpen = currentWidth >= 1024;
        sidebarWrapper.classList.toggle('open', isSidebarOpen);
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        highlightActiveSection();
      }
      lastWidth = currentWidth;
    };
    window.addEventListener('resize', window._resizeHandler);

    // Initialize state
    sidebarWrapper.classList.toggle('open', isSidebarOpen);
    toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
    highlightActiveSection();

    // Expose for PostPage.jsx
    window.initSidebar = initSidebar;
  }

  // Run initialization
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSidebar();
  } else {
    document.addEventListener('DOMContentLoaded', initSidebar);
  }
})();
