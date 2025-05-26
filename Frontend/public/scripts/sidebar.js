(function() {
  function initSidebar() {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!sidebarWrapper || !toggleButton) {
      console.warn('[sidebar.js] Missing sidebar-wrapper or toggle-button');
      return;
    }

    if (sidebarWrapper.dataset.sidebarInitialized) {
      console.log('[sidebar.js] Sidebar already initialized');
      return;
    }
    sidebarWrapper.dataset.sidebarInitialized = 'true';
    console.log('[sidebar.js] Sidebar initialized');

    let isSidebarOpen = window.innerWidth >= 1024;

    const toggleSidebar = () => {
      console.log('[sidebar.js] Toggle sidebar called, width:', window.innerWidth);
      if (window.innerWidth < 1024) {
        isSidebarOpen = !isSidebarOpen;
        sidebarWrapper.classList.toggle('open', isSidebarOpen);
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        console.log('[sidebar.js] Sidebar open:', isSidebarOpen);
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

    // Attach toggle
    console.log('[sidebar.js] Attaching toggle listener');
    toggleButton.addEventListener('click', toggleSidebar);

    // Attach link events
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = e.currentTarget.getAttribute('href')?.slice(1) || '';
        const section = document.getElementById(sectionId);
        if (section) {
          section.scrollIntoView({ behavior: 'smooth' });
          if (window.innerWidth < 1024 && isSidebarOpen) {
            toggleSidebar();
          }
        }
      });
    });

    // Attach scroll
    window.addEventListener('scroll', highlightActiveSection);

    // Handle resize
    let lastWidth = window.innerWidth;
    window.addEventListener('resize', () => {
      const currentWidth = window.innerWidth;
      if ((lastWidth < 1024 && currentWidth >= 1024) || (lastWidth >= 1024 && currentWidth < 1024)) {
        isSidebarOpen = currentWidth >= 1024;
        sidebarWrapper.classList.toggle('open', isSidebarOpen);
        toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
        toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
        highlightActiveSection();
        console.log('[sidebar.js] Resize, sidebar open:', isSidebarOpen);
      }
      lastWidth = currentWidth;
    });

    // Initialize
    sidebarWrapper.classList.toggle('open', isSidebarOpen);
    toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
    highlightActiveSection();
  }

  // Ensure DOM is ready
  const tryInit = () => {
    if (document.getElementById('toggle-button') && document.getElementById('sidebar-wrapper')) {
      initSidebar();
    } else {
      console.log('[sidebar.js] Elements not found, retrying...');
      setTimeout(tryInit, 100);
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    tryInit();
  } else {
    document.addEventListener('DOMContentLoaded', tryInit);
  }

  // Fallback: Observe DOM for toggle-button
  const observer = new MutationObserver(() => {
    if (document.getElementById('toggle-button') && !document.getElementById('sidebar-wrapper').dataset.sidebarInitialized) {
      console.log('[sidebar.js] Toggle button detected via observer');
      initSidebar();
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
})();
