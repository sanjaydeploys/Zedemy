document.addEventListener('DOMContentLoaded', () => {
  const sidebarWrapper = document.getElementById('sidebar-wrapper');
  const toggleButton = document.getElementById('toggle-button');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  // Exit if critical elements are missing
  if (!sidebarWrapper || !toggleButton) {
    console.warn('[sidebar.js] Missing sidebar-wrapper or toggle-button');
    return;
  }

  // Initialize sidebar state based on screen width
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
      const href = link.getAttribute('href')?.slice(1) || '';
      link.classList.toggle('active', href === activeSectionId);
    });
  };

  // Attach toggle event
  toggleButton.addEventListener('click', toggleSidebar);

  // Attach link click events
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('href')?.slice(1) || '';
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        if (window.innerWidth < 1024) {
          toggleSidebar();
        }
      }
    });
  });

  // Handle scroll and resize
  window.addEventListener('scroll', highlightActiveSection);
  window.addEventListener('resize', () => {
    const newIsOpen = window.innerWidth >= 1024;
    if (newIsOpen !== isSidebarOpen) {
      isSidebarOpen = newIsOpen;
      sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
      sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
      toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
      toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    }
    highlightActiveSection();
  });

  // Initialize state
  sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
  sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
  toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
  toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
  highlightActiveSection();

  // Expose toggleSidebar for PostPage.jsx
  window.toggleSidebar = toggleSidebar;
});
