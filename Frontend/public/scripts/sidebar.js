document.addEventListener('DOMContentLoaded', () => {
  const sidebarWrapper = document.getElementById('sidebar-wrapper');
  const toggleButton = document.getElementById('toggle-button');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  if (!sidebarWrapper || !toggleButton) {
    console.warn('[sidebar.js] Missing sidebar elements');
    return;
  }

  let isSidebarOpen = window.innerWidth >= 1024;

  const toggleSidebar = () => {
    isSidebarOpen = !isSidebarOpen;
    sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
    sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
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
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('active', href === activeSectionId);
    });
  };

  // Remove existing listeners to prevent duplicates in SPA
  const existingToggle = toggleButton.__toggleListener;
  if (existingToggle) toggleButton.removeEventListener('click', existingToggle);
  toggleButton.__toggleListener = toggleSidebar;
  toggleButton.addEventListener('click', toggleSidebar);

  // Reattach link listeners
  sidebarLinks.forEach(link => {
    const handler = (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('href').slice(1);
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        if (window.innerWidth < 1024) {
          toggleSidebar();
        }
      }
    };
    const existingHandler = link.__clickListener;
    if (existingHandler) link.removeEventListener('click', existingHandler);
    link.__clickListener = handler;
    link.addEventListener('click', handler);
  });

  // Scroll and resize listeners
  window.addEventListener('scroll', highlightActiveSection, { passive: true });
  window.addEventListener('resize', () => {
    const shouldBeOpen = window.innerWidth >= 1024;
    if (isSidebarOpen !== shouldBeOpen) {
      isSidebarOpen = shouldBeOpen;
      sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
      sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
      toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
      toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    }
    highlightActiveSection();
  });

  // Initialize
  sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
  sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
  toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
  toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
  highlightActiveSection();

  // Expose toggleSidebar for PostPage.jsx
  window.toggleSidebar = toggleSidebar;
});
