(function () {
  var root = document.documentElement;
  root.classList.add('js');

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
  function onScroll() {
    nav.classList.toggle('is-scrolled', window.scrollY > 8);
    // Nothing is highlighted while the visitor is still on the hero.
    if (firstSection && window.scrollY < firstSection.offsetTop - window.innerHeight / 2) {
      document.querySelectorAll('.nav__links a.is-active').forEach(function (a) { a.classList.remove('is-active'); });
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

  // Highlight the nav link for the section in view
  var links = document.querySelectorAll('.nav__links a');
  var sections = Array.prototype.map.call(links, function (a) { return document.querySelector(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });
  }

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
    goTo(a.getAttribute('href').slice(1), true);
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
