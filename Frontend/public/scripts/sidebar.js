(function() {
  function initSidebar() {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!sidebarWrapper || !toggleButton) {
      console.warn('[sidebar.js] Missing sidebar-wrapper or toggle-button');
      return;
    }

    // Sidebar open on large screens, closed on mobile
    let isSidebarOpen = window.innerWidth >= 1024;

    const toggleSidebar = () => {
      if (window.innerWidth < 1024) {
        isSidebarOpen = !isSidebarOpen;
        sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
        sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
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

    // Attach toggle event for mobile
    window._toggleSidebarHandler = toggleSidebar;
    if (window.innerWidth < 1024) {
      toggleButton.addEventListener('click', window._toggleSidebarHandler);
    }

    // Attach link click events
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

    // Handle scroll
    window.removeEventListener('scroll', window._highlightActiveSection);
    window._highlightActiveSection = highlightActiveSection;
    window.addEventListener('scroll', window._highlightActiveSection);

    // Handle resize
    window.removeEventListener('resize', window._resizeHandler);
    window._resizeHandler = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      if (isLargeScreen !== isSidebarOpen) {
        isSidebarOpen = isLargeScreen;
        sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
        sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
        toggleButton.style.display = isLargeScreen ? 'none' : 'block';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        // Reattach toggle event based on screen size
        toggleButton.removeEventListener('click', window._toggleSidebarHandler);
        if (!isLargeScreen) {
          toggleButton.addEventListener('click', window._toggleSidebarHandler);
        }
      }
      highlightActiveSection();
    };
    window.addEventListener('resize', window._resizeHandler);

    // Initialize state
    sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
    sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    toggleButton.style.display = window.innerWidth >= 1024 ? 'none' : 'block';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
    toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    highlightActiveSection();

    // Expose functions
    window.toggleSidebar = toggleSidebar;
    window.initSidebar = initSidebar;
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }

  // Handle CSR DOM changes
  const observer = new MutationObserver(() => {
    if (document.getElementById('sidebar-wrapper') && document.getElementById('toggle-button')) {
      initSidebar();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
