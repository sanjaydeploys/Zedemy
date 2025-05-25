document.addEventListener('DOMContentLoaded', initializeSidebar);

function initializeSidebar() {
  const sidebarWrapper = document.getElementById('sidebar-wrapper');
  const toggleButton = document.getElementById('toggle-button');
  const sidebarLinks = document.querySelectorAll('.sidebar-link');

  if (!sidebarWrapper || !toggleButton) {
    console.warn('[sidebar.js] Sidebar elements not found');
    observeSidebarChanges();
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

  toggleButton.addEventListener('click', toggleSidebar);
  sidebarLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const sectionId = link.getAttribute('href').slice(1);
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
        if (window.innerWidth < 1024) {
          toggleSidebar();
        }
      }
    });
  });

  window.addEventListener('scroll', highlightActiveSection);
  window.addEventListener('resize', () => {
    isSidebarOpen = window.innerWidth >= 1024;
    sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
    sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
    toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
    toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
    highlightActiveSection();
  });

  // Initialize
  sidebarWrapper.dataset.state = isSidebarOpen ? 'open' : 'closed';
  sidebarWrapper.style.transform = isSidebarOpen ? 'translateX(0)' : 'translateX(-100%)';
  toggleButton.setAttribute('aria-label', isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar');
  toggleButton.textContent = isSidebarOpen ? '✕' : '☰';
  highlightActiveSection();
}

function observeSidebarChanges() {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(() => {
      const sidebarWrapper = document.getElementById('sidebar-wrapper');
      const toggleButton = document.getElementById('toggle-button');
      if (sidebarWrapper && toggleButton) {
        observer.disconnect();
        initializeSidebar();
      }
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}
