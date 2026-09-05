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

    function setCard(el, v) {
      el.href = v.link;
      var img = el.querySelector('img');
      var m = (v.link || '').match(/(?:watch\?v=|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      var vid = m ? m[1] : '';
      if (vid) {
        img.src = 'https://i.ytimg.com/vi/' + vid + '/hqdefault.jpg';
        img.onerror = function() { this.src = 'https://i.ytimg.com/vi/' + vid + '/mqdefault.jpg'; this.onerror = null; };
      } else if (v.thumbnail) {
        img.src = v.thumbnail;
      }
      img.alt = v.title;
      img.removeAttribute('loading');
      el.querySelector('.spotlight-card-title').textContent = v.title;
    }

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
          videos = data.items.filter(function(v) { return v.link && v.link.indexOf('/shorts/') === -1; }).slice(0, 8);
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
      { img: 'assets/images/merch/cafwfee-cup-army.png', name: 'CAWFEE CUP - MEATBAWL ARMY', price: '$11.00' },
      { img: 'assets/images/merch/cafwfee-cup-haw-yaw.png', name: 'CAWFEE CUP - HOW AW YAW', price: '$13.40' },
      { img: 'assets/images/merch/cafwfee-cup-army-v2.png', name: 'CAWFEE CUP - ARMY v2', price: '$11.00' },
      { img: 'assets/images/merch/cafwfee-mug-joemet.png', name: 'TRAVEL MUG - JOEMET123', price: '$23.40' },
      { img: 'assets/images/merch/cafwfee-mug-army.png', name: 'TRAVEL MUG - MEATBAWL ARMY', price: '$23.40' },
      { img: 'assets/images/merch/sticker-frankie.png', name: 'STICKER - FRANKIE BEANS', price: '$6.00' },
      { img: 'assets/images/merch/stickers-pack.png', name: 'STICKER PACK (11 MINI)', price: '$6.50' },
      { img: 'assets/images/merch/tshirt-haw-yaw.png', name: 'T-SHIRT - HOW AW YA', price: '$16.30' },
      { img: 'assets/images/merch/tshirt-army.png', name: 'T-SHIRT - MEATBAWL ARMY', price: '$16.30' },
      { img: 'assets/images/merch/hoodie-frankie.png', name: 'HOODIE - FRANKIE BEANS', price: '$28.30' },
      { img: 'assets/images/merch/hoodie-army.png', name: 'HOODIE - MEATBAWL ARMY', price: '$28.30' },
      { img: 'assets/images/merch/beanie-frankie.png', name: 'BEANIE - FRANKIE BEANS', price: '$15.60' }
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

    var targets = document.querySelectorAll(
      '.main-content > .section, .main-content > .about-section, .main-content > .cmd-category'
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

  /* ---------- Cursor-tracking spotlight on cards (fine pointers only) ---------- */
  (function cardSpotlight() {
    if (prefersReduced) return;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    var selector = '.merch-card, .social-card, .affiliate-card, .cmd-category, .about-section';
    var queued = false;
    var lastX = 0;
    var lastY = 0;
    var lastTarget = null;

    document.addEventListener('pointermove', function (e) {
      lastX = e.clientX;
      lastY = e.clientY;
      lastTarget = e.target;
      if (queued) return;
      queued = true;

      requestAnimationFrame(function () {
        queued = false;
        var card = lastTarget && lastTarget.closest ? lastTarget.closest(selector) : null;
        if (!card) return;
        var r = card.getBoundingClientRect();
        if (!r.width || !r.height) return;
        card.style.setProperty('--mx', ((lastX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((lastY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    }, { passive: true });
  })();

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
})();
