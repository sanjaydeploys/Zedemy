(function() {
  // Initialize sidebar functionality
  function initSidebar() {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    // Exit if critical elements are missing
    if (!sidebarWrapper || !toggleButton) {
      console.warn('[sidebar.js] Missing sidebar-wrapper or toggle-button');
      return;
    }

    // Initialize sidebar state
    let isSidebarOpen = window.innerWidth >= 1024;

    // Toggle sidebar function
    const toggleSidebar = () => {
      isSidebarOpen = !isSidebarOpen;
      sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
      sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
      toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
      toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    };

    // Highlight active section
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

    // Remove existing listeners to prevent duplicates
    toggleButton.removeEventListener('click', window._toggleSidebarHandler);
    sidebarLinks.forEach(link => {
      link.removeEventListener('click', window._sidebarLinkHandler);
    });

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
        if (window.innerWidth < 1024) {
          toggleSidebar();
        }
      }
    };
    sidebarLinks.forEach(link => {
      link.addEventListener('click', window._sidebarLinkHandler);
    });

    // Handle scroll and resize
    window.removeEventListener('scroll', window._highlightActiveSection);
    window._highlightActiveSection = highlightActiveSection;
    window.addEventListener('scroll', window._highlightActiveSection);

    window.removeEventListener('resize', window._resizeHandler);
    window._resizeHandler = () => {
      const newIsOpen = window.innerWidth >= 1024;
      if (newIsOpen !== isSidebarOpen) {
        isSidebarOpen = newIsOpen;
        sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
        sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
      }
      highlightActiveSection();
    };
    window.addEventListener('resize', window._resizeHandler);

    // Initialize state
    sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
    sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
    toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    highlightActiveSection();

    // Expose functions
    window.toggleSidebar = toggleSidebar;
    window.initSidebar = initSidebar;
  }

  // Run on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    initSidebar();
  }

  // MutationObserver for dynamic DOM changes in CSR
  const observer = new MutationObserver((mutations) => {
    if (document.getElementById('sidebar-wrapper') && document.getElementById('toggle-button')) {
      initSidebar();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Polling fallback for CSR
  let attempts = 0;
  const maxAttempts = 10;
  const pollInterval = setInterval(() => {
    if (document.getElementById('sidebar-wrapper') && document.getElementById('toggle-button')) {
      initSidebar();
      clearInterval(pollInterval);
    } else if (attempts++ >= maxAttempts) {
      console.warn('[sidebar.js] Failed to find sidebar elements after max attempts');
      clearInterval(pollInterval);
    }
  }, 100);
})();
