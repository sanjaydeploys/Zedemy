(function () {
  // Ensure code runs after DOM is fully loaded
  document.addEventListener('DOMContentLoaded', initializeSidebar);

  function initializeSidebar() {
    const sidebarWrapper = document.getElementById('sidebar-wrapper');
    const toggleButton = document.getElementById('toggle-button');
    const sidebarLinks = document.querySelectorAll('.sidebar-link');

    if (!sidebarWrapper || !toggleButton) {
      console.warn('[Sidebar] Missing sidebar wrapper or toggle button');
      return;
    }

    // Set initial state based on screen size
    const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
    if (isDesktop) {
      sidebarWrapper.classList.add('open');
      toggleButton.style.display = 'none';
    } else {
      sidebarWrapper.classList.remove('open');
      toggleButton.style.display = 'flex';
    }

    // Toggle sidebar on button click
    toggleButton.addEventListener('click', () => {
      sidebarWrapper.classList.toggle('open');
      toggleButton.setAttribute(
        'aria-label',
        sidebarWrapper.classList.contains('open')
          ? 'Close sidebar navigation'
          : 'Open sidebar navigation'
      );
      toggleButton.textContent = sidebarWrapper.classList.contains('open') ? 'Close' : 'Menu';
    });

    // Handle sidebar link clicks for smooth scrolling
    sidebarLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const sectionId = link.getAttribute('href').substring(1);
        const targetSection = document.getElementById(sectionId);

        if (targetSection) {
          targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Update active state
          sidebarLinks.forEach(l => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');

          // Close sidebar on mobile after clicking a link
          if (!isDesktop) {
            sidebarWrapper.classList.remove('open');
            toggleButton.textContent = 'Menu';
            toggleButton.setAttribute('aria-label', 'Open sidebar navigation');
          }
        }
      });
    });

    // Update active link based on scroll position
    const sections = Array.from(sidebarLinks).map(link => {
      const href = link.getAttribute('href');
      return href ? document.querySelector(href) : null;
    }).filter(Boolean);

    const observerOptions = {
      root: null,
      threshold: 0.5,
      rootMargin: '-20% 0px -20% 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.id;
          sidebarLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === `#${sectionId}`) {
              link.setAttribute('aria-current', 'true');
            } else {
              link.removeAttribute('aria-current');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));

    // Handle window resize to adjust sidebar visibility
    window.addEventListener('resize', () => {
      const isNowDesktop = window.matchMedia('(min-width: 1024px)').matches;
      if (isNowDesktop) {
        sidebarWrapper.classList.add('open');
        toggleButton.style.display = 'none';
      } else {
        sidebarWrapper.classList.remove('open');
        toggleButton.style.display = 'flex';
        toggleButton.textContent = 'Menu';
        toggleButton.setAttribute('aria-label', 'Open sidebar navigation');
      }
    });

    // Prevent duplicate initialization in CSR
    if (window.__SIDEBAR_INITIALIZED__) {
      console.warn('[Sidebar] Already initialized');
      return;
    }
    window.__SIDEBAR_INITIALIZED__ = true;
  }

  // Global scrollToSection function for inline onclick handlers
  window.scrollToSection = function (sectionId) {
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
      targetSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const link = document.querySelector(`.sidebar-link[href="#${sectionId}"]`);
      if (link) {
        document.querySelectorAll('.sidebar-link').forEach(l => l.removeAttribute('aria-current'));
        link.setAttribute('aria-current', 'true');
      }
    }
  };
})();
