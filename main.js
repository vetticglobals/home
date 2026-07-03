/* The Vettic Dossier, night edition — progressive enhancement only.
   The page is complete without this file: all content is static, bars
   carry final widths, the stamp is visible. JS adds the night sky, the
   reading lamp, day/night switching, optional ambient music, and the
   original reveal/stamp/sticky behaviors. Motion gates on
   prefers-reduced-motion; sound only ever starts from a user gesture. */
(function () {
  "use strict";

  var root = document.documentElement;
  var motionOK =
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
    "IntersectionObserver" in window;

  function store(key, val) {
    try { localStorage.setItem(key, val); } catch (e) {}
  }
  function recall(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  /* ==================================================================
     THEME — night by default, remembered, soft-crossfaded when possible
     ================================================================== */
  var themeBtn = document.getElementById("themeToggle");
  var metaTheme = document.getElementById("metaTheme");

  function currentTheme() {
    return root.getAttribute("data-theme") === "light" ? "light" : "dark";
  }
  function applyTheme(t, persist) {
    root.setAttribute("data-theme", t);
    if (persist) store("vt-theme", t);
    if (metaTheme) metaTheme.setAttribute("content", t === "light" ? "#f99984" : "#0b101d");
    if (themeBtn) {
      themeBtn.setAttribute("aria-pressed", t === "dark" ? "true" : "false");
      themeBtn.setAttribute("aria-label", t === "dark" ? "Switch to day mode" : "Switch to night mode");
    }
    Field.setTheme(t);
    Lamp.setTheme(t);
  }
  var themeState = currentTheme(); // logical state: stays truthful while a view transition is mid-flight
  if (themeBtn) {
    themeBtn.addEventListener("click", function () {
      themeState = themeState === "dark" ? "light" : "dark";
      var next = themeState;
      if (document.startViewTransition && motionOK) {
        document.startViewTransition(function () { applyTheme(next, true); });
      } else {
        applyTheme(next, true);
      }
    });
  }

  /* ==================================================================
     THE NIGHT SKY — the talent pool as a drifting starfield.
     Seven brighter stars draw the V constellation over the hero:
     the seven signals, connected. Pointer pulls nearby stars into
     focus and links them — the act of matching.
     ================================================================== */
  var Field = (function () {
    var canvas = document.getElementById("field");
    if (!canvas || !canvas.getContext) return { setTheme: function () {} };

    var ctx = canvas.getContext("2d");
    var W = 0, H = 0, stars = [], raf = 0, running = false;
    var last = 0, fade = 0, born = 0;
    var pointer = { x: -9999, y: -9999 };
    var hero = document.querySelector(".desk");
    var shoot = null, nextShoot = 9;
    var spriteCream = makeSprite("240,233,216");
    var spriteCoral = makeSprite("249,153,132");

    /* The V — seven signals as a constellation, in hero-relative coords */
    var V_POINTS = [
      [0.575, 0.10], [0.615, 0.21], [0.655, 0.32], [0.695, 0.43],
      [0.755, 0.31], [0.815, 0.19], [0.875, 0.07]
    ];

    function makeSprite(rgb) {
      var s = document.createElement("canvas");
      s.width = s.height = 64;
      var g = s.getContext("2d");
      var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, "rgba(" + rgb + ",1)");
      grad.addColorStop(0.25, "rgba(" + rgb + ",0.55)");
      grad.addColorStop(0.6, "rgba(" + rgb + ",0.12)");
      grad.addColorStop(1, "rgba(" + rgb + ",0)");
      g.fillStyle = grad;
      g.fillRect(0, 0, 64, 64);
      return s;
    }

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var n = Math.round(Math.min(170, (W * H) / 9500));
      stars = [];
      for (var i = 0; i < n; i++) {
        var z = Math.random(); // depth: 0 far, 1 near
        stars.push({
          x: Math.random() * W,
          y: Math.random() * (H * 1.5),
          z: z,
          r: 0.6 + z * 1.6 + (Math.random() < 0.06 ? 1.4 : 0),
          a: 0.2 + z * 0.42,
          tw: Math.random() * 6.283,
          ts: 0.3 + Math.random() * 0.8,
          vx: 2 + z * 5,
          vy: (Math.random() - 0.5) * 2.4,
          coral: Math.random() < 0.26,
          dx: 0, dy: 0
        });
      }
    }

    function drawStar(x, y, r, alpha, coral) {
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      var s = r * 8;
      ctx.drawImage(coral ? spriteCoral : spriteCream, x - s, y - s, s * 2, s * 2);
    }

    function frame(now) {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
      last = now;
      born += dt;
      fade = Math.min(1, fade + dt / 1.2);

      ctx.clearRect(0, 0, W, H);
      var sy = window.pageYOffset || 0;
      var span = H * 1.5;
      var near = []; // stars close to the pointer this frame

      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (s.x > W + 20) s.x = -20;
        if (s.x < -20) s.x = W + 20;

        var py = s.y - sy * (0.05 + s.z * 0.12);
        py = ((py % span) + span) % span - H * 0.25;

        /* gentle pull toward the pointer */
        var ddx = pointer.x - s.x, ddy = pointer.y - py;
        var d = Math.sqrt(ddx * ddx + ddy * ddy);
        if (d < 150 && d > 0.001) {
          var f = (1 - d / 150) * 14;
          s.dx += (ddx / d) * f * dt;
          s.dy += (ddy / d) * f * dt;
        }
        s.dx *= 0.94;
        s.dy *= 0.94;

        var x = s.x + s.dx * 10;
        var y = py + s.dy * 10;
        var alpha = s.a * (0.72 + 0.28 * Math.sin(born * s.ts + s.tw)) * fade;
        drawStar(x, y, s.r, alpha, s.coral);
        if (d < 130) near.push({ x: x, y: y, d: d });
      }

      /* pointer links: hairlines from the lamp to nearby stars */
      if (near.length) {
        ctx.lineWidth = 1;
        for (var j = 0; j < near.length; j++) {
          var nl = near[j];
          ctx.globalAlpha = (1 - nl.d / 130) * 0.3 * fade;
          ctx.strokeStyle = "rgba(249,153,132,1)";
          ctx.beginPath();
          ctx.moveTo(pointer.x, pointer.y);
          ctx.lineTo(nl.x, nl.y);
          ctx.stroke();
        }
      }

      drawConstellation(born, fade);
      drawShootingStar(dt);
      ctx.globalAlpha = 1;
    }

    /* The seven-signal V, drawn stroke by stroke after the headline rises.
       Skipped on narrow screens, where it would squeeze into the text. */
    function drawConstellation(t, globalFade, forceComplete) {
      if (!hero || W < 720) return;
      var rect = hero.getBoundingClientRect();
      if (rect.bottom < -60) return;
      var pts = V_POINTS.map(function (p) {
        return [p[0] * W, rect.top + p[1] * rect.height];
      });
      var progress = forceComplete ? 6 : Math.max(0, Math.min(6, ((t - 1.6) / 2.6) * 6));

      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(240,233,216,1)";
      for (var i = 0; i < Math.ceil(progress); i++) {
        var seg = Math.min(1, progress - i);
        ctx.globalAlpha = 0.4 * seg * globalFade;
        ctx.beginPath();
        ctx.moveTo(pts[i][0], pts[i][1]);
        ctx.lineTo(
          pts[i][0] + (pts[i + 1][0] - pts[i][0]) * seg,
          pts[i][1] + (pts[i + 1][1] - pts[i][1]) * seg
        );
        ctx.stroke();
      }
      for (var k = 0; k < pts.length; k++) {
        var lit = forceComplete ? 1 : Math.max(0, Math.min(1, progress - (k - 1)));
        if (lit <= 0) continue;
        var pulse = forceComplete ? 1 : 1 + 0.5 * (1 - lit);
        drawStar(pts[k][0], pts[k][1], 2.6 * pulse, (0.7 + 0.22 * Math.sin(t * 0.9 + k)) * lit * globalFade, true);
      }
    }

    /* A streak across the sky every so often — blink and you miss it */
    function drawShootingStar(dt) {
      nextShoot -= dt;
      if (!shoot && nextShoot <= 0) {
        shoot = {
          x: W * (0.1 + Math.random() * 0.6),
          y: H * (0.05 + Math.random() * 0.3),
          vx: 420 + Math.random() * 200,
          vy: 140 + Math.random() * 80,
          life: 0.8
        };
        nextShoot = 9 + Math.random() * 10;
      }
      if (!shoot) return;
      shoot.life -= dt;
      if (shoot.life <= 0) { shoot = null; return; }
      shoot.x += shoot.vx * dt;
      shoot.y += shoot.vy * dt;
      var tail = 0.09;
      var g = ctx.createLinearGradient(shoot.x, shoot.y, shoot.x - shoot.vx * tail, shoot.y - shoot.vy * tail);
      g.addColorStop(0, "rgba(240,233,216," + (0.7 * shoot.life) + ")");
      g.addColorStop(1, "rgba(240,233,216,0)");
      ctx.globalAlpha = 1;
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(shoot.x, shoot.y);
      ctx.lineTo(shoot.x - shoot.vx * tail, shoot.y - shoot.vy * tail);
      ctx.stroke();
    }

    function start() {
      if (running) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
    function stop() {
      running = false;
      cancelAnimationFrame(raf);
    }

    /* Reduced motion: one complete, still frame of the night sky */
    function staticFrame() {
      ctx.clearRect(0, 0, W, H);
      fade = 1;
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i];
        drawStar(s.x, ((s.y % (H * 1.5)) + H * 1.5) % (H * 1.5) - H * 0.25, s.r, s.a, s.coral);
      }
      drawConstellation(0, 1, true);
      ctx.globalAlpha = 1;
    }

    window.addEventListener("resize", function () {
      resize();
      if (!motionOK && currentTheme() === "dark") staticFrame();
    });
    window.addEventListener("pointermove", function (e) {
      pointer.x = e.clientX;
      pointer.y = e.clientY;
    }, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (currentTheme() !== "dark" || !motionOK) return;
      if (document.hidden) stop(); else start();
    });

    resize();
    return {
      setTheme: function (t) {
        if (t === "dark") {
          if (motionOK) start(); else staticFrame();
        } else {
          stop();
        }
      }
    };
  })();

  /* ==================================================================
     READING LAMP — a pool of warm light trailing the pointer
     ================================================================== */
  var Lamp = (function () {
    var el = document.getElementById("lamp");
    var fine = window.matchMedia("(pointer: fine)").matches;
    if (!el || !fine || !motionOK) return { setTheme: function () {} };

    var tx = -9999, ty = -9999, x = -9999, y = -9999, raf = 0, active = false;

    function loop() {
      if (!active) return;
      raf = requestAnimationFrame(loop);
      x += (tx - x) * 0.12;
      y += (ty - y) * 0.12;
      el.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    }
    window.addEventListener("pointermove", function (e) {
      tx = e.clientX; ty = e.clientY;
      if (x < -999) { x = tx; y = ty; }
      if (active) el.classList.add("on");
    }, { passive: true });

    return {
      setTheme: function (t) {
        active = t === "dark";
        cancelAnimationFrame(raf);
        if (active) loop(); else el.classList.remove("on");
      }
    };
  })();

  /* ==================================================================
     AMBIENT MUSIC — a small generative piece, synthesized on the fly.
     Purely background: a warm pad drifting through a four-chord cycle,
     an airy noise bed, and sparse pentatonic notes like distant keys.
     Off by default; only ever starts from a click on the note button.
     ================================================================== */
  var Music = (function () {
    var btn = document.getElementById("soundToggle");
    if (!btn) return;

    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) { btn.hidden = true; return; }

    var ctx = null, master = null, padOsc = [], padGain = null, lp = null;
    var noiseSrc = null, timers = [], on = false;

    /* Warm, unhurried: Am9 → Fmaj7 → Cmaj7 → G6, one chord ~13s */
    var CHORDS = [
      [110.0, 164.81, 220.0, 246.94, 329.63],
      [87.31, 130.81, 174.61, 220.0, 329.63],
      [130.81, 164.81, 196.0, 246.94, 392.0],
      [98.0, 146.83, 196.0, 246.94, 329.63]
    ];
    var PLUCKS = [523.25, 587.33, 659.25, 783.99, 880.0]; // C pentatonic, high and soft
    var chordIdx = 0;

    function init() {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);

      lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 420;
      lp.Q.value = 0.6;
      lp.connect(master);

      /* slow breathing on the filter */
      var lfo = ctx.createOscillator();
      var lfoGain = ctx.createGain();
      lfo.frequency.value = 0.05;
      lfoGain.gain.value = 150;
      lfo.connect(lfoGain);
      lfoGain.connect(lp.frequency);
      lfo.start();

      padGain = ctx.createGain();
      padGain.gain.value = 0.05;
      padGain.connect(lp);

      var chord = CHORDS[0];
      for (var i = 0; i < chord.length; i++) {
        var o = ctx.createOscillator();
        o.type = i < 2 ? "sine" : "triangle";
        o.frequency.value = chord[i];
        o.detune.value = (i % 2 ? 4 : -3);
        var g = ctx.createGain();
        g.gain.value = i < 2 ? 0.5 : 0.22;
        o.connect(g);
        g.connect(padGain);
        o.start();
        padOsc.push({ osc: o, gain: g });
      }

      /* air: looped noise through its own low filter */
      var len = ctx.sampleRate * 2;
      var buf = ctx.createBuffer(1, len, ctx.sampleRate);
      var data = buf.getChannelData(0);
      for (var n = 0; n < len; n++) data[n] = (Math.random() * 2 - 1) * 0.5;
      noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = buf;
      noiseSrc.loop = true;
      var nf = ctx.createBiquadFilter();
      nf.type = "lowpass";
      nf.frequency.value = 600;
      var ng = ctx.createGain();
      ng.gain.value = 0.012;
      noiseSrc.connect(nf);
      nf.connect(ng);
      ng.connect(master);
      noiseSrc.start();

      timers.push(setInterval(nextChord, 13000));
      timers.push(setInterval(maybePluck, 4200));
    }

    function nextChord() {
      if (!ctx) return;
      chordIdx = (chordIdx + 1) % CHORDS.length;
      var chord = CHORDS[chordIdx];
      var t = ctx.currentTime;
      for (var i = 0; i < padOsc.length; i++) {
        padOsc[i].osc.frequency.setTargetAtTime(chord[i], t, 3.5);
      }
    }

    function maybePluck() {
      if (!ctx || !on || Math.random() < 0.45) return;
      var f = PLUCKS[Math.floor(Math.random() * PLUCKS.length)];
      var t = ctx.currentTime;
      var o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      var g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.035, t + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 3.2);
      var f2 = ctx.createBiquadFilter();
      f2.type = "lowpass";
      f2.frequency.value = 2200;
      o.connect(g); g.connect(f2); f2.connect(master);
      o.start(t);
      o.stop(t + 3.4);
    }

    function setBtn() {
      btn.classList.toggle("playing", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      btn.setAttribute("aria-label", on ? "Pause ambient music" : "Play ambient music");
    }

    function enable() {
      if (!ctx) init();
      if (ctx.state === "suspended") ctx.resume();
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setTargetAtTime(0.85, ctx.currentTime, 1.2);
      on = true;
      store("vt-music", "on");
      setBtn();
    }
    function disable() {
      if (ctx) master.gain.setTargetAtTime(0, ctx.currentTime, 0.4);
      on = false;
      store("vt-music", "off");
      setBtn();
    }

    btn.addEventListener("click", function () {
      hideHint();
      if (on) disable(); else enable();
    });

    document.addEventListener("visibilitychange", function () {
      if (!ctx) return;
      if (document.hidden) { if (on) master.gain.setTargetAtTime(0, ctx.currentTime, 0.3); }
      else if (on) { ctx.resume(); master.gain.setTargetAtTime(0.85, ctx.currentTime, 1.0); }
    });

    /* If music was on last visit, resume on the first gesture (autoplay rules) */
    if (recall("vt-music") === "on") {
      var once = function () {
        enable();
        window.removeEventListener("pointerdown", once);
        window.removeEventListener("keydown", once);
      };
      window.addEventListener("pointerdown", once);
      window.addEventListener("keydown", once);
    }

    /* One-time quiet discovery hint under the note button */
    var hint = document.getElementById("soundHint");
    function hideHint() {
      if (hint) hint.classList.remove("show");
      store("vt-music-hint", "seen");
    }
    if (hint && !recall("vt-music-hint") && recall("vt-music") !== "on") {
      setTimeout(function () { hint.classList.add("show"); }, 2600);
      setTimeout(hideHint, 10000);
    }
  })();

  /* ==================================================================
     READING PROGRESS + SCROLL CUE
     ================================================================== */
  (function () {
    var bar = document.getElementById("progress");
    var cue = document.querySelector(".scroll-cue");
    if (!bar) return;
    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var p = max > 0 ? Math.min(1, window.pageYOffset / max) : 0;
      bar.style.setProperty("--p", p.toFixed(4));
      if (cue && window.pageYOffset > 60) cue.classList.add("gone");
    }
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  })();

  /* ==================================================================
     Original dossier behaviors (unchanged)
     ================================================================== */

  /* ---- Scroll reveals (secondary content only) ---- */
  if (motionOK) {
    var revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach(function (el) { el.classList.add("will-reveal"); });

    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
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
  var band = document.querySelector(".band");
  var colophon = document.querySelector(".colophon");
  if (bar && heroCta && colophon && "IntersectionObserver" in window) {
    bar.hidden = false; // CSS keeps it translated off-screen until .show
    var heroGone = false;
    var bandSeen = false;
    var footSeen = false;
    var update = function () {
      bar.classList.toggle("show", heroGone && !bandSeen && !footSeen);
    };
    new IntersectionObserver(function (entries) {
      var e = entries[0];
      heroGone = !e.isIntersecting && e.boundingClientRect.top < 0;
      update();
    }).observe(heroCta);
    if (band) {
      new IntersectionObserver(function (entries) {
        bandSeen = entries[0].isIntersecting;
        update();
      }, { rootMargin: "0px 0px -25% 0px" }).observe(band);
    }
    new IntersectionObserver(function (entries) {
      footSeen = entries[0].isIntersecting;
      update();
    }, { rootMargin: "0px 0px -40% 0px" }).observe(colophon);
  }

  /* Boot: sync button state, meta color, and theme-dependent layers */
  applyTheme(currentTheme());
})();
