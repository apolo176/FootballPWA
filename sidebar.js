
    // Script para marcar el link activo según la página
    const links = document.querySelectorAll('#sidebar .nav-link');
    const current = location.pathname.split('/').pop();
    links.forEach(link => {
      if (link.getAttribute('href') === current) {
        link.classList.add('active');
      }
    });
