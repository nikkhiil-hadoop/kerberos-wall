// Chapter 01: the skew simulator. The KDC clock is the reference (0); client and service are sliders.
(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const K = window.KWall;
  if (!K || !$('tl1')) return;

  const AXIS = 1200; // seconds shown each side of "now"
  const labels = [-1200, -600, 0, 600, 1200].map((v) => ({ v, text: v === 0 ? 'now' : K.fmt(v) }));
  const tl1 = K.timeline($('tl1'), { min: -AXIS, max: AXIS, labels });
  const tl2 = K.timeline($('tl2'), { min: -AXIS, max: AXIS, labels });

  const PRESETS = {
    sync: [0, 0],
    laptop: [-420, 0],
    vm: [0, -540],
    agree: [500, 500],
    inside: [299, 0],
    outside: [301, 0],
  };

  let limit = 300;
  let client = 0;
  let service = 0;

  const dir = (s, a, b) => K.mmss(Math.abs(s)) + (s > 0 ? ' ' + a : ' ' + b);

  function setStage(stageId, statusId, msgId, state, status, msg) {
    const st = $(stageId);
    st.classList.remove('ok', 'bad', 'skip');
    st.classList.add(state);
    const s = $(statusId);
    s.className = 'stage-status ' + state;
    s.textContent = status;
    $(msgId).textContent = msg;
  }

  function verdict(kind, title, text) {
    const v = $('verdict');
    v.classList.remove('good', 'bad');
    if (kind) v.classList.add(kind);
    $('verdict-title').textContent = title;
    $('verdict-text').textContent = text;
  }

  function update() {
    $('v-client').textContent = K.describe(client, 'fast', 'slow');
    $('v-service').textContent = K.describe(service, 'fast', 'slow');

    const d1 = client;            // client timestamp vs KDC clock (the reference)
    const d2 = client - service;  // client timestamp vs service clock
    const bad1 = Math.abs(d1) > limit;
    const bad2 = Math.abs(d2) > limit;
    const band = [-limit, limit];

    tl1.update({ value: d1, band, walls: band, center: 0, bad: bad1, tag: 'Δ ' + K.fmt(d1) });
    tl2.update({ value: d2, band, walls: band, center: 0, bad: !bad1 && bad2, tag: 'Δ ' + K.fmt(d2) });

    if (bad1) {
      setStage('stage1', 'st1', 'msg1', 'bad', '✗ KRB_AP_ERR_SKEW (37)',
        'typical message: kinit: Clock skew too great while getting initial credentials');
      setStage('stage2', 'st2', 'msg2', 'skip', '— never reached', 'no ticket to present, so the service never sees you');
      verdict('bad', 'fails at kinit',
        'The client clock is ' + dir(client, 'ahead of', 'behind') + ' the KDC (allowed ' + K.mmss(limit) +
        '). Fix the client’s clock, or the KDC’s. The service isn’t involved yet, so its clock doesn’t matter.');
    } else if (bad2) {
      setStage('stage1', 'st1', 'msg1', 'ok', '✓ accepted', 'tickets issued: the KDC and the client agree within ' + K.mmss(limit));
      setStage('stage2', 'st2', 'msg2', 'bad', '✗ KRB_AP_ERR_SKEW (37)',
        'typical message: GSSException … (Mechanism level: Clock skew too great (37))');
      verdict('bad', 'kinit works, then the connection fails',
        'The client and the KDC agree, so the problem is the service host: its clock is ' +
        dir(-d2, 'ahead of', 'behind') + ' the client’s (allowed ' + K.mmss(limit) + '). Fix the service’s clock.');
    } else {
      setStage('stage1', 'st1', 'msg1', 'ok', '✓ accepted', 'tickets issued: the KDC and the client agree within ' + K.mmss(limit));
      setStage('stage2', 'st2', 'msg2', 'ok', '✓ accepted', 'the service accepts the authenticator and logs you in');
      verdict('good', 'authenticated',
        'client ↔ KDC: ' + K.fmt(d1) + ' · client ↔ service: ' + K.fmt(d2) +
        '. Both inside ±' + K.mmss(limit) + '.');
    }
  }

  function setSliders() {
    $('r-client').value = String(client);
    $('r-service').value = String(service);
  }

  $('r-client').addEventListener('input', (e) => { client = Number(e.target.value); update(); });
  $('r-service').addEventListener('input', (e) => { service = Number(e.target.value); update(); });

  document.querySelectorAll('.chip[data-preset]').forEach((chip) => {
    chip.addEventListener('click', () => {
      const p = PRESETS[chip.dataset.preset];
      if (!p) return;
      client = p[0];
      service = p[1];
      setSliders();
      update();
    });
  });

  document.querySelectorAll('.seg-btn[data-limit]').forEach((btn) => {
    btn.addEventListener('click', () => {
      limit = Number(btn.dataset.limit);
      document.querySelectorAll('.seg-btn[data-limit]').forEach((b) => {
        b.setAttribute('aria-pressed', String(b === btn));
      });
      update();
    });
  });

  // Start on the instructive case: the laptop that slept.
  client = -420;
  setSliders();
  update();
})();
