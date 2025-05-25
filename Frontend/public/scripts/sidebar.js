(function() {
  function initSidebar() {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!sidebarWrapper || !toggleButton) {
      console.warn('[sidebar.js] Missing sidebar-wrapper or toggle-button');
      return;
    }

    // Sidebar visible by default on all devices
    let isSidebarOpen = true;

    const toggleSidebar = () => {
      isSidebarOpen = !isSidebarOpen;
      sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
      sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
      toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar');
      toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
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

    // Attach toggle event
    window._toggleSidebarHandler = toggleSidebar;
    toggleButton.addEventListener('click', window._toggleSidebarHandler);

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

    // Handle scroll and resize
    window.removeEventListener('scroll', window._highlightActiveSection);
    window._highlightActiveSection = highlightActiveSection;
    window.addEventListener('scroll', window._highlightActiveSection);

    window.removeEventListener('resize', window._resizeHandler);
    window._resizeHandler = () => {
      // Keep sidebar open on resize unless toggled
      sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
      sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
      toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar');
      toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
      highlightActiveSection();
    };
    window.addEventListener('resize', window._resizeHandler);

    // Initialize state
    sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
    sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Hide Sidebar' : 'Show Sidebar');
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

  // Handle dynamic DOM changes in CSR
  const observer = new MutationObserver(() => {
    if (document.getElementById('sidebar-wrapper') && document.getElementById('toggle-button')) {
      initSidebar();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
