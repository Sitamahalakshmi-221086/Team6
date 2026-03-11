
    // Navbar shadow & blur on scroll
    const nav = document.querySelector('nav');
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        nav.style.background = 'rgba(255,255,255,0.85)';
        nav.style.boxShadow = '0 10px 30px rgba(0,0,0,0.08)';
        nav.style.backdropFilter = 'blur(16px)';
      } else {
        nav.style.background = 'rgba(255,255,255,0.97)';
        nav.style.boxShadow = 'none';
        nav.style.backdropFilter = 'blur(12px)';
      }
    });

    // Reveal Animations on Scroll
    const revealOptions = { threshold: 0.15, rootMargin: "0px 0px -50px 0px" };
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.style.animationPlayState = 'running';
          entry.target.style.opacity = '1';
          observer.unobserve(entry.target);
        }
      });
    }, revealOptions);

    document.querySelectorAll('.how-card, .feature-card, .role-card, .section-head, .pipeline').forEach((el, i) => {
      el.style.opacity = '0';
      el.style.willChange = 'transform, opacity';
      const delay = (i % 3) * 0.1;
      el.style.animation = `fadeUp 0.6s ${delay}s cubic-bezier(0.16, 1, 0.3, 1) forwards`;
      el.style.animationPlayState = 'paused';
      revealObserver.observe(el);
    });

    // Animated count-up on scroll into view
    function animateCount(el, target, suffix, duration, decimal) {
      let start = null;
      const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const val = decimal
          ? (eased * target).toFixed(1)
          : Math.floor(eased * target).toLocaleString();
        el.textContent = val + suffix;
        if (progress < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }

    const statsSection = document.querySelector('.stats-section');
    let counted = false;
    const statObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !counted) {
        counted = true;
        animateCount(document.getElementById('stat1'), 3200, '+', 2000, false);
        animateCount(document.getElementById('stat2'), 120, '+', 2000, false);
        animateCount(document.getElementById('stat3'), 94, '%', 2000, false);
        animateCount(document.getElementById('stat4'), 4.9, '★', 2000, true);
      }
    }, { threshold: 0.3 });
    if (statsSection) statObserver.observe(statsSection);