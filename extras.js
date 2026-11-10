// Chapters 02 and 03: the replay window, and ticket start/end times.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const K = window.KWall;
  if (!K) return;
  const LIMIT = 300; // default allowed skew, seconds

  function outcome(box, titleId, textId, kind, title, text) {
    box.classList.remove('good', 'bad');
    box.classList.add(kind);
    $(titleId).textContent = title;
    $(textId).textContent = text;
  }

  /* ── 02 · replay window ── */
  if ($('tl3')) {
    const tl = K.timeline($('tl3'), {
      min: 0, max: 900,
      labels: [
        { v: 0, text: 'legit login' },
        { v: 300, text: 'window closes' },
        { v: 600, text: '10:00' },
        { v: 900, text: '15:00' },
      ],
    });
    let cache = true;

    const update = () => {
      const n = Number($('rp-range').value);
      $('rp-val').textContent = K.mmss(n);
      let accepted = false;
      if (n > LIMIT) {
        outcome($('rp-out'), 'rp-title', 'rp-text', 'good', 'Rejected: KRB_AP_ERR_SKEW (37)',
          'The captured timestamp is older than the allowed window, so it’s refused outright. No memory needed for this part.');
      } else if (cache) {
        outcome($('rp-out'), 'rp-title', 'rp-text', 'good', 'Rejected: KRB_AP_ERR_REPEAT (34)',
          'Request is a replay. The service has already seen this exact authenticator and remembers it for the length of the window.');
      } else {
        accepted = true;
        outcome($('rp-out'), 'rp-title', 'rp-text', 'bad', 'Accepted: the attacker is in',
          'With no replay cache, nothing stops a captured authenticator being reused until the window closes.');
      }
      tl.update({
        value: n, band: [0, LIMIT], walls: [LIMIT], center: null, ghosts: [0],
        bad: accepted, tag: '+' + K.mmss(n),
      });
    };

    $('rp-range').addEventListener('input', update);
    document.querySelectorAll('#rp-seg .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        cache = btn.dataset.cache === 'on';
        document.querySelectorAll('#rp-seg .seg-btn').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        update();
      });
    });
    update();
  }

  /* ── 03 · ticket validity ── */
  if ($('tl4')) {
    const CASES = {
      // value = how far the service's "now" is from the ticket edge (seconds); true "now" is `at` from the edge
      fresh: { at: 30, start: -360, edge: 'ticket start' },
      expiring: { at: -120, start: 480, edge: 'ticket end' },
    };
    let current = 'fresh';
    let tl = null;

    const rebuild = () => {
      tl = K.timeline($('tl4'), {
        min: -900, max: 900,
        labels: [
          { v: -900, text: '−15:00' }, { v: -300, text: '−5:00' },
          { v: 300, text: '+5:00' }, { v: 900, text: '+15:00' },
        ],
      });
    };

    const update = () => {
      const c = CASES[current];
      const off = Number($('tk-range').value);
      $('tk-val').textContent = K.describe(off, 'fast', 'slow');
      const value = c.at + off; // service's "now", relative to the ticket edge

      let bad = false;
      if (current === 'fresh') {
        if (value < -LIMIT) {
          bad = true;
          outcome($('tk-out'), 'tk-title', 'tk-text', 'bad', 'Rejected: KRB_AP_ERR_TKT_NYV (33)',
            'Ticket not yet valid. To this service’s slow clock, the ticket starts ' + K.mmss(-value) +
            ' in the future (allowed: ' + K.mmss(LIMIT) + ').');
        } else {
          outcome($('tk-out'), 'tk-title', 'tk-text', 'good', 'Accepted',
            value < 0
              ? 'The service sees the ticket starting ' + K.mmss(-value) + ' from now, inside the ' + K.mmss(LIMIT) + ' allowance.'
              : 'The service sees the ticket as ' + K.mmss(value) + ' old. Valid.');
        }
        tl.update({ value, band: [-LIMIT, 900], walls: [-LIMIT], center: 0, centerTag: c.edge, bad, tag: K.fmt(value) });
      } else {
        if (value > LIMIT) {
          bad = true;
          outcome($('tk-out'), 'tk-title', 'tk-text', 'bad', 'Rejected: KRB_AP_ERR_TKT_EXPIRED (32)',
            'Ticket expired. To this service’s fast clock, the ticket ended ' + K.mmss(value) +
            ' ago, more than the ' + K.mmss(LIMIT) + ' allowance.');
        } else {
          outcome($('tk-out'), 'tk-title', 'tk-text', 'good', 'Accepted',
            value <= 0
              ? 'The service sees ' + K.mmss(-value) + ' left on the ticket. Valid.'
              : 'The ticket looks ' + K.mmss(value) + ' past its end, but that’s inside the ' + K.mmss(LIMIT) + ' allowance, so it’s still accepted.');
        }
        tl.update({ value, band: [-900, LIMIT], walls: [LIMIT], center: 0, centerTag: c.edge, bad, tag: K.fmt(value) });
      }
    };

    document.querySelectorAll('#tk-seg .seg-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        current = btn.dataset.case;
        document.querySelectorAll('#tk-seg .seg-btn').forEach((b) => {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        $('tk-range').value = String(CASES[current].start);
        update();
      });
    });
    $('tk-range').addEventListener('input', update);

    rebuild();
    update();
  }
})();
