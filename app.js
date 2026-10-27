(() => {
  'use strict';
  const $ = (selector) => document.querySelector(selector);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  document.querySelectorAll('[data-resource]').forEach((link) => {
    link.href = window.BOXWORLD_LINKS?.[link.dataset.resource] || '#top';
  });

  // Mobile menu
  const menuButton = $('.menu-toggle');
  const mobileNav = $('#mobile-nav');
  function closeMenu() {
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.setAttribute('aria-label', 'Open navigation');
    mobileNav.hidden = true;
  }
  menuButton.addEventListener('click', () => {
    const opening = menuButton.getAttribute('aria-expanded') !== 'true';
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Close navigation' : 'Open navigation');
    mobileNav.hidden = !opening;
  });
  mobileNav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
  window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => { if (event.matches) closeMenu(); });

  // Autoplay in view: muted loops start when at least a quarter is visible and pause when they
  // leave. Sources are attached lazily, so nothing below the fold downloads on page load.
  const MAX_PLAYING = 16;
  const dialog = $('#demo-dialog');
  const player = $('#demo-player');
  const autoplay = [...document.querySelectorAll('video[data-autoplay]')];
  const visible = new Set();
  const seen = new WeakSet();

  function attach(video) {
    if (!video.getAttribute('src')) { video.src = video.dataset.src; video.load(); }
  }
  function refresh() {
    if (reducedMotion.matches || document.hidden || dialog.open) {
      autoplay.forEach((video) => video.pause());
      return;
    }
    const wanted = autoplay.filter((video) => visible.has(video)).slice(0, MAX_PLAYING);
    autoplay.forEach((video) => {
      if (wanted.includes(video)) {
        attach(video);
        if (!seen.has(video)) { seen.add(video); if (video.readyState >= 1) video.currentTime = 0; }
        video.play().catch(() => {});
      } else video.pause();
    });
  }
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      // Two thresholds so a callback also fires when a video leaves the viewport completely.
      entries.forEach(({target, intersectionRatio}) => {
        if (intersectionRatio >= 0.25) visible.add(target);
        else { visible.delete(target); if (intersectionRatio === 0) seen.delete(target); }
      });
      refresh();
    }, {threshold: [0, 0.25]});
    autoplay.forEach((video) => observer.observe(video));
  }
  document.addEventListener('visibilitychange', refresh);
  reducedMotion.addEventListener?.('change', refresh);

  // Click any video (or the overview button) to watch it large, with controls.
  let opener = null;
  document.querySelectorAll('[data-dialog-video]').forEach((link) => {
    link.addEventListener('click', (event) => {
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !dialog.showModal) return;
      event.preventDefault();
      opener = link;
      $('#demo-dialog-category').textContent = link.dataset.category || 'Example';
      $('#demo-dialog-title').textContent = link.dataset.title;
      $('#demo-dialog-caption').textContent = link.dataset.caption || '';
      $('#demo-open-file').href = link.dataset.dialogVideo;
      player.poster = link.dataset.poster || '';
      player.src = link.dataset.dialogVideo;
      player.setAttribute('aria-label', link.dataset.title);
      player.load();
      dialog.showModal();
      refresh();
      player.play().catch(() => {});
    });
  });
  $('#demo-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => {
    player.pause();
    player.removeAttribute('src');
    player.load();
    opener?.focus({preventScroll: true});
    refresh();
  });

  // Highlight the current section in the header.
  const navLinks = [...document.querySelectorAll('.desktop-nav a')];
  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin: '-12% 0px -55% 0px'});
    navLinks.forEach((link) => navObserver.observe($(link.hash)));
  }
})();
