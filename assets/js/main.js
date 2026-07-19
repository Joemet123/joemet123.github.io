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

  /* ---------- YouTube Video Carousel (auto-fetched from RSS) ---------- */
  var ytTrack = document.getElementById('yt-track');
  var ytCarousel = document.getElementById('yt-carousel');
  if (ytTrack && ytCarousel) {
    var channelId = 'UCu0kb0PuVHuq2H2ZPYwCJ2w';
    var rssUrl = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId;
    var proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(rssUrl);

    fetch(proxyUrl)
      .then(function (res) { return res.text(); })
      .then(function (xml) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(xml, 'text/xml');
        var entries = doc.querySelectorAll('entry');
        var videos = [];
        entries.forEach(function (entry, i) {
          if (i >= 10) return;
          var vid = entry.querySelector('videoId');
          var title = entry.querySelector('title');
          if (vid && title) {
            videos.push({ id: vid.textContent, title: title.textContent });
          }
        });
        if (videos.length === 0) return;

        ytTrack.innerHTML = '';
        videos.forEach(function (v) {
          var card = document.createElement('a');
          card.href = 'https://www.youtube.com/watch?v=' + v.id;
          card.target = '_blank';
          card.rel = 'noopener';
          card.className = 'card';
          card.innerHTML = '<div class="merch-image-wrap"><img src="https://i3.ytimg.com/vi/' + v.id + '/hqdefault.jpg" alt="' + v.title.replace(/"/g, '&quot;') + '" loading="lazy"></div>' +
            '<div style="padding:1rem 1.25rem;"><div class="card-title" style="font-size:0.92rem;">' + v.title + '</div></div>';
          ytTrack.appendChild(card);
        });

        // Auto-rotate
        var autoScroll = setInterval(function () {
          var maxScroll = ytTrack.scrollWidth - ytTrack.clientWidth;
          if (ytTrack.scrollLeft >= maxScroll - 10) {
            ytTrack.scrollTo({ left: 0, behavior: 'smooth' });
          } else {
            ytTrack.scrollBy({ left: 300, behavior: 'smooth' });
          }
        }, 4000);

        // Pause on hover
        ytCarousel.addEventListener('mouseenter', function () { clearInterval(autoScroll); });
        ytCarousel.addEventListener('mouseleave', function () {
          autoScroll = setInterval(function () {
            var maxScroll = ytTrack.scrollWidth - ytTrack.clientWidth;
            if (ytTrack.scrollLeft >= maxScroll - 10) {
              ytTrack.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
              ytTrack.scrollBy({ left: 300, behavior: 'smooth' });
            }
          }, 4000);
        });
      })
      .catch(function () { /* RSS fetch failed silently */ });
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
