window.toggleSidebar = function () {
  const sidebar = document.getElementById('sidebar-wrapper');
  if (sidebar) {
    sidebar.classList.toggle('open');
  }
};

window.scrollToSection = function (sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    const sidebar = document.getElementById('sidebar-wrapper');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
    }
  }
};
