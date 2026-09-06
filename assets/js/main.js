/* ============================================
   JOEMET123 — Main JavaScript
   Shared across all pages
   ============================================ */

(function () {
  'use strict';

  /* ---------- Hamburger Menu ---------- */
  const hamburger = document.querySelector('.hamburger');
  const mainNav = document.querySelector('.main-nav');

  if (hamburger && mainNav) {
    hamburger.addEventListener('click', function () {
      hamburger.classList.toggle('active');
      mainNav.classList.toggle('open');
    });

    // Close nav when a link is clicked (mobile)
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        hamburger.classList.remove('active');
        mainNav.classList.remove('open');
      });
    });
  }

  /* ---------- Active Nav Link ---------- */
  (function setActiveLink() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    var links = document.querySelectorAll('.main-nav a');
    links.forEach(function (link) {
      var href = link.getAttribute('href');
      if (href === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  })();

  /* ---------- Carousel ---------- */
  document.querySelectorAll('.carousel-container').forEach(function (container) {
    var track = container.querySelector('.carousel-track');
    var prevBtn = container.querySelector('.carousel-prev');
    var nextBtn = container.querySelector('.carousel-next');
    if (!track || !prevBtn || !nextBtn) return;

    var scrollAmount = 300;

    prevBtn.addEventListener('click', function () {
      track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });
    nextBtn.addEventListener('click', function () {
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  });

  /* ============================================================
     VIDEO LIGHTBOX
     Vanilla, no libraries. The iframe is created on open and
     destroyed on close, which is what actually stops the audio —
     hiding the modal would leave the player running.
     ============================================================ */
  var lbEl     = document.getElementById('yt-lightbox');
  var lbPanel  = lbEl ? lbEl.querySelector('.yt-lightbox-panel') : null;
  var lbFrame  = lbEl ? lbEl.querySelector('.yt-lightbox-frame') : null;
  var lbTitle  = lbEl ? lbEl.querySelector('.yt-lightbox-title') : null;
  var lbClose  = lbEl ? lbEl.querySelector('.yt-lightbox-close') : null;
  var lbReturn = null;   // element that had focus before opening
  var lbOnClose = null;  // caller callback (e.g. restart the carousel)

  function lbIsOpen() {
    return !!lbEl && lbEl.classList.contains('is-open');
  }

  function lbFocusables() {
    return lbPanel ? lbPanel.querySelectorAll('button, iframe, a[href]') : [];
  }

  function lbKeydown(e) {
    if (!lbIsOpen()) return;

    if (e.key === 'Escape' || e.key === 'Esc') {
      e.preventDefault();
      e.stopPropagation();   // don't also fire the mobile-nav Escape handler
      closeLightbox();
      return;
    }
    if (e.key !== 'Tab') return;

    // Focus trap: cycle inside the panel only.
    var f = lbFocusables();
    if (!f.length) return;
    var first = f[0];
    var last = f[f.length - 1];

    if (!lbPanel.contains(document.activeElement)) {
      e.preventDefault();
      first.focus();
    } else if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openLightbox(video, onClose) {
    if (!lbEl || !video || !video.videoId || lbIsOpen()) return;

    lbReturn = document.activeElement;
    lbOnClose = typeof onClose === 'function' ? onClose : null;

    lbTitle.textContent = video.title || '';
    lbEl.classList.toggle('yt-lightbox--short', !!video.isShort);

    var iframe = document.createElement('iframe');
    iframe.src = 'https://www.youtube.com/embed/' + video.videoId + '?autoplay=1&rel=0';
    iframe.title = video.title || 'YouTube Video Player';
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', '');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    lbFrame.appendChild(iframe);

    lbEl.classList.add('is-open');
    document.body.classList.add('lightbox-open');   // scroll lock
    if (lbClose) lbClose.focus();

    document.addEventListener('keydown', lbKeydown, true);
  }

  function closeLightbox() {
    if (!lbIsOpen()) return;

    lbEl.classList.remove('is-open', 'yt-lightbox--short');
    document.body.classList.remove('lightbox-open');

    // Tear the player down completely so playback and audio stop.
    while (lbFrame.firstChild) lbFrame.removeChild(lbFrame.firstChild);

    document.removeEventListener('keydown', lbKeydown, true);

    if (lbReturn && typeof lbReturn.focus === 'function') lbReturn.focus();
    lbReturn = null;

    if (lbOnClose) { var cb = lbOnClose; lbOnClose = null; cb(); }
  }

  if (lbEl) {
    // Backdrop and the X both carry data-lb-close.
    lbEl.addEventListener('click', function (e) {
      var node = e.target;
      while (node && node !== lbEl) {
        if (node.hasAttribute && node.hasAttribute('data-lb-close')) { closeLightbox(); return; }
        node = node.parentNode;
      }
    });
  }

  /* ---------- Spotlight Video Carousel (auto-fetched from RSS) ---------- */
  var spotCenter = document.getElementById('spot-center');
  var spotLeft = document.getElementById('spot-left');
  var spotRight = document.getElementById('spot-right');
  var spotDots = document.getElementById('spot-dots');
  var ytCarousel = document.getElementById('yt-carousel');

  if (spotCenter && spotLeft && spotRight && ytCarousel) {
    var channelId = 'UCu0kb0PuVHuq2H2ZPYwCJ2w';
    var rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId;
    var apiUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
    var videos = [];
    var current = 0;

    function videoIdOf(link) {
      var m = (link || '').match(/(?:watch\?v=|shorts\/|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{6,})/);
      return m ? m[1] : '';
    }

    // rss2json hands titles back HTML-escaped (&quot;, &amp;, &#39;). Written
    // straight into textContent they show up as literal entity text on the
    // card, so decode once here. A textarea cannot execute anything.
    function decodeEntities(s) {
      if (!s) return '';
      var ta = document.createElement('textarea');
      ta.innerHTML = s;
      return ta.value;
    }

    function setCard(el, v) {
      el.href = v.link;
      el._video = v;
      el.classList.toggle('is-short', !!v.isShort);
      var img = el.querySelector('img');
      if (v.videoId) {
        img.src = 'https://i.ytimg.com/vi/' + v.videoId + '/hqdefault.jpg';
        img.onerror = function () { this.src = 'https://i.ytimg.com/vi/' + v.videoId + '/mqdefault.jpg'; this.onerror = null; };
      } else if (v.thumbnail) {
        img.src = v.thumbnail;
      }
      img.alt = v.title;
      img.removeAttribute('loading');
      el.querySelector('.spotlight-card-title').textContent = v.title;
    }

    // Any card opens the player in place instead of leaving the site.
    [spotLeft, spotCenter, spotRight].forEach(function (card) {
      card.addEventListener('click', function (e) {
        if (!card._video || !card._video.videoId) return;   // fall through to the href
        e.preventDefault();
        clearInterval(autoTimer);
        openLightbox(card._video, resetAuto);
      });
    });

    function updateSpotlight(idx) {
      if (videos.length === 0) return;
      var len = videos.length;
      var leftIdx = (idx - 1 + len) % len;
      var rightIdx = (idx + 1) % len;
      setCard(spotCenter, videos[idx]);
      setCard(spotLeft, videos[leftIdx]);
      setCard(spotRight, videos[rightIdx]);
      var dots = spotDots.querySelectorAll('.spotlight-dot');
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }

    function nextVideo() { current = (current + 1) % videos.length; updateSpotlight(current); }
    function prevVideo() { current = (current - 1 + videos.length) % videos.length; updateSpotlight(current); }

    var prevBtn = ytCarousel.querySelector('.spotlight-prev');
    var nextBtn = ytCarousel.querySelector('.spotlight-next');
    if (prevBtn) prevBtn.addEventListener('click', function () { prevVideo(); resetAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { nextVideo(); resetAuto(); });

    // Auto-rotate
    var autoTimer = setInterval(nextVideo, 5000);
    function resetAuto() { clearInterval(autoTimer); autoTimer = setInterval(nextVideo, 5000); }
    ytCarousel.addEventListener('mouseenter', function () { clearInterval(autoTimer); });
    ytCarousel.addEventListener('mouseleave', function () { resetAuto(); });

    // Pause auto-rotate while off-screen (mobile scroll) to avoid jumpy updates
    if ('IntersectionObserver' in window) {
      var ytObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) resetAuto();
          else clearInterval(autoTimer);
        });
      }, { threshold: 0.3 });
      ytObserver.observe(ytCarousel);
    }

    fetch(apiUrl)
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          // Shorts are included on purpose: the channel feed only carries
          // ~15 recent uploads and most of them are Shorts, so filtering
          // them out left two cards. Take the seven most recent overall
          // and label the Shorts instead of hiding them.
          videos = data.items
            .filter(function (v) { return v.link && videoIdOf(v.link); })
            .slice(0, 7)
            .map(function (v) {
              return {
                title: decodeEntities(v.title),
                link: v.link,
                thumbnail: v.thumbnail,
                videoId: videoIdOf(v.link),
                isShort: v.link.indexOf('/shorts/') !== -1
              };
            });
        }
        if (videos.length === 0) return;
        // Build dots
        videos.forEach(function (_, i) {
          var dot = document.createElement('button');
          dot.className = 'spotlight-dot' + (i === 0 ? ' active' : '');
          dot.setAttribute('aria-label', 'Video ' + (i + 1));
          dot.addEventListener('click', function () { current = i; updateSpotlight(current); resetAuto(); });
          spotDots.appendChild(dot);
        });
        updateSpotlight(0);
      })
      .catch(function () {});
  }

  /* ---------- Merch Spotlight Carousel ---------- */
  var merchCenter = document.getElementById('merch-center');
  var merchLeft = document.getElementById('merch-left');
  var merchRight = document.getElementById('merch-right');
  var merchDots = document.getElementById('merch-dots');
  var merchCarousel = document.getElementById('merch-carousel');

  if (merchCenter && merchLeft && merchRight && merchCarousel) {
    var merchItems = [
      { img: 'assets/images/merch/cafwfee-cup-army.png', name: 'Cawfee Cup — Meatbawl Army', price: '$11.00' },
      { img: 'assets/images/merch/cafwfee-cup-haw-yaw.png', name: 'Cawfee Cup — How Aw Yaw', price: '$13.40' },
      { img: 'assets/images/merch/cafwfee-cup-army-v2.png', name: 'Cawfee Cup — Meatbawl Army V2', price: '$11.00' },
      { img: 'assets/images/merch/cafwfee-mug-joemet.png', name: 'Cawfee Mug — JOEMET123 Travel Mug', price: '$23.40' },
      { img: 'assets/images/merch/cafwfee-mug-army.png', name: 'Cawfee Mug — Meatbawl Army Travel Mug', price: '$23.40' },
      { img: 'assets/images/merch/sticker-frankie.png', name: 'Holographic Sticker — Frankie Beans', price: '$6.00' },
      { img: 'assets/images/merch/stickers-pack.png', name: '11 Mini Stickers — Sticker Pack', price: '$6.50' },
      { img: 'assets/images/merch/tshirt-haw-yaw.png', name: 'T-Shirt — How Aw Ya', price: '$16.30' },
      { img: 'assets/images/merch/tshirt-army.png', name: 'T-Shirt — Meatbawl Army', price: '$16.30' },
      { img: 'assets/images/merch/hoodie-frankie.png', name: 'Hoodie — Frankie Beans', price: '$28.30' },
      { img: 'assets/images/merch/hoodie-army.png', name: 'Hoodie — Meatbawl Army', price: '$28.30' },
      { img: 'assets/images/merch/beanie-frankie.png', name: 'Beanie — Frankie Beans', price: '$15.60' }
    ];
    var mIdx = 0;

    function setMerchCard(el, item) {
      el.querySelector('img').src = item.img;
      el.querySelector('img').alt = item.name;
      el.querySelector('.spotlight-card-name').textContent = item.name;
      el.querySelector('.spotlight-card-price').textContent = item.price;
    }

    function updateMerch(idx) {
      var len = merchItems.length;
      setMerchCard(merchCenter, merchItems[idx]);
      setMerchCard(merchLeft, merchItems[(idx - 1 + len) % len]);
      setMerchCard(merchRight, merchItems[(idx + 1) % len]);
      var dots = merchDots.querySelectorAll('.spotlight-dot');
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    }

    function nextMerch() { mIdx = (mIdx + 1) % merchItems.length; updateMerch(mIdx); }
    function prevMerch() { mIdx = (mIdx - 1 + merchItems.length) % merchItems.length; updateMerch(mIdx); }

    var mPrev = merchCarousel.querySelector('.spotlight-prev');
    var mNext = merchCarousel.querySelector('.spotlight-next');
    if (mPrev) mPrev.addEventListener('click', function () { prevMerch(); resetMerchAuto(); });
    if (mNext) mNext.addEventListener('click', function () { nextMerch(); resetMerchAuto(); });

    var merchAuto = setInterval(nextMerch, 5000);
    function resetMerchAuto() { clearInterval(merchAuto); merchAuto = setInterval(nextMerch, 5000); }
    merchCarousel.addEventListener('mouseenter', function () { clearInterval(merchAuto); });
    merchCarousel.addEventListener('mouseleave', function () { resetMerchAuto(); });

    // Pause auto-rotate while off-screen (mobile scroll) to avoid jumpy updates
    if ('IntersectionObserver' in window) {
      var merchObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) resetMerchAuto();
          else clearInterval(merchAuto);
        });
      }, { threshold: 0.3 });
      merchObserver.observe(merchCarousel);
    }

    // Build dots
    merchItems.forEach(function (_, i) {
      var dot = document.createElement('button');
      dot.className = 'spotlight-dot' + (i === 0 ? ' active' : '');
      dot.setAttribute('aria-label', 'Merch ' + (i + 1));
      dot.addEventListener('click', function () { mIdx = i; updateMerch(mIdx); resetMerchAuto(); });
      merchDots.appendChild(dot);
    });
    updateMerch(0);
  }

  /* ---------- Live Follower Counts ---------- */
  // YouTube (via noembed fallback — shows static count, API needs key)
  // Twitch follower count requires API auth — show static for now

  /* ---------- Donate Popup Window ---------- */
  // "Support via Streamlabs" — opens a dedicated 500x750 mini-window
  // when the browser allows popups. Falls back to a regular new tab
  // (via the <a target="..."> native behavior) when popups are blocked,
  // so the button always works regardless of browser policy.
  var donatePopupLink = document.querySelector('.donate-popup-btn');
  if (donatePopupLink) {
    donatePopupLink.addEventListener('click', function (e) {
      // Clamp popup size to the available screen so it never exceeds
      // the viewport on small phones.
      var w = Math.min(500, window.screen.availWidth - 20);
      var h = Math.min(750, window.screen.availHeight - 40);
      var win = window.open(
        this.href,
        this.target || 'StreamlabsTipping',
        'width=' + w + ',height=' + h + ',scrollbars=yes,resizable=yes'
      );
      if (win) {
        e.preventDefault();
        win.focus();
      }
      // win === null when the popup was blocked -> let the <a> handle it.
    });
  }

  /* ============================================================
     MOTION SYSTEM
     Transform/opacity only. IntersectionObserver over scroll
     listeners. Everything here is additive: if it never runs,
     the page still renders fully.
     ============================================================ */

  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  /* ---------- Header condenses once you leave the top ---------- */
  (function headerScrollState() {
    if (!hasIO) return;
    var sentinel = document.createElement('div');
    sentinel.setAttribute('aria-hidden', 'true');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.insertBefore(sentinel, document.body.firstChild);

    new IntersectionObserver(function (entries) {
      document.body.classList.toggle('is-scrolled', !entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  })();

  /* ---------- Scroll reveals, staggered per entering batch ---------- */
  (function scrollReveals() {
    if (prefersReduced || !hasIO) return;

    // The hero is deliberately excluded: it is above the fold and
    // should paint immediately rather than fade in behind the player.
    var targets = document.querySelectorAll(
      '.main-content > .section, .main-content > .about-section, .main-content > .cmd-grid'
    );
    if (!targets.length) return;

    targets.forEach(function (el) { el.classList.add('reveal'); });

    var io = new IntersectionObserver(function (entries) {
      // Offset only the items arriving together, 55ms apart, capped so it never drags.
      var arriving = entries.filter(function (e) { return e.isIntersecting; });
      arriving.forEach(function (entry, i) {
        entry.target.style.transitionDelay = Math.min(i, 5) * 55 + 'ms';
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    targets.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- Measure the sticky chrome ----------
     The band is one row on mobile (nav is an overlay) and two rows on
     desktop, so its height cannot be a constant. Anything that has to
     sit or scroll below it reads these two custom properties. */
  (function stickyOffsets() {
    var band = document.querySelector('.site-band');
    if (!band) return;
    var jump = document.querySelector('.page-jump');

    function measure() {
      var b = Math.round(band.getBoundingClientRect().height);
      var j = jump ? Math.round(jump.getBoundingClientRect().height) : 0;
      var root = document.documentElement.style;
      root.setProperty('--band-total', b + 'px');
      root.setProperty('--anchor-offset', (b + j + 22) + 'px');
    }

    measure();
    window.addEventListener('resize', measure, { passive: true });
    if ('ResizeObserver' in window) {
      var ro = new ResizeObserver(measure);
      ro.observe(band);
      if (jump) ro.observe(jump);
    }
  })();

  /* ---------- Scroll progress rail ---------- */
  (function scrollProgress() {
    if (!document.body) return;
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var queued = false;
    function update() {
      queued = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - doc.clientHeight;
      var p = max > 0 ? Math.min(Math.max(doc.scrollTop / max, 0), 1) : 0;
      bar.style.transform = 'scaleX(' + p + ')';
    }
    function schedule() {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    update();
  })();

  /* ---------- Stats count up the first time they are seen ---------- */
  (function statCountUp() {
    if (prefersReduced || !hasIO) return;
    var nums = document.querySelectorAll('.stat-num[data-count-to]');
    if (!nums.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        io.unobserve(entry.target);

        var el = entry.target;
        var to = parseFloat(el.getAttribute('data-count-to'));
        var dp = parseInt(el.getAttribute('data-decimals') || '0', 10);
        if (isNaN(to)) return;

        var started = null;
        var dur = 900;

        function frame(ts) {
          if (started === null) started = ts;
          var p = Math.min((ts - started) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);          // ease-out
          el.textContent = (to * eased).toFixed(dp);
          if (p < 1) window.requestAnimationFrame(frame);
          else el.textContent = to.toFixed(dp);
        }
        window.requestAnimationFrame(frame);
      });
    }, { threshold: 0.6 });

    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- In-page jump nav: mark the section you are in ---------- */
  (function jumpNavSpy() {
    var nav = document.querySelector('.page-jump');
    if (!nav || !hasIO) return;

    var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
    var map = {};
    links.forEach(function (a) {
      var target = document.getElementById(a.getAttribute('href').slice(1));
      if (target) map[target.id] = a;
    });
    var ids = Object.keys(map);
    if (!ids.length) return;

    map[ids[0]].classList.add('is-current');

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-current'); });
        map[entry.target.id].classList.add('is-current');
      });
    }, { rootMargin: '-25% 0px -65% 0px', threshold: 0 });

    ids.forEach(function (id) { io.observe(document.getElementById(id)); });
  })();

  /* ---------- Close the mobile nav on Escape or outside tap ---------- */
  if (hamburger && mainNav) {
    var closeNav = function () {
      if (!mainNav.classList.contains('open')) return;
      hamburger.classList.remove('active');
      mainNav.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    };

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });

    document.addEventListener('click', function (e) {
      if (!mainNav.classList.contains('open')) return;
      if (mainNav.contains(e.target) || hamburger.contains(e.target)) return;
      closeNav();
    });
  }

  /* ---------- Keep aria-expanded honest on the hamburger ---------- */
  if (hamburger && mainNav) {
    var syncExpanded = function () {
      hamburger.setAttribute('aria-expanded', mainNav.classList.contains('open') ? 'true' : 'false');
    };
    hamburger.addEventListener('click', syncExpanded);
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', syncExpanded);
    });
  }


  /* ---------- Live Discord presence count ---------- */
  (function discordCount() {
    var el = document.getElementById('dc-count');
    if (!el) return;
    fetch('https://discord.com/api/guilds/472588259717939211/widget.json')
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (d && typeof d.presence_count === 'number') {
          el.textContent = d.presence_count.toLocaleString() + ' Online';
        }
      })
      .catch(function () {});
  })();
})();
