(function() {
  let retryInterval = null;
  let retryTimeout = null;
  const maxRetryDuration = 5000; // 5 seconds
  const retryIntervalMs = 100;

  function initSidebar() {
    // Clear existing retries
    if (retryInterval) clearInterval(retryInterval);
    if (retryTimeout) clearTimeout(retryTimeout);

    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!sidebarWrapper || !toggleButton) {
      console.warn('[sidebar.js] Missing sidebar-wrapper or toggle-button, retrying...');
      // Fallback: Retry after 100ms
      retryTimeout = setTimeout(initSidebar, 100);
      // Fallback: Retry every 100ms for 5 seconds
      const startTime = Date.now();
      retryInterval = setInterval(() => {
        if (document.getElementById('sidebar-wrapper') && document.getElementById('toggle-button')) {
          clearInterval(retryInterval);
          initSidebar();
        } else if (Date.now() - startTime > maxRetryDuration) {
          clearInterval(retryInterval);
          console.error('[sidebar.js] Failed to find sidebar-wrapper or toggle-button after 5 seconds');
        }
      }, retryIntervalMs);
      return;
    }

    console.log('[sidebar.js] Sidebar initialized successfully');

    let isSidebarOpen = window.innerWidth >= 1024;

    const toggleSidebar = () => {
      if (window.innerWidth < 1024) {
        isSidebarOpen = !isSidebarOpen;
        sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
        sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        console.log('[sidebar.js] Sidebar toggled:', isSidebarOpen ? 'open' : 'closed');
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
    if (window._toggleSidebarHandler) {
      toggleButton.removeEventListener('click', window._toggleSidebarHandler);
    }
    if (window._sidebarLinkHandler) {
      sidebarLinks.forEach(link => link.removeEventListener('click', window._sidebarLinkHandler));
    }
    if (window._highlightActiveSection) {
      window.removeEventListener('scroll', window._highlightActiveSection);
    }
    if (window._resizeHandler) {
      window.removeEventListener('resize', window._resizeHandler);
    }

    // Attach toggle event
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
    window._highlightActiveSection = highlightActiveSection;
    window.addEventListener('scroll', window._highlightActiveSection);

    // Handle resize
    window._resizeHandler = () => {
      const isLargeScreen = window.innerWidth >= 1024;
      if (isLargeScreen !== isSidebarOpen) {
        isSidebarOpen = isLargeScreen;
        sidebarWrapper.dataset.state = isLargeScreen ? 'open' : 'closed';
        sidebarWrapper.style.transform = isLargeScreen ? 'translateX(0)' : 'translateX(-100%)';
        toggleButton.style.display = isLargeScreen ? 'none' : 'block';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        // Reattach toggle event
        toggleButton.removeEventListener('click', window._toggleSidebarHandler);
        if (!isLargeScreen) {
          toggleButton.addEventListener('click', window._toggleSidebarHandler);
        }
        console.log('[sidebar.js] Resize handled, sidebar:', isLargeScreen ? 'open' : 'closed');
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
  }

  // Initial run
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initSidebar();
  } else {
    document.addEventListener('DOMContentLoaded', initSidebar);
  }

  // Robust CSR handling
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length) {
        if (document.getElementById('sidebar-wrapper') && document.getElementById('toggle-button')) {
          console.log('[sidebar.js] DOM change detected, reinitializing');
          initSidebar();
          break;
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  // Expose for manual triggering
  window.initSidebar = initSidebar;
})();
