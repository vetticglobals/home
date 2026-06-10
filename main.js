/* The Vettic Dossier — progressive enhancement only.
   The page is complete without this file: bars carry their final widths,
   the stamp is visible, all content is static. JS only subtracts state
   and restores it on scroll. Everything gates on prefers-reduced-motion. */
(function () {
  "use strict";

  var motionOK =
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    "IntersectionObserver" in window;

  /* ---- Scroll reveals (secondary content only) ---- */
  if (motionOK) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach(function (el) { el.classList.add("will-reveal"); });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          // Stagger within a group, capped, cleared after run so hovers never lag.
          var group = el.closest("[data-reveal-group]");
          if (group) {
            var siblings = Array.prototype.slice.call(
              group.querySelectorAll("[data-reveal]")
            );
            var i = siblings.indexOf(el);
            el.style.transitionDelay = Math.min(i, 5) * 80 + "ms";
            el.addEventListener("transitionend", function clear() {
              el.style.transitionDelay = "";
              el.removeEventListener("transitionend", clear);
            });
          }
          el.classList.add("in");
          io.unobserve(el);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.15 }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---- Specimen: bars draw, stamp lands. Once, then replayable. ---- */
  var specimen = document.getElementById("specimen");
  if (specimen && motionOK) {
    specimen.classList.add("armed");

    var specimenIO = new IntersectionObserver(
      function (entries) {
        if (entries[0].isIntersecting) {
          specimen.classList.add("in");
          specimenIO.disconnect();
          var replay = document.querySelector(".replay");
          if (replay) {
            replay.hidden = false;
            replay.addEventListener("click", function () {
              specimen.classList.remove("in");
              void specimen.offsetWidth; // restart transitions
              specimen.classList.add("in");
            });
          }
        }
      },
      { threshold: 0.35 }
    );
    specimenIO.observe(specimen);
  }

  /* ---- Sticky mobile CTA: show after the hero CTA exits, hide at colophon ---- */
  var bar = document.getElementById("stickyCta");
  var heroCta = document.querySelector(".cover-cta");
  var colophon = document.querySelector(".colophon");
  if (bar && heroCta && colophon && "IntersectionObserver" in window) {
    bar.hidden = false; // CSS keeps it translated off-screen until .show
    var heroGone = false;
    var footSeen = false;
    var update = function () {
      bar.classList.toggle("show", heroGone && !footSeen);
    };
    new IntersectionObserver(function (entries) {
      // Only count the hero CTA as "gone" once it has exited upward —
      // on load it sits below the fold and the bar must stay hidden.
      var e = entries[0];
      heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(heroCta);
    new IntersectionObserver(function (entries) {
      footSeen = entries[0].isIntersecting;
      update();
    }, { rootMargin: "0px 0px -40% 0px" }).observe(colophon);
  }
})();
