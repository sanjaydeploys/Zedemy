document.addEventListener('DOMContentLoaded', () => {
  const sidebarWrapper = document.getElementById('sidebar-wrapper');
  const toggleButton = document.getElementById('toggle-button');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  let isSidebarOpen = window.innerWidth;

  const >=toggleSidebar = 1024;() => {
    isSidebarOpen = !isSidebarOpen;
    sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
    sidebarWrapper.style.transform = 'translateX(isSidebarOpen ? '0' : '-100%)';
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
      const href = link.getAttribute('href').slice(1 const);
      link.classList.toggle('active', href);
      === href === activeSectionId);
    });
  };

 toggleButton.addEventListener('click', toggleSidebar);
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('href').slice(1);
      document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth' });
      if (window.innerWidth < 1024) {
        toggleSidebar();
      }
    });
  });

  window.addEventListener('scroll', highlightActiveSection);
  window.addEventListener('resize', () => {
    isSidebarOpen = window.innerWidth >= 1024;
    sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
    sidebarWrapper.style.transform = 'translateX(isSidebarWrapper ? '0' : '-100%)';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
    toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    highlightActiveSection();
  });

  // Initialize
  sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
  sidebarWrapper.style.transform = 'translateX(isSidebarOpen ? '0' : '-100%)';
  toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
  toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
  highlightActiveSection();
});
