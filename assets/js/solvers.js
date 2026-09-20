/* ============================================================
   JOEMET123 — Call Of Duty Zombies Solvers
   Ported 1:1 from the three Discord bots:
     OFFICIAL_BO3_ZOMBIES_SOLVER.py
     OFFICIAL_BO6_ZOMBIES_SOLVER.py
     OFFICIAL_BO7_ZOMBIES_SOLVER.py
   Every code, mapping, sequence and algorithm below is copied
   from that source. Nothing here is invented.

   Pure client-side. No network, no storage, no tracking.
   Widgets mount into [data-solver] placeholders, so the static
   prose around them stays in the HTML and stays indexable.
   ============================================================ */
(function () {
  'use strict';

  /* ==========================================================
     0. TINY DOM HELPERS
     ========================================================== */

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = text;
    return n;
  }

  function frag() { return document.createDocumentFragment(); }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); }

  /* Build a labelled <select>. opts = [{v: value, t: text}] */
  function selectField(labelText, opts, placeholder) {
    var wrap = el('label', 'solver-field solver-field--tight');
    wrap.appendChild(el('span', null, labelText));
    var sel = el('select');
    if (placeholder) {
      var o0 = el('option', null, placeholder);
      o0.value = '';
      sel.appendChild(o0);
    }
    opts.forEach(function (o) {
      var op = el('option', null, o.t);
      op.value = String(o.v);
      sel.appendChild(op);
    });
    wrap.appendChild(sel);
    return { wrap: wrap, input: sel };
  }

  function numberField(labelText, ph) {
    var wrap = el('label', 'solver-field solver-field--tight');
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
    var wrap = el('label', 'solver-field solver-field--tight');
    wrap.appendChild(el('span', null, labelText));
    var inp = el('input');
    inp.type = 'text';
    inp.autocomplete = 'off';
    if (ph) inp.placeholder = ph;
    if (maxLen) inp.maxLength = maxLen;
    wrap.appendChild(inp);
    return { wrap: wrap, input: inp };
  }

  function button(label, cls) {
    var b = el('button', cls || 'solver-chip', label);
    b.type = 'button';
    return b;
  }

  function actions() { return el('div', 'solver-actions'); }

  function chipRow(labelText) {
    var row = el('div', 'solver-chiprow');
    if (labelText) row.appendChild(el('span', 'solver-chiprow-label', labelText));
    return row;
  }

  /* Result panel — created hidden, shown once it has content. */
  function resultBox() {
    var box = el('div', 'solver-result');
    return box;
  }

  function showResult(box) { box.classList.add('is-open'); }

  function resultTitle(text) { return el('p', 'solver-result-title', text); }

  function resultList(items) {
    var ul = el('ul', 'solver-answer-list');
    items.forEach(function (t) {
      var li = el('li');
      if (typeof t === 'string') { li.textContent = t; } else { li.appendChild(t); }
      ul.appendChild(li);
    });
    return ul;
  }

  function strongLine(label, value) {
    var p = el('p', 'solver-line');
    p.appendChild(el('span', 'solver-line-k', label));
    p.appendChild(el('strong', 'solver-line-v', value));
    return p;
  }

  function note(text, kind) {
    return el('p', 'solver-note' + (kind ? ' solver-note--' + kind : ''), text);
  }

  /* ==========================================================
     1. IMAGE HANDLING + LIGHTBOX
     ========================================================== */

  var IMG_BASE = 'assets/images/solvers/';

  function imgPath(game, file) { return IMG_BASE + game + '/' + file; }

  /* A clickable image plate with a full-size fallback link. */
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
    btn.addEventListener('click', function () { openImageLightbox(src, alt); });
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

  /* --- lightbox --- */
  var lb = null, lbImg = null, lbCap = null, lbReturn = null;

  function buildLightbox() {
    if (lb) return;
    lb = el('div', 'solver-lightbox');
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.hidden = true;

    var backdrop = el('div', 'solver-lightbox-backdrop');
    backdrop.addEventListener('click', closeImageLightbox);
    lb.appendChild(backdrop);

    var panel = el('div', 'solver-lightbox-panel');
    var bar = el('div', 'solver-lightbox-bar');
    lbCap = el('p', 'solver-lightbox-title', '');
    bar.appendChild(lbCap);
    var close = el('button', 'solver-lightbox-close', '\u00d7');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', closeImageLightbox);
    bar.appendChild(close);
    panel.appendChild(bar);

    var stage = el('div', 'solver-lightbox-stage');
    lbImg = el('img');
    lbImg.alt = '';
    stage.appendChild(lbImg);
    panel.appendChild(stage);

    lb.appendChild(panel);
    document.body.appendChild(lb);

    document.addEventListener('keydown', function (e) {
      if (!lb.hidden && (e.key === 'Escape' || e.key === 'Esc')) closeImageLightbox();
    });
  }

  function openImageLightbox(src, alt) {
    buildLightbox();
    lbReturn = document.activeElement;
    lbImg.src = src;
    lbImg.alt = alt || '';
    lbCap.textContent = alt || '';
    lb.hidden = false;
    document.body.classList.add('lightbox-open');
    var c = lb.querySelector('.solver-lightbox-close');
    if (c) c.focus();
  }

  function closeImageLightbox() {
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

  /* "green|pink" -> [[room, setting], ...]  (all 30 combinations) */
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
     3. BO6 DATA
     Source: OFFICIAL_BO6_ZOMBIES_SOLVER.py section 5
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

  /* Insertion order below IS the button order in the bot. */
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
     4. BO7 DATA
     Source: OFFICIAL_BO7_ZOMBIES_SOLVER.py section 5
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

  /* --- Kowakujo scrolls: 3x3 lights-out with a plus-shaped toggle --- */
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

  /* Gaussian elimination over GF(2), minimum-weight solution.
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

  /* --- Kowakujo mystery --- */
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

  /* --- Rex Infernus: Nexus pillar handle alignment --- */
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
    var startKey = start.join(',');
    var visited = {};
    visited[startKey] = null;
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
    /* Python sorts tuples (total, temple, counts) — total then temple name. */
    costs.sort(function (a, b) {
      if (a.total !== b.total) return a.total - b.total;
      return a.temple < b.temple ? -1 : (a.temple > b.temple ? 1 : 0);
    });
    return costs;
  }

  /* ==========================================================
     5. WIDGETS
     ========================================================== */

  var WIDGETS = {};

  /* ---------- BO3: Gorod Krovi Valve Step ---------- */
  WIDGETS.valve = function (root) {
    var locOpts = VALVE_LOCATIONS.map(function (n) { return { v: n, t: n }; });
    var inputs = el('div', 'solver-inputs');
    var green = selectField('Green Light Is In', locOpts, 'Choose A Room\u2026');
    var pink = selectField('Pink Cylinder Is In', locOpts, 'Choose A Room\u2026');
    inputs.appendChild(green.wrap);
    inputs.appendChild(pink.wrap);
    root.appendChild(inputs);

    var act = actions();
    var reset = button('Start Over', 'btn btn-outline');
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function refreshPink() {
      /* The bot never offers the green room as the pink room. */
      var g = green.input.value;
      Array.prototype.forEach.call(pink.input.options, function (o) {
        o.hidden = (o.value !== '' && o.value === g);
      });
      if (pink.input.value && pink.input.value === g) pink.input.value = '';
    }

    function run() {
      var g = green.input.value, p = pink.input.value;
      clear(out);
      if (!g || !p) {
        out.classList.remove('is-open');
        return;
      }
      var answer = solveValves(g, p);
      showResult(out);
      if (!answer) {
        out.appendChild(resultTitle('No Match'));
        out.appendChild(note('There Is No Route Stored For Green ' + g + ' To Pink ' + p +
          '. Double-Check The Two Rooms And Try Again.', 'warn'));
        return;
      }
      out.appendChild(resultTitle('Your Valve Settings'));
      out.appendChild(strongLine('Green Light At ', g));
      out.appendChild(strongLine('Pink Cylinder At ', p));
      out.appendChild(el('p', 'solver-subhead', 'Go Around The Map And Set:'));
      out.appendChild(resultList(answer.map(function (row) {
        var li = frag();
        li.appendChild(el('strong', null, row[0]));
        li.appendChild(document.createTextNode(' \u2014 Set To '));
        li.appendChild(el('code', 'solver-code', String(row[1])));
        return li;
      })));
      out.appendChild(note('Then Grab Your Pink Cylinder At ' + p + ' \u2014 Your Endpoint.'));
    }

    green.input.addEventListener('change', function () { refreshPink(); run(); });
    pink.input.addEventListener('change', run);
    reset.addEventListener('click', function () {
      green.input.value = '';
      pink.input.value = '';
      refreshPink();
      clear(out);
      out.classList.remove('is-open');
    });
    refreshPink();
  };

  /* ---------- BO6: Beamsmasher ---------- */
  WIDGETS.beamsmasher = function (root) {
    var inputs = el('div', 'solver-inputs');
    var fx = numberField('Enter X Value', 'Example: 1');
    var fy = numberField('Enter Y Value', 'Example: 2');
    var fz = numberField('Enter Z Value', 'Example: 3');
    inputs.appendChild(fx.wrap);
    inputs.appendChild(fy.wrap);
    inputs.appendChild(fz.wrap);
    root.appendChild(inputs);

    var act = actions();
    var go = button('Solve', 'btn btn-accent');
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(go);
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function parseVal(raw) {
      var s = (raw || '').trim();
      if (s === '') return NaN;
      if (!/^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s)) return NaN;
      var n = parseFloat(s);
      if (!isFinite(n)) return NaN;
      /* The bot rejects 2.7 rather than flooring it. "2.0" is fine. */
      if (Math.floor(n) !== n) return NaN;
      return n;
    }

    function run() {
      var x = parseVal(fx.input.value);
      var y = parseVal(fy.input.value);
      var z = parseVal(fz.input.value);
      clear(out);
      showResult(out);
      if (isNaN(x) || isNaN(y) || isNaN(z) ||
          Math.abs(x) > BEAMSMASHER_LIMIT ||
          Math.abs(y) > BEAMSMASHER_LIMIT ||
          Math.abs(z) > BEAMSMASHER_LIMIT) {
        out.appendChild(resultTitle('Invalid Entry'));
        out.appendChild(note('Enter Whole Numbers (-99 To 99) Only, Then Try Again.', 'warn'));
        return;
      }
      out.appendChild(resultTitle('Results For X=' + x + ', Y=' + y + ', Z=' + z));
      out.appendChild(resultList([
        lineNode('First Number', String(beamFirst(x))),
        lineNode('Second Number', String(beamSecond(x, y, z))),
        lineNode('Third Number', String(beamThird(x, y, z)))
      ]));
    }

    function lineNode(k, v) {
      var f = frag();
      f.appendChild(el('strong', null, k));
      f.appendChild(document.createTextNode(' \u2014 '));
      f.appendChild(el('code', 'solver-code', v));
      return f;
    }

    go.addEventListener('click', run);
    [fx, fy, fz].forEach(function (f) {
      f.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    });
    reset.addEventListener('click', function () {
      fx.input.value = ''; fy.input.value = ''; fz.input.value = '';
      clear(out); out.classList.remove('is-open');
    });
  };

  /* ---------- BO6: Projector & Straus Counter ---------- */
  WIDGETS.projector = function (root) {
    var row = chipRow('What Colour Is Your Straus Counter?');
    var out = resultBox();
    var chips = {};
    STRAUS_ORDER.forEach(function (key) {
      var b = button(STRAUS_COLOURS[key].button, 'solver-chip solver-chip--' + key);
      b.addEventListener('click', function () {
        STRAUS_ORDER.forEach(function (k) { chips[k].classList.remove('is-on'); });
        b.classList.add('is-on');
        var d = STRAUS_COLOURS[key];
        clear(out);
        showResult(out);
        out.appendChild(resultTitle('Turn Your Projector To ' + d.projector));
        out.appendChild(note('Since Your Straus Counter Is ' + d.counter +
          ', Turn Your Projector To ' + d.projector + '.'));
      });
      chips[key] = b;
      row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(out);
  };

  /* ---------- BO6: Raven sword fossils ---------- */
  WIDGETS.raven = function (root) {
    var row = chipRow('What Does Your Fossil Look Like?');
    var out = resultBox();
    var chips = {};
    Object.keys(FOSSILS).forEach(function (k) {
      var b = button(k, 'solver-chip');
      b.addEventListener('click', function () {
        Object.keys(chips).forEach(function (j) { chips[j].classList.remove('is-on'); });
        b.classList.add('is-on');
        clear(out);
        showResult(out);
        out.appendChild(resultTitle('Fossil ' + k + ' \u2014 Your Code Is Below'));
        out.appendChild(note('Insert Sword In Basement & Enter This Code.'));
        out.appendChild(imagePlate('bo6', FOSSILS[k].image, 'Fossil ' + k + ' Code',
          'Fossil ' + k + ' Code'));
      });
      chips[k] = b;
      row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(out);
  };

  /* ---------- BO6: The Tomb rune tracker ---------- */
  WIDGETS.runes = function (root) {
    var picked = [];
    var row = chipRow('Select The Runes In Your Game');
    var chips = {};
    for (var n = 1; n <= RUNE_COUNT; n++) {
      (function (num) {
        var b = button('Rune ' + num, 'solver-chip');
        b.addEventListener('click', function () {
          var i = picked.indexOf(num);
          if (i !== -1) { picked.splice(i, 1); b.classList.remove('is-on'); }
          else { picked.push(num); b.classList.add('is-on'); }
          paint();
        });
        chips[num] = b;
        row.appendChild(b);
      })(n);
    }
    root.appendChild(row);

    var act = actions();
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function paint() {
      clear(out);
      showResult(out);
      out.appendChild(resultTitle('Selected Runes'));
      out.appendChild(el('p', 'solver-big', picked.length
        ? picked.map(function (n) { return 'Rune ' + n; }).join(', ')
        : 'None'));
      out.appendChild(note('Click A Rune Again To Un-Pick A Mis-Tap.'));
    }

    reset.addEventListener('click', function () {
      picked.length = 0;
      Object.keys(chips).forEach(function (k) { chips[k].classList.remove('is-on'); });
      clear(out);
      out.classList.remove('is-open');
    });
  };

  /* ---------- BO6: MKII Chalkboard ---------- */
  WIDGETS.chalkboard = function (root) {
    var row = chipRow('What Are The Letters On The Bottom Left Of Your Chalkboard?');
    var out = resultBox();
    var chips = {};
    CHALKBOARD_KEYS.forEach(function (key) {
      var b = button(key, 'solver-chip');
      b.addEventListener('click', function () {
        CHALKBOARD_KEYS.forEach(function (k) { chips[k].classList.remove('is-on'); });
        b.classList.add('is-on');
        var codes = CHALKBOARDS[key];
        clear(out);
        showResult(out);
        out.appendChild(resultTitle('Chalkboard ' + key + ' Codes'));
        out.appendChild(resultList(CHALKBOARD_WORDS.map(function (w) {
          var f = frag();
          f.appendChild(el('strong', null, w.toUpperCase()));
          f.appendChild(document.createTextNode(': '));
          f.appendChild(el('code', 'solver-code', String(codes[w])));
          return f;
        })));
        out.appendChild(note('The Printed Page Names One Of These Four Words. ' +
          'The Number Beside It Is Your Service Tunnel Code.'));
      });
      chips[key] = b;
      row.appendChild(b);
    });
    root.appendChild(row);
    root.appendChild(out);
  };

  /* ---------- BO6: Gorgofex periodic code ---------- */
  WIDGETS.gorgofex = function (root) {
    var inputs = el('div', 'solver-inputs');
    var fd = textField('Deadshot Monitor Letter', 'First Letter On Screen', 2);
    var fr = textField('Periodic Room Monitor Letter', 'First Letter On Screen', 2);
    inputs.appendChild(fd.wrap);
    inputs.appendChild(fr.wrap);
    root.appendChild(inputs);

    var act = actions();
    var go = button('Find My Code', 'btn btn-accent');
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(go);
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function run() {
      var d = (fd.input.value || '').trim().toUpperCase();
      var r = (fr.input.value || '').trim().toUpperCase();
      clear(out);
      showResult(out);
      if (!d && !r) {
        out.appendChild(resultTitle('Error'));
        out.appendChild(note('You Must Enter At Least One Letter.', 'warn'));
        return;
      }
      var res = solveGorgofex(d, r);
      out.appendChild(resultTitle('You Input Letters'));
      out.appendChild(strongLine('Deadshot: ', d || 'N/A'));
      out.appendChild(strongLine('Periodic Room: ', r || 'N/A'));
      if (res.primary !== null) {
        var p = el('p', 'solver-big');
        p.appendChild(document.createTextNode('Unlock The Room With Combination \u2014 '));
        p.appendChild(el('code', 'solver-code solver-code--lg', pad3(res.primary)));
        out.appendChild(p);
      } else {
        out.appendChild(note('Could Not Find Combination For "' + d + r + '".', 'warn'));
      }
      if (res.alternate !== null) {
        var a = el('p', 'solver-line');
        a.appendChild(document.createTextNode('* Alternate Possible Combination \u2014 '));
        a.appendChild(el('code', 'solver-code', pad3(res.alternate)));
        out.appendChild(a);
      }
      out.appendChild(note('* If Neither Code Works, You Entered The Letters Wrong. End The ' +
        'Round To Refresh Your Monitors & Input Your New Letters Properly.'));
    }

    go.addEventListener('click', run);
    [fd, fr].forEach(function (f) {
      f.input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); run(); } });
    });
    reset.addEventListener('click', function () {
      fd.input.value = ''; fr.input.value = '';
      clear(out); out.classList.remove('is-open');
    });
  };

  /* ---------- BO6: Reckoning teleporter code ---------- */
  WIDGETS.teleporter = function (root) {
    var picks = [];
    var row = chipRow('Select The Button Of Your Folder\u2019s Item (Pick ' + TELEPORTER_TARGET + ')');
    var chips = {};
    TELEPORTER_ITEMS.forEach(function (item) {
      var b = button(item.digit + ' - ' + item.label, 'solver-chip');
      b.addEventListener('click', function () {
        if (picks.indexOf(item.digit) !== -1) return;
        if (picks.length >= TELEPORTER_TARGET) return;
        picks.push(item.digit);
        paint();
      });
      chips[item.digit] = b;
      row.appendChild(b);
    });
    root.appendChild(row);

    var act = actions();
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function itemOf(digit) {
      return TELEPORTER_ITEMS.filter(function (i) { return i.digit === digit; })[0];
    }

    function paint() {
      var complete = picks.length >= TELEPORTER_TARGET;
      TELEPORTER_ITEMS.forEach(function (item) {
        var chosen = picks.indexOf(item.digit) !== -1;
        chips[item.digit].classList.toggle('is-on', chosen);
        chips[item.digit].disabled = chosen || complete;
      });
      var ordered = picks.slice().sort(function (a, b) {
        return itemOf(a).precedence - itemOf(b).precedence;
      });
      clear(out);
      showResult(out);
      if (complete) {
        var code = ordered.join('-');
        out.appendChild(resultTitle('Your Teleportation Room Code Is'));
        var p = el('p', 'solver-big');
        p.appendChild(el('code', 'solver-code solver-code--lg', code));
        out.appendChild(p);
        out.appendChild(resultList(ordered.map(function (d) { return itemOf(d).label; })));
      } else {
        out.appendChild(resultTitle('Selected So Far (' + picks.length + '/' + TELEPORTER_TARGET + ')'));
        out.appendChild(resultList(ordered.length
          ? ordered.map(function (d) { return itemOf(d).digit + ' - ' + itemOf(d).label; })
          : ['\u2014']));
      }
    }

    reset.addEventListener('click', function () {
      picks.length = 0;
      paint();
      clear(out);
      out.classList.remove('is-open');
    });
  };

  /* ==========================================================
     6. BO7 WIDGETS
     ========================================================== */

  /* Generic "pick these in the order they happened" tool.
     Direct port of SequenceToolView. */
  function sequenceWidget(root, opts) {
    var picks = [];
    var row = chipRow(opts.prompt);
    var chips = {};
    opts.options.forEach(function (o) {
      var b = button(o.button, 'solver-chip');
      b.addEventListener('click', function () {
        if (picks.indexOf(o.v) !== -1) return;
        if (picks.length >= opts.target) return;
        picks.push(o.v);
        paint();
      });
      chips[o.v] = b;
      row.appendChild(b);
    });
    root.appendChild(row);

    var act = actions();
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function paint() {
      var complete = picks.length >= opts.target;
      opts.options.forEach(function (o) {
        var chosen = picks.indexOf(o.v) !== -1;
        chips[o.v].classList.toggle('is-on', chosen);
        chips[o.v].disabled = chosen || complete;
      });
      clear(out);
      showResult(out);
      opts.render(out, picks, complete);
    }

    reset.addEventListener('click', function () {
      picks.length = 0;
      paint();
      clear(out);
      out.classList.remove('is-open');
    });
  }

  /* ---------- BO7: Free RG-MK2 jump pads ---------- */
  WIDGETS.mk2 = function (root) {
    function labelOf(v) {
      return MK2_BUTTONS.filter(function (b) { return b.v === v; })[0].label;
    }
    sequenceWidget(root, {
      prompt: 'Select The Jump Pads In The Order You Use Them (All ' + MK2_BUTTONS.length + ')',
      options: MK2_BUTTONS,
      target: MK2_BUTTONS.length,
      render: function (out, picks, complete) {
        if (!complete) {
          out.appendChild(resultTitle('Selected: ' + picks.length + '/' + MK2_BUTTONS.length));
          out.appendChild(resultList(picks.length
            ? picks.map(function (v) { return labelOf(v); }) : ['\u2014']));
          return;
        }
        out.appendChild(resultTitle('Your Jump Pad Sequence'));
        var steps = [];
        for (var i = 0; i < picks.length - 1; i++) {
          var f = frag();
          f.appendChild(el('strong', null, labelOf(picks[i])));
          f.appendChild(document.createTextNode(' To '));
          f.appendChild(el('strong', null, labelOf(picks[i + 1])));
          steps.push(f);
        }
        out.appendChild(resultList(steps));
      }
    });
  };

  /* ---------- BO7: Purple skulls ---------- */
  WIDGETS.skulls = function (root) {
    sequenceWidget(root, {
      prompt: 'Shoot The Skulls In This Order \u2014 Pick All ' + ASTRA_SKULLS.length,
      options: ASTRA_SKULLS.map(function (n) { return { v: n, button: String(n) }; }),
      target: ASTRA_SKULLS.length,
      render: function (out, picks, complete) {
        out.appendChild(resultTitle(complete
          ? 'Your Skull Sequence'
          : 'Selected: ' + picks.length + '/' + ASTRA_SKULLS.length));
        out.appendChild(resultList(picks.length
          ? picks.map(function (v, i) { return (i + 1) + '. Skull ' + v; })
          : ['\u2014']));
      }
    });
  };

  /* ---------- BO7: Oscar's planet order ---------- */
  WIDGETS.planets = function (root) {
    sequenceWidget(root, {
      prompt: 'Oscar Will Say "Playback Of Elimination 20\u2026" \u2014 Select Your ' +
              PLANET_TARGET + ' Planets',
      options: PLANET_BUTTONS.map(function (p) { return { v: p.v, button: p.label }; }),
      target: PLANET_TARGET,
      render: function (out, picks, complete) {
        var code = picks.length ? picks.join('') : '---';
        if (complete) {
          out.appendChild(resultTitle('Insert Your Final Code Into The Machine'));
          var p = el('p', 'solver-big');
          p.appendChild(el('code', 'solver-code solver-code--lg', code));
          out.appendChild(p);
        } else {
          out.appendChild(resultTitle('Selected: ' + picks.length + '/' + PLANET_TARGET));
          out.appendChild(strongLine('Code So Far: ', code));
        }
        out.appendChild(resultList(picks.length
          ? picks.map(function (v, i) {
              var pb = PLANET_BUTTONS.filter(function (x) { return x.v === v; })[0];
              return (i + 1) + '. ' + pb.label + ' (' + pb.v + ')';
            })
          : ['\u2014']));
      }
    });
  };

  /* ---------- BO7: Pillar piano symbols ---------- */
  WIDGETS.pillars = function (root) {
    sequenceWidget(root, {
      prompt: 'Select The Numbers 1-5 In The Order They Appear. Select STATIC For The Fixed Symbol.',
      options: PILLAR_BUTTONS.map(function (p) { return { v: p.v, button: p.button }; }),
      target: PILLAR_TARGET,
      render: function (out, picks, complete) {
        var display = picks.length
          ? picks.map(function (n) { return n === 0 ? 'STATIC' : String(n); }).join(' - ')
          : '---';
        if (!complete) {
          out.appendChild(resultTitle('Selected: ' + picks.length + '/' + PILLAR_TARGET));
          out.appendChild(strongLine('Current Order: ', display));
          return;
        }
        /* STATIC stands in for whichever symbol the player never saw. */
        var seen = {};
        picks.forEach(function (n) { if (n !== 0) seen[n] = true; });
        var missing = [1, 2, 3, 4, 5].filter(function (n) { return !seen[n]; });
        var standIn = missing.length ? missing[0] : null;
        var resolved = picks.map(function (n) {
          return n === 0 ? (standIn !== null ? String(standIn) : '?') : String(n);
        });
        out.appendChild(resultTitle('Final Sequence'));
        var p = el('p', 'solver-big');
        p.appendChild(el('code', 'solver-code solver-code--lg', resolved.join(' - ')));
        out.appendChild(p);
        out.appendChild(note('This Is The Order In Which You Stated Your Piano Symbols ' +
          'Appeared. Use The Sheet Below To Now Activate Your Pillars.'));
      }
    });
  };

  /* ---------- BO7: Statues / Book EE ---------- */
  WIDGETS.statues = function (root) {
    var chosen = [];
    var total = Object.keys(BOOK_TO_STATUE).length;
    var chips = {};

    STATUE_BOOKS.forEach(function (statue) {
      var row = chipRow(statue.bookshelf);
      statue.books.forEach(function (book) {
        var b = button(titleCaseBook(book.label), 'solver-chip');
        b.addEventListener('click', function () {
          if (chosen.indexOf(book.id) !== -1) return;
          chosen.push(book.id);
          b.classList.add('is-on');
          b.disabled = true;
          solveBtn.disabled = false;
          paintProgress();
        });
        chips[book.id] = b;
        row.appendChild(b);
      });
      root.appendChild(row);
    });

    var act = actions();
    var solveBtn = button('Solve', 'btn btn-accent');
    solveBtn.disabled = true;
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(solveBtn);
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function titleCaseBook(s) {
      return s.toLowerCase().replace(/\b[a-z]/g, function (c) { return c.toUpperCase(); });
    }

    function paintProgress() {
      clear(out);
      showResult(out);
      out.appendChild(resultTitle('Selected Books: ' + chosen.length + '/' + total));
      out.appendChild(note('Select The Books That Appeared Next To The Statues In Your Game, ' +
        'Then Hit Solve.'));
    }

    solveBtn.addEventListener('click', function () {
      var counts = {};
      STATUE_BOOKS.forEach(function (s) { counts[s.key] = 0; });
      chosen.forEach(function (id) {
        var k = BOOK_TO_STATUE[id];
        if (k) counts[k] += 1;
      });
      clear(out);
      showResult(out);
      out.appendChild(resultTitle('Final Turn Sequence'));
      out.appendChild(strongLine('Selected Books: ', chosen.length + '/' + total));
      out.appendChild(resultList(STATUE_BOOKS.map(function (s) {
        var f = frag();
        f.appendChild(el('strong', null, s.bookshelf));
        f.appendChild(document.createTextNode(': '));
        f.appendChild(el('code', 'solver-code', String(counts[s.key])));
        return f;
      })));
      /* Lock the board the way the bot does once solved. */
      Object.keys(chips).forEach(function (id) { chips[id].disabled = true; });
      solveBtn.disabled = true;
    });

    reset.addEventListener('click', function () {
      chosen.length = 0;
      Object.keys(chips).forEach(function (id) {
        chips[id].disabled = false;
        chips[id].classList.remove('is-on');
      });
      solveBtn.disabled = true;
      clear(out);
      out.classList.remove('is-open');
    });
  };

  /* ---------- BO7: Kowakujo scrolls ---------- */
  WIDGETS.scrolls = function (root) {
    var lit = {};
    var grid = el('div', 'solver-grid3');
    var cells = {};

    KOWAKUJO_LAYOUT.forEach(function (rowCells) {
      rowCells.forEach(function (cell) {
        var b = button('', 'solver-cell');
        b.dataset.cell = cell;
        paintCell(b, cell);
        b.addEventListener('click', function () {
          lit[cell] = !lit[cell];
          paintCell(b, cell);
        });
        cells[cell] = b;
        grid.appendChild(b);
      });
    });
    root.appendChild(grid);

    function paintCell(b, cell) {
      var on = !!lit[cell];
      b.textContent = cell.toUpperCase() + ' (' + (on ? 'OUT' : 'IN') + ')';
      b.classList.toggle('is-out', on);
      b.classList.toggle('is-in', !on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
    }

    var legend = el('p', 'solver-note');
    legend.appendChild(el('strong', null, 'OUT'));
    legend.appendChild(document.createTextNode(' = Facing Outwards / Active. '));
    legend.appendChild(el('strong', null, 'IN'));
    legend.appendChild(document.createTextNode(' = Facing Inwards / Inactive.'));
    root.appendChild(legend);

    var act = actions();
    var go = button('Solve Puzzle', 'btn btn-accent');
    var clearAll = button('Clear All', 'btn btn-outline');
    act.appendChild(go);
    act.appendChild(clearAll);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    go.addEventListener('click', function () {
      var state = KOWAKUJO_CELLS.map(function (c) { return lit[c] ? 1 : 0; });
      var solution = kowakujoSolveMatrix(state);
      clear(out);
      showResult(out);
      if (solution === null) {
        out.appendChild(resultTitle('No Matrix Solution Detected'));
        out.appendChild(note('This Pattern Cannot Reach An All-IN Configuration. That ' +
          'Usually Means One Of The OUT/IN States Was Misread From The Game Screen. ' +
          'Please Double-Check Your Scrolls And Try Again.', 'warn'));
        return;
      }
      var presses = [];
      solution.forEach(function (v, i) {
        if (v) presses.push(KOWAKUJO_CELLS[i].toUpperCase());
      });
      out.appendChild(resultTitle('Your Winning Combination Has Been Calculated'));
      out.appendChild(note('Complete The Puzzle By Shooting Or Meleeing The Scrolls In ' +
        'The Following Order:'));
      if (presses.length) {
        out.appendChild(resultList(presses.map(function (c, i) {
          var f = frag();
          f.appendChild(el('strong', null, (i + 1) + '. ' + c));
          f.appendChild(document.createTextNode(' (' + (KOWAKUJO_POSITION_NAMES[c] || 'Unknown') + ')'));
          return f;
        })));
      } else {
        out.appendChild(el('p', 'solver-big', 'Nothing To Press \u2014 Every Scroll Is Already Facing IN.'));
      }
      out.appendChild(note('If You Mess Up, You Can Undo What You Did And Pick Up Where You ' +
        'Left Off, Or Re-Solve From The Current Positions Of Your Scrolls.'));
    });

    clearAll.addEventListener('click', function () {
      lit = {};
      Object.keys(cells).forEach(function (c) { paintCell(cells[c], c); });
      clear(out);
      out.classList.remove('is-open');
    });
  };

  /* ---------- BO7: Kowakujo mystery ---------- */
  WIDGETS.mystery = function (root) {
    var state = { accomplice: null, symptom: null, symbol: null, zodiac: null, onset: null };
    var order = ['accomplice', 'symptom', 'symbol', 'zodiac', 'onset'];
    var inputs = el('div', 'solver-inputs');
    var fields = {};

    order.forEach(function (cat) {
      var opts = MYSTERY_OPTIONS[cat].map(function (pair) {
        return { v: pair[0], t: pair[1] };
      });
      var f = selectField(MYSTERY_CATEGORY_LABELS[cat], opts, 'Not Set');
      f.input.addEventListener('change', function () {
        var raw = f.input.value;
        if (raw === '') { state[cat] = null; }
        else if (MYSTERY_NUMERIC[cat]) { state[cat] = parseInt(raw, 10); }
        else { state[cat] = raw; }
        paint();
      });
      fields[cat] = f;
      inputs.appendChild(f.wrap);
    });
    root.appendChild(inputs);

    var act = actions();
    var reset = button('Reset Clues', 'btn btn-outline');
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function paint() {
      var accompliceItem = ACCOMPLICE_ITEMS[state.accomplice] || '[Select Accomplice]';
      var symbolItem = SYMBOL_ITEMS[state.symbol] || '[Select Location]';
      var poisonItem = solvePoison(state.accomplice, state.symptom);
      var dialResult;
      if (state.zodiac !== null && state.onset !== null) {
        var dial = (((state.zodiac - state.onset) % 12) + 12) % 12;
        dialResult = ZODIAC_NAMES[dial];
      } else {
        dialResult = '[Select Time Of Death & Toxin Onset]';
      }

      clear(out);
      showResult(out);
      out.appendChild(resultTitle('Painting Sequence Answers'));
      out.appendChild(resultList([
        paintingLine('1st Painting (Suspect)', 'Comb (Fixed)'),
        paintingLine('2nd Painting (Accomplice)', accompliceItem),
        paintingLine('3rd Painting (Poison)', poisonItem),
        paintingLine('4th Painting (Location)', symbolItem),
        paintingLine('5th Painting (Motive)', 'Crest Medallion (Fixed)')
      ]));
      out.appendChild(note('The Poison Is Auto-Solved From Accomplice + Cause Of Death \u2014 ' +
        'It Is Not A Separate Pick.'));
      out.appendChild(el('p', 'solver-subhead', 'Zodiac Dial'));
      out.appendChild(strongLine('Turn Dial To: ', dialResult));
      out.appendChild(note('Time Of Death, Rotated Back By The Toxin Onset Hours, ' +
        '= The Poisoning Time.'));
    }

    function paintingLine(k, v) {
      var f = frag();
      f.appendChild(el('strong', null, k));
      f.appendChild(document.createTextNode(': '));
      f.appendChild(el('span', 'solver-line-v', v));
      return f;
    }

    reset.addEventListener('click', function () {
      order.forEach(function (cat) { state[cat] = null; fields[cat].input.value = ''; });
      clear(out);
      out.classList.remove('is-open');
    });

    paint();
  };

  /* ---------- BO7: Necrofluid Gauntlet ---------- */
  WIDGETS.gauntlet = function (root) {
    var chosen = {};   /* group -> symbol key */
    var chips = {};

    GAUNTLET_GROUPS.forEach(function (group) {
      var row = chipRow(group + GAUNTLET_GROUP_HINTS[group]);
      Object.keys(SYMBOL_BUTTONS).forEach(function (k) {
        var data = SYMBOL_BUTTONS[k];
        if (data.group !== group) return;
        var b = button(data.label, 'solver-chip solver-chip--' + group.toLowerCase());
        b.addEventListener('click', function () {
          if (chosen[group] !== undefined) return;
          chosen[group] = k;
          paint();
        });
        chips[k] = b;
        row.appendChild(b);
      });
      root.appendChild(row);
    });

    var act = actions();
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    function paint() {
      Object.keys(SYMBOL_BUTTONS).forEach(function (k) {
        var g = SYMBOL_BUTTONS[k].group;
        var locked = chosen[g] !== undefined;
        chips[k].disabled = locked;
        chips[k].classList.toggle('is-on', chosen[g] === k);
      });
      var picked = GAUNTLET_GROUPS.filter(function (g) { return chosen[g] !== undefined; });
      clear(out);
      showResult(out);
      if (picked.length < 3) {
        out.appendChild(resultTitle('Selected: ' + picked.length + '/3'));
        out.appendChild(note('Pick One Symbol Per Location \u2014 Tower, Barn And House.'));
      } else {
        out.appendChild(resultTitle('Sequence Complete'));
        out.appendChild(note('Insert Each Symbol As Shown Below.'));
      }
      picked.forEach(function (g) {
        var k = chosen[g];
        out.appendChild(imagePlate('bo7', SYMBOL_BUTTONS[k].image,
          g + ' Symbol' + GAUNTLET_GROUP_HINTS[g] + ' \u2014 Symbol ' + SYMBOL_BUTTONS[k].label,
          g + ' Symbol ' + SYMBOL_BUTTONS[k].label + GAUNTLET_GROUP_HINTS[g]));
      });
      if (picked.length >= 3) {
        out.appendChild(imagePlate('bo7', 'ashesGauntlet_insert.jpg',
          'Insert Each Symbol As Shown', 'Insert Order Reference'));
      }
    }

    reset.addEventListener('click', function () {
      chosen = {};
      paint();
      clear(out);
      out.classList.remove('is-open');
    });
  };

  /* ---------- BO7: Nexus pillar handle alignment ---------- */
  WIDGETS.crank = function (root) {
    var state = { lever: 'horizontal', starts: [null, null, null], target: null };

    var inputs = el('div', 'solver-inputs');

    var targetField = selectField('Target Shadowsmith Area',
      REX_CRANK_TEMPLES.map(function (t) { return { v: t, t: t }; }),
      'The One You Are Cleansing\u2026');
    targetField.input.addEventListener('change', function () {
      state.target = targetField.input.value || null;
      paint();
    });
    inputs.appendChild(targetField.wrap);

    var handleFields = REX_CRANK_NAMES.map(function (name, idx) {
      var where = REX_CRANK_WHERE[name];
      var label = name + ' Pillar' + (where ? ' (' + where + ')' : '');
      var f = selectField(label,
        REX_CRANK_PICK_ORDER.map(function (ring) {
          return { v: REX_CRANK_RING.indexOf(ring), t: crankLabel(ring) };
        }),
        'Pointing At\u2026');
      f.input.addEventListener('change', function () {
        var raw = f.input.value;
        state.starts[idx] = raw === '' ? null : parseInt(raw, 10);
        paint();
      });
      inputs.appendChild(f.wrap);
      return f;
    });
    root.appendChild(inputs);

    var act = actions();
    var flip = button('Flip Spin Direction', 'btn btn-accent');
    var done = button('Area Done', 'btn btn-outline');
    var reset = button('Reset', 'btn btn-outline');
    act.appendChild(flip);
    act.appendChild(done);
    act.appendChild(reset);
    root.appendChild(act);

    var out = resultBox();
    root.appendChild(out);

    flip.addEventListener('click', function () {
      state.lever = state.lever === 'horizontal' ? 'vertical' : 'horizontal';
      paint();
    });

    done.addEventListener('click', function () {
      if (!state.target) return;
      var landed = REX_CRANK_RING.indexOf(state.target);
      state.starts = [landed, landed, landed];
      state.target = null;
      targetField.input.value = '';
      handleFields.forEach(function (f) { f.input.value = String(landed); });
      paint();
    });

    reset.addEventListener('click', function () {
      state = { lever: 'horizontal', starts: [null, null, null], target: null };
      targetField.input.value = '';
      handleFields.forEach(function (f) { f.input.value = ''; });
      paint();
    });

    function paint() {
      var look = REX_LEVER_LOOK[state.lever];
      var otherKey = state.lever === 'horizontal' ? 'vertical' : 'horizontal';
      var other = REX_LEVER_LOOK[otherKey];
      var placed = state.starts.every(function (s) { return s !== null; });

      done.disabled = !(state.target && placed);

      clear(out);
      showResult(out);

      out.appendChild(strongLine('Target Shadowsmith Area: ', state.target || 'Not Set'));
      out.appendChild(strongLine('Spin Direction: ', look.direction));
      out.appendChild(note('Assuming The Lever Below Pack-A-Punch Is ' + look.short + ' \u2014 ' +
        look.look + '. If It Is ' + other.short + ' (' + other.look + '), Tap Flip Spin Direction.'));

      out.appendChild(el('p', 'solver-subhead', 'Your Pillars'));
      out.appendChild(resultList(REX_CRANK_NAMES.map(function (name, i) {
        var where = REX_CRANK_WHERE[name];
        var f = frag();
        f.appendChild(el('strong', null, name.toUpperCase() + ' PILLAR' +
          (where ? ' (' + where.toUpperCase() + ')' : '')));
        f.appendChild(document.createTextNode(': Facing '));
        f.appendChild(el('span', 'solver-line-v',
          state.starts[i] !== null ? crankLabel(REX_CRANK_RING[state.starts[i]]) : 'Not Set'));
        return f;
      })));

      if (placed && state.target) {
        var counts = rexCrankSolve(state.starts, REX_CRANK_RING.indexOf(state.target), look.spin);
        if (counts === null) {
          out.appendChild(note('No Solution \u2014 Double-Check What You Set Above.', 'warn'));
        } else {
          out.appendChild(el('p', 'solver-subhead', 'Interact With Handles This Amount'));
          out.appendChild(resultList(REX_CRANK_NAMES.map(function (name, i) {
            var f = frag();
            f.appendChild(el('strong', null, name.toUpperCase() + ' PILLAR: '));
            f.appendChild(el('code', 'solver-code', counts[i] + 'x'));
            return f;
          })));
          out.appendChild(note('Any Order. 0x Means Leave That One Alone. The Blue Laser ' +
            'Fires The Moment All 3 Line Up. Once You Turn Them, All 3 Point At ' +
            state.target + ' \u2014 Press Area Done And The Solver Will Update Them For You.'));
        }
      } else {
        var missing = [];
        if (!state.target) missing.push('Target Shadowsmith Area');
        if (!placed) missing.push('All 3 Pillar Positions');
        out.appendChild(note('Still Need: ' + missing.join(', ') + '.', 'warn'));
      }

      if (placed) {
        out.appendChild(el('p', 'solver-subhead', 'Turns From Where You Are Now'));
        out.appendChild(resultList(rexCrankCosts(state.starts, look.spin).map(function (r) {
          var f = frag();
          f.appendChild(el('strong', null, r.temple));
          f.appendChild(document.createTextNode(' \u2014 ' + r.total +
            ' turn' + (r.total === 1 ? '' : 's')));
          if (r.total === 0) f.appendChild(document.createTextNode('  (Where You Are Now)'));
          else if (r.temple === state.target) f.appendChild(document.createTextNode('  (Your Target)'));
          return f;
        })));
        out.appendChild(note('Can Be Done In Any Order \u2014 Above Is The Amount Of Turns ' +
          'It Takes To Get To Each.'));
      }

      out.appendChild(note('Before You Move The Handles To Another Area: Make It Rain, And ' +
        'Blast The Purple Spot On The Boss Head\u2019s Forehead \u2014 Otherwise You Have To ' +
        'Come Back To Do It Later.'));
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
        var p = el('p', 'solver-note solver-note--warn',
          'This Tool Could Not Start In Your Browser. The Reference Data Above Still Applies.');
        node.appendChild(p);
        if (window.console && console.error) console.error('Solver failed: ' + key, err);
      }
    });
  }

  /* Static cheat-sheet images already exist in the HTML as <img>.
     Wire them to the lightbox without duplicating any markup. */
  function wireStaticImages() {
    var figs = document.querySelectorAll('.solver-figure[data-src]');
    Array.prototype.forEach.call(figs, function (fig) {
      var im = fig.querySelector('img');
      var btn = fig.querySelector('.solver-img-btn');
      if (!im || !btn) return;
      btn.addEventListener('click', function () {
        openImageLightbox(fig.getAttribute('data-src'), im.alt || '');
      });
    });
  }

  /* Map jump-rail: highlight the section currently on screen. */
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
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });
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

  /* Exposed only so the build-time verification harness can check the
     ported algorithms against the Python. Harmless in a browser. */
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
