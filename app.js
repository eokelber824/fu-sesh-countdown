(function () {
  "use strict";

  // July 15, 2026 at 9:45 AM California time (PDT, UTC-7) = 16:45 UTC
  // Single fixed instant — same countdown for everyone, everywhere.
  const TARGET_MS = 1784133900000;
  const START_HYPE = Date.now();

  const TITLE_COUNTDOWN = "🎉🥳🎉 Countdown till last Fu Sesh 🎉🥳🎉";
  const TITLE_PARTY = "WooHooo time to party with FU";

  const $ = (id) => document.getElementById(id);

  const els = {
    days: $("days"),
    hours: $("hours"),
    minutes: $("minutes"),
    seconds: $("seconds"),
    mainTitle: $("main-title"),
    mainSubtitle: $("main-subtitle"),
    localEventTime: $("local-event-time"),
    hypeMeter: $("hype-meter"),
    hypePercent: $("hype-percent"),
    statRawSeconds: $("stat-raw-seconds"),
    statExcitement: $("stat-excitement"),
    footerTicker: $("footer-ticker"),
    soundToggle: $("sound-toggle"),
    partyBoost: $("party-boost"),
    rsvpBtn: $("rsvp-btn"),
    rsvpMsg: $("rsvp-msg"),
    daysFun: $("days-fun"),
    hoursFun: $("hours-fun"),
    minutesFun: $("minutes-fun"),
    secondsFun: $("seconds-fun"),
    confettiCanvas: $("confetti-canvas"),
  };

  let soundEnabled = true;
  let partyStarted = false;
  let audioCtx = null;

  const funLabels = {
    days: ["of anticipation", "until glory", "of Fu waiting", "of destiny"],
    hours: ["of hype", "of pure energy", "of almost-there", "of vibes"],
    minutes: ["of Fu energy", "of countdown magic", "of nervous excitement", "of party prep"],
    seconds: ["until destiny", "tick tock", "so close", "HERE WE GO"],
  };

  function pad(n) {
    var num = Number(n);
    if (isNaN(num) || num < 0) return "00";
    return (num < 10 ? "0" : "") + Math.floor(num);
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function formatLocalTime(ms) {
    try {
      return new Date(ms).toLocaleString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short",
      });
    } catch (e) {
      return new Date(ms).toString();
    }
  }

  function updateLocalEventTime() {
    if (!els.localEventTime) return;
    els.localEventTime.textContent =
      "Where you are, that's " + formatLocalTime(TARGET_MS);
  }

  function updateFooterTicker() {
    if (!els.footerTicker) return;
    var nowText = formatLocalTime(Date.now());
    var eventText = formatLocalTime(TARGET_MS);
    els.footerTicker.textContent =
      "Your time now: " + nowText + " · Party starts: " + eventText;
  }

  function getRemaining() {
    var diff = TARGET_MS - Date.now();
    if (diff <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    var totalSeconds = Math.floor(diff / 1000);
    var days = Math.floor(totalSeconds / 86400);
    var hours = Math.floor((totalSeconds % 86400) / 3600);
    var minutes = Math.floor((totalSeconds % 3600) / 60);
    var seconds = totalSeconds % 60;
    return { total: diff, days: days, hours: hours, minutes: minutes, seconds: seconds };
  }

  function updateHypeMeter() {
    if (!els.hypeMeter || !els.hypePercent) return;
    var totalSpan = TARGET_MS - START_HYPE;
    var elapsed = Date.now() - START_HYPE;
    var base = 50;
    if (totalSpan > 0) {
      base = Math.min(99, Math.max(1, Math.round((elapsed / totalSpan) * 100)));
    }
    var jitter = partyStarted ? 100 : Math.min(99, base + Math.floor(Math.random() * 8));
    els.hypeMeter.value = jitter;
    els.hypePercent.textContent = jitter + "%";
  }

  function tickUnit(el) {
    if (!el || !el.closest) return;
    var unit = el.closest(".countdown__unit");
    if (unit) {
      unit.classList.add("tick");
      setTimeout(function () {
        unit.classList.remove("tick");
      }, 200);
    }
  }

  function playTick() {
    if (!soundEnabled || partyStarted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var osc = audioCtx.createOscillator();
      var gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 520;
      gain.gain.value = 0.03;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      /* audio optional */
    }
  }

  function playPartyFanfare() {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      var notes = [523, 659, 784, 1047, 784, 1047];
      for (var i = 0; i < notes.length; i++) {
        (function (freq, idx) {
          var osc = audioCtx.createOscillator();
          var gain = audioCtx.createGain();
          osc.type = idx % 2 === 0 ? "square" : "triangle";
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          var t = audioCtx.currentTime + idx * 0.15;
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
          osc.start(t);
          osc.stop(t + 0.25);
        })(notes[i], i);
      }
    } catch (e) {
      /* audio optional */
    }
  }

  function initConfetti() {
    var canvas = els.confettiCanvas;
    if (!canvas || !canvas.getContext) {
      return { burst: function () {} };
    }

    var ctx = canvas.getContext("2d");
    var particles = [];
    var animId = null;
    var cleanupTimer = null;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    function stopConfetti() {
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
      if (cleanupTimer) {
        clearTimeout(cleanupTimer);
        cleanupTimer = null;
      }
      particles = [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      canvas.style.display = "none";
    }

    function spawn(count) {
      var colors = ["#ffd700", "#ff3d9a", "#00e5ff", "#b8ff3c", "#ffffff"];
      var centerX = canvas.width / 2;
      var centerY = canvas.height / 2;
      for (var i = 0; i < count; i++) {
        particles.push({
          x: centerX + (Math.random() - 0.5) * 80,
          y: centerY + (Math.random() - 0.5) * 80,
          w: 6 + Math.random() * 8,
          h: 4 + Math.random() * 6,
          color: randomFrom(colors),
          vx: (Math.random() - 0.5) * 10,
          vy: -4 - Math.random() * 8,
          rot: Math.random() * 360,
          vr: (Math.random() - 0.5) * 12,
        });
      }
    }

    function frame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      var alive = [];
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.rot += p.vr;
        if (p.y < canvas.height + 60 && p.x > -60 && p.x < canvas.width + 60) {
          alive.push(p);
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rot * Math.PI) / 180);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
          ctx.restore();
        }
      }
      particles = alive;
      if (particles.length > 0) {
        animId = requestAnimationFrame(frame);
      } else {
        stopConfetti();
      }
    }

    return {
      burst: function (intense) {
        stopConfetti();
        canvas.style.display = "block";
        spawn(intense ? 120 : 50);
        animId = requestAnimationFrame(frame);
        cleanupTimer = setTimeout(stopConfetti, 4000);
      },
    };
  }

  var confetti = initConfetti();

  function startParty() {
    if (partyStarted) return;
    partyStarted = true;
    document.body.classList.add("party-mode");
    if (els.mainTitle) els.mainTitle.textContent = TITLE_PARTY;
    if (els.mainSubtitle) {
      els.mainSubtitle.innerHTML =
        "🎊 <strong>THE WAIT IS OVER.</strong> 🎊<br><span class=\"tiny\">Official party status: ACTIVATED · Fu Sesh: LEGENDARY</span>";
    }
    if (els.days) els.days.textContent = "00";
    if (els.hours) els.hours.textContent = "00";
    if (els.minutes) els.minutes.textContent = "00";
    if (els.seconds) els.seconds.textContent = "00";
    if (els.hypeMeter) els.hypeMeter.value = 100;
    if (els.hypePercent) els.hypePercent.textContent = "100%";
    if (els.statExcitement) els.statExcitement.textContent = "∞%";
    if (els.statRawSeconds) els.statRawSeconds.textContent = "0 — PARTY TIME";
    playPartyFanfare();
    confetti.burst(true);
  }

  var lastSecond = -1;

  function updateCountdown() {
    var r = getRemaining();
    if (els.statRawSeconds) {
      els.statRawSeconds.textContent =
        r.total > 0 ? String(Math.ceil(r.total / 1000)) : "0 — PARTY TIME";
    }

    if (r.total <= 0) {
      startParty();
      return;
    }

    if (els.days) els.days.textContent = pad(r.days);
    if (els.hours) els.hours.textContent = pad(r.hours);
    if (els.minutes) els.minutes.textContent = pad(r.minutes);
    if (els.seconds) els.seconds.textContent = pad(r.seconds);

    if (r.seconds !== lastSecond) {
      lastSecond = r.seconds;
      tickUnit(els.seconds);
      playTick();
      if (r.seconds % 7 === 0) {
        if (els.daysFun) els.daysFun.textContent = randomFrom(funLabels.days);
        if (els.hoursFun) els.hoursFun.textContent = randomFrom(funLabels.hours);
        if (els.minutesFun) els.minutesFun.textContent = randomFrom(funLabels.minutes);
        if (els.secondsFun) els.secondsFun.textContent = randomFrom(funLabels.seconds);
      }
    }

    updateHypeMeter();
    if (els.statExcitement) {
      els.statExcitement.textContent = 847 + Math.floor(Math.random() * 50) + "%";
    }
  }

  if (els.soundToggle) {
    els.soundToggle.addEventListener("click", function () {
      soundEnabled = !soundEnabled;
      els.soundToggle.setAttribute("aria-pressed", String(!soundEnabled));
      els.soundToggle.textContent = soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
      if (soundEnabled && audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume();
      }
    });
  }

  if (els.partyBoost) {
    els.partyBoost.addEventListener("click", function () {
      if (els.statExcitement) {
        els.statExcitement.textContent = 900 + Math.floor(Math.random() * 99) + "%";
      }
      if (els.hypeMeter) els.hypeMeter.value = 99;
      if (els.hypePercent) els.hypePercent.textContent = "99%";
      if (soundEnabled) playPartyFanfare();
    });
  }

  if (els.rsvpBtn) {
    els.rsvpBtn.addEventListener("click", function () {
      if (els.rsvpMsg) els.rsvpMsg.hidden = false;
    });
  }

  document.addEventListener(
    "click",
    function () {
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    },
    { once: true }
  );

  updateLocalEventTime();
  updateFooterTicker();
  updateCountdown();
  setInterval(updateCountdown, 250);
  setInterval(updateFooterTicker, 1000);
})();
