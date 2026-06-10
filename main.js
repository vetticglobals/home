// Animate match bars + score count-up when they scroll into view.
(function () {
  "use strict";

  function animateScore(el) {
    var target = parseInt(el.getAttribute("data-score"), 10) || 0;
    var num = el.querySelector(".score-num");
    if (!num) return;
    var start = null;
    var duration = 1100;
    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      num.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function reveal(card) {
    card.querySelectorAll(".match-bar-fill").forEach(function (bar) {
      bar.style.width = (parseInt(bar.getAttribute("data-fill"), 10) || 0) + "%";
    });
    card.querySelectorAll(".match-score").forEach(animateScore);
  }

  var cards = document.querySelectorAll(".match-card");

  if (!("IntersectionObserver" in window)) {
    cards.forEach(reveal); // fallback: just show them
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        reveal(entry.target);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  cards.forEach(function (c) { io.observe(c); });
})();

// Reveal the header "Book a call" CTA only once the hero CTA has scrolled away,
// so the same button never shows twice in the first viewport (esp. on mobile).
(function () {
  "use strict";

  var header = document.querySelector(".site-header");
  var heroCta = document.querySelector(".hero-cta");
  if (!header || !heroCta) return;

  function setVisible(show) {
    header.classList.toggle("show-cta", show);
  }

  // Progressive enhancement: only hide-by-default when we can manage visibility.
  header.classList.add("cta-managed");

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      // Hero CTA out of view -> show header CTA; in view -> hide it.
      setVisible(!entries[0].isIntersecting);
    }, { threshold: 0 });
    io.observe(heroCta);
  } else {
    // Fallback: reveal once the user scrolls past the hero CTA.
    var onScroll = function () {
      setVisible(heroCta.getBoundingClientRect().bottom < 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }
})();
