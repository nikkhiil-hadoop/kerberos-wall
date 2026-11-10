// Hero: two live analog clocks. The client clock drifts ahead until it crosses the five-minute wall.
(() => {
  'use strict';

  const host = document.getElementById('hero-clocks');
  const K = window.KWall;
  if (!host || !K) return;

  const NS = 'http://www.w3.org/2000/svg';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const LIMIT = 300;                       // seconds: the default allowed skew
  const R = 96;
  const CIRC = 2 * Math.PI * R;
  const pad = (n) => String(n).padStart(2, '0');

  const el = (tag, attrs, parent) => {
    const n = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach((k) => n.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(n);
    return n;
  };

  function build(label) {
    const box = document.createElement('div');
    box.className = 'clockbox';
    const who = document.createElement('div');
    who.className = 'who';
    who.textContent = label;

    const svg = el('svg', { viewBox: '0 0 200 200', class: 'clock', 'aria-hidden': 'true' });
    el('circle', { cx: 100, cy: 100, r: R, class: 'ring-bg' }, svg);
    const ring = el('circle', {
      cx: 100, cy: 100, r: R, class: 'ring-fg', transform: 'rotate(-90 100 100)',
      'stroke-dasharray': CIRC, 'stroke-dashoffset': CIRC,
    }, svg);
    el('circle', { cx: 100, cy: 100, r: 86, class: 'face' }, svg);
    for (let i = 0; i < 60; i++) {
      const a = (i * 6 * Math.PI) / 180;
      const major = i % 5 === 0;
      const r1 = major ? 70 : 77;
      const r2 = 82;
      el('line', {
        x1: 100 + r1 * Math.sin(a), y1: 100 - r1 * Math.cos(a),
        x2: 100 + r2 * Math.sin(a), y2: 100 - r2 * Math.cos(a),
        class: 'tick' + (major ? ' major' : ''),
      }, svg);
    }
    const hh = el('line', { x1: 100, y1: 100, x2: 100, y2: 56, class: 'hand hand-h' }, svg);
    const mh = el('line', { x1: 100, y1: 100, x2: 100, y2: 36, class: 'hand hand-m' }, svg);
    const sh = el('line', { x1: 100, y1: 112, x2: 100, y2: 26, class: 'hand hand-s' }, svg);
    el('circle', { cx: 100, cy: 100, r: 4.5, class: 'hub' }, svg);

    const dig = document.createElement('div');
    dig.className = 'digital';
    box.append(who, svg, dig);

    return {
      box,
      set(d) {
        const s = d.getSeconds() + d.getMilliseconds() / 1000;
        const m = d.getMinutes() + s / 60;
        const h = (d.getHours() % 12) + m / 60;
        sh.setAttribute('transform', 'rotate(' + s * 6 + ' 100 100)');
        mh.setAttribute('transform', 'rotate(' + m * 6 + ' 100 100)');
        hh.setAttribute('transform', 'rotate(' + h * 30 + ' 100 100)');
        dig.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      },
      ring(frac, bad) {
        ring.setAttribute('stroke-dashoffset', String(CIRC * (1 - Math.min(1, frac))));
        ring.setAttribute('class', 'ring-fg' + (bad ? ' bad' : ''));
      },
    };
  }

  const client = build('client');
  const service = build('service');
  host.append(client.box, service.box);

  const deltaEl = document.getElementById('hero-delta');
  const statusEl = document.getElementById('hero-status');
  let lastBad = null;

  // 0 → +7:00 over 12 s, hold 4 s, snap back (an NTP step) over 2 s.
  const offsetAt = (t) => {
    const p = t % 18;
    if (p < 12) return 420 * (p / 12);
    if (p < 16) return 420;
    return 420 * (1 - (p - 16) / 2);
  };

  function render(off) {
    const now = Date.now();
    client.set(new Date(now + off * 1000));
    service.set(new Date(now));
    const bad = Math.abs(off) > LIMIT;
    client.ring(Math.abs(off) / LIMIT, bad);
    service.ring(0, false);
    deltaEl.textContent = K.fmt(off);
    deltaEl.style.color = bad ? 'var(--bad)' : '';
    if (bad !== lastBad) {
      lastBad = bad;
      statusEl.className = 'status ' + (bad ? 'bad' : 'ok');
      statusEl.textContent = bad
        ? '✗ KRB_AP_ERR_SKEW (37) · Clock skew too great'
        : '✓ within ±5:00 · accepted';
    }
  }

  if (reduce) {
    // No continuous motion: show a fixed failing state and tick once a second.
    render(372);
    setInterval(() => render(372), 1000);
    return;
  }

  const t0 = performance.now();
  let last = 0;
  const frame = (now) => {
    if (now - last >= 33) {
      last = now;
      render(offsetAt((now - t0) / 1000));
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
})();
