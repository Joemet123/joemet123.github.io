/* ============================================================
   JOEMET123 — Zombies Solvers
   Pure client-side tools. No network, no storage, no tracking.
   Each solver is registered in SOLVERS and rendered on demand,
   so adding a new one is a single object, not a new page.
   ============================================================ */
(function () {
  'use strict';

  var A = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  /* ---------- helpers ---------- */
  function onlyAZ(s) { return (s || '').toUpperCase().replace(/[^A-Z]/g, ''); }

  function caesar(text, shift) {
    return (text || '').replace(/[a-z]/gi, function (ch) {
      var base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode((ch.charCodeAt(0) - base + shift + 26) % 26 + base);
    });
  }

  function atbash(text) {
    return (text || '').replace(/[a-z]/gi, function (ch) {
      var base = ch <= 'Z' ? 65 : 97;
      return String.fromCharCode(base + 25 - (ch.charCodeAt(0) - base));
    });
  }

  function vigenere(text, key, dir) {
    var k = onlyAZ(key);
    if (!k) return 'Enter a keyword.';
    var i = 0;
    return (text || '').replace(/[a-z]/gi, function (ch) {
      var base = ch <= 'Z' ? 65 : 97;
      var shift = k.charCodeAt(i % k.length) - 65;
      i++;
      return String.fromCharCode((ch.charCodeAt(0) - base + dir * shift + 26) % 26 + base);
    });
  }

  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
    I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
    Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
    Y: '-.--', Z: '--..', 0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
    5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.'
  };
  var UNMORSE = {};
  Object.keys(MORSE).forEach(function (k) { UNMORSE[MORSE[k]] = k; });

  /* ---------- solver definitions ---------- */
  var SOLVERS = [
    {
      id: 'caesar',
      name: 'Caesar / ROT Brute Force',
      blurb: 'Zombies ciphers are very often a straight letter shift. This runs all 25 shifts at once so you can eyeball the one that turns into English instead of guessing one at a time.',
      fields: [{ k: 'text', label: 'Ciphertext', type: 'textarea', ph: 'Paste the cipher here' }],
      run: function (v) {
        var t = v.text || '';
        if (!t.trim()) return 'Paste some ciphertext above.';
        var out = [];
        for (var s = 1; s <= 25; s++) {
          out.push('ROT ' + String(s).padStart(2, ' ') + '  ' + caesar(t, s));
        }
        return out.join('\n');
      }
    },
    {
      id: 'a1z26',
      name: 'A1Z26 (Letters ↔ Numbers)',
      blurb: 'Numbers scrawled on a wall are usually just letter positions. Converts both directions — numbers separated by spaces, dashes or commas.',
      fields: [{ k: 'text', label: 'Letters Or Numbers', type: 'textarea', ph: '8 5 12 12 15   or   HELLO' }],
      run: function (v) {
        var t = (v.text || '').trim();
        if (!t) return 'Enter letters or numbers above.';
        if (/\d/.test(t)) {
          return t.split(/[^0-9]+/).filter(Boolean).map(function (n) {
            var i = parseInt(n, 10);
            return (i >= 1 && i <= 26) ? A[i - 1] : '?';
          }).join('');
        }
        return onlyAZ(t).split('').map(function (c) { return A.indexOf(c) + 1; }).join(' ');
      }
    },
    {
      id: 'atbash',
      name: 'Atbash',
      blurb: 'A mirrored alphabet — A becomes Z, B becomes Y. Self-reversing, so running it on the output gives the original back.',
      fields: [{ k: 'text', label: 'Text', type: 'textarea', ph: 'Paste text here' }],
      run: function (v) {
        return (v.text || '').trim() ? atbash(v.text) : 'Enter some text above.';
      }
    },
    {
      id: 'vigenere',
      name: 'Vigenère',
      blurb: 'A keyword cipher. Turns up on the harder Easter eggs where a plain shift is not enough. You need the keyword — it is usually a character or map name hidden somewhere nearby.',
      fields: [
        { k: 'text', label: 'Text', type: 'textarea', ph: 'Paste text here' },
        { k: 'key', label: 'Keyword', type: 'text', ph: 'e.g. RICHTOFEN' },
        { k: 'mode', label: 'Direction', type: 'select', opts: ['Decode', 'Encode'] }
      ],
      run: function (v) {
        if (!(v.text || '').trim()) return 'Enter some text above.';
        return vigenere(v.text, v.key, v.mode === 'Encode' ? 1 : -1);
      }
    },
    {
      id: 'morse',
      name: 'Morse Code',
      blurb: 'Radios, beeping panels and light sequences. Dots and dashes with spaces between letters, and " / " between words.',
      fields: [{ k: 'text', label: 'Morse Or Text', type: 'textarea', ph: '.... . .-.. .-.. ---   or   HELLO' }],
      run: function (v) {
        var t = (v.text || '').trim();
        if (!t) return 'Enter morse or text above.';
        if (/^[.\-\/\s]+$/.test(t)) {
          return t.split(/\s*\/\s*/).map(function (w) {
            return w.trim().split(/\s+/).map(function (c) { return UNMORSE[c] || '?'; }).join('');
          }).join(' ');
        }
        return t.toUpperCase().split('').map(function (c) {
          if (c === ' ') return '/';
          return MORSE[c] || '';
        }).filter(Boolean).join(' ');
      }
    },
    {
      id: 'binhex',
      name: 'Binary / Hex → Text',
      blurb: 'Terminal dumps and computer screens. Accepts 8-bit binary groups or hex pairs, spaced or not.',
      fields: [{ k: 'text', label: 'Binary Or Hex', type: 'textarea', ph: '01001000 01001001   or   48 49' }],
      run: function (v) {
        var t = (v.text || '').trim();
        if (!t) return 'Enter binary or hex above.';
        var clean = t.replace(/\s+/g, '');
        try {
          if (/^[01]+$/.test(clean) && clean.length % 8 === 0) {
            return clean.match(/.{8}/g).map(function (b) {
              return String.fromCharCode(parseInt(b, 2));
            }).join('');
          }
          if (/^[0-9a-f]+$/i.test(clean) && clean.length % 2 === 0) {
            return clean.match(/.{2}/g).map(function (h) {
              return String.fromCharCode(parseInt(h, 16));
            }).join('');
          }
        } catch (e) { /* fall through */ }
        return 'Not valid binary (groups of 8) or hex (pairs).';
      }
    },
    {
      id: 'freqs',
      name: 'Letter Frequency',
      blurb: 'When a cipher is not a simple shift, frequency tells you what you are dealing with. In English E, T, A and O dominate — if the counts look flat, it is probably not a substitution cipher at all.',
      fields: [{ k: 'text', label: 'Ciphertext', type: 'textarea', ph: 'Paste the cipher here' }],
      run: function (v) {
        var s = onlyAZ(v.text);
        if (!s) return 'Paste some ciphertext above.';
        var counts = {};
        s.split('').forEach(function (c) { counts[c] = (counts[c] || 0) + 1; });
        var rows = Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a]; });
        var max = counts[rows[0]];
        return rows.map(function (c) {
          var n = counts[c];
          var pct = ((n / s.length) * 100).toFixed(1);
          var bar = '█'.repeat(Math.max(1, Math.round((n / max) * 24)));
          return c + '  ' + String(n).padStart(3, ' ') + '  ' + pct.padStart(5, ' ') + '%  ' + bar;
        }).join('\n') + '\n\nTotal letters: ' + s.length;
      }
    }
  ];

  /* ---------- render ---------- */
  var mount = document.getElementById('solver-list');
  if (!mount) return;

  SOLVERS.forEach(function (S) {
    var card = document.createElement('section');
    card.className = 'solver';
    card.id = S.id;

    var head = '<h2 class="solver-name">' + S.name + '</h2>' +
               '<p class="solver-blurb">' + S.blurb + '</p>';

    var inputs = S.fields.map(function (f) {
      var id = S.id + '-' + f.k;
      if (f.type === 'textarea') {
        return '<label class="solver-field"><span>' + f.label + '</span>' +
               '<textarea id="' + id + '" rows="3" placeholder="' + (f.ph || '') + '" spellcheck="false"></textarea></label>';
      }
      if (f.type === 'select') {
        return '<label class="solver-field solver-field--tight"><span>' + f.label + '</span><select id="' + id + '">' +
               f.opts.map(function (o) { return '<option>' + o + '</option>'; }).join('') +
               '</select></label>';
      }
      return '<label class="solver-field solver-field--tight"><span>' + f.label + '</span>' +
             '<input id="' + id + '" type="text" placeholder="' + (f.ph || '') + '" spellcheck="false"></label>';
    }).join('');

    card.innerHTML = head +
      '<div class="solver-inputs">' + inputs + '</div>' +
      '<div class="solver-actions">' +
        '<button class="btn btn-accent solver-run" type="button">Solve</button>' +
        '<button class="btn btn-outline solver-copy" type="button">Copy Result</button>' +
        '<button class="btn btn-outline solver-clear" type="button">Clear</button>' +
      '</div>' +
      '<pre class="solver-out" aria-live="polite"></pre>';

    mount.appendChild(card);

    var out = card.querySelector('.solver-out');
    function collect() {
      var v = {};
      S.fields.forEach(function (f) {
        var el = document.getElementById(S.id + '-' + f.k);
        v[f.k] = el ? el.value : '';
      });
      return v;
    }
    function run() {
      var res;
      try { res = S.run(collect()); }
      catch (e) { res = 'Something went wrong with that input.'; }
      out.textContent = res;
      out.classList.add('has-output');
    }

    card.querySelector('.solver-run').addEventListener('click', run);
    card.querySelector('.solver-clear').addEventListener('click', function () {
      S.fields.forEach(function (f) {
        var el = document.getElementById(S.id + '-' + f.k);
        if (el && el.tagName !== 'SELECT') el.value = '';
      });
      out.textContent = '';
      out.classList.remove('has-output');
    });
    card.querySelector('.solver-copy').addEventListener('click', function (e) {
      if (!out.textContent) return;
      var btn = e.currentTarget;
      var restore = btn.textContent;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(out.textContent).then(function () {
          btn.textContent = 'Copied';
          setTimeout(function () { btn.textContent = restore; }, 1400);
        }).catch(function () {});
      }
    });
    // Enter inside a single-line field runs it
    card.querySelectorAll('input[type="text"]').forEach(function (el) {
      el.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter') { ev.preventDefault(); run(); }
      });
    });
  });

  /* index of solvers for the jump strip */
  var idx = document.getElementById('solver-index');
  if (idx) {
    idx.innerHTML = SOLVERS.map(function (S) {
      return '<a href="#' + S.id + '">' + S.name + '</a>';
    }).join('');
  }
})();
