/* ============================================================
   Portfolio behaviour: expandable projects, theme, equations.
   Everything degrades gracefully — without JS the panels are
   simply open (see .js rules in style.css).
   ============================================================ */

(function () {
  'use strict';

  /* ---------- expandable projects ---------- */

  var projects = Array.prototype.slice.call(document.querySelectorAll('.project'));

  projects.forEach(function (project) {
    var button = project.querySelector('.project-head');
    var panel  = project.querySelector('.panel');
    if (!button || !panel) return;

    panel.inert = true;                       // keep collapsed links out of the tab order

    button.addEventListener('click', function () {
      setOpen(project, !project.classList.contains('open'));
    });
  });

  function setOpen(project, open) {
    var button = project.querySelector('.project-head');
    var panel  = project.querySelector('.panel');

    project.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
    panel.inert = !open;

    // Keep the URL shareable: /#p-forecasting opens that project directly.
    if (open && project.id) {
      history.replaceState(null, '', '#' + project.id);
    } else if (!open && location.hash === '#' + project.id) {
      history.replaceState(null, '', location.pathname + location.search);
    }
  }

  /* ---------- category carousel ---------- */

  // Replaced below when the carousel is present; lets the hash handler
  // bring a project's category into view before opening it.
  var showCategoryOf = function () {};

  var carousel = document.querySelector('.cats');
  if (carousel) {
    var track  = carousel.querySelector('.cat-track');
    var tabs   = Array.prototype.slice.call(carousel.querySelectorAll('.cat-tab'));
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.cat-slide'));
    var prev   = carousel.querySelector('.cat-prev');
    var next   = carousel.querySelector('.cat-next');
    var active = 0;
    var settle;

    var syncHeight = function () {
      track.style.height = slides[active].offsetHeight + 'px';
    };

    var setActive = function (i) {
      active = i;
      tabs.forEach(function (tab, k) {
        tab.setAttribute('aria-selected', String(k === i));
        tab.tabIndex = k === i ? 0 : -1;
      });
      slides.forEach(function (slide, k) { slide.inert = k !== i; });
      prev.disabled = i === 0;
      next.disabled = i === slides.length - 1;
      syncHeight();
    };

    var go = function (i, smooth) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      setActive(i);
      track.scrollTo({ left: slides[i].offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
    };

    tabs.forEach(function (tab, k) {
      tab.addEventListener('click', function () { go(k, true); });
      tab.addEventListener('keydown', function (e) {
        var to = { ArrowLeft: k - 1, ArrowRight: k + 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        to = (to + tabs.length) % tabs.length;
        go(to, true);
        tabs[to].focus();
      });
    });
    prev.addEventListener('click', function () { go(active - 1, true); });
    next.addEventListener('click', function () { go(active + 1, true); });

    // Swipes and trackpad scrolls: pick up the new category once the track settles.
    track.addEventListener('scroll', function () {
      clearTimeout(settle);
      settle = setTimeout(function () {
        var i = Math.round(track.scrollLeft / track.clientWidth);
        if (i !== active && slides[i]) setActive(i);
      }, 90);
    }, { passive: true });

    // Follow the visible category as its projects open and close.
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(syncHeight);
      slides.forEach(function (slide) { ro.observe(slide); });
    }
    window.addEventListener('resize', function () { track.scrollLeft = slides[active].offsetLeft; });

    showCategoryOf = function (el) {
      var i = slides.indexOf(el.closest('.cat-slide'));
      if (i !== -1 && i !== active) go(i, false);
    };

    setActive(0);
  }

  function openFromHash() {
    var id = location.hash.slice(1);
    if (!id) return;
    var target = document.getElementById(id);
    if (target && target.classList.contains('project') && !target.classList.contains('open')) {
      showCategoryOf(target);
      setOpen(target, true);
      target.scrollIntoView({ block: 'start' });
    }
  }

  window.addEventListener('hashchange', openFromHash);

  /* ---------- theme ---------- */

  var toggle = document.getElementById('theme-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var root = document.documentElement;
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var current = root.getAttribute('data-theme') || (systemDark ? 'dark' : 'light');
      var next = current === 'dark' ? 'light' : 'dark';

      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* ---------- misc ---------- */

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('scrolled', window.scrollY > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Highlight the section currently in view in the nav.
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a'));
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if ('IntersectionObserver' in window && sections.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    sections.forEach(function (s) { observer.observe(s); });
  }

  /* ---------- LaTeX ---------- */

  function renderMath() {
    if (typeof renderMathInElement !== 'function') return;
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '\\[', right: '\\]', display: true },
        { left: '\\(', right: '\\)', display: false }
      ],
      throwOnError: false
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { renderMath(); openFromHash(); });
  } else {
    renderMath();
    openFromHash();
  }
})();
