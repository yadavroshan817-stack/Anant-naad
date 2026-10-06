
(() => {
  "use strict";

  const cfg = window.ANANT_NAAD_CONFIG;
  const sessionOrder = ["morning", "afternoon", "evening", "night"];

  const byId = (id) => document.getElementById(id);
  const body = document.body;
  const playButton = byId("playButton");
  const playIcon = byId("playIcon");
  const playLabel = byId("playLabel");
  const playerStatus = byId("playerStatus");
  const youtubeTitle = byId("youtubeTitle");
  const streamState = byId("streamState");
  const installButton = byId("installButton");

  let currentSessionKey = "morning";
  let currentSession = cfg.sessions.morning;
  let nextSessionKey = "afternoon";
  let countdownTimer = null;
  let scheduleTimer = null;
  let player = null;
  let playerReady = false;
  let pendingPlay = false;
  let isPlaying = false;
  let deferredInstallPrompt = null;
  let playerApiPromise = null;

  const VEDIC = {
    vasus: [
      "Agni • Fire",
      "Prithvi • Earth",
      "Vayu • Air",
      "Antariksha • Sky",
      "Surya • Sun",
      "Dyaus • Heaven",
      "Soma • Moon",
      "Nakshatra • Stars"
    ],
    rudras: [
      "Chakshu • Sight",
      "Shrotra • Hearing",
      "Ghrana • Smell",
      "Jihva • Taste",
      "Tvak • Touch",
      "Vak • Speech",
      "Pani • Hands",
      "Pada • Feet",
      "Payu • Elimination",
      "Upastha • Reproduction",
      "Manas • Mind"
    ],
    adityas: [
      "Mitra",
      "Aryaman",
      "Bhaga",
      "Varuna",
      "Daksha",
      "Aṃśa",
      "Tvaṣṭṛ",
      "Pūṣan",
      "Vivasvat",
      "Savitṛ",
      "Dhātā",
      "Viṣṇu"
    ],
    completing: ["Indra", "Prajāpati"]
  };

  function minutesOf(time) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  function localMinutes() {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }

  function sessionForNow() {
    const now = localMinutes();
    for (const key of sessionOrder) {
      const s = cfg.sessions[key];
      const start = minutesOf(s.start);
      const end = minutesOf(s.end);
      if (start < end) {
        if (now >= start && now < end) return key;
      } else {
        if (now >= start || now < end) return key;
      }
    }
    return "night";
  }

  function nextSessionFor(key) {
    const idx = sessionOrder.indexOf(key);
    return sessionOrder[(idx + 1) % sessionOrder.length];
  }

  function minutesUntilNextSession() {
    const now = localMinutes();
    const current = cfg.sessions[currentSessionKey];
    let target = minutesOf(current.end);
    let delta = target - now;
    if (delta <= 0) delta += 24 * 60;
    return delta;
  }

  function formatClock(date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function formatCountdown(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return [h, m, s].map(v => String(v).padStart(2, "0")).join(":");
  }

  function applySession(key, forcePlayerReload = false) {
    const oldKey = currentSessionKey;
    currentSessionKey = key;
    currentSession = cfg.sessions[key];
    nextSessionKey = nextSessionFor(key);

    body.dataset.theme = currentSession.palette;
    byId("sessionIcon").textContent = currentSession.icon;
    byId("sessionLabel").textContent = currentSession.label;
    byId("sessionSubtitle").textContent = currentSession.subtitle;
    byId("sessionMood").textContent = currentSession.mood;
    byId("deityFocus").textContent = currentSession.deityFocus.join(" • ");
    byId("stripSession").textContent = currentSession.label;
    byId("stripNext").textContent = cfg.sessions[nextSessionKey].label;
    byId("orbCaption").textContent = currentSession.subtitle;

    // Visual motif varies by mood.
    const symbols = {
      morning: "ॐ",
      afternoon: "कृष्ण",
      evening: "🪔",
      night: "☾"
    };
    byId("orbSymbol").textContent = symbols[key];

    renderSchedule();

    if (oldKey !== key && forcePlayerReload && playerReady) {
      loadSessionIntoPlayer(true);
    }
  }

  function renderSchedule() {
    const grid = byId("scheduleGrid");
    grid.innerHTML = "";
    sessionOrder.forEach(key => {
      const s = cfg.sessions[key];
      const card = document.createElement("article");
      card.className = "schedule-card" + (key === currentSessionKey ? " active" : "");
      card.style.setProperty("--card-accent", `var(--accent)`);
      card.innerHTML = `
        <div class="schedule-icon">${escapeHtml(s.icon)}</div>
        <div class="schedule-name">${escapeHtml(s.label)}</div>
        <div class="schedule-time">${escapeHtml(s.start)} – ${escapeHtml(s.end)}</div>
        <div class="schedule-mood">${escapeHtml(s.mood)}</div>
      `;
      grid.appendChild(card);
    });
  }

  function renderVedicGroups() {
    Object.entries(VEDIC).forEach(([id, items]) => {
      const container = byId(id);
      container.innerHTML = items.map(item => `<div class="deity-chip">${escapeHtml(item)}</div>`).join("");
    });
  }

  function setQuoteForToday() {
    const quotes = cfg.dailyQuotes || [];
    if (!quotes.length) return;
    const start = new Date(new Date().getFullYear(), 0, 0);
    const now = new Date();
    const day = Math.floor((now - start) / 86400000);
    const q = quotes[day % quotes.length];
    byId("quoteText").textContent = q.text;
    byId("quoteTranslation").textContent = q.translation;
    byId("quoteSource").textContent = q.source;
  }

  function buildDirectEmbedUrl() {
    const s = currentSession;
    let url = "";
    if (s.playlistId) {
      url = `https://www.youtube.com/embed?listType=playlist&list=${encodeURIComponent(s.playlistId)}`;
    } else if (Array.isArray(s.videoIds) && s.videoIds.length) {
      const first = encodeURIComponent(s.videoIds[0]);
      const queue = s.videoIds.map(encodeURIComponent).join(",");
      url = `https://www.youtube.com/embed/${first}?playlist=${queue}`;
    }
    if (!url) return "";
    const params = [
      "enablejsapi=1",
      "playsinline=1",
      "controls=1",
      "rel=0",
      "autoplay=0"
    ];
    return `${url}${url.includes("?") ? "&" : "?"}${params.join("&")}`;
  }

  function showDirectEmbedFallback() {
    const url = buildDirectEmbedUrl();
    if (!url) {
      playerStatus.textContent = "No YouTube content is configured for this session.";
      streamState.textContent = "Not configured";
      return;
    }

    const wrap = byId("youtube-player");
    wrap.innerHTML = "";
    const iframe = document.createElement("iframe");
    iframe.src = url;
    iframe.title = `${currentSession.label} — Anant Naad`;
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = "strict-origin-when-cross-origin";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    wrap.appendChild(iframe);

    playerStatus.textContent = "YouTube's standard embedded player is ready. Tap Play inside the player.";
    streamState.textContent = "Embedded player ready";
  }

  function youtubeApi() {
    if (playerApiPromise) return playerApiPromise;

    playerApiPromise = new Promise((resolve, reject) => {
      if (window.YT && window.YT.Player) {
        resolve(window.YT);
        return;
      }

      const previous = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previous === "function") previous();
        resolve(window.YT);
      };

      const existing = document.getElementById("youtube-iframe-api");
      if (existing) return;

      const script = document.createElement("script");
      script.id = "youtube-iframe-api";
      script.src = "https://www.youtube.com/iframe_api";
      script.async = true;
      script.onerror = () => reject(new Error("Could not load the YouTube IFrame API."));
      document.head.appendChild(script);
    });

    return playerApiPromise;
  }

  async function initPlayer() {
    if (playerReady) return;
    streamState.textContent = "Connecting to YouTube…";

    try {
      await youtubeApi();
      const origin = location.protocol.startsWith("http") ? location.origin : undefined;

      player = new window.YT.Player("youtube-player", {
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 0,
          controls: 1,
          playsinline: 1,
          rel: 0,
          enablejsapi: 1,
          origin
        },
        events: {
          onReady: () => {
            playerReady = true;
            loadSessionIntoPlayer(false);
            streamState.textContent = "Ready";
            byId("stripPlayback").textContent = "Ready to play";
            if (pendingPlay) {
              pendingPlay = false;
              playCurrent();
            }
          },
          onStateChange: onPlayerStateChange,
          onError: onPlayerError,
          onAutoplayBlocked: () => {
            pendingPlay = false;
            streamState.textContent = "Tap Play to start";
            playerStatus.textContent = "Your browser blocked automatic playback. Tap Play once and the devotional player will start.";
          }
        }
      });
    } catch (error) {
      console.error(error);
      streamState.textContent = "Using standard YouTube player";
      showDirectEmbedFallback();
    }
  }

  function loadSessionIntoPlayer(autoPlay) {
    if (!playerReady || !player) return;
    const s = currentSession;

    const config = {
      autoplay: autoPlay ? 1 : 0,
      index: 0
    };

    if (s.playlistId) {
      player.loadPlaylist({
        listType: "playlist",
        list: s.playlistId,
        index: 0,
        startSeconds: 0
      });
    } else if (Array.isArray(s.videoIds) && s.videoIds.length) {
      player.loadPlaylist({
        listType: "playlist",
        list: s.videoIds,
        index: 0,
        startSeconds: 0
      });
    } else {
      playerStatus.textContent = "No YouTube playlist is configured for this session. Edit config.js.";
      return;
    }

    player.setLoop(true);
    player.setShuffle(false);

    if (autoPlay) {
      setTimeout(() => playCurrent(), 350);
    }
  }

  function playCurrent() {
    if (!playerReady || !player) {
      pendingPlay = true;
      initPlayer();
      return;
    }
    try {
      player.playVideo();
    } catch (e) {
      console.error(e);
      playerStatus.textContent = "Playback could not start. Tap Play again.";
    }
  }

  function togglePlayback() {
    if (!playerReady) {
      pendingPlay = true;
      initPlayer();
      return;
    }
    if (isPlaying) {
      player.pauseVideo();
    } else {
      playCurrent();
    }
  }

  function onPlayerStateChange(event) {
    const states = window.YT.PlayerState;
    if (event.data === states.PLAYING) {
      isPlaying = true;
      playIcon.textContent = "Ⅱ";
      playLabel.textContent = "Pause";
      streamState.textContent = "LIVE • Playing";
      byId("stripPlayback").textContent = "Playing";
      playerStatus.textContent = "Devotional playback is live in the embedded YouTube player.";
      updateNowPlaying();
    } else if (event.data === states.PAUSED) {
      isPlaying = false;
      playIcon.textContent = "▶";
      playLabel.textContent = "Play Anant Naad";
      streamState.textContent = "Paused";
      byId("stripPlayback").textContent = "Paused";
    } else if (event.data === states.BUFFERING) {
      streamState.textContent = "Buffering…";
      byId("stripPlayback").textContent = "Buffering";
    } else if (event.data === states.ENDED) {
      streamState.textContent = "Switching to next track…";
    } else if (event.data === states.CUED) {
      updateNowPlaying();
      if (!isPlaying) streamState.textContent = "Ready";
    }
  }

  function updateNowPlaying() {
    if (!playerReady || !player) return;
    try {
      const data = player.getVideoData();
      const title = data && data.title ? data.title : currentSession.label;
      youtubeTitle.textContent = title;
    } catch {
      youtubeTitle.textContent = currentSession.label;
    }
  }

  function onPlayerError(event) {
    const messages = {
      2: "Invalid video or playlist configuration.",
      5: "The requested HTML5 player content could not be loaded.",
      100: "This video is unavailable or private.",
      101: "This video does not allow playback on websites.",
      150: "This video does not allow embedded playback."
    };
    const message = messages[event.data] || "YouTube returned a playback error.";
    streamState.textContent = "Playback error";
    playerStatus.textContent = `${message} Try another track or replace the playlist/video in config.js.`;
    showDirectEmbedFallback();
  }

  function updateClockAndCountdown() {
    const now = new Date();
    byId("localTime").textContent = formatClock(now);

    const key = sessionForNow();
    if (key !== currentSessionKey) {
      const wasPlaying = isPlaying;
      applySession(key, wasPlaying);
    }

    const nextSession = cfg.sessions[nextSessionKey];
    const seconds = minutesUntilNextSession() * 60 - now.getSeconds();
    byId("nextSwitch").textContent = `Next mood — ${formatCountdown(Math.max(0, seconds))}`;
  }

  function openModal(title, kicker, html) {
    byId("modalKicker").textContent = kicker;
    byId("modalTitle").textContent = title;
    byId("modalBody").innerHTML = `<div class="modal-content">${html}</div>`;
    byId("modalBackdrop").hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeModal() {
    byId("modalBackdrop").hidden = true;
    document.body.classList.remove("modal-open");
  }

  function donationModal() {
    const d = cfg.donation;
    openModal(
      "Support Anant Naad",
      "DIVINE BROADCASTING",
      `
        <div class="donation">
          <img src="${escapeHtml(d.qrImage)}" alt="UPI donation QR code">
          <div>
            <p>Support the free devotional listening experience. Scan the QR code with a UPI app or use the UPI ID below.</p>
            <div class="upi-box">${escapeHtml(d.upiId)}</div>
            <a class="primary-button" style="display:inline-flex;margin-top:12px;" href="upi://pay?pa=${encodeURIComponent(d.upiId)}&pn=${encodeURIComponent(d.payeeName)}&cu=INR">Open UPI App</a>
          </div>
        </div>
      `
    );
  }

  function helpModal() {
    openModal(
      "How Anant Naad Works",
      "HELP",
      `
        <p><strong>1. Tap Play.</strong> The site starts the official YouTube embedded player after your interaction.</p>
        <p><strong>2. Your local time sets the mood.</strong> Morning, afternoon, evening and night each have a different visual atmosphere and devotional programme.</p>
        <p><strong>3. Keep the player visible.</strong> YouTube playback is embedded rather than downloaded or rebroadcast.</p>
        <p><strong>4. Donate or share.</strong> Use the Donate button for UPI support and Share to send Anant Naad to friends.</p>
        <p><strong>Need to change music?</strong> Open <code>config.js</code> and replace each session's playlistId or videoIds.</p>
      `
    );
  }

  function aboutModal() {
    openModal(
      "About Anant Naad",
      "ABOUT",
      `
        <p>Anant Naad is a lightweight, single-page devotional listening experience designed around time, mood and spiritual ambience.</p>
        <p>The website is intentionally static so it can be hosted for free. Music is played through YouTube's embedded player/API instead of copying or downloading third-party music files.</p>
        <p>Created with Devotion ❤️ by Roshika.</p>
      `
    );
  }

  function privacyModal() {
    openModal(
      "Privacy",
      "PRIVACY",
      `
        <p>Anant Naad does not require login or ask for personal profile information. The static site can store only basic local preferences in the browser if you later add them.</p>
        <p>Because playback is provided by an embedded YouTube player, YouTube may process data according to its own policies. This site does not download or store the music.</p>
      `
    );
  }

  function termsModal() {
    openModal(
      "Terms",
      "TERMS",
      `
        <p>Use Anant Naad for personal listening. Third-party YouTube videos and playlists remain subject to the rights, availability and embedding settings of their owners.</p>
        <p>Do not use the site to download, redistribute or commercially rebroadcast third-party music outside the permissions provided by the relevant platform and rights holders.</p>
      `
    );
  }

  async function shareSite() {
    const shareData = {
      title: "Anant Naad — Divine Sounds, Anytime",
      text: "Listen to Anant Naad — a living devotional radio experience.",
      url: location.href
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch (e) {
      if (e && e.name === "AbortError") return;
    }
    try {
      await navigator.clipboard.writeText(location.href);
      playerStatus.textContent = "Link copied. Share Anant Naad with someone who needs a little calm.";
    } catch {
      prompt("Copy this Anant Naad link:", location.href);
    }
  }

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    installButton.hidden = false;
  });

  installButton.addEventListener("click", async () => {
    if (deferredInstallPrompt) {
      deferredInstallPrompt.prompt();
      await deferredInstallPrompt.userChoice;
      deferredInstallPrompt = null;
      installButton.hidden = true;
      return;
    }

    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    if (isIOS) {
      openModal(
        "Install Anant Naad on iPhone",
        "ADD TO HOME SCREEN",
        `<p>Open Anant Naad in Safari, tap the <strong>Share</strong> button, then choose <strong>Add to Home Screen</strong>.</p>
         <p>The site is designed as a lightweight PWA and works well as a home-screen listening experience.</p>`
      );
      return;
    }

    helpModal();
  });

  playButton.addEventListener("click", togglePlayback);
  byId("shareButton").addEventListener("click", shareSite);
  byId("helpButton").addEventListener("click", helpModal);
  byId("donateButton").addEventListener("click", donationModal);
  byId("donateButtonBottom").addEventListener("click", donationModal);
  byId("aboutButton").addEventListener("click", aboutModal);
  byId("privacyButton").addEventListener("click", privacyModal);
  byId("termsButton").addEventListener("click", termsModal);
  byId("modalClose").addEventListener("click", closeModal);
  byId("modalBackdrop").addEventListener("click", (e) => {
    if (e.target === byId("modalBackdrop")) closeModal();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !byId("modalBackdrop").hidden) closeModal();
  });

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // iOS/iPadOS Safari does not expose beforeinstallprompt.
  if (/iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream) {
    installButton.hidden = false;
  }

  // Initial render
  applySession(sessionForNow());
  renderVedicGroups();
  setQuoteForToday();
  updateClockAndCountdown();
  setInterval(updateClockAndCountdown, 1000);
  setTimeout(() => {
    if (!playerReady) initPlayer();
  }, 150);
  setTimeout(() => {
    if (!playerReady && !document.querySelector("#youtube-player iframe")) {
      showDirectEmbedFallback();
    }
  }, 10000);

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
})();
