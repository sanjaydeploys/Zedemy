(function() {
  function initSidebar(attempts = 5) {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    // Exit if elements missing
    if (!sidebarWrapper || !toggleButton) {
      if (attempts > 0) {
        requestAnimationFrame(() => initSidebar(attempts - 1));
      }
      return;
    }

    // Prevent re-initialization
    if (sidebarWrapper.dataset.sidebarInitialized) return;
    sidebarWrapper.dataset.sidebarInitialized = 'true';

    // Start hidden on mobile, visible on desktop
    let isSidebarOpen = window.innerWidth >= 1024;

    // Ensure toggle button visible on mobile
    if (window.innerWidth < 1024) {
      toggleButton.style.display = 'block';
    }

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

    // Clean up listeners
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

    // Handle resize
    let lastWidth = window.innerWidth;
    window._resizeHandler = () => {
      const currentWidth = window.innerWidth;
      if ((lastWidth < 1024 && currentWidth >= 1024) || (lastWidth >= 1024 && currentWidth < 1024)) {
        isSidebarOpen = currentWidth >= 1024;
        sidebarWrapper.classList.toggle('open', isSidebarOpen);
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        toggleButton.style.display = currentWidth < 1024 ? 'block' : 'none';
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

    window.initSidebar = initSidebar;
  }

  // Run initialization
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSidebar();
  } else {
    document.addEventListener('DOMContentLoaded', initSidebar);
  }
})();
