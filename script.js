(function () {
  var root = document.documentElement;
  root.classList.add('js');

  // Liquid glass can bend the content behind it only in Chromium browsers
  // (backdrop-filter with an SVG filter). Elsewhere it stays clear glass.
  var brands = (navigator.userAgentData && navigator.userAgentData.brands) || [];
  var reduceTransparency = window.matchMedia('(prefers-reduced-transparency: reduce)').matches;
  if (!reduceTransparency && brands.some(function (b) { return /Chromium/.test(b.brand); })) {
    root.classList.add('lg-refract');
  }

  // Theme toggle: remembers the choice, otherwise follows the system setting.
  var themeBtn = document.getElementById('theme-toggle');
  function isDark() {
    var t = root.getAttribute('data-theme');
    if (t) return t === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  // Mobile menu
  var menuBtn = document.getElementById('menu-toggle');
  var menu = document.getElementById('mobile-menu');
  function setMenu(open) {
    menu.hidden = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  menuBtn.addEventListener('click', function () { setMenu(menu.hidden); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  // Nav border once the page scrolls
  var nav = document.querySelector('.nav');
  var firstSection = document.getElementById('about');
  var navLock = 0;
  var toTop = document.querySelector('.to-top');
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
    if (toTop) toTop.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.8);
    // Nothing is highlighted while the visitor is still on the hero.
    if (firstSection && window.scrollY < firstSection.offsetTop - window.innerHeight / 2) {
      if (Date.now() > navLock) setActive(null);
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Reveal sections as they come into view
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  // iOS 26 style tab bar: one glass pill slides between the tabs, stretching
  // like liquid on the way and settling with a small bounce; a tap sends a
  // ripple of light through the glass from the exact point you pressed.
  var navList = document.querySelector('.nav__links');
  var links = document.querySelectorAll('.nav__links a');
  var indicator = null, activeLink = null, pill = null;
  if (navList) {
    indicator = document.createElement('span');
    indicator.className = 'nav__indicator';
    indicator.setAttribute('aria-hidden', 'true');
    navList.insertBefore(indicator, navList.firstChild);
    navList.classList.add('has-indicator');
  }

  function placePill(link, animate) {
    if (!indicator) return;
    if (!link || !link.offsetWidth) { indicator.classList.remove('is-shown'); return; }
    var x1 = link.offsetLeft, w1 = link.offsetWidth;
    var still = !pill || !indicator.classList.contains('is-shown') || !animate ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches || !indicator.animate;
    if (!still) {
      var x0 = pill.x, w0 = pill.w;
      var left = Math.min(x0, x1), right = Math.max(x0 + w0, x1 + w1);
      indicator.animate([
        { transform: 'translateX(' + x0 + 'px) scaleY(1)', width: w0 + 'px' },
        { transform: 'translateX(' + left + 'px) scaleY(0.84)', width: (right - left) + 'px', offset: 0.45 },
        { transform: 'translateX(' + x1 + 'px) scaleY(1.07)', width: w1 + 'px', offset: 0.78 },
        { transform: 'translateX(' + x1 + 'px) scaleY(1)', width: w1 + 'px' }
      ], { duration: 560, easing: 'cubic-bezier(0.3, 0.7, 0.25, 1)' });
    }
    indicator.style.transform = 'translateX(' + x1 + 'px)';
    indicator.style.width = w1 + 'px';
    indicator.classList.add('is-shown');
    pill = { x: x1, w: w1 };
  }

  function setActive(id) {
    if (!links) return;
    var next = null;
    links.forEach(function (a) {
      var on = !!id && a.getAttribute('href') === '#' + id;
      a.classList.toggle('is-active', on);
      if (on) next = a;
    });
    if (next === activeLink) return;
    activeLink = next;
    placePill(next, true);
  }

  // Highlight the tab for the section in view
  var sections = Array.prototype.map.call(links, function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      if (Date.now() < navLock) return; // a tapped tab owns the pill until its scroll ends
      entries.forEach(function (entry) {
        if (entry.isIntersecting) setActive(entry.target.id);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });
  }
  window.addEventListener('scrollend', function () { navLock = 0; });
  window.addEventListener('resize', function () { placePill(activeLink, false); });
  window.addEventListener('load', function () { placePill(activeLink, false); });

  function ripple(e, host) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var r = host.getBoundingClientRect();
    var wave = document.createElement('span');
    wave.className = 'lg-ripple';
    wave.style.left = (e.clientX - r.left) + 'px';
    wave.style.top = (e.clientY - r.top) + 'px';
    host.appendChild(wave);
    wave.addEventListener('animationend', function () { wave.remove(); });
  }
  document.addEventListener('pointerdown', function (e) {
    var tab = e.target.closest && e.target.closest('.nav__links a, .mobile-menu a');
    if (!tab) return;
    var host = tab.closest('.nav__inner, .mobile-menu');
    if (host) ripple(e, host);
    if (indicator && navList.contains(tab)) indicator.classList.add('is-pressed');
  });
  ['pointerup', 'pointercancel', 'dragstart'].forEach(function (type) {
    document.addEventListener(type, function () { if (indicator) indicator.classList.remove('is-pressed'); });
  });

  // In-page links scroll smoothly and keep the address bar clean (no #section).
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function goTo(id, smooth) {
    var behavior = smooth && !reduceMotion ? 'smooth' : 'auto';
    if (!id || id === 'top') { window.scrollTo({ top: 0, behavior: behavior }); return; }
    var target = document.getElementById(id);
    if (!target) return;
    target.scrollIntoView({ behavior: behavior, block: 'start' });
    // Move keyboard and screen reader focus to the section too.
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    var targetId = a.getAttribute('href').slice(1);
    // Move the pill straight to the tapped tab, like iOS, instead of hopping
    // through every section the page scrolls past on the way.
    if (sections.some(function (s) { return s && s.id === targetId; })) {
      navLock = Date.now() + 1500;
      setActive(targetId);
    } else if (targetId === 'top') {
      navLock = Date.now() + 1500;
      setActive(null);
    }
    goTo(targetId, true);
  });
  // Arriving from an old #link or /index.html: jump to the section, then tidy the address.
  function cleanAddress() {
    if (location.hash || location.search || /\/index\.html$/.test(location.pathname)) {
      history.replaceState(null, '', location.pathname.replace(/index\.html$/, ''));
    }
  }
  var startId = decodeURIComponent(location.hash.slice(1));
  if (startId) {
    goTo(startId, false);
    // Fonts and images can shift the layout after the first jump; settle once they've loaded.
    var userScrolled = false;
    window.addEventListener('wheel', function () { userScrolled = true; }, { once: true, passive: true });
    window.addEventListener('touchmove', function () { userScrolled = true; }, { once: true, passive: true });
    window.addEventListener('load', function () { if (!userScrolled) goTo(startId, false); });
  }
  cleanAddress();
  window.addEventListener('hashchange', function () {
    var id = decodeURIComponent(location.hash.slice(1));
    if (id) goTo(id, true);
    cleanAddress();
  });

  // Duplicate the logo strip once so the marquee loops without a gap.
  var techList = document.querySelector('.tech__list');
  if (techList) {
    Array.prototype.slice.call(techList.children).forEach(function (li) {
      var copy = li.cloneNode(true);
      copy.setAttribute('aria-hidden', 'true');
      techList.appendChild(copy);
    });
  }

  // Keep the current role's length up to date (counted like LinkedIn: start month included).
  document.querySelectorAll('.job__duration[data-start]').forEach(function (el) {
    var parts = el.getAttribute('data-start').split('-');
    var now = new Date();
    var months = (now.getFullYear() - Number(parts[0])) * 12 + (now.getMonth() + 1 - Number(parts[1])) + 1;
    if (months < 1) return;
    var y = Math.floor(months / 12), m = months % 12, out = [];
    if (y) out.push(y + (y === 1 ? ' year' : ' years'));
    if (m) out.push(m + (m === 1 ? ' month' : ' months'));
    el.textContent = out.join(' ');
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
