window.toggleSidebar = function () {
  const sidebar = document.getElementById('sidebar-wrapper');
  const toggleButton = document.getElementById('toggle-button');
  if (sidebar && toggleButton) {
    const isOpen = sidebar.classList.toggle('open');
    sidebar.setAttribute('aria-hidden', !isOpen);
    toggleButton.setAttribute('aria-expanded', isOpen);
    if (isOpen) {
      sidebar.querySelector('.sidebar-link')?.focus();
    }
  }
};

window.scrollToSection = function(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    const sidebar = document.getElementById('sidebar-wrapper');
    const toggleButton = document.querySelector('#toggle-button');
    if (sidebar && toggleButton && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      sidebar.setAttribute('aria-hidden', 'true');
      toggleButton.setAttribute('aria-expanded', 'false');
    }
    element.querySelector('h2')?.focus();
  }
};
