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
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(rssUrl);
    var videos = [];
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

    fetch(proxyUrl)
      .then(function (res) { return res.text(); })
      .then(function (xml) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, 'text/xml');
        var entries = doc.querySelectorAll('entry');
        entries.forEach(function (entry, i) {
          if (i >= 10) return;
          var vid = entry.querySelector('videoId');
          var title = entry.querySelector('title');
          if (vid && title) videos.push({ id: vid.textContent, title: title.textContent });
        });
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
