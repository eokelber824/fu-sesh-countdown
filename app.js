(function () {
  "use strict";

  // July 15, 2026 at 9:45 AM Pacific (America/Los_Angeles)
  const EVENT_YEAR = 2026;
  const EVENT_MONTH = 6; // July (0-indexed)
  const EVENT_DAY = 15;
  const EVENT_HOUR = 9;
  const EVENT_MINUTE = 45;

  const TITLE_COUNTDOWN = "🎉🥳🎉 Countdown till last Fu Sesh 🎉🥳🎉";
  const TITLE_PARTY = "WooHooo time to party with FU";
  const TZ = "America/Los_Angeles";

  const $ = (id) => document.getElementById(id);

  const els = {
    days: $("days"),
    hours: $("hours"),
    minutes: $("minutes"),
    seconds: $("seconds"),
    mainTitle: $("main-title"),
    mainSubtitle: $("main-subtitle"),
    hypeMeter: $("hype-meter"),
    hypePercent: $("hype-percent"),
    statRawSeconds: $("stat-raw-seconds"),
    statExcitement: $("stat-excitement"),
    footerTicker: $("footer-ticker"),
    soundToggle: $("sound-toggle"),
    partyBoost: $("party-boost"),
    rsvpBtn: $("rsvp-btn"),
    rsvpMsg: $("rsvp-msg"),
    countdown: $("countdown"),
    daysFun: $("days-fun"),
    hoursFun: $("hours-fun"),
    minutesFun: $("minutes-fun"),
    secondsFun: $("seconds-fun"),
    celebrationOverlay: $("celebration-overlay"),
    sparkleLayer: $("sparkle-layer"),
    confettiCanvas: $("confetti-canvas"),
  };

  let soundEnabled = true;
  let partyStarted = false;
  let audioCtx = null;
  let confettiAnim = null;

  const funLabels = {
    days: ["of anticipation", "until glory", "of Fu waiting", "of destiny"],
    hours: ["of hype", "of pure energy", "of almost-there", "of vibes"],
    minutes: ["of Fu energy", "of countdown magic", "of nervous excitement", "of party prep"],
    seconds: ["until destiny", "tick tock", "so close", "HERE WE GO"],
  };

  function getTargetDate() {
    // 9:45 AM on July 15 in America/Los_Angeles (PDT = UTC-7 in July).
    // Resolve wall-clock time via Intl instead of parsing offset strings, which
    // breaks in Safari and produces NaN countdowns.
    const desired = {
      year: EVENT_YEAR,
      month: EVENT_MONTH + 1,
      day: EVENT_DAY,
      hour: EVENT_HOUR,
      minute: EVENT_MINUTE,
    };

    let guess = Date.UTC(EVENT_YEAR, EVENT_MONTH, EVENT_DAY, EVENT_HOUR + 7, EVENT_MINUTE, 0);
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ,
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: false,
    });

    for (let i = 0; i < 6; i++) {
      const parts = formatter.formatToParts(new Date(guess));
      const part = (type) => Number(parts.find((p) => p.type === type).value);
      const got = {
        year: part("year"),
        month: part("month"),
        day: part("day"),
        hour: part("hour") % 24,
        minute: part("minute"),
      };

      const diffMinutes =
        (desired.year - got.year) * 525600 +
        (desired.month - got.month) * 43200 +
        (desired.day - got.day) * 1440 +
        (desired.hour - got.hour) * 60 +
        (desired.minute - got.minute);

      if (diffMinutes === 0) {
        return new Date(guess);
      }
      guess += diffMinutes * 60 * 1000;
    }

    // Fallback: July is always PDT (UTC-7)
    return new Date(`${EVENT_YEAR}-07-15T09:45:00-07:00`);
  }

  const TARGET = getTargetDate();
  const START_HYPE = Date.now();

  function pad(n) {
    if (!Number.isFinite(n) || n < 0) return "00";
    return String(Math.floor(n)).padStart(2, "0");
  }

  function randomFrom(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function updateFooterTicker() {
    const now = new Date();
    const pt = now.toLocaleString("en-US", {
      timeZone: TZ,
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      timeZoneName: "short",
    });
    els.footerTicker.textContent = `Pacific Time Now: ${pt} · Event locked to July 15, 2026 9:45 AM PT`;
  }

  function getRemaining() {
    const targetMs = TARGET.getTime();
    if (!Number.isFinite(targetMs)) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const diff = targetMs - Date.now();
    if (diff <= 0) {
      return { total: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    const seconds = Math.floor(diff / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return { total: diff, days, hours, minutes, seconds: secs };
  }

  function updateHypeMeter(remaining) {
    const totalSpan = TARGET.getTime() - START_HYPE;
    const elapsed = Date.now() - START_HYPE;
    const base = Math.min(99, Math.max(1, Math.round((elapsed / totalSpan) * 100)));
    const jitter = partyStarted ? 100 : Math.min(99, base + Math.floor(Math.random() * 8));
    els.hypeMeter.value = jitter;
    els.hypePercent.textContent = `${jitter}%`;
  }

  function tickUnit(el) {
    if (!el) return;
    const unit = el.closest(".countdown__unit");
    if (unit) {
      unit.classList.add("tick");
      setTimeout(() => unit.classList.remove("tick"), 200);
    }
  }

  function playTick() {
    if (!soundEnabled || partyStarted) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 520;
      gain.gain.value = 0.03;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (_) {
      /* audio optional */
    }
  }

  function playPartyFanfare() {
    if (!soundEnabled) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523, 659, 784, 1047, 784, 1047];
      notes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = i % 2 === 0 ? "square" : "triangle";
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const t = audioCtx.currentTime + i * 0.15;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.12, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
      });
    } catch (_) {
      /* audio optional */
    }
  }

  function initSparkles() {
    if (!els.sparkleLayer) return;
    const emojis = ["✨", "⭐", "💫", "🌟", "✦"];
    for (let i = 0; i < 24; i++) {
      const s = document.createElement("span");
      s.className = "sparkle";
      s.textContent = randomFrom(emojis);
      s.style.left = `${Math.random() * 100}%`;
      s.style.animationDelay = `${Math.random() * 4}s`;
      s.style.animationDuration = `${3 + Math.random() * 4}s`;
      els.sparkleLayer.appendChild(s);
    }
  }

  function initConfetti() {
    const canvas = els.confettiCanvas;
    const ctx = canvas.getContext("2d");
    let particles = [];
    let running = false;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    function spawn(count) {
      const colors = ["#ffd700", "#ff3d9a", "#00e5ff", "#b8ff3c", "#ffffff"];
      for (let i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: -20 - Math.random() * canvas.height * 0.5,
          w: 6 + Math.random() * 8,
          h: 4 + Math.random() * 6,
          color: randomFrom(colors),
          vx: (Math.random() - 0.5) * 4,
          vy: 2 + Math.random() * 6,
          rot: Math.random() * 360,
          vr: (Math.random() - 0.5) * 12,
        });
      }
    }

    function frame() {
      if (!running && particles.length === 0) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles = particles.filter((p) => p.y < canvas.height + 40);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (running || particles.length > 0) {
        confettiAnim = requestAnimationFrame(frame);
      }
    }

    return {
      burst(intense) {
        spawn(intense ? 180 : 60);
        if (!running) {
          running = true;
          frame();
        }
      },
      partyMode() {
        running = true;
        const interval = setInterval(() => spawn(40), 400);
        frame();
        return () => {
          clearInterval(interval);
          running = false;
        };
      },
    };
  }

  const confetti = initConfetti();

  function startParty() {
    if (partyStarted) return;
    partyStarted = true;
    document.body.classList.add("party-mode");
    els.mainTitle.textContent = TITLE_PARTY;
    els.mainSubtitle.innerHTML =
      "🎊 <strong>THE WAIT IS OVER.</strong> 🎊<br><span class=\"tiny\">Official party status: ACTIVATED · Fu Sesh: LEGENDARY</span>";
    els.days.textContent = "00";
    els.hours.textContent = "00";
    els.minutes.textContent = "00";
    els.seconds.textContent = "00";
    els.hypeMeter.value = 100;
    els.hypePercent.textContent = "100%";
    els.statExcitement.textContent = "∞%";
    els.statRawSeconds.textContent = "0 — PARTY TIME";
    els.celebrationOverlay.hidden = false;
    setTimeout(() => {
      els.celebrationOverlay.hidden = true;
    }, 900);
    playPartyFanfare();
    confetti.burst(true);
    confetti.partyMode();
  }

  let lastSecond = -1;

  function updateCountdown() {
    const r = getRemaining();
    els.statRawSeconds.textContent = r.total > 0 ? Math.ceil(r.total / 1000).toLocaleString() : "0 — PARTY TIME";

    if (r.total <= 0) {
      startParty();
      return;
    }

    els.days.textContent = pad(r.days);
    els.hours.textContent = pad(r.hours);
    els.minutes.textContent = pad(r.minutes);
    els.seconds.textContent = pad(r.seconds);

    if (r.seconds !== lastSecond) {
      lastSecond = r.seconds;
      tickUnit(els.seconds);
      playTick();
      if (r.seconds % 7 === 0) {
        els.daysFun.textContent = randomFrom(funLabels.days);
        els.hoursFun.textContent = randomFrom(funLabels.hours);
        els.minutesFun.textContent = randomFrom(funLabels.minutes);
        els.secondsFun.textContent = randomFrom(funLabels.seconds);
      }
    }

    updateHypeMeter(r);
    els.statExcitement.textContent = `${847 + Math.floor(Math.random() * 50)}%`;
  }

  els.soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    els.soundToggle.setAttribute("aria-pressed", String(!soundEnabled));
    els.soundToggle.textContent = soundEnabled ? "🔊 Sound: ON" : "🔇 Sound: OFF";
    if (soundEnabled && audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  });

  els.partyBoost.addEventListener("click", () => {
    confetti.burst(false);
    els.statExcitement.textContent = `${900 + Math.floor(Math.random() * 99)}%`;
    els.hypeMeter.value = 99;
    els.hypePercent.textContent = "99%";
    if (soundEnabled) playPartyFanfare();
  });

  els.rsvpBtn.addEventListener("click", () => {
    els.rsvpMsg.hidden = false;
    confetti.burst(false);
  });

  document.addEventListener(
    "click",
    () => {
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
    },
    { once: true }
  );

  initSparkles();
  updateFooterTicker();
  updateCountdown();
  setInterval(updateCountdown, 250);
  setInterval(updateFooterTicker, 1000);
})();
