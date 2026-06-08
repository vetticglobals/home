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
