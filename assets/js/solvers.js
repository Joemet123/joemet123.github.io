/* ============================================================
   JOEMET123 — Call Of Duty Zombies Solvers
   Logic ported 1:1 from the three Discord bots:
     OFFICIAL_BO3_ZOMBIES_SOLVER.py
     OFFICIAL_BO6_ZOMBIES_SOLVER.py
     OFFICIAL_BO7_ZOMBIES_SOLVER.py
   Every code, mapping, sequence and algorithm below is copied
   from that source. Nothing here is invented.

   The INTERFACE is deliberately not the bot's. Discord forces
   one message, five action rows and a back button; a browser
   has none of those limits, so every tool is laid out flat with
   its controls and its answer side by side and always visible.

   Pure client-side. No network, no storage, no tracking.
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     0. DOM HELPERS
     ========================================================== */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }
  function frag() { return document.createDocumentFragment(); }
  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* Controls on the left, answer on the right (stacked on mobile).
     The answer panel is always present so nothing jumps when it fills. */
  function makeIO(root) {
    var io = el('div', 'solver-io');
    var controls = el('div', 'solver-io-controls');
    var outWrap = el('div', 'solver-io-out');
    var res = el('div', 'solver-result');
    outWrap.appendChild(res);
    io.appendChild(controls);
    io.appendChild(outWrap);
    root.appendChild(io);
    return { controls: controls, out: res };
  }

  /* A labelled group of choice buttons — replaces the bot's dropdowns. */
  function optGroup(labelText, hint) {
    var wrap = el('div', 'solver-opt');
    if (labelText) {
      var lab = el('span', 'solver-opt-label', labelText);
      wrap.appendChild(lab);
    }
    if (hint) wrap.appendChild(el('span', 'solver-opt-hint', hint));
    var btns = el('div', 'solver-opt-btns');
    wrap.appendChild(btns);
    return { wrap: wrap, btns: btns };
  }

  function chip(label, cls) {
    var b = el('button', 'solver-chip' + (cls ? ' ' + cls : ''), label);
    b.type = 'button';
    return b;
  }

  /* A choice button that shows the actual in-game symbol. */
  function imgChip(game, file, label, alt) {
    var b = el('button', 'solver-imgchip');
    b.type = 'button';
    var im = el('img');
    im.src = imgPath(game, file);
    im.alt = alt || label;
    im.loading = 'lazy';
    im.decoding = 'async';
    b.appendChild(im);
    b.appendChild(el('span', 'solver-imgchip-label', label));
    return b;
  }

  function numberField(labelText, ph) {
    var wrap = el('label', 'solver-field');
    wrap.appendChild(el('span', null, labelText));
    var inp = el('input');
    inp.type = 'text';
    inp.inputMode = 'numeric';
    inp.autocomplete = 'off';
    if (ph) inp.placeholder = ph;
    wrap.appendChild(inp);
    return { wrap: wrap, input: inp };
  }

  function textField(labelText, ph, maxLen) {
    var wrap = el('label', 'solver-field');
    wrap.appendChild(el('span', null, labelText));
    var inp = el('input');
    inp.type = 'text';
    inp.autocomplete = 'off';
    if (ph) inp.placeholder = ph;
    if (maxLen) inp.maxLength = maxLen;
    wrap.appendChild(inp);
    return { wrap: wrap, input: inp };
  }

  function actions() { return el('div', 'solver-actions'); }
  function button(label, cls) {
    var b = el('button', cls || 'btn btn-outline', label);
    b.type = 'button';
    return b;
  }

  /* ---- answer panel rendering ---- */
  function idle(out, message) {
    clear(out);
    out.className = 'solver-result solver-result--idle';
    out.appendChild(el('p', 'solver-idle', message));
  }
  function begin(out, title) {
    clear(out);
    out.className = 'solver-result is-answered';
    if (title) out.appendChild(el('p', 'solver-result-title', title));
  }
  function beginWarn(out, title) {
    clear(out);
    out.className = 'solver-result is-warning';
    if (title) out.appendChild(el('p', 'solver-result-title', title));
  }
  function progress(out, title) {
    clear(out);
    out.className = 'solver-result is-progress';
    if (title) out.appendChild(el('p', 'solver-result-title', title));
  }

  function answerList(items) {
    var ul = el('ul', 'solver-answer-list');
    items.forEach(function (t) {
      var li = el('li');
      if (typeof t === 'string') li.textContent = t; else li.appendChild(t);
      ul.appendChild(li);
    });
    return ul;
  }
  function stepList(items) {
    var ol = el('ol', 'solver-answer-steps');
    items.forEach(function (t) {
      var li = el('li');
      if (typeof t === 'string') li.textContent = t; else li.appendChild(t);
      ol.appendChild(li);
    });
    return ol;
  }
  function kv(label, value) {
    var p = el('p', 'solver-line');
    p.appendChild(el('span', 'solver-line-k', label));
    p.appendChild(el('strong', 'solver-line-v', value));
    return p;
  }
  function bigCode(text) {
    var p = el('p', 'solver-big');
    p.appendChild(el('code', 'solver-code solver-code--lg', text));
    return p;
  }
  function subhead(text) { return el('p', 'solver-subhead', text); }
  function note(text, kind) {
    return el('p', 'solver-note' + (kind ? ' solver-note--' + kind : ''), text);
  }
  function codeNode(k, v, sep) {
    var f = frag();
    f.appendChild(el('strong', null, k));
    f.appendChild(document.createTextNode(sep || ' \u2014 '));
    f.appendChild(el('code', 'solver-code', v));
    return f;
  }

  /* ==========================================================
     1. IMAGES + LIGHTBOX (zoomable, pinch friendly)
     ========================================================== */

  var IMG_BASE = 'assets/images/solvers/';
  function imgPath(game, file) { return IMG_BASE + game + '/' + file; }

  function imagePlate(game, file, alt, caption) {
    var src = imgPath(game, file);
    var fig = el('figure', 'solver-figure');
    var btn = el('button', 'solver-img-btn');
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open Full Size: ' + alt);
    var im = el('img');
    im.src = src;
    im.alt = alt;
    im.loading = 'lazy';
    im.decoding = 'async';
    btn.appendChild(im);
    btn.addEventListener('click', function () { openLightbox(src, alt); });
    fig.appendChild(btn);

    var cap = el('figcaption', 'solver-figcaption');
    cap.appendChild(document.createTextNode(caption || alt));
    cap.appendChild(document.createTextNode(' \u00b7 '));
    var a = el('a', 'solver-fullsize', 'Open Full Size');
    a.href = src;
    a.target = '_blank';
    a.rel = 'noopener';
    cap.appendChild(a);
    fig.appendChild(cap);
    return fig;
  }

  var lb = null, lbImg = null, lbCap = null, lbZoom = null, lbReturn = null, lbStage = null;

  function buildLightbox() {
    if (lb) return;
    lb = el('div', 'solver-lightbox');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.hidden = true;

    var backdrop = el('div', 'solver-lightbox-backdrop');
    backdrop.addEventListener('click', closeLightbox);
    lb.appendChild(backdrop);

    var panel = el('div', 'solver-lightbox-panel');
    var bar = el('div', 'solver-lightbox-bar');
    lbCap = el('p', 'solver-lightbox-title', '');
    bar.appendChild(lbCap);

    lbZoom = el('button', 'solver-lightbox-zoom', 'Actual Size');
    lbZoom.type = 'button';
    lbZoom.addEventListener('click', toggleZoom);
    bar.appendChild(lbZoom);

    var close = el('button', 'solver-lightbox-close', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closeLightbox);
    bar.appendChild(close);
    panel.appendChild(bar);

    lbStage = el('div', 'solver-lightbox-stage');
    lbImg = el('img');
    lbImg.alt = '';
    lbImg.addEventListener('click', toggleZoom);
    lbStage.appendChild(lbImg);
    panel.appendChild(lbStage);

    lb.appendChild(panel);
    document.body.appendChild(lb);

    document.addEventListener('keydown', function (e) {
      if (!lb.hidden && (e.key === 'Escape' || e.key === 'Esc')) closeLightbox();
    });
  }

  function toggleZoom() {
    if (!lbStage) return;
    var zoomed = lbStage.classList.toggle('is-zoomed');
    lbZoom.textContent = zoomed ? 'Fit To Screen' : 'Actual Size';
  }

  function openLightbox(src, alt) {
    buildLightbox();
    lbReturn = document.activeElement;
    lbStage.classList.remove('is-zoomed');
    lbZoom.textContent = 'Actual Size';
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCap.textContent = alt || '';
    lb.hidden = false;
    document.body.classList.add('lightbox-open');
    var c = lb.querySelector('.solver-lightbox-close');
    if (c) c.focus();
  }

  function closeLightbox() {
    if (!lb || lb.hidden) return;
    lb.hidden = true;
    lbImg.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (lbReturn && lbReturn.focus) lbReturn.focus();
    lbReturn = null;
  }

  /* ==========================================================
     2. BO3 DATA — Gorod Krovi Valve Step
     Source: OFFICIAL_BO3_ZOMBIES_SOLVER.py section 4
     ========================================================== */

  var VALVE_LOCATIONS = [
    'Armory', 'Supply Depot', 'Tank Factory',
    'Infirmary', 'Dragon Command', 'Department Store'
  ];

  var VALVE_COMBINATIONS = {
    'Armory|Tank Factory': [['Armory', 3], ['Department Store', 2], ['Infirmary', 3], ['Dragon Command', 1], ['Supply Depot', 3]],
    'Armory|Department Store': [['Armory', 1], ['Supply Depot', 3], ['Tank Factory', 1], ['Infirmary', 1], ['Dragon Command', 2]],
    'Armory|Dragon Command': [['Armory', 3], ['Department Store', 2], ['Infirmary', 2], ['Tank Factory', 2], ['Supply Depot', 1]],
    'Armory|Supply Depot': [['Armory', 2], ['Tank Factory', 1], ['Infirmary', 1], ['Department Store', 3], ['Dragon Command', 1]],
    'Armory|Infirmary': [['Armory', 2], ['Tank Factory', 2], ['Supply Depot', 1], ['Dragon Command', 2], ['Department Store', 2]],
    'Department Store|Armory': [['Department Store', 3], ['Dragon Command', 3], ['Infirmary', 2], ['Tank Factory', 2], ['Supply Depot', 2]],
    'Department Store|Dragon Command': [['Department Store', 2], ['Infirmary', 2], ['Tank Factory', 3], ['Armory', 1], ['Supply Depot', 1]],
    'Department Store|Supply Depot': [['Department Store', 1], ['Armory', 2], ['Tank Factory', 1], ['Infirmary', 3], ['Dragon Command', 3]],
    'Department Store|Infirmary': [['Department Store', 1], ['Armory', 2], ['Tank Factory', 2], ['Supply Depot', 1], ['Dragon Command', 3]],
    'Department Store|Tank Factory': [['Department Store', 2], ['Infirmary', 3], ['Dragon Command', 1], ['Supply Depot', 2], ['Armory', 2]],
    'Dragon Command|Supply Depot': [['Dragon Command', 2], ['Department Store', 2], ['Infirmary', 2], ['Tank Factory', 3], ['Armory', 1]],
    'Dragon Command|Infirmary': [['Dragon Command', 1], ['Supply Depot', 3], ['Tank Factory', 3], ['Armory', 3], ['Department Store', 2]],
    'Dragon Command|Tank Factory': [['Dragon Command', 3], ['Infirmary', 1], ['Department Store', 1], ['Armory', 1], ['Supply Depot', 3]],
    'Dragon Command|Department Store': [['Dragon Command', 1], ['Supply Depot', 2], ['Armory', 2], ['Tank Factory', 1], ['Infirmary', 1]],
    'Dragon Command|Armory': [['Dragon Command', 1], ['Supply Depot', 3], ['Tank Factory', 1], ['Infirmary', 1], ['Department Store', 1]],
    'Supply Depot|Infirmary': [['Supply Depot', 3], ['Tank Factory', 3], ['Armory', 3], ['Department Store', 3], ['Dragon Command', 3]],
    'Supply Depot|Tank Factory': [['Supply Depot', 2], ['Armory', 3], ['Department Store', 3], ['Dragon Command', 3], ['Infirmary', 2]],
    'Supply Depot|Dragon Command': [['Supply Depot', 3], ['Tank Factory', 3], ['Armory', 3], ['Department Store', 2], ['Infirmary', 3]],
    'Supply Depot|Department Store': [['Supply Depot', 2], ['Armory', 2], ['Tank Factory', 1], ['Infirmary', 3], ['Dragon Command', 2]],
    'Supply Depot|Armory': [['Supply Depot', 3], ['Tank Factory', 1], ['Infirmary', 3], ['Dragon Command', 2], ['Department Store', 1]],
    'Infirmary|Tank Factory': [['Infirmary', 3], ['Dragon Command', 2], ['Department Store', 1], ['Armory', 1], ['Supply Depot', 3]],
    'Infirmary|Supply Depot': [['Infirmary', 3], ['Dragon Command', 2], ['Department Store', 1], ['Armory', 2], ['Tank Factory', 2]],
    'Infirmary|Dragon Command': [['Infirmary', 2], ['Tank Factory', 2], ['Supply Depot', 2], ['Armory', 2], ['Department Store', 3]],
    'Infirmary|Department Store': [['Infirmary', 3], ['Dragon Command', 1], ['Supply Depot', 3], ['Tank Factory', 3], ['Armory', 3]],
    'Infirmary|Armory': [['Infirmary', 2], ['Tank Factory', 2], ['Supply Depot', 1], ['Dragon Command', 2], ['Department Store', 1]],
    'Tank Factory|Infirmary': [['Tank Factory', 2], ['Supply Depot', 2], ['Armory', 2], ['Department Store', 3], ['Dragon Command', 3]],
    'Tank Factory|Supply Depot': [['Tank Factory', 1], ['Infirmary', 3], ['Dragon Command', 2], ['Department Store', 1], ['Armory', 1]],
    'Tank Factory|Dragon Command': [['Tank Factory', 1], ['Infirmary', 1], ['Department Store', 1], ['Armory', 1], ['Supply Depot', 1]],
    'Tank Factory|Department Store': [['Tank Factory', 1], ['Infirmary', 3], ['Dragon Command', 1], ['Supply Depot', 2], ['Armory', 3]],
    'Tank Factory|Armory': [['Tank Factory', 1], ['Infirmary', 1], ['Department Store', 3], ['Dragon Command', 1], ['Supply Depot', 2]]
  };

  function solveValves(green, pink) {
    return VALVE_COMBINATIONS[green + '|' + pink] || null;
  }

  /* ==========================================================
     3. BO6 DATA — OFFICIAL_BO6_ZOMBIES_SOLVER.py section 5
     ========================================================== */

  var BEAMSMASHER_LIMIT = 99;
  function beamFirst(x)        { return 2 * x + 11; }
  function beamSecond(x, y, z) { return (2 * z + y) - 5; }
  function beamThird(x, y, z)  { return Math.abs((y + z) - x); }

  var STRAUS_COLOURS = {
    red:    { button: 'Red',    counter: 'RED',    projector: 'GREEN' },
    yellow: { button: 'Yellow', counter: 'YELLOW', projector: 'YELLOW' },
    green:  { button: 'Green',  counter: 'GREEN',  projector: 'RED' }
  };
  var STRAUS_ORDER = ['red', 'yellow', 'green'];

  var FOSSILS = {
    1: { image: 'scorpion_code.jpg' },
    2: { image: 'pisces_code.jpg' },
    3: { image: 'aries_code.jpg' },
    4: { image: 'leo_code.jpg' },
    5: { image: 'gemini_code.jpg' }
  };

  var RUNE_COUNT = 8;

  var CHALKBOARDS = {
    'Ni':  { Moth: 1888, Worm: 5861, Yeti: 5482, Crab: 4664 },
    'OUY': { Moth: 7394, Worm: 9377, Yeti: 3192, Crab: 9729 },
    'M':   { Moth: 1676, Worm: 7671, Yeti: 3576, Crab: 5775 },
    'S':   { Moth: 8587, Worm: 8588, Yeti: 5785, Crab: 7857 }
  };
  var CHALKBOARD_KEYS = ['Ni', 'OUY', 'M', 'S'];
  var CHALKBOARD_WORDS = ['Moth', 'Worm', 'Yeti', 'Crab'];

  var PERIODIC_TABLE = {
    H: 1, HE: 2, LI: 3, BE: 4, B: 5, C: 6, N: 7, O: 8, F: 9, NE: 10,
    NA: 11, MG: 12, AL: 13, SI: 14, P: 15, S: 16, CL: 17, AR: 18,
    K: 19, CA: 20, SC: 21, TI: 22, V: 23, CR: 24, MN: 25, FE: 26,
    CO: 27, NI: 28, CU: 29, ZN: 30, GA: 31, GE: 32, AS: 33, SE: 34,
    BR: 35, KR: 36,
    RB: 37, SR: 38, Y: 39, ZR: 40, NB: 41, MO: 42, TC: 43, RU: 44,
    RH: 45, PD: 46, AG: 47, CD: 48, IN: 49, SN: 50, SB: 51, TE: 52,
    I: 53, XE: 54,
    CS: 55, BA: 56, HF: 72, TA: 73, W: 74, RE: 75, OS: 76, IR: 77,
    PT: 78, AU: 79, HG: 80, TL: 81, PB: 82, BI: 83, PO: 84, AT: 85,
    RN: 86,
    FR: 87, RA: 88, RF: 104, DB: 105, SG: 106, BH: 107, HS: 108, MT: 109,
    LA: 57, CE: 58, PR: 59, ND: 60, PM: 61, SM: 62, EU: 63, GD: 64,
    TB: 65, DY: 66, HO: 67, ER: 68, TM: 69, YB: 70, LU: 71,
    AC: 89, TH: 90, PA: 91, U: 92, NP: 93, PU: 94, AM: 95, CM: 96,
    BK: 97, CF: 98, ES: 99, FM: 100, MD: 101, NO: 102, LR: 103,
    DS: 110, RG: 111, CN: 112, NH: 113, FL: 114, MC: 115, LV: 116,
    TS: 117, OG: 118
  };

  function pad3(n) { return ('00' + n).slice(-3); }

  function solveGorgofex(deadshot, room) {
    var primary = Object.prototype.hasOwnProperty.call(PERIODIC_TABLE, deadshot + room)
      ? PERIODIC_TABLE[deadshot + room] : null;
    var alternate = null;
    if (deadshot && room && Object.prototype.hasOwnProperty.call(PERIODIC_TABLE, room + deadshot)) {
      alternate = PERIODIC_TABLE[room + deadshot];
    }
    return { primary: primary, alternate: alternate };
  }

  var TELEPORTER_ITEMS = [
    { digit: 6, label: 'BND Badge',      precedence: 1 },
    { digit: 1, label: "Notso's Collar", precedence: 2 },
    { digit: 3, label: 'Scarf',          precedence: 3 },
    { digit: 4, label: 'Wristwatch',     precedence: 4 },
    { digit: 5, label: 'Combat Goggles', precedence: 5 },
    { digit: 2, label: 'Katana',         precedence: 6 }
  ];
  var TELEPORTER_TARGET = 4;

  /* ==========================================================
     4. BO7 DATA — OFFICIAL_BO7_ZOMBIES_SOLVER.py section 5
     ========================================================== */

  var SYMBOL_BUTTONS = {
    1:  { label: '1',  image: 'ashesgauntlet1.jpg',  group: 'Tower' },
    2:  { label: '2',  image: 'ashesgauntlet2.jpg',  group: 'Tower' },
    3:  { label: '3',  image: 'ashesgauntlet3.jpg',  group: 'Tower' },
    4:  { label: '4',  image: 'ashesgauntlet4.jpg',  group: 'Tower' },
    5:  { label: '5',  image: 'ashesgauntlet5.jpg',  group: 'Barn' },
    6:  { label: '6',  image: 'ashesgauntlet6.jpg',  group: 'Barn' },
    7:  { label: '7',  image: 'ashesgauntlet7.jpg',  group: 'Barn' },
    8:  { label: '8',  image: 'ashesgauntlet8.jpg',  group: 'Barn' },
    9:  { label: '9',  image: 'ashesgauntlet9.jpg',  group: 'House' },
    10: { label: '10', image: 'ashesgauntlet10.jpg', group: 'House' },
    11: { label: '11', image: 'ashesgauntlet11.jpg', group: 'House' },
    12: { label: '12', image: 'ashesgauntlet12.jpg', group: 'House' }
  };
  var GAUNTLET_GROUPS = ['Tower', 'Barn', 'House'];
  var GAUNTLET_GROUP_HINTS = {
    Tower: ' - Left Of Eye',
    Barn:  ' - Back Of Eye',
    House: ' - Right Of Eye'
  };

  var MK2_BUTTONS = [
    { v: 1, button: '1', label: '1 - Janus Towers' },
    { v: 2, button: '2', label: '2 - Vandorn Farm' },
    { v: 3, button: '3', label: '3 - Ashwood (Doubletap Side)' },
    { v: 4, button: '4', label: '4 - Blackwater' },
    { v: 5, button: '5', label: '5 - Exit 115' },
    { v: 6, button: '6', label: '6 - Zarya Cosmodrome' },
    { v: 7, button: '7', label: '7 - Ashwood (Jugg Side)' }
  ];

  var ASTRA_SKULLS = [1, 2, 3, 4, 5];

  var PLANET_BUTTONS = [
    { v: 1, label: 'Mercury' }, { v: 2, label: 'Venus' },
    { v: 3, label: 'Earth' },   { v: 4, label: 'Mars' },
    { v: 5, label: 'Jupiter' }, { v: 6, label: 'Saturn' },
    { v: 7, label: 'Uranus' },  { v: 8, label: 'Neptune' }
  ];
  var PLANET_TARGET = 3;

  var PILLAR_BUTTONS = [
    { v: 1, button: '1' }, { v: 2, button: '2' }, { v: 3, button: '3' },
    { v: 4, button: '4' }, { v: 5, button: '5' }, { v: 0, button: 'STATIC' }
  ];
  var PILLAR_TARGET = 5;

  var STATUE_BOOKS = [
    {
      key: 'STATUE_1_GRAMOPHONE', bookshelf: 'Gramophone Statue',
      books: [
        { label: 'WITCHLIGHT CODEX', id: 'w_codex' },
        { label: 'PYRAMIDS OF CYDONIA', id: 'p_cydonia' },
        { label: 'SILENCE AT SINGULARITY', id: 's_singularity' }
      ]
    },
    {
      key: 'STATUE_2_BANISTER', bookshelf: 'Banister Statue',
      books: [
        { label: 'THE BLACK VEIL', id: 'b_veil' },
        { label: 'THE MOON DIRECTIVE', id: 'm_directive' },
        { label: 'THE MUSICA UNIVERSALIS', id: 'm_universalis' }
      ]
    },
    {
      key: 'STATUE_3_PAINTING', bookshelf: 'Painting Statue',
      books: [
        { label: 'THE UNKNOWABLE VOID', id: 'u_void' },
        { label: 'ECHOES OF ANDROMEDA', id: 'e_andromeda' },
        { label: 'ASH AND BONE', id: 'a_bone' }
      ]
    }
  ];
  var BOOK_TO_STATUE = {};
  STATUE_BOOKS.forEach(function (s) {
    s.books.forEach(function (b) { BOOK_TO_STATUE[b.id] = s.key; });
  });

  var KOWAKUJO_CELLS = ['a1', 'a2', 'a3', 'b1', 'b2', 'b3', 'c1', 'c2', 'c3'];
  var KOWAKUJO_CELL_IDX = {};
  KOWAKUJO_CELLS.forEach(function (c, i) { KOWAKUJO_CELL_IDX[c] = i; });
  var KOWAKUJO_TOGGLES = {
    a1: ['a1', 'a2', 'b1'],
    a2: ['a1', 'a2', 'a3', 'b2'],
    a3: ['a3', 'a2', 'b3'],
    b1: ['b1', 'a1', 'b2', 'c1'],
    b2: ['b2', 'a2', 'b1', 'b3', 'c2'],
    b3: ['b3', 'a3', 'b2', 'c3'],
    c1: ['c1', 'b1', 'c2'],
    c2: ['c2', 'c1', 'b2', 'c3'],
    c3: ['c3', 'b3', 'c2']
  };
  var KOWAKUJO_LAYOUT = [['a1', 'b1', 'c1'], ['a2', 'b2', 'c2'], ['a3', 'b3', 'c3']];
  var KOWAKUJO_POSITION_NAMES = {
    A1: 'Left Top',    B1: 'Middle Top',    C1: 'Right Top',
    A2: 'Left Middle', B2: 'Middle Middle', C2: 'Right Middle',
    A3: 'Left Bottom', B3: 'Middle Bottom', C3: 'Right Bottom'
  };

  /* GF(2) Gaussian elimination, minimum-weight solution.
     Direct port of kowakujo_solve_matrix(). */
  function kowakujoSolveMatrix(bState) {
    var size = KOWAKUJO_CELLS.length, i, r, k, col;
    var A = [];
    for (i = 0; i < size; i++) { A.push(new Array(size).fill(0)); }
    Object.keys(KOWAKUJO_TOGGLES).forEach(function (btn) {
      var c = KOWAKUJO_CELL_IDX[btn];
      KOWAKUJO_TOGGLES[btn].forEach(function (cell) {
        A[KOWAKUJO_CELL_IDX[cell]][c] ^= 1;
      });
    });

    var aug = [];
    for (i = 0; i < size; i++) { aug.push(A[i].slice().concat([bState[i]])); }

    var pivots = [], rowIdx = 0;
    for (col = 0; col < size; col++) {
      var pivot = -1;
      for (r = rowIdx; r < size; r++) { if (aug[r][col]) { pivot = r; break; } }
      if (pivot < 0) continue;
      var tmp = aug[rowIdx]; aug[rowIdx] = aug[pivot]; aug[pivot] = tmp;
      for (r = 0; r < size; r++) {
        if (r !== rowIdx && aug[r][col]) {
          var nr = new Array(size + 1);
          for (k = 0; k <= size; k++) { nr[k] = aug[r][k] ^ aug[rowIdx][k]; }
          aug[r] = nr;
        }
      }
      pivots.push([rowIdx, col]);
      rowIdx++;
    }

    for (r = rowIdx; r < size; r++) { if (aug[r][size]) return null; }

    var pivotCols = {};
    pivots.forEach(function (p) { pivotCols[p[1]] = true; });
    var free = [];
    for (col = 0; col < size; col++) { if (!pivotCols[col]) free.push(col); }

    var best = null, bestWeight = size + 1;
    var total = 1 << free.length;
    for (var mask = 0; mask < total; mask++) {
      var sol = new Array(size).fill(0);
      for (i = 0; i < free.length; i++) { sol[free[i]] = (mask >> i) & 1; }
      for (i = pivots.length - 1; i >= 0; i--) {
        var pr = pivots[i][0], pc = pivots[i][1];
        var value = aug[pr][size];
        for (k = pc + 1; k < size; k++) { if (aug[pr][k]) value ^= sol[k]; }
        sol[pc] = value;
      }
      var w = 0;
      for (i = 0; i < size; i++) w += sol[i];
      if (w < bestWeight) { best = sol.slice(); bestWeight = w; }
    }
    return best;
  }

  var MYSTERY_OPTIONS = {
    accomplice: [['merchant', 'Merchant'], ['courtier', 'Courtier'], ['gardener', 'Gardener']],
    symptom: [['emesis', 'Noxious Food + Emesis'], ['plant', 'Contaminated / Noxious Plant'],
              ['paralysis', 'Evidence of Paralysis']],
    symbol: [['fish', 'Fish'], ['mountains', 'Mountains'], ['bird', 'Bird']],
    zodiac: [[0, 'Rat'], [1, 'Ox'], [2, 'Tiger'], [3, 'Hare'], [4, 'Dragon'], [5, 'Snake'],
             [6, 'Horse'], [7, 'Goat'], [8, 'Monkey'], [9, 'Rooster'], [10, 'Dog'], [11, 'Boar']],
    onset: (function () {
      var a = [];
      for (var n = 1; n <= 12; n++) { a.push([n, n + ' Hour' + (n !== 1 ? 's' : '')]); }
      return a;
    })()
  };
  var MYSTERY_NUMERIC = { zodiac: true, onset: true };
  var MYSTERY_CATEGORY_LABELS = {
    accomplice: 'Accomplice',
    symptom: 'Cause Of Death',
    symbol: 'Location (4th Painting)',
    zodiac: 'Time Of Death (Zodiac Hour)',
    onset: 'Toxin Onset Time'
  };
  var ACCOMPLICE_ITEMS = { merchant: 'Abacus', courtier: "Noble's Hat", gardener: "Gardener's Shears" };
  var SYMBOL_ITEMS = { fish: 'Tea Whisk', mountains: 'Horse Statuette', bird: 'Calligraphy Brush' };
  var ACCOMPLICE_OPTIONS = {
    courtier: ['Pufferfish', 'Monkshood Flower'],
    gardener: ['Plum Pit', 'Monkshood Flower'],
    merchant: ['Pufferfish', 'Plum Pit']
  };
  var SYMPTOM_OPTIONS = {
    paralysis: ['Pufferfish', 'Monkshood Flower'],
    plant: ['Monkshood Flower', 'Plum Pit'],
    emesis: ['Pufferfish', 'Plum Pit']
  };
  var ZODIAC_NAMES = ['Rat', 'Ox', 'Tiger', 'Hare', 'Dragon', 'Snake',
                      'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Boar'];

  function solvePoison(accomplice, symptom) {
    if (!accomplice || !symptom) return '[Select Accomplice & Cause Of Death]';
    var a = ACCOMPLICE_OPTIONS[accomplice] || [];
    var s = SYMPTOM_OPTIONS[symptom] || [];
    var overlap = a.filter(function (item) { return s.indexOf(item) !== -1; });
    if (overlap.length === 1) return overlap[0];
    if (overlap.length > 1) return '[Ambiguous - Check Clues]';
    return '[No Match - Check Clues]';
  }

  var REX_CRANK_RING = ['House', 'Nyxara', 'Veytharion', 'Empty', 'Dravakar', 'Caltheris'];
  var REX_CRANK_TEMPLES = ['Veytharion', 'Caltheris', 'Dravakar', 'Nyxara'];
  var REX_CRANK_NAMES = ['Inner', 'Middle', 'Outer'];
  var REX_CRANK_WHERE = { Inner: 'Closest To PaP', Middle: '', Outer: 'Furthest From PaP' };
  var REX_CRANK_DISPLAY = { House: 'The House', Empty: 'None Of The Above' };
  var REX_CRANK_PICK_ORDER = ['Veytharion', 'Caltheris', 'Dravakar', 'Nyxara', 'House', 'Empty'];
  var REX_LEVER_LOOK = {
    horizontal: {
      spin: -1, short: 'Horizontal',
      look: 'Not Pointing At Stairs & Perk Machine', direction: 'Counter-Clockwise'
    },
    vertical: {
      spin: 1, short: 'Vertical',
      look: 'Pointing At Stairs & Perk Machine', direction: 'Clockwise'
    }
  };

  function crankLabel(ringName) { return REX_CRANK_DISPLAY[ringName] || ringName; }
  function mod6(n) { return ((n % 6) + 6) % 6; }

  /* Direct port of rex_crank_solve(): breadth-first, identical visit order. */
  function rexCrankSolve(starts, targetPos, direction) {
    var start = starts.slice();
    if (start[0] === targetPos && start[1] === targetPos && start[2] === targetPos) {
      return [0, 0, 0];
    }
    var visited = {};
    visited[start.join(',')] = null;
    var queue = [start];
    var head = 0;
    while (head < queue.length) {
      var current = queue[head++];
      for (var turned = 0; turned < 3; turned++) {
        var nxt = [
          mod6(current[0] + direction * (0 === turned ? 1 : 2)),
          mod6(current[1] + direction * (1 === turned ? 1 : 2)),
          mod6(current[2] + direction * (2 === turned ? 1 : 2))
        ];
        var key = nxt.join(',');
        if (Object.prototype.hasOwnProperty.call(visited, key)) continue;
        visited[key] = { prev: current.join(','), turned: turned };
        if (nxt[0] === targetPos && nxt[1] === targetPos && nxt[2] === targetPos) {
          var counts = [0, 0, 0];
          var node = key;
          while (visited[node] !== null) {
            counts[visited[node].turned] += 1;
            node = visited[node].prev;
          }
          return counts;
        }
        queue.push(nxt);
      }
    }
    return null;
  }

  function rexCrankCosts(starts, direction) {
    var costs = [];
    REX_CRANK_TEMPLES.forEach(function (temple) {
      var counts = rexCrankSolve(starts, REX_CRANK_RING.indexOf(temple), direction);
      if (counts !== null) {
        costs.push({ total: counts[0] + counts[1] + counts[2], temple: temple, counts: counts });
      }
    });
    costs.sort(function (a, b) {
      if (a.total !== b.total) return a.total - b.total;
      return a.temple < b.temple ? -1 : (a.temple > b.temple ? 1 : 0);
    });
    return costs;
  }

  /* ==========================================================
     5. SHARED WIDGET BEHAVIOURS
     ========================================================== */

  /* Single-choice button group. onPick(value) fires on every change. */
  function singleChoice(container, labelText, options, onPick, hint) {
    var g = optGroup(labelText, hint);
    var chips = {};
    options.forEach(function (o) {
      var b = chip(o.label, o.cls);
      b.addEventListener('click', function () {
        Object.keys(chips).forEach(function (k) {
          chips[k].classList.remove('is-on');
          chips[k].setAttribute('aria-pressed', 'false');
        });
        b.classList.add('is-on');
        b.setAttribute('aria-pressed', 'true');
        onPick(o.v);
      });
      b.setAttribute('aria-pressed', 'false');
      chips[String(o.v)] = b;
      g.btns.appendChild(b);
    });
    container.appendChild(g.wrap);
    return {
      chips: chips,
      group: g.wrap,
      clear: function () {
        Object.keys(chips).forEach(function (k) {
          chips[k].classList.remove('is-on');
          chips[k].setAttribute('aria-pressed', 'false');
          chips[k].disabled = false;
        });
      },
      setDisabled: function (value, off) {
        var b = chips[String(value)];
        if (b) b.disabled = !!off;
      },
      select: function (value) {
        var b = chips[String(value)];
        if (b) b.click();
      }
    };
  }

  /* "Tell me the order these happened" — port of SequenceToolView. */
  function sequenceWidget(root, opts) {
    var io = makeIO(root);
    var picks = [];
    var g = optGroup(opts.prompt, opts.hint);
    var chips = {};
    opts.options.forEach(function (o) {
      var b = opts.image
        ? imgChip(opts.image.game, o.image, o.button, o.alt)
        : chip(o.button);
      b.addEventListener('click', function () {
        if (picks.indexOf(o.v) !== -1) return;
        if (picks.length >= opts.target) return;
        picks.push(o.v);
        paint();
      });
      chips[o.v] = b;
      g.btns.appendChild(b);
    });
    if (opts.image) g.btns.classList.add('solver-opt-btns--img');
    io.controls.appendChild(g.wrap);

    var act = actions();
    var undo = button('Undo Last');
    var reset = button('Reset');
    act.appendChild(undo);
    act.appendChild(reset);
    io.controls.appendChild(act);

    undo.addEventListener('click', function () { picks.pop(); paint(); });
    reset.addEventListener('click', function () { picks.length = 0; paint(); });

    function paint() {
      var complete = picks.length >= opts.target;
      opts.options.forEach(function (o) {
        var chosen = picks.indexOf(o.v) !== -1;
        chips[o.v].classList.toggle('is-on', chosen);
        chips[o.v].disabled = chosen || complete;
        var order = picks.indexOf(o.v);
        chips[o.v].setAttribute('data-order', order === -1 ? '' : String(order + 1));
        chips[o.v].classList.toggle('has-order', order !== -1);
      });
      undo.disabled = picks.length === 0;
      reset.disabled = picks.length === 0;
      if (picks.length === 0) { idle(io.out, opts.idle); return; }
      opts.render(io.out, picks, complete);
    }
    paint();
    return io;
  }

  /* ==========================================================
     6. WIDGETS
     ========================================================== */

  var WIDGETS = {};

  /* ---------- BO3: Gorod Krovi Valve Step ---------- */
  WIDGETS.valve = function (root) {
    var io = makeIO(root);
    var state = { green: null, pink: null };
    var opts = VALVE_LOCATIONS.map(function (n) { return { v: n, label: n }; });

    var greenG = singleChoice(io.controls, 'Green Light Is In', opts, function (v) {
      state.green = v;
      if (state.pink === v) { state.pink = null; pinkG.clear(); }
      VALVE_LOCATIONS.forEach(function (n) { pinkG.setDisabled(n, n === v); });
      run();
    }, 'The Room With The Green Light Above Its Valve');

    var pinkG = singleChoice(io.controls, 'Pink Cylinder Is In', opts, function (v) {
      state.pink = v;
      run();
    }, 'This Room Is Your Endpoint');

    var act = actions();
    var reset = button('Start Over');
    act.appendChild(reset);
    io.controls.appendChild(act);
    reset.addEventListener('click', function () {
      state.green = state.pink = null;
      greenG.clear();
      pinkG.clear();
      run();
    });

    function run() {
      if (!state.green || !state.pink) {
        idle(io.out, 'Pick Your Green Light Room And Your Pink Cylinder Room. ' +
          'Every Valve Setting Appears Here.');
        return;
      }
      var answer = solveValves(state.green, state.pink);
      if (!answer) {
        beginWarn(io.out, 'No Match');
        io.out.appendChild(note('There Is No Route Stored For Green ' + state.green +
          ' To Pink ' + state.pink + '. Double-Check The Two Rooms.', 'warn'));
        return;
      }
      begin(io.out, 'Your Valve Settings');
      io.out.appendChild(kv('Green Light At ', state.green));
      io.out.appendChild(kv('Pink Cylinder At ', state.pink));
      io.out.appendChild(subhead('Go Around The Map And Set'));
      io.out.appendChild(answerList(answer.map(function (row) {
        return codeNode(row[0], String(row[1]), ' \u2014 Set To ');
      })));
      io.out.appendChild(note('Then Grab Your Pink Cylinder At ' + state.pink +
        ' \u2014 Your Endpoint. The Endpoint Room Never Gets A Setting.'));
    }
    run();
  };

  /* ---------- BO6: Beamsmasher ---------- */
  WIDGETS.beamsmasher = function (root) {
    var io = makeIO(root);
    var grid = el('div', 'solver-fieldrow');
    var fx = numberField('X Value', 'e.g. 1');
    var fy = numberField('Y Value', 'e.g. 2');
    var fz = numberField('Z Value', 'e.g. 3');
    grid.appendChild(fx.wrap);
    grid.appendChild(fy.wrap);
    grid.appendChild(fz.wrap);
    io.controls.appendChild(grid);

    var act = actions();
    var go = button('Solve', 'btn btn-accent');
    var reset = button('Reset');
    act.appendChild(go);
    act.appendChild(reset);
    io.controls.appendChild(act);

    function parseVal(raw) {
      var s = (raw || '').trim();
      if (s === '') return NaN;
      if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return NaN;
      var n = parseFloat(s);
      if (!isFinite(n)) return NaN;
      if (Math.floor(n) !== n) return NaN;   /* reject 2.7, never floor it */
      return n;
    }

    function run() {
      var x = parseVal(fx.input.value);
      var y = parseVal(fy.input.value);
      var z = parseVal(fz.input.value);
      if (isNaN(x) || isNaN(y) || isNaN(z) ||
          Math.abs(x) > BEAMSMASHER_LIMIT || Math.abs(y) > BEAMSMASHER_LIMIT ||
          Math.abs(z) > BEAMSMASHER_LIMIT) {
        beginWarn(io.out, 'Invalid Entry');
        io.out.appendChild(note('Enter Whole Numbers From -99 To 99 Only, Then Try Again.', 'warn'));
        return;
      }
      begin(io.out, 'Results For X=' + x + ', Y=' + y + ', Z=' + z);
      io.out.appendChild(answerList([
        codeNode('First Number', String(beamFirst(x))),
        codeNode('Second Number', String(beamSecond(x, y, z))),
        codeNode('Third Number', String(beamThird(x, y, z)))
      ]));
    }

    function resetAll() {
      fx.input.value = ''; fy.input.value = ''; fz.input.value = '';
      idle(io.out, 'Enter The Three Numbers Your Game Shows. The Three Numbers ' +
        'To Enter Back Appear Here.');
    }

    go.addEventListener('click', run);
    reset.addEventListener('click', resetAll);
    [fx, fy, fz].forEach(function (f) {
      f.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); run(); }
      });
    });
    resetAll();
  };

  /* ---------- BO6: Projector & Straus Counter ---------- */
  WIDGETS.projector = function (root) {
    var io = makeIO(root);
    singleChoice(io.controls, 'What Colour Is Your Straus Counter?',
      STRAUS_ORDER.map(function (k) {
        return { v: k, label: STRAUS_COLOURS[k].button, cls: 'solver-chip--' + k };
      }),
      function (key) {
        var d = STRAUS_COLOURS[key];
        begin(io.out, 'Turn Your Projector To ' + d.projector);
        io.out.appendChild(el('p', 'solver-verdict solver-verdict--' + d.projector.toLowerCase(),
          d.projector));
        io.out.appendChild(note('Since Your Straus Counter Is ' + d.counter +
          ', Turn Your Projector To ' + d.projector + '.'));
      });
    idle(io.out, 'Pick Your Straus Counter Colour. The Projector Colour Appears Here.');
  };

  /* ---------- BO6: Raven sword fossils ---------- */
  WIDGETS.raven = function (root) {
    var io = makeIO(root);
    singleChoice(io.controls, 'Which Fossil Do You Have?',
      Object.keys(FOSSILS).map(function (k) { return { v: k, label: k }; }),
      function (k) {
        begin(io.out, 'Fossil ' + k + ' \u2014 Your Code');
        io.out.appendChild(note('Insert The Sword In The Basement And Enter This Code.'));
        io.out.appendChild(imagePlate('bo6', FOSSILS[k].image,
          'Fossil ' + k + ' Code', 'Fossil ' + k + ' Code'));
      },
      'Match It Against The Chart Above \u2014 Both Views Are Shown There');
    idle(io.out, 'Pick Your Fossil Number. Its Code Image Appears Here.');
  };

  /* ---------- BO6: The Tomb rune tracker ---------- */
  WIDGETS.runes = function (root) {
    var io = makeIO(root);
    var picked = [];
    var g = optGroup('Select The Runes In Your Game',
      'Tap Again To Un-Pick A Mis-Tap');
    var chips = {};
    for (var n = 1; n <= RUNE_COUNT; n++) {
      (function (num) {
        var b = chip(String(num));
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          var i = picked.indexOf(num);
          if (i !== -1) picked.splice(i, 1); else picked.push(num);
          paint();
        });
        chips[num] = b;
        g.btns.appendChild(b);
      })(n);
    }
    io.controls.appendChild(g.wrap);

    var act = actions();
    var reset = button('Reset');
    act.appendChild(reset);
    io.controls.appendChild(act);
    reset.addEventListener('click', function () { picked.length = 0; paint(); });

    function paint() {
      Object.keys(chips).forEach(function (k) {
        var on = picked.indexOf(Number(k)) !== -1;
        chips[k].classList.toggle('is-on', on);
        chips[k].setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      reset.disabled = picked.length === 0;
      if (!picked.length) {
        idle(io.out, 'Tap The Runes You See In Your Game. They Are Listed Back Here So ' +
          'You Do Not Have To Hold Them In Your Head.');
        return;
      }
      begin(io.out, 'Selected Runes');
      io.out.appendChild(el('p', 'solver-verdict',
        picked.map(function (x) { return 'Rune ' + x; }).join(', ')));
      io.out.appendChild(note('This Tool Records Your Runes \u2014 It Does Not Calculate ' +
        'Anything, And Neither Does The Discord Bot.'));
    }
    paint();
  };

  /* ---------- BO6: MKII Chalkboard ---------- */
  WIDGETS.chalkboard = function (root) {
    var io = makeIO(root);
    singleChoice(io.controls, 'Letters On The Bottom Left Of Your Chalkboard',
      CHALKBOARD_KEYS.map(function (k) { return { v: k, label: k }; }),
      function (key) {
        var codes = CHALKBOARDS[key];
        begin(io.out, 'Chalkboard ' + key + ' Codes');
        io.out.appendChild(note('The Printed Page Names One Of These Four Words. ' +
          'The Number Beside It Is Your Service Tunnel Code.'));
        io.out.appendChild(answerList(CHALKBOARD_WORDS.map(function (w) {
          return codeNode(w.toUpperCase(), String(codes[w]), ': ');
        })));
      });
    idle(io.out, 'Pick Your Chalkboard Letters. All Four Possible Codes Appear Here.');
  };

  /* ---------- BO6: Gorgofex periodic code ---------- */
  WIDGETS.gorgofex = function (root) {
    var io = makeIO(root);
    var grid = el('div', 'solver-fieldrow');
    var fd = textField('Deadshot Monitor Letter', 'First Letter', 2);
    var fr = textField('Periodic Room Letter', 'First Letter', 2);
    grid.appendChild(fd.wrap);
    grid.appendChild(fr.wrap);
    io.controls.appendChild(grid);

    var act = actions();
    var go = button('Find My Code', 'btn btn-accent');
    var reset = button('Reset');
    act.appendChild(go);
    act.appendChild(reset);
    io.controls.appendChild(act);

    function run() {
      var d = (fd.input.value || '').trim().toUpperCase();
      var r = (fr.input.value || '').trim().toUpperCase();
      if (!d && !r) {
        beginWarn(io.out, 'Enter At Least One Letter');
        io.out.appendChild(note('Sometimes Only One Monitor Shows A Word. That Is Normal ' +
          '\u2014 Enter The One You Have.', 'warn'));
        return;
      }
      var res = solveGorgofex(d, r);
      if (res.primary === null) {
        beginWarn(io.out, 'Could Not Find Combination For "' + d + r + '"');
        io.out.appendChild(note('That Is Not An Element On The Periodic Table. Check Both ' +
          'Letters, Or End The Round To Refresh Your Monitors.', 'warn'));
        return;
      }
      begin(io.out, 'Unlock Code');
      io.out.appendChild(bigCode(pad3(res.primary)));
      io.out.appendChild(kv('Element: ', d + r));
      if (res.alternate !== null) {
        io.out.appendChild(subhead('Alternate Possible Combination'));
        io.out.appendChild(answerList([codeNode('If ' + r + d + ' Instead',
          pad3(res.alternate), ' \u2014 ')]));
      }
      io.out.appendChild(note('If Neither Code Works You Entered The Letters Wrong. End The ' +
        'Round To Refresh Your Monitors And Enter The New Letters.'));
    }

    function resetAll() {
      fd.input.value = ''; fr.input.value = '';
      idle(io.out, 'Enter The First Letter From Each Monitor. The Three-Digit Door Code ' +
        'Appears Here.');
    }
    go.addEventListener('click', run);
    reset.addEventListener('click', resetAll);
    [fd, fr].forEach(function (f) {
      f.input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); run(); }
      });
    });
    resetAll();
  };

  /* ---------- BO6: Reckoning teleporter code ---------- */
  WIDGETS.teleporter = function (root) {
    function itemOf(d) {
      return TELEPORTER_ITEMS.filter(function (i) { return i.digit === d; })[0];
    }
    sequenceWidget(root, {
      prompt: 'Which Four Folder Items Did You Find?',
      hint: 'Order Does Not Matter \u2014 The Code Is Sorted For You',
      options: TELEPORTER_ITEMS.map(function (i) {
        return { v: i.digit, button: i.digit + ' \u00b7 ' + i.label };
      }),
      target: TELEPORTER_TARGET,
      idle: 'Pick The Four Items Pictured On Your Folders. Your Four-Digit Code Appears Here.',
      render: function (out, picks, complete) {
        var ordered = picks.slice().sort(function (a, b) {
          return itemOf(a).precedence - itemOf(b).precedence;
        });
        if (!complete) {
          progress(out, 'Selected ' + picks.length + ' Of ' + TELEPORTER_TARGET);
          out.appendChild(answerList(ordered.map(function (d) {
            return itemOf(d).digit + ' \u00b7 ' + itemOf(d).label;
          })));
          return;
        }
        begin(out, 'Your Teleportation Room Code');
        out.appendChild(bigCode(ordered.join('-')));
        out.appendChild(subhead('Read In This Order'));
        out.appendChild(stepList(ordered.map(function (d) {
          return codeNode(itemOf(d).label, String(itemOf(d).digit), ' \u2014 ');
        })));
      }
    });
  };

  /* ---------- BO7: Free RG-MK2 jump pads ---------- */
  WIDGETS.mk2 = function (root) {
    function labelOf(v) {
      return MK2_BUTTONS.filter(function (b) { return b.v === v; })[0].label;
    }
    sequenceWidget(root, {
      prompt: 'Tap The Jump Pads In The Order You Take Them',
      hint: 'All ' + MK2_BUTTONS.length + ' Pads',
      options: MK2_BUTTONS,
      target: MK2_BUTTONS.length,
      idle: 'Tap All Seven Pads In Order. Your Route Appears Here As A Chain Of Hops.',
      render: function (out, picks, complete) {
        if (!complete) {
          progress(out, 'Selected ' + picks.length + ' Of ' + MK2_BUTTONS.length);
          out.appendChild(stepList(picks.map(function (v) { return labelOf(v); })));
          return;
        }
        begin(out, 'Your Jump Pad Sequence');
        var steps = [];
        for (var i = 0; i < picks.length - 1; i++) {
          var f = frag();
          f.appendChild(el('strong', null, labelOf(picks[i])));
          f.appendChild(document.createTextNode(' To '));
          f.appendChild(el('strong', null, labelOf(picks[i + 1])));
          steps.push(f);
        }
        out.appendChild(stepList(steps));
      }
    });
  };

  /* ---------- BO7: Purple skulls ---------- */
  WIDGETS.skulls = function (root) {
    sequenceWidget(root, {
      prompt: 'Tap The Skulls In Shooting Order',
      hint: 'All ' + ASTRA_SKULLS.length,
      options: ASTRA_SKULLS.map(function (n) { return { v: n, button: String(n) }; }),
      target: ASTRA_SKULLS.length,
      idle: 'Tap The Five Skulls In The Order You Need To Shoot Them.',
      render: function (out, picks, complete) {
        if (!complete) progress(out, 'Selected ' + picks.length + ' Of ' + ASTRA_SKULLS.length);
        else begin(out, 'Shoot The Skulls In This Order');
        out.appendChild(stepList(picks.map(function (v) { return 'Skull ' + v; })));
      }
    });
  };

  /* ---------- BO7: Oscar's planet order ---------- */
  WIDGETS.planets = function (root) {
    sequenceWidget(root, {
      prompt: 'Tap The Planets In The Order Oscar Names Them',
      hint: 'Pick ' + PLANET_TARGET,
      options: PLANET_BUTTONS.map(function (p) { return { v: p.v, button: p.label }; }),
      target: PLANET_TARGET,
      idle: 'Oscar Says "Playback Of Elimination 20\u2026" Then Names Three Planets. ' +
            'Tap Them In Order.',
      render: function (out, picks, complete) {
        var code = picks.join('');
        if (!complete) {
          progress(out, 'Selected ' + picks.length + ' Of ' + PLANET_TARGET);
          out.appendChild(kv('Code So Far: ', code || '---'));
        } else {
          begin(out, 'Insert This Code Into The Machine');
          out.appendChild(bigCode(code));
        }
        out.appendChild(stepList(picks.map(function (v) {
          var pb = PLANET_BUTTONS.filter(function (x) { return x.v === v; })[0];
          return codeNode(pb.label, String(pb.v), ' \u2014 ');
        })));
      }
    });
  };

  /* ---------- BO7: Pillar piano symbols ---------- */
  WIDGETS.pillars = function (root) {
    sequenceWidget(root, {
      prompt: 'Tap The Symbols In The Order They Played',
      hint: 'Use STATIC For The Fixed Symbol',
      options: PILLAR_BUTTONS.map(function (p) { return { v: p.v, button: p.button }; }),
      target: PILLAR_TARGET,
      idle: 'Tap 1-5 In The Order They Appeared, Using STATIC For The Fixed One. ' +
            'The Solver Fills In Whichever Number You Never Saw.',
      render: function (out, picks, complete) {
        var display = picks.map(function (n) { return n === 0 ? 'STATIC' : String(n); }).join(' - ');
        if (!complete) {
          progress(out, 'Selected ' + picks.length + ' Of ' + PILLAR_TARGET);
          out.appendChild(kv('Current Order: ', display || '---'));
          return;
        }
        var seen = {};
        picks.forEach(function (n) { if (n !== 0) seen[n] = true; });
        var missing = [1, 2, 3, 4, 5].filter(function (n) { return !seen[n]; });
        var standIn = missing.length ? missing[0] : null;
        var resolved = picks.map(function (n) {
          return n === 0 ? (standIn !== null ? String(standIn) : '?') : String(n);
        });
        begin(out, 'Final Sequence');
        out.appendChild(bigCode(resolved.join(' - ')));
        out.appendChild(kv('You Entered: ', display));
        if (standIn !== null) {
          out.appendChild(kv('STATIC Resolved To: ', String(standIn)));
        }
        out.appendChild(note('This Is The Order Your Piano Symbols Appeared. ' +
          'Use The Sheet To Now Activate Your Pillars.'));
      }
    });
  };

  /* ---------- BO7: Statues / Book EE ---------- */
  WIDGETS.statues = function (root) {
    var io = makeIO(root);
    var chosen = [];
    var total = Object.keys(BOOK_TO_STATUE).length;
    var chips = {};

    function titleCaseBook(s) {
      return s.toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    }

    STATUE_BOOKS.forEach(function (statue) {
      var g = optGroup(statue.bookshelf, 'Tap Each Book That Appeared');
      statue.books.forEach(function (book) {
        var b = chip(titleCaseBook(book.label));
        b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', function () {
          var i = chosen.indexOf(book.id);
          if (i !== -1) chosen.splice(i, 1); else chosen.push(book.id);
          paint();
        });
        chips[book.id] = b;
        g.btns.appendChild(b);
      });
      io.controls.appendChild(g.wrap);
    });

    var act = actions();
    var reset = button('Reset');
    act.appendChild(reset);
    io.controls.appendChild(act);
    reset.addEventListener('click', function () { chosen.length = 0; paint(); });

    function paint() {
      Object.keys(chips).forEach(function (id) {
        var on = chosen.indexOf(id) !== -1;
        chips[id].classList.toggle('is-on', on);
        chips[id].setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      reset.disabled = chosen.length === 0;
      if (!chosen.length) {
        idle(io.out, 'Tap Every Book That Appeared Next To The Statues In Your Game. ' +
          'The Turn Counts Update Live.');
        return;
      }
      var counts = {};
      STATUE_BOOKS.forEach(function (s) { counts[s.key] = 0; });
      chosen.forEach(function (id) {
        var k = BOOK_TO_STATUE[id];
        if (k) counts[k] += 1;
      });
      begin(io.out, 'Final Turn Sequence');
      io.out.appendChild(kv('Selected Books: ', chosen.length + ' Of ' + total));
      io.out.appendChild(answerList(STATUE_BOOKS.map(function (s) {
        return codeNode(s.bookshelf, String(counts[s.key]), ': ');
      })));
      io.out.appendChild(note('Turn Each Statue That Many Times.'));
    }
    paint();
  };

  /* ---------- BO7: Kowakujo scrolls ---------- */
  WIDGETS.scrolls = function (root) {
    var io = makeIO(root);
    var lit = {};
    var cells = {};
    /* An untouched grid is all-IN, which is technically already solved. Showing
       "nothing to press" before the player has entered anything reads as though
       the tool answered on its own, so hold the idle prompt until first tap. */
    var touched = false;

    var lead = el('p', 'solver-opt-label', 'Match The Grid To Your Screen');
    io.controls.appendChild(lead);

    var grid = el('div', 'solver-grid3');
    KOWAKUJO_LAYOUT.forEach(function (rowCells) {
      rowCells.forEach(function (cell) {
        var b = el('button', 'solver-cell');
        b.type = 'button';
        paintCell(b, cell);
        b.addEventListener('click', function () {
          lit[cell] = !lit[cell];
          touched = true;
          paintCell(b, cell);
          solve();
        });
        cells[cell] = b;
        grid.appendChild(b);
      });
    });
    io.controls.appendChild(grid);

    function paintCell(b, cell) {
      var on = !!lit[cell];
      clear(b);
      b.appendChild(el('span', 'solver-cell-id', cell.toUpperCase()));
      b.appendChild(el('span', 'solver-cell-state', on ? 'OUT' : 'IN'));
      b.classList.toggle('is-out', on);
      b.classList.toggle('is-in', !on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    var legend = el('p', 'solver-legend');
    var lo = el('span', 'solver-legend-item solver-legend-item--out');
    lo.appendChild(el('strong', null, 'OUT'));
    lo.appendChild(document.createTextNode(' Facing Outwards / Active'));
    var li2 = el('span', 'solver-legend-item solver-legend-item--in');
    li2.appendChild(el('strong', null, 'IN'));
    li2.appendChild(document.createTextNode(' Facing Inwards / Inactive'));
    legend.appendChild(lo);
    legend.appendChild(li2);
    io.controls.appendChild(legend);

    var act = actions();
    var clearAll = button('Clear All');
    act.appendChild(clearAll);
    io.controls.appendChild(act);
    clearAll.addEventListener('click', function () {
      lit = {};
      touched = false;
      Object.keys(cells).forEach(function (c) { paintCell(cells[c], c); });
      solve();
    });

    function solve() {
      if (!touched) {
        idle(io.out, 'Tap Each Cell So The Grid Matches Your Screen. The Shortest Set Of ' +
          'Hits Appears Here As You Go.');
        return;
      }
      var state = KOWAKUJO_CELLS.map(function (c) { return lit[c] ? 1 : 0; });
      var solution = kowakujoSolveMatrix(state);
      if (solution === null) {
        beginWarn(io.out, 'No Solution For That Pattern');
        io.out.appendChild(note('This Grid Cannot Reach An All-IN Configuration, Which ' +
          'Usually Means One Of The OUT/IN States Was Misread. Double-Check Your Scrolls.', 'warn'));
        return;
      }
      var presses = [];
      solution.forEach(function (v, i) {
        if (v) presses.push(KOWAKUJO_CELLS[i].toUpperCase());
      });
      if (!presses.length) {
        begin(io.out, 'Nothing To Press');
        io.out.appendChild(el('p', 'solver-verdict', 'Every Scroll Is Already Facing IN'));
        return;
      }
      begin(io.out, 'Shoot Or Melee In This Order');
      io.out.appendChild(stepList(presses.map(function (c) {
        var f = frag();
        f.appendChild(el('strong', null, c));
        f.appendChild(document.createTextNode(' \u2014 ' + (KOWAKUJO_POSITION_NAMES[c] || 'Unknown')));
        return f;
      })));
      io.out.appendChild(note('Fewest Possible Hits. If You Mess Up, Undo What You Did Or ' +
        'Re-Match The Grid From Your Scrolls\u2019 Current Positions.'));
    }
    solve();
  };

  /* ---------- BO7: Kowakujo mystery ---------- */
  WIDGETS.mystery = function (root) {
    var io = makeIO(root);
    var state = { accomplice: null, symptom: null, symbol: null, zodiac: null, onset: null };
    var groups = {};

    ['accomplice', 'symptom', 'symbol'].forEach(function (cat) {
      groups[cat] = singleChoice(io.controls, MYSTERY_CATEGORY_LABELS[cat],
        MYSTERY_OPTIONS[cat].map(function (p) { return { v: p[0], label: p[1] }; }),
        function (v) { state[cat] = v; paint(); });
    });
    ['zodiac', 'onset'].forEach(function (cat) {
      groups[cat] = singleChoice(io.controls, MYSTERY_CATEGORY_LABELS[cat],
        MYSTERY_OPTIONS[cat].map(function (p) { return { v: p[0], label: p[1] }; }),
        function (v) { state[cat] = MYSTERY_NUMERIC[cat] ? Number(v) : v; paint(); });
      groups[cat].group.classList.add('solver-opt--compact');
    });

    var act = actions();
    var reset = button('Reset Clues');
    act.appendChild(reset);
    io.controls.appendChild(act);
    reset.addEventListener('click', function () {
      Object.keys(state).forEach(function (k) { state[k] = null; });
      Object.keys(groups).forEach(function (k) { groups[k].clear(); });
      paint();
    });

    function paintingLine(k, v, unresolved) {
      var f = frag();
      f.appendChild(el('strong', null, k));
      f.appendChild(document.createTextNode(': '));
      f.appendChild(el('span', unresolved ? 'solver-pending' : 'solver-line-v', v));
      return f;
    }

    function paint() {
      var accompliceItem = ACCOMPLICE_ITEMS[state.accomplice];
      var symbolItem = SYMBOL_ITEMS[state.symbol];
      var poisonItem = solvePoison(state.accomplice, state.symptom);
      var poisonUnresolved = poisonItem.charAt(0) === '[';
      var dial = null;
      if (state.zodiac !== null && state.onset !== null) {
        dial = ZODIAC_NAMES[(((state.zodiac - state.onset) % 12) + 12) % 12];
      }

      var anySet = Object.keys(state).some(function (k) { return state[k] !== null; });
      if (!anySet) {
        idle(io.out, 'Set The Clues Your Game Rolled. All Five Painting Items And The ' +
          'Zodiac Dial Are Worked Out Live.');
        return;
      }

      begin(io.out, 'Painting Sequence');
      io.out.appendChild(answerList([
        paintingLine('1st Painting (Suspect)', 'Comb (Fixed)'),
        paintingLine('2nd Painting (Accomplice)', accompliceItem || 'Select Accomplice', !accompliceItem),
        paintingLine('3rd Painting (Poison)', poisonUnresolved ? poisonItem.replace(/[\[\]]/g, '') : poisonItem, poisonUnresolved),
        paintingLine('4th Painting (Location)', symbolItem || 'Select Location', !symbolItem),
        paintingLine('5th Painting (Motive)', 'Crest Medallion (Fixed)')
      ]));
      io.out.appendChild(subhead('Zodiac Dial'));
      if (dial) {
        io.out.appendChild(el('p', 'solver-verdict', 'Turn Dial To ' + dial));
      } else {
        io.out.appendChild(note('Set Time Of Death And Toxin Onset To Get The Dial.', 'warn'));
      }
      io.out.appendChild(note('The Poison Is Auto-Solved From Accomplice + Cause Of Death. ' +
        'Time Of Death Rotated Back By The Onset Hours Gives The Poisoning Time.'));
    }
    paint();
  };

  /* ---------- BO7: Necrofluid Gauntlet (image picker) ---------- */
  WIDGETS.gauntlet = function (root) {
    var io = makeIO(root);
    var chosen = {};
    var chips = {};

    GAUNTLET_GROUPS.forEach(function (group) {
      var g = optGroup(group + GAUNTLET_GROUP_HINTS[group], 'Tap Your Symbol');
      g.btns.classList.add('solver-opt-btns--img');
      Object.keys(SYMBOL_BUTTONS).forEach(function (k) {
        var data = SYMBOL_BUTTONS[k];
        if (data.group !== group) return;
        var b = imgChip('bo7', data.image, data.label,
          group + ' Symbol ' + data.label);
        b.addEventListener('click', function () {
          chosen[group] = (chosen[group] === k) ? undefined : k;
          if (chosen[group] === undefined) delete chosen[group];
          paint();
        });
        chips[k] = b;
        g.btns.appendChild(b);
      });
      io.controls.appendChild(g.wrap);
    });

    var act = actions();
    var reset = button('Reset');
    act.appendChild(reset);
    io.controls.appendChild(act);
    reset.addEventListener('click', function () { chosen = {}; paint(); });

    function paint() {
      Object.keys(SYMBOL_BUTTONS).forEach(function (k) {
        var g = SYMBOL_BUTTONS[k].group;
        chips[k].classList.toggle('is-on', chosen[g] === k);
      });
      var picked = GAUNTLET_GROUPS.filter(function (g) { return chosen[g] !== undefined; });
      reset.disabled = picked.length === 0;
      if (!picked.length) {
        idle(io.out, 'Tap The Symbol You See At Each Location. Your Three Symbols Are Held ' +
          'Here So You Do Not Have To Memorise Them Across Half A Map.');
        return;
      }
      if (picked.length < 3) progress(io.out, 'Selected ' + picked.length + ' Of 3');
      else begin(io.out, 'Sequence Complete \u2014 Insert As Shown');
      var strip = el('div', 'solver-pickstrip');
      picked.forEach(function (g) {
        var k = chosen[g];
        var cardEl = el('figure', 'solver-pick');
        var im = el('img');
        im.src = imgPath('bo7', SYMBOL_BUTTONS[k].image);
        im.alt = g + ' Symbol ' + SYMBOL_BUTTONS[k].label;
        im.loading = 'lazy';
        cardEl.appendChild(im);
        cardEl.appendChild(el('figcaption', null,
          g + GAUNTLET_GROUP_HINTS[g] + ' \u00b7 ' + SYMBOL_BUTTONS[k].label));
        strip.appendChild(cardEl);
      });
      io.out.appendChild(strip);
      if (picked.length >= 3) {
        io.out.appendChild(imagePlate('bo7', 'ashesGauntlet_insert.jpg',
          'Insert Each Symbol As Shown', 'Insert Order Reference'));
      }
    }
    paint();
  };

  /* ---------- BO7: Nexus pillar handle alignment ---------- */
  WIDGETS.crank = function (root) {
    var io = makeIO(root);
    var state = { lever: 'horizontal', starts: [null, null, null], target: null };

    var leverG = singleChoice(io.controls, 'Lever Below Pack-A-Punch',
      [
        { v: 'horizontal', label: 'Horizontal' },
        { v: 'vertical', label: 'Vertical' }
      ],
      function (v) { state.lever = v; paint(); },
      'Horizontal = Not Pointing At The Stairs & Perk Machine');
    leverG.chips.horizontal.classList.add('is-on');
    leverG.chips.horizontal.setAttribute('aria-pressed', 'true');

    var targetG = singleChoice(io.controls, 'Target Shadowsmith Area',
      REX_CRANK_TEMPLES.map(function (t) { return { v: t, label: t }; }),
      function (v) { state.target = v; paint(); },
      'The One You Are Cleansing');

    var ringOpts = REX_CRANK_PICK_ORDER.map(function (ring) {
      return { v: REX_CRANK_RING.indexOf(ring), label: crankLabel(ring) };
    });
    var handleGs = REX_CRANK_NAMES.map(function (name, idx) {
      var where = REX_CRANK_WHERE[name];
      return singleChoice(io.controls,
        name + ' Pillar' + (where ? ' (' + where + ')' : ''),
        ringOpts,
        function (v) { state.starts[idx] = Number(v); paint(); },
        'Currently Pointing At');
    });

    var act = actions();
    var done = button('Area Done', 'btn btn-accent');
    var reset = button('Reset');
    act.appendChild(done);
    act.appendChild(reset);
    io.controls.appendChild(act);

    done.addEventListener('click', function () {
      if (!state.target) return;
      var landed = REX_CRANK_RING.indexOf(state.target);
      state.starts = [landed, landed, landed];
      state.target = null;
      targetG.clear();
      handleGs.forEach(function (g) {
        g.clear();
        var b = g.chips[String(landed)];
        if (b) { b.classList.add('is-on'); b.setAttribute('aria-pressed', 'true'); }
      });
      paint();
    });

    reset.addEventListener('click', function () {
      state = { lever: 'horizontal', starts: [null, null, null], target: null };
      targetG.clear();
      handleGs.forEach(function (g) { g.clear(); });
      leverG.clear();
      leverG.chips.horizontal.classList.add('is-on');
      leverG.chips.horizontal.setAttribute('aria-pressed', 'true');
      paint();
    });

    function paint() {
      var look = REX_LEVER_LOOK[state.lever];
      var placed = state.starts.every(function (s) { return s !== null; });
      done.disabled = !(state.target && placed);

      if (!placed || !state.target) {
        var missing = [];
        if (!state.target) missing.push('Target Shadowsmith Area');
        if (!placed) missing.push('All 3 Pillar Positions');
        idle(io.out, 'Still Need: ' + missing.join(' And ') +
          '. The Handles Are Geared \u2014 Turning One Moves The Other Two By Two, So The ' +
          'Turn Counts Are Worked Out Properly Here.');
        return;
      }

      var counts = rexCrankSolve(state.starts, REX_CRANK_RING.indexOf(state.target), look.spin);
      if (counts === null) {
        beginWarn(io.out, 'No Solution');
        io.out.appendChild(note('Double-Check What You Set Above.', 'warn'));
        return;
      }

      begin(io.out, 'Interact With Handles This Amount');
      var turns = el('div', 'solver-turns');
      REX_CRANK_NAMES.forEach(function (name, i) {
        var t = el('div', 'solver-turn' + (counts[i] === 0 ? ' is-zero' : ''));
        t.appendChild(el('span', 'solver-turn-n', counts[i] + 'x'));
        t.appendChild(el('span', 'solver-turn-k', name));
        turns.appendChild(t);
      });
      io.out.appendChild(turns);
      io.out.appendChild(kv('Spin Direction: ', look.direction));
      io.out.appendChild(note('Any Order. 0x Means Leave That One Alone. The Blue Laser Fires ' +
        'The Moment All 3 Line Up. Then Press Area Done And The Solver Updates Them For You.'));

      io.out.appendChild(subhead('Turns From Where You Are Now'));
      io.out.appendChild(answerList(rexCrankCosts(state.starts, look.spin).map(function (r) {
        var f = frag();
        f.appendChild(el('strong', null, r.temple));
        f.appendChild(document.createTextNode(' \u2014 ' + r.total +
          ' Turn' + (r.total === 1 ? '' : 's')));
        if (r.total === 0) f.appendChild(el('span', 'solver-tag', 'Where You Are'));
        else if (r.temple === state.target) f.appendChild(el('span', 'solver-tag', 'Your Target'));
        return f;
      })));
      io.out.appendChild(note('Before You Move The Handles To Another Area: Make It Rain, And ' +
        'Blast The Purple Spot On The Boss Head\u2019s Forehead \u2014 Otherwise You Have To ' +
        'Come Back To Do It Later.', 'warn'));
    }
    paint();
  };

  /* ==========================================================
     7. MOUNTING
     ========================================================== */

  function mountAll() {
    var nodes = document.querySelectorAll('[data-solver]');
    Array.prototype.forEach.call(nodes, function (node) {
      var key = node.getAttribute('data-solver');
      var build = WIDGETS[key];
      if (typeof build !== 'function') return;
      try {
        build(node);
        node.classList.add('is-mounted');
      } catch (err) {
        node.classList.add('is-failed');
        node.appendChild(el('p', 'solver-note solver-note--warn',
          'This Tool Could Not Start In Your Browser. The Reference Data Above Still Applies.'));
        if (window.console && console.error) console.error('Solver failed: ' + key, err);
      }
    });
  }

  /* Static cheat-sheet images are already in the HTML; wire them to the viewer. */
  function wireStaticImages() {
    var figs = document.querySelectorAll('.solver-figure[data-src]');
    Array.prototype.forEach.call(figs, function (fig) {
      var im = fig.querySelector('img');
      var btn = fig.querySelector('.solver-img-btn');
      if (!im || !btn) return;
      btn.addEventListener('click', function () {
        openLightbox(fig.getAttribute('data-src'), im.alt || '');
      });
    });
  }

  /* Map rail: mark the section currently on screen. */
  function wireIndexRail() {
    var rail = document.querySelector('.solver-index');
    if (!rail || !('IntersectionObserver' in window)) return;
    var links = {};
    Array.prototype.forEach.call(rail.querySelectorAll('a[href^="#"]'), function (a) {
      links[a.getAttribute('href').slice(1)] = a;
    });
    var ids = Object.keys(links);
    if (!ids.length) return;
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        ids.forEach(function (id) { links[id].classList.remove('is-current'); });
        var a = links[entry.target.id];
        if (a) a.classList.add('is-current');
      });
    }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });
    ids.forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) obs.observe(sec);
    });
  }

  function init() {
    mountAll();
    wireStaticImages();
    wireIndexRail();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Exposed so the verification harness can check the ported algorithms
     against the Python. Harmless in a browser. */
  window.__SOLVER_TEST__ = {
    beam: function (x, y, z) { return [beamFirst(x), beamSecond(x, y, z), beamThird(x, y, z)]; },
    gorgofex: solveGorgofex,
    pad3: pad3,
    valve: solveValves,
    valveCount: Object.keys(VALVE_COMBINATIONS).length,
    scrolls: kowakujoSolveMatrix,
    crank: rexCrankSolve,
    crankCosts: rexCrankCosts,
    poison: solvePoison,
    ring: REX_CRANK_RING,
    chalkboards: CHALKBOARDS,
    periodic: PERIODIC_TABLE,
    teleporter: TELEPORTER_ITEMS
  };
})();
