/* SMC Commercial Properties — client script.
   Everything here is progressive enhancement: pages are fully readable without JS. */
(function () {
  'use strict';
  var doc = document, root = doc.documentElement;

  /* ---------- Mobile nav ---------- */
  var toggle = doc.querySelector('.nav-toggle');
  if (toggle) {
    toggle.addEventListener('click', function () {
      var open = root.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && root.classList.contains('nav-open')) {
        root.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
        toggle.focus();
      }
    });
    doc.querySelectorAll('.site-nav a').forEach(function (a) {
      a.addEventListener('click', function () {
        root.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Preview badge (preview hosts only) ---------- */
  var badge = doc.querySelector('.preview-badge');
  if (badge) {
    var hideBtn = badge.querySelector('button');
    if (hideBtn) hideBtn.addEventListener('click', function () { badge.hidden = true; });
  }

  /* ---------- Home hero carousel ---------- */
  var hero = doc.querySelector('[data-carousel]');
  if (hero) {
    var slides = hero.querySelectorAll('.hero-slide');
    var tabs = hero.querySelectorAll('.hero-tab');
    var view = hero.querySelector('.hero-view');
    var pauseBtn = hero.querySelector('.hero-pause');
    var ms = parseInt(hero.getAttribute('data-interval'), 10) || 7000;
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cur = 0, timer = null, paused = reduce, hover = false;
    hero.style.setProperty('--slide-ms', ms + 'ms');

    function show(i) {
      cur = (i + slides.length) % slides.length;
      slides.forEach(function (s, k) {
        s.classList.toggle('is-active', k === cur);
        s.setAttribute('aria-hidden', k === cur ? 'false' : 'true');
      });
      tabs.forEach(function (t, k) {
        t.classList.toggle('is-active', k === cur);
        t.setAttribute('aria-selected', k === cur ? 'true' : 'false');
        // restart progress animation
        var p = t.querySelector('.ht-progress');
        if (p) { p.style.display = 'none'; void p.offsetWidth; p.style.display = ''; }
      });
      if (view && tabs[cur]) {
        view.href = tabs[cur].getAttribute('data-href');
        view.textContent = 'View ' + tabs[cur].getAttribute('data-name');
      }
      schedule();
    }
    function schedule() {
      clearTimeout(timer);
      if (!paused && !hover) timer = setTimeout(function () { show(cur + 1); }, ms);
    }
    function setPaused(p) {
      paused = p;
      hero.classList.toggle('hero-paused', p);
      if (pauseBtn) pauseBtn.setAttribute('aria-label', p ? 'Play slideshow' : 'Pause slideshow');
      schedule();
    }
    tabs.forEach(function (t, k) { t.addEventListener('click', function () { show(k); }); });
    if (pauseBtn) pauseBtn.addEventListener('click', function () { setPaused(!paused); });
    hero.addEventListener('mouseenter', function () { hover = true; hero.classList.add('hero-paused'); clearTimeout(timer); });
    hero.addEventListener('mouseleave', function () { hover = false; hero.classList.toggle('hero-paused', paused); schedule(); });
    setPaused(paused);
    show(0);
  }

  /* ---------- Generic filter groups ----------
     <div data-filter-group="dir">  tabs: [data-filter-tab="value"] (value "all" = everything)
     items: [data-filter-item][data-prop][data-cat][data-name]
     optional: [data-filter-search], [data-filter-cat], [data-filter-count], [data-filter-empty] */
  doc.querySelectorAll('[data-filter-group]').forEach(function (group) {
    var tabs = group.querySelectorAll('[data-filter-tab]');
    var items = group.querySelectorAll('[data-filter-item]');
    var search = group.querySelector('[data-filter-search]');
    var catSel = group.querySelector('[data-filter-cat]');
    var count = group.querySelector('[data-filter-count]');
    var empty = group.querySelector('[data-filter-empty]');
    var state = { prop: 'all', q: '', cat: 'all' };

    function apply() {
      var shown = 0, q = state.q.trim().toLowerCase();
      items.forEach(function (el) {
        // data-prop may hold several ids separated by spaces (e.g. news for all centers)
        var ok = (state.prop === 'all' || (' ' + el.getAttribute('data-prop') + ' ').indexOf(' ' + state.prop + ' ') > -1) &&
                 (state.cat === 'all' || el.getAttribute('data-cat') === state.cat) &&
                 (!q || (el.getAttribute('data-name') || '').indexOf(q) > -1);
        el.hidden = !ok;
        if (ok) shown++;
      });
      if (count) count.textContent = 'Showing ' + shown + ' of ' + items.length;
      if (empty) empty.hidden = shown !== 0;
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        tabs.forEach(function (o) { o.setAttribute('aria-pressed', o === t ? 'true' : 'false'); });
        state.prop = t.getAttribute('data-filter-tab');
        apply();
      });
    });
    if (search) search.addEventListener('input', function () { state.q = search.value; apply(); });
    if (catSel) catSel.addEventListener('change', function () { state.cat = catSel.value; apply(); });

    // Deep link: ?property=<slug-or-id>
    var want = new URLSearchParams(location.search).get('property');
    if (want) {
      tabs.forEach(function (t) {
        if (t.getAttribute('data-filter-tab') === want || t.getAttribute('data-slug') === want) t.click();
      });
    }
    apply();
  });

  /* ---------- Preselect property in forms from ?property= ---------- */
  var wantProp = new URLSearchParams(location.search).get('property');
  if (wantProp) {
    doc.querySelectorAll('select[name="property"]').forEach(function (sel) {
      Array.prototype.forEach.call(sel.options, function (o) {
        if (o.getAttribute('data-slug') === wantProp || o.value === wantProp) sel.value = o.value;
      });
    });
  }

  /* ---------- Forms (Netlify Forms, AJAX) ---------- */
  doc.querySelectorAll('form[data-ajax]').forEach(function (form) {
    var status = form.querySelector('.form-status');
    var btn = form.querySelector('[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      if (btn) { btn.disabled = true; btn.setAttribute('aria-busy', 'true'); }
      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          form.reset();
          if (status) { status.className = 'form-status ok'; status.textContent = form.getAttribute('data-success'); }
        })
        .catch(function () {
          if (status) {
            var mail = form.getAttribute('data-fallback');
            status.className = 'form-status err';
            status.innerHTML = 'We couldn’t send this right now. Please email <a href="mailto:' + mail + '">' + mail + '</a> and we’ll reply within one business day.';
          }
        })
        .then(function () { if (btn) { btn.disabled = false; btn.removeAttribute('aria-busy'); } if (status) status.focus && status.focus(); });
    });
  });

  /* ---------- Footer year ---------- */
  doc.querySelectorAll('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
