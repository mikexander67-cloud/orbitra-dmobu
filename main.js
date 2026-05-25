/* =========================================================================
   ORBITRA — main.js (v2.5)
   Vanilla JS only. Hamburger menu, smooth scroll, scroll reveal,
   sticky section-strip scrollspy. No counters (spec forbids stats blocks).
   ========================================================================= */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    setupRevealObserver();
    setupHamburger();
    setupSmoothScroll();
    setupSectionStripSpy();
  }

  /* ----- 1. Reveal on scroll ----------------------------------------- */
  function setupRevealObserver() {
    var targets = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!('IntersectionObserver' in window) || !targets.length) {
      targets.forEach(function (el) { el.classList.add('in-view'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ----- 2. Hamburger menu ------------------------------------------- */
  function setupHamburger() {
    var toggle = document.querySelector('.nav-toggle');
    var menu = document.querySelector('.nav-menu');
    if (!toggle || !menu) return;

    function open() {
      menu.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
      toggle.setAttribute('aria-label', 'Close navigation');
      document.body.classList.add('menu-open');
    }
    function close() {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
      document.body.classList.remove('menu-open');
    }
    function toggleMenu() {
      if (menu.classList.contains('open')) close(); else open();
    }

    toggle.addEventListener('click', toggleMenu);
    toggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMenu(); }
    });

    // Close on link tap (any anchor inside the menu)
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { close(); });
    });

    // Close on outside click (touch + mouse)
    document.addEventListener('click', function (e) {
      if (!menu.classList.contains('open')) return;
      if (menu.contains(e.target) || toggle.contains(e.target)) return;
      close();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) close();
    });

    // Close if resized into desktop layout
    var mq = window.matchMedia('(min-width: 1024px)');
    mq.addEventListener ? mq.addEventListener('change', function (e) {
      if (e.matches) close();
    }) : mq.addListener(function (e) { if (e.matches) close(); });
  }

  /* ----- 3. Smooth-scroll for in-page anchors ------------------------ */
  function setupSmoothScroll() {
    var headerH = function () {
      return parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
    };
    var stripH = function () {
      var strip = document.querySelector('.section-strip');
      if (!strip || window.innerWidth < 768) return 0;
      return strip.offsetHeight || 44;
    };

    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var href = a.getAttribute('href');
        if (!href || href === '#' || href.length < 2) return;
        var target = document.querySelector(href);
        if (!target) return;
        e.preventDefault();
        var rect = target.getBoundingClientRect();
        var top = window.pageYOffset + rect.top - headerH() - stripH() - 8;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      });
    });
  }

  /* ----- 4. Section-strip scrollspy ---------------------------------- */
  function setupSectionStripSpy() {
    var strip = document.querySelector('.section-strip');
    if (!strip) return;
    var stripLinks = Array.prototype.slice.call(strip.querySelectorAll('a[href^="#"]'));
    if (!stripLinks.length) return;

    var sectionMap = {};
    stripLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      var section = document.getElementById(id);
      if (section) sectionMap[id] = { link: link, section: section };
    });

    function setActive(id) {
      stripLinks.forEach(function (l) {
        var lid = l.getAttribute('href').slice(1);
        if (lid === id) l.classList.add('is-active');
        else l.classList.remove('is-active');
      });
    }

    if (!('IntersectionObserver' in window)) {
      // Fallback: highlight on click only
      stripLinks.forEach(function (l) {
        l.addEventListener('click', function () { setActive(l.getAttribute('href').slice(1)); });
      });
      return;
    }

    var headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
    var stripH = strip.offsetHeight || 44;
    var topOffset = headerH + stripH;

    // Track which sections are currently "active" by ratio of viewport coverage.
    var entriesMap = {};

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        entriesMap[entry.target.id] = entry;
      });
      // Pick the section whose top is closest to (but above) the top-offset line and is visible
      var best = null;
      Object.keys(sectionMap).forEach(function (id) {
        var e = entriesMap[id];
        if (!e || !e.isIntersecting) return;
        var rect = e.boundingClientRect;
        // Prefer the section whose top is just below the strip line
        var distance = Math.abs(rect.top - topOffset);
        if (!best || distance < best.distance) {
          best = { id: id, distance: distance };
        }
      });
      if (best) setActive(best.id);
    }, {
      // Trigger when ~30% of section is visible below the sticky strip
      rootMargin: '-' + (topOffset + 4) + 'px 0px -40% 0px',
      threshold: [0, 0.15, 0.35, 0.6]
    });

    Object.keys(sectionMap).forEach(function (id) {
      io.observe(sectionMap[id].section);
    });

    // Also recalc offset on resize (header height can change)
    window.addEventListener('resize', function () {
      headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 76;
      stripH = strip.offsetHeight || 44;
      topOffset = headerH + stripH;
    });
  }
})();
