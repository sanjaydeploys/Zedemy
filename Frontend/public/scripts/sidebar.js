(function() {
  function initSidebar(attempts = 10) {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!sidebarWrapper || !toggleButton) {
      if (attempts > 0) {
        requestAnimationFrame(() => initSidebar(attempts - 1));
      }
      return;
    }

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

    // Clean up listeners
    toggleButton.removeEventListener('click', window._toggleSidebarHandler);
    sidebarLinks.forEach(link => link.removeEventListener('click', window._sidebarLinkHandler));
    window.removeEventListener('scroll', window._highlightActiveSection);
    window.removeEventListener('resize', window._resizeHandler);

    // Attach events
    window._toggleSidebarHandler = toggleSidebar;
    if (window.innerWidth < 1024) {
      toggleButton.addEventListener('click', toggleSidebar);
    }

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

    window._highlightActiveSection = highlightActiveSection;
    window.addEventListener('scroll', highlightActiveSection);

    window._resizeHandler = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      if (isLargeScreen !== isSidebarOpen) {
        isSidebarOpen = isLargeScreen;
        sidebarWrapper.classList.toggle('open', isLargeScreen);
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        toggleButton.style.display = isLargeScreen ? 'none' : 'block';
        toggleButton.removeEventListener('click', window._toggleSidebarHandler);
        if (!isLargeScreen) {
          toggleButton.addEventListener('click', window._toggleSidebarHandler);
        }
      }
      highlightActiveSection();
    };
    window.addEventListener('resize', window._resizeHandler);

    // Initialize state
    sidebarWrapper.classList.toggle('open', isSidebarOpen);
    toggleButton.style.display = window.innerWidth >= 1024 ? 'none' : 'block';
    toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
    highlightActiveSection();

    window.initSidebar = initSidebar; // Expose for PostPage.jsx
  }

  // Run initialization
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSidebar();
  } else {
    document.addEventListener('DOMContentLoaded', initSidebar);
  }
})();
