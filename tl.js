// Shared helpers: time formatting and a small "timeline with a wall" widget.
// All DOM writes use textContent / CSSOM (no innerHTML).
(() => {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');
  const mmss = (s) => {
    const t = Math.round(Math.abs(s));
    return Math.floor(t / 60) + ':' + pad(t % 60);
  };
  const fmt = (s) => (s > 0 ? '+' : s < 0 ? '−' : '') + mmss(s); // +6:12, −0:30, 0:00
  const describe = (s, pos, neg) => (s === 0 ? 'in sync' : mmss(s) + ' ' + (s > 0 ? pos : neg));

  /**
   * cfg: { min, max, labels: [{v, text}] }   (values in seconds)
   * update(o): { value, tag, bad, band:[a,b], walls:[v,v], center, centerTag, ghosts:[v,v] }
   */
  function timeline(host, cfg) {
    host.textContent = '';
    const min = cfg.min;
    const span = cfg.max - cfg.min;
    const pos = (v) => ((v - min) / span) * 100;
    const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
    const add = (cls) => {
      const d = document.createElement('div');
      d.className = cls;
      host.appendChild(d);
      return d;
    };

    add('tl-axis');
    const band = add('tl-band');
    const walls = [add('tl-wall'), add('tl-wall')];
    const center = add('tl-center');
    const centerTag = add('tl-center-tag');
    const ghosts = [add('tl-ghost'), add('tl-ghost')];
    const marker = add('tl-marker');
    const tag = add('tl-tag');

    (cfg.labels || []).forEach((l, i, all) => {
      const first = i === 0 && l.v === cfg.min ? ' first' : '';
      const last = i === all.length - 1 && l.v === cfg.max ? ' last' : '';
      const s = add('tl-lab' + first + last);
      s.textContent = l.text;
      s.style.left = clamp(pos(l.v), 0, 100) + '%';
    });

    function update(o) {
      if (o.band) {
        const a = clamp(pos(o.band[0]), 0, 100);
        const b = clamp(pos(o.band[1]), 0, 100);
        band.hidden = false;
        band.style.left = a + '%';
        band.style.width = b - a + '%';
      } else {
        band.hidden = true;
      }
      walls.forEach((w, i) => {
        const v = (o.walls || [])[i];
        w.hidden = v === undefined;
        if (v !== undefined) w.style.left = clamp(pos(v), 0, 100) + '%';
      });
      if (o.center === undefined || o.center === null) {
        center.hidden = true;
        centerTag.hidden = true;
      } else {
        center.hidden = false;
        center.style.left = clamp(pos(o.center), 0, 100) + '%';
        centerTag.hidden = !o.centerTag;
        if (o.centerTag) {
          centerTag.textContent = o.centerTag;
          centerTag.style.left = clamp(pos(o.center), 8, 92) + '%';
        }
      }
      ghosts.forEach((g, i) => {
        const v = (o.ghosts || [])[i];
        g.hidden = v === undefined;
        if (v !== undefined) g.style.left = clamp(pos(v), 0, 100) + '%';
      });
      const mp = clamp(pos(o.value), 2, 98);
      marker.style.left = mp + '%';
      marker.classList.toggle('bad', !!o.bad);
      tag.style.left = clamp(mp, 9, 91) + '%';
      tag.textContent = o.tag || '';
      tag.classList.toggle('bad', !!o.bad);
    }

    return { update };
  }

  window.KWall = { timeline, fmt, mmss, describe };
})();
