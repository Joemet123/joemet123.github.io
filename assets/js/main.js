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
    var videos = [
      { id: 'j8njoJ1XS5c', title: 'Can I BEAT Kowakujo With My *FAVORITE* Weapon Of-All-Time? (BO7 ZOMBIES)' },
      { id: 'd0hNZkM_IbQ', title: 'KOWAKUJO: FULL MAIN EASTER EGG GUIDE IN UNDER 10 MINUTES!' },
      { id: 'umwH5fbrNxg', title: 'YOU\'RE DOING KOWAKUJO\'S PORTRAITS EE STEP WRONG' },
      { id: 'WmGH3Jp1Csk', title: 'BO7 ZOMBIES: KOWAKUJO MASTERCLASS GUIDE' },
      { id: 'YPx0cSqVFGw', title: 'THE BEST ZOMBIES WEAPON IS BACK IN BO7!' },
      { id: 'mGK1Uy1gKEI', title: '*HOLY* BO7 ASHES OF THE DAMNED ZOMBIES TRAILER REACTION!' },
      { id: 'WbO9wsiq9ok', title: 'BO7 ZOMBIES LEAKED WITH OG CREW!' },
      { id: 'Uo6Dn0p88kE', title: 'THE BIGGEST BO7 ZOMBIES UPDATE IS HERE!' }
    ];
    var current = 0;

    function setCard(el, v) {
      el.href = 'https://www.youtube.com/watch?v=' + v.id;
      el.querySelector('img').src = 'https://i3.ytimg.com/vi/' + v.id + '/hqdefault.jpg';
      el.querySelector('img').alt = v.title;
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
      // Update dots
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

    loadVideos(videos);

  }

  /* ---------- Merch Spotlight Carousel ---------- */
  var merchCenter = document.getElementById('merch-center');
  var merchLeft = document.getElementById('merch-left');
  var merchRight = document.getElementById('merch-right');
  var merchDots = document.getElementById('merch-dots');
  var merchCarousel = document.getElementById('merch-carousel');

  if (merchCenter && merchLeft && merchRight && merchCarousel) {
    var merchItems = [
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-173619042711050-0.png', name: 'CAWFEE CUP - MEATBAWL ARMY', price: '$11.00' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-17521829249324-2.png', name: 'CAWFEE CUP - HOW AW YAW', price: '$13.40' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-175218469611051-0.png', name: 'CAWFEE CUP - ARMY v2', price: '$11.00' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-175218273119514-0.png', name: 'TRAVEL MUG - JOEMET123', price: '$23.40' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-175218496719514-0.png', name: 'TRAVEL MUG - MEATBAWL ARMY', price: '$23.40' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-170805891716706-0.png', name: 'STICKER - FRANKIE BEANS', price: '$6.00' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-172490548212917-0.png', name: 'STICKER PACK (11 MINI)', price: '$6.50' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-17361166689527-0.png', name: 'T-SHIRT - HOW AW YA', price: '$16.30' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-17361170454046-0.png', name: 'T-SHIRT - MEATBAWL ARMY', price: '$16.30' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-170805856010841-1.png', name: 'HOODIE - FRANKIE BEANS', price: '$28.30' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-17080584925554-1.png', name: 'HOODIE - MEATBAWL ARMY', price: '$28.30' },
      { img: 'https://uploads.twitchalerts.com/000/143/932/780/2253608-mockup-170803703217496-0.png', name: 'BEANIE - FRANKIE BEANS', price: '$15.60' }
    ];
    var mIdx = 0;

    function setMerchCard(el, item) {
      el.querySelector('img').src = item.img;
      el.querySelector('img').alt = item.name;
      el.querySelector('.spotlight-card-title').textContent = item.name + ' — ' + item.price;
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

  /* ---------- Donate Form ---------- */
  var donateBtn = document.getElementById('donate-btn');
  if (donateBtn) {
    donateBtn.addEventListener('click', function () {
      var username = document.getElementById('donate-username');
      var amount = document.getElementById('donate-amount');
      var message = document.getElementById('donate-message');

      var user = username ? username.value.trim() : '';
      var amt = amount ? amount.value.trim() : '';
      var msg = message ? message.value.trim() : '';

      if (!amt || isNaN(parseFloat(amt)) || parseFloat(amt) <= 0) {
        alert('Please enter a valid donation amount.');
        return;
      }

      var url = 'https://streamlabs.com/joemet123/tip';
      window.open(url, '_blank');
    });
  }
})();
