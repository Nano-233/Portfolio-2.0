(function () {
  "use strict";

  var data = window.PORTFOLIO;
  if (!data) return;

  var $ = function (id) { return document.getElementById(id); };
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var CAT = {};
  data.categories.forEach(function (c) { CAT[c.id] = c.label; });

  var STATUS = {
    public: "Live",
    private: "Private repo",
    local: "Not published",
    team: "Team project",
    playable: "Playable"
  };

  var state = { cat: "all", q: "" };

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  /* ------------------------------------------------------------------ *
   * search helpers
   * ------------------------------------------------------------------ */

  function hay(p) {
    return [p.title, p.summary, p.detail || "", p.tagline, CAT[p.category] || "", p.year, p.stack.join(" ")]
      .join(" ").toLowerCase();
  }

  function filterList() {
    return data.projects.filter(function (p) {
      if (state.cat !== "all" && p.category !== state.cat) return false;
      if (!state.q) return true;
      return state.q.split(/\s+/).every(function (t) { return hay(p).indexOf(t) !== -1; });
    });
  }

  function mark(container, text, q) {
    container.textContent = "";
    if (!q) { container.textContent = text; return; }
    var terms = q.split(/\s+/).filter(Boolean);
    var lower = text.toLowerCase();
    var ranges = [];
    terms.forEach(function (t) {
      var from = 0, at;
      while ((at = lower.indexOf(t, from)) !== -1) {
        ranges.push([at, at + t.length]);
        from = at + t.length;
      }
    });
    if (!ranges.length) { container.textContent = text; return; }
    ranges.sort(function (a, b) { return a[0] - b[0]; });
    var merged = [];
    ranges.forEach(function (r) {
      var last = merged[merged.length - 1];
      if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
      else merged.push([r[0], r[1]]);
    });
    var cur = 0;
    merged.forEach(function (r) {
      if (r[0] > cur) container.appendChild(document.createTextNode(text.slice(cur, r[0])));
      var m = el("mark", null, text.slice(r[0], r[1]));
      container.appendChild(m);
      cur = r[1];
    });
    if (cur < text.length) container.appendChild(document.createTextNode(text.slice(cur)));
  }

  /* ------------------------------------------------------------------ *
   * year + marquee
   * ------------------------------------------------------------------ */

  $("hero-year").textContent = String(new Date().getFullYear());
  $("year").textContent = String(new Date().getFullYear());

  function buildMarquee() {
    var track = $("marquee-track");
    var words = [
      "AI systems", "Computer vision", "LLM agents", "Game design",
      "Full-stack", "Deterministic engines", "Sports analytics", "On-device ML"
    ];
    for (var pass = 0; pass < 2; pass++) {
      words.forEach(function (w) {
        track.appendChild(el("span", "marquee-item", w));
      });
    }
  }

  /* ------------------------------------------------------------------ *
   * index rows
   * ------------------------------------------------------------------ */

  var rowsEl = $("rows");
  var countEl = $("index-count");
  var noResults = $("no-results");

  function buildRows() {
    var list = filterList();
    rowsEl.textContent = "";

    list.forEach(function (p, i) {
      var row = el("li", "row");
      row.tabIndex = 0;
      row.setAttribute("role", "button");
      row.setAttribute("aria-label", "Open " + p.title);
      row.dataset.id = p.id;

      row.appendChild(el("span", "row-num", String(i + 1).padStart(2, "0")));

      var main = el("div", "row-main");
      var title = el("span", "row-title");
      mark(title, p.title, state.q);
      main.appendChild(title);
      main.appendChild(el("span", "row-sub", p.tagline));
      row.appendChild(main);

      var side = el("div", "row-side");
      side.appendChild(el("span", "row-cat", CAT[p.category] || p.category));
      side.appendChild(el("span", "row-year", p.year));
      var arrow = el("span", "row-arrow", "↗");
      side.appendChild(arrow);
      row.appendChild(side);

      row.addEventListener("click", function () { openDetail(p); });
      row.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(p); }
      });
      attachPreview(row, p);
      if (finePointer) row.addEventListener("hotenter", function () { if (!state.q) scramble(title, p.title); });

      rowsEl.appendChild(row);
    });

    countEl.textContent = list.length === data.projects.length
      ? data.projects.length + " works"
      : list.length + " / " + data.projects.length;

    noResults.hidden = list.length !== 0;
    rowsEl.hidden = list.length === 0;
  }

  function buildCats() {
    var wrap = $("cats");
    data.categories.forEach(function (c) {
      var b = el("button", null, c.label);
      b.type = "button";
      b.dataset.cat = c.id;
      b.setAttribute("aria-pressed", "false");
      wrap.appendChild(b);
    });

    wrap.addEventListener("click", function (e) {
      var b = e.target.closest("button");
      if (!b) return;
      state.cat = b.dataset.cat;
      syncCats();
      buildRows();
    });

    syncCats();
  }

  function syncCats() {
    $("cats").querySelectorAll("button").forEach(function (b) {
      var on = b.dataset.cat === state.cat;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  var filterTimer;
  $("filter").addEventListener("input", function (e) {
    var v = e.target.value.trim().toLowerCase();
    clearTimeout(filterTimer);
    filterTimer = setTimeout(function () {
      state.q = v;
      buildRows();
    }, 80);
  });

  $("reset").addEventListener("click", function () {
    state = { cat: "all", q: "" };
    $("filter").value = "";
    syncCats();
    buildRows();
  });

  /* ------------------------------------------------------------------ *
   * cursor preview
   * ------------------------------------------------------------------ */

  var cursor = $("cursor");
  var preview = $("cursor-preview");
  var previewVideo = preview.querySelector("video");
  var previewImage = preview.querySelector("img");
  var mouse = { x: -200, y: -200, cx: 0, cy: 0 };
  var previewTok = 0, previewDelay = 0, warmCache = {};
  function warm(src) { if (!warmCache[src]) { warmCache[src] = new Image(); warmCache[src].src = src; } return warmCache[src]; }
  // fetch every preview image/poster once the page has settled, so first hovers are instant
  window.addEventListener("load", function () {
    setTimeout(function () {
      data.projects.forEach(function (p) { if (p.media) warm(p.media.type === "video" ? p.media.poster : p.media.src); });
    }, 300);
  });

  function attachPreview(node, project) {
    if (!finePointer || !project.media) return;

    node.addEventListener("hotenter", function () {
      var m = project.media, tok = ++previewTok;
      previewVideo.classList.remove("is-shown");
      previewImage.classList.remove("is-shown");
      previewVideo.pause();
      // ponytail: pop is immediate via .is-hot; preview waits 100ms so fast skims don't flash media
      clearTimeout(previewDelay);
      previewDelay = setTimeout(function () {
        if (tok !== previewTok) return;
        preview.classList.add("is-visible");
        document.body.classList.add("cursor-active");
      }, 100);

      if (m.type === "video") {
        previewVideo.poster = m.poster || "";
        if (previewVideo.getAttribute("src") !== m.src) previewVideo.src = m.src;
        previewVideo.muted = true;
        previewVideo.play().catch(function () {});
        previewVideo.classList.add("is-shown");
      } else {
        var im = warm(m.src);
        var show = function () {
          if (tok !== previewTok) return;
          previewImage.src = m.src;
          previewImage.alt = "";
          previewImage.classList.add("is-shown");
        };
        if (im.complete && im.naturalWidth) show(); else im.addEventListener("load", show, { once: true });
      }
    });
    node.addEventListener("hotleave", function () {
      clearTimeout(previewDelay);
      previewTok++;
      preview.classList.remove("is-visible");
      document.body.classList.remove("cursor-active");
      previewVideo.pause();
    });
  }

  function setupCursor() {
    if (!finePointer || reduce) return;

    // the custom dot replaces the system cursor everywhere
    document.body.classList.add("has-cursor");
    document.addEventListener("pointerover", function (e) {
      var t = e.target.closest ? e.target : e.target.parentElement;
      document.body.classList.toggle("cursor-link", !!(t && t.closest("a,button,input,[role=button],.row")));
      document.body.classList.toggle("cursor-drag", !!(t && t.closest(".gallery-viewport")));
    });

    // ponytail: hover is computed from the pointer position (not :hover), so it also updates while scrolling and never skips a row
    var hot = null, rowsEl = $("rows");
    function syncHot() {
      var e = document.elementFromPoint(mouse.x, mouse.y), r = e && e.closest ? e.closest(".row") : null;
      if (r === hot) return;
      if (hot) { hot.classList.remove("is-hot"); hot.dispatchEvent(new Event("hotleave")); }
      hot = r;
      if (hot) { hot.classList.add("is-hot"); hot.dispatchEvent(new Event("hotenter")); }
      rowsEl.classList.toggle("has-hot", !!hot);
    }
    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      syncHotSoon();
    }, { passive: true });
    var hotRaf = 0;
    function syncHotSoon() { if (!hotRaf) hotRaf = requestAnimationFrame(function () { hotRaf = 0; syncHot(); }); }
    window.addEventListener("scroll", syncHotSoon, { passive: true });

    // keep the preview inside the viewport
    function tick() {
      // the dot sits exactly on the pointer; only the preview eases, and flips at the viewport edge
      var w = 580, pad = 24;
      var tx = mouse.x + pad + w > window.innerWidth ? -w - pad * 2 : 0;
      var ty = mouse.y + pad + w * 0.62 > window.innerHeight ? -w * 0.62 - pad * 2 : 0;
      mouse.cx += (tx - mouse.cx) * 0.2;
      mouse.cy += (ty - mouse.cy) * 0.2;

      cursor.style.transform = "translate3d(" + mouse.x + "px," + mouse.y + "px,0)";
      preview.style.translate = mouse.cx.toFixed(1) + "px " + mouse.cy.toFixed(1) + "px";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ *
   * gallery rail
   * ------------------------------------------------------------------ */

  /* ------------------------------------------------------------------ *
   * "Take a look": a 3D wheel the page scroll spins. Front card is large and plays.
   * ------------------------------------------------------------------ */

  var pin = $("wheel-pin"), wheel = $("wheel"), scene = pin ? pin.querySelector(".wheel-scene") : null;
  var W = { list: data.plates, cards: [], step: 0, cur: 0, target: 0, pos: 0, active: -1, R: 0, raf: 0 };

  function cardW() { return Math.max(240, Math.min(760, window.innerWidth * 0.31, window.innerHeight * 0.6)); }

  function buildGallery() {
    var n = W.list.length, cw = cardW();
    wheel.textContent = "";
    W.cards = [];
    W.active = -1;
    W.step = 360 / n;
    // ponytail: radius keeps neighbours nearly touching; the front card is pushed toward the viewer in spin()
    W.R = Math.max(cw * 1.2, (cw * 1.04 / 2) / Math.tan(Math.PI / n));
    pin.style.setProperty("--cw", cw + "px");

    W.list.forEach(function (plate, i) {
      var card = el("button", "card");
      card.type = "button";
      card.setAttribute("aria-label", plate.label);
      var frame = el("span", "card-frame");
      var media = document.createElement(plate.type === "video" ? "video" : "img");
      media.src = plate.src;
      if (plate.type === "video") { media.muted = true; media.loop = true; media.playsInline = true; media.preload = "metadata"; }
      else { media.alt = plate.label; media.loading = "lazy"; media.draggable = false; }
      frame.appendChild(media);
      card.appendChild(frame);
      card.appendChild(el("span", "card-num", String(i + 1).padStart(2, "0")));
      card.addEventListener("click", function () {
        if (i !== mod(Math.round(W.cur))) { scrollToCard(i); return; }
        var proj = data.projects.filter(function (q) { return q.id === plate.p; })[0];
        if (proj) openDetail(proj);
      });
      wheel.appendChild(card);
      W.cards.push({ el: card, media: media, plate: plate, i: i });
    });
    sizePin();
    spin(true);
  }

  // ponytail: no pinning. Section is content-height; wheel over it spins the cylinder, and hands the page back at either end.
  function sizePin() { pin.style.height = ""; }

  function kick() { if (!W.raf) W.raf = requestAnimationFrame(function () { spin(false); }); }
  function mod(k) { return ((k % W.list.length) + W.list.length) % W.list.length; }
  // circular: go to card i by the shortest way round
  function scrollToCard(i) { var n = W.list.length, r = Math.round(W.pos); W.pos = r + mod(i - r + n / 2 | 0) - (n / 2 | 0); kick(); }

  (scene || pin).addEventListener("wheel", function (e) {
    if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    e.preventDefault(); // ponytail: endless loop, so the wheel always captures; scroll the page with the pointer outside the section
    // ponytail: target may lead the visible position by at most 1.5 cards, so fast flicks still pass through every entry
    W.pos = Math.max(W.cur - 1.5, Math.min(W.cur + 1.5, W.pos + Math.max(-0.5, Math.min(0.5, e.deltaY / 160))));
    kick();
  }, { passive: false });

  function spin(snap) {
    var n = W.list.length;
    W.target = W.pos;
    if (snap || reduce) W.cur = W.target;
    else W.cur += (W.target - W.cur) * 0.14;

    wheel.style.transform = "translateZ(" + (-W.R) + "px) rotateX(-4deg) rotateY(" + (-W.cur * W.step) + "deg)";
    var act = mod(Math.round(W.cur));
    W.cards.forEach(function (c, i) {
      var d = (((i - W.cur) % n) + n) % n;
      d = Math.min(d, n - d);
      var near = Math.max(0, 1 - d);
      c.el.style.transform = "rotateY(" + (i * W.step) + "deg) translateZ(" + (W.R + near * W.R * 0.3).toFixed(1) + "px) scale(" + (0.7 + 0.3 * near).toFixed(3) + ")";
      c.el.style.opacity = Math.max(0, 1 - d / 4).toFixed(2);
      c.el.style.pointerEvents = d < 3 ? "auto" : "none";
      c.el.classList.toggle("is-active", i === act);
    });
    if (act !== W.active) setActive(act);
    if (Math.abs(W.target - W.cur) > 0.002) W.raf = requestAnimationFrame(function () { spin(false); });
    else W.raf = 0;
  }

  function setActive(i) {
    W.cards.forEach(function (c) { if (c.plate.type === "video") c.media.pause(); });
    var c = W.cards[i];
    if (c.plate.type === "video") c.media.play().catch(function () {});
    W.active = i;
    $("wheel-num").textContent = String(i + 1).padStart(2, "0") + " / " + String(W.list.length).padStart(2, "0");
    $("wheel-title").textContent = c.plate.label;
    $("wheel-tag").textContent = c.plate.note;
  }

  window.addEventListener("resize", buildGallery);

  /* ------------------------------------------------------------------ *
   * scroll-driven behaviours: rail, progress, marquee, gallery
   * ------------------------------------------------------------------ */

  var railList = $("rail-list");
  var sections = [];

  function buildRail() {
    var defs = [
      { id: "hero", label: "Top" },
      { id: "gallery", label: "Take a look" },
      { id: "index", label: "Index" },
      { id: "about", label: "Colophon" },
      { id: "contact", label: "Contact" }
    ];

    defs.forEach(function (d) {
      var section = document.getElementById(d.id);
      if (!section) return;
      sections.push({ el: section, btn: null, id: d.id });

      var li = document.createElement("li");
      var b = el("button", null);
      b.type = "button";
      b.setAttribute("aria-label", "Go to " + d.label);
      var tick = el("span", "rail-tick");
      tick.setAttribute("aria-hidden", "true");
      b.appendChild(tick);
      b.appendChild(document.createTextNode(d.label));
      b.addEventListener("click", function () {
        section.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
      li.appendChild(b);
      railList.appendChild(li);
      sections[sections.length - 1].btn = b;
    });
  }

  function setupScroll() {
    var bar = $("progress-bar");
    var topbar = document.querySelector(".topbar");
    var heroName = document.querySelector(".hero-name");
    var marqueeTrack = $("marquee-track");
    var lastScrollY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

      topbar.classList.toggle("is-solid", y > 40);
      if (heroName && !reduce) {
        var hf = Math.min(1, y / window.innerHeight);
        heroName.style.transform = "translateY(" + (y * 0.28).toFixed(1) + "px) scale(" + (1 - hf * 0.18).toFixed(3) + ")";
        heroName.style.opacity = Math.max(0, 1 - hf * 1.15).toFixed(2);
      }

      // rail active section
      var mid = y + window.innerHeight * 0.35;
      var active = sections[0];
      sections.forEach(function (s) { if (s.el.offsetTop <= mid) active = s; });
      sections.forEach(function (s) { s.btn.classList.toggle("is-active", s === active); });

      // marquee drifts with scroll direction
      if (marqueeTrack && !reduce) {
        var delta = y - lastScrollY;
        marqueeOffset -= delta * 0.35;
        var half = marqueeTrack.scrollWidth / 2;
        if (half > 0) {
          if (marqueeOffset < -half) marqueeOffset += half;
          if (marqueeOffset > 0) marqueeOffset -= half;
        }
        marqueeTrack.style.transform = "translate3d(" + marqueeOffset.toFixed(1) + "px,0,0)";
      }
      lastScrollY = y;
      ticking = false;
    }

    var marqueeOffset = 0;

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ------------------------------------------------------------------ *
   * detail overlay
   * ------------------------------------------------------------------ */

  var detail = $("detail");
  var detailTitle = $("detail-title");
  var detailKicker = $("detail-kicker");
  var detailMeta = $("detail-meta");
  var detailSummary = $("detail-summary");
  var detailMedia = $("detail-media");
  var detailBody = $("detail-body");
  var detailLinks = $("detail-links");
  var openList = [];
  var openIndex = -1;
  var lastFocus = null;

  function openDetail(project) {
    openList = filterList();
    openIndex = openList.findIndex(function (p) { return p.id === project.id; });
    lastFocus = document.activeElement;
    fillDetail(project);
    detail.hidden = false;
    document.body.classList.add("is-loading");
    $("detail-close").focus();
  }

  function fillDetail(p) {
    detailKicker.textContent = (CAT[p.category] || p.category) + " · " + p.year;
    detailTitle.textContent = p.title;

    var meta = [STATUS[p.status] || p.status];
    if (p.commits) meta.push(p.commits + " commits");
    meta = meta.concat(p.stack);
    detailMeta.textContent = meta.join("  ·  ");

    detailSummary.textContent = p.summary;

    detailMedia.textContent = "";
    if (p.media) {
      if (p.media.type === "video") {
        var v = document.createElement("video");
        v.src = p.media.src;
        if (p.media.poster) v.poster = p.media.poster;
        v.controls = true;
        v.muted = true;
        v.loop = true;
        v.playsInline = true;
        v.setAttribute("playsinline", "");
        detailMedia.appendChild(v);
      } else {
        var img = document.createElement("img");
        img.src = p.media.src;
        img.alt = p.media.alt || p.title;
        detailMedia.appendChild(img);
      }
    }

    detailBody.textContent = "";
    if (p.detail) detailBody.appendChild(el("p", null, p.detail));

    if (p.embed) {
      var wrap = el("div", "detail-media");
      var frame = document.createElement("iframe");
      frame.src = p.embed;
      frame.title = p.title + " playable demo";
      frame.loading = "lazy";
      frame.allowFullscreen = true;
      frame.style.cssText = "display:block;width:100%;aspect-ratio:16/10;border:0";
      wrap.appendChild(frame);
      detailBody.appendChild(wrap);
    }

    detailLinks.textContent = "";
    if (!p.links || !p.links.length) {
      detailLinks.appendChild(el("span", "note", p.status === "team" ? "Team hackathon — no public repository" : "Not published — available on request"));
    } else {
      p.links.forEach(function (l) {
        var a = el("a", null, l.label + " ↗");
        a.href = l.href;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        detailLinks.appendChild(a);
      });
    }

    detail.querySelector(".detail-inner").scrollTop = 0;
  }

  function closeDetail() {
    detail.hidden = true;
    document.body.classList.remove("is-loading");
    detailMedia.textContent = "";
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function step(dir) {
    if (!openList.length) return;
    openIndex = (openIndex + dir + openList.length) % openList.length;
    fillDetail(openList[openIndex]);
  }

  $("detail-close").addEventListener("click", closeDetail);
  $("detail-prev").addEventListener("click", function () { step(-1); });
  $("detail-next").addEventListener("click", function () { step(1); });
  detail.addEventListener("click", function (e) { if (e.target === detail) closeDetail(); });

  /* ------------------------------------------------------------------ *
   * palette
   * ------------------------------------------------------------------ */

  var palette = $("palette");
  var palInput = $("palette-input");
  var palResults = $("palette-results");
  var palItems = [];
  var palIndex = 0;

  function commands() {
    var list = [
      { kind: "Go", title: "Take a look", run: function () { jump("#gallery"); } },
      { kind: "Go", title: "Index of works", run: function () { jump("#index"); } },
      { kind: "Go", title: "Colophon", run: function () { jump("#about"); } },
      { kind: "Go", title: "Contact", run: function () { jump("#contact"); } },
      { kind: "Act", title: "Invert theme", run: toggleTheme },
      { kind: "Link", title: "GitHub", run: function () { ext("https://github.com/Nano-233"); } },
      { kind: "Link", title: "LinkedIn", run: function () { ext("https://www.linkedin.com/in/harbour-wang-a51743281/"); } },
      { kind: "Link", title: "itch.io", run: function () { ext("https://nano-233.itch.io/"); } }
    ];
    data.projects.forEach(function (p) {
      list.push({ kind: "Work", title: p.title, project: p, run: function () { openDetail(p); } });
    });
    return list;
  }

  var allCommands = commands();

  function jump(hash) {
    closePalette();
    var t = document.querySelector(hash);
    if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }

  function ext(url) {
    closePalette();
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function renderPalette() {
    var q = palInput.value.trim().toLowerCase();
    palItems = allCommands.filter(function (c) {
      return !q || (c.title + " " + c.kind).toLowerCase().indexOf(q) !== -1;
    }).slice(0, 40);
    palIndex = 0;
    palResults.textContent = "";

    if (!palItems.length) {
      palResults.appendChild(el("li", "pal-empty", "Nothing for \u201c" + palInput.value + "\u201d"));
      return;
    }

    palItems.forEach(function (c, i) {
      var li = el("li", "pal-item");
      li.setAttribute("role", "option");
      li.setAttribute("aria-selected", String(i === 0));
      var t = el("span", "pal-title");
      mark(t, c.title, q);
      li.appendChild(t);
      li.appendChild(el("span", "pal-kind", c.kind));
      li.addEventListener("click", function () { c.run(); });
      li.addEventListener("pointermove", function () { setPal(i); });
      palResults.appendChild(li);
    });
  }

  function setPal(i) {
    var nodes = palResults.querySelectorAll(".pal-item");
    if (!nodes.length) return;
    palIndex = (i + nodes.length) % nodes.length;
    nodes.forEach(function (n, k) { n.setAttribute("aria-selected", String(k === palIndex)); });
    var a = nodes[palIndex];
    if (a) a.scrollIntoView({ block: "nearest" });
  }

  function openPalette() {
    if (!palette.hidden) return;
    palInput.value = "";
    renderPalette();
    palette.hidden = false;
    palInput.focus();
  }

  function closePalette() {
    palette.hidden = true;
  }

  palInput.addEventListener("input", renderPalette);
  palInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setPal(palIndex + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setPal(palIndex - 1); }
    else if (e.key === "Enter") {
      e.preventDefault();
      var c = palItems[palIndex];
      if (c) c.run();
    } else if (e.key === "Escape") { closePalette(); }
  });
  palette.addEventListener("click", function (e) { if (e.target === palette) closePalette(); });
  $("search-open").addEventListener("click", openPalette);

  /* ------------------------------------------------------------------ *
   * theme
   * ------------------------------------------------------------------ */

  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    $("theme-toggle").textContent = t === "paper" ? "Darken" : "Lighten";
  }

  function toggleTheme() {
    var next = document.documentElement.getAttribute("data-theme") === "paper" ? "ink" : "paper";
    applyTheme(next);
    try { localStorage.setItem("hw-theme", next); } catch (e) { /* ignore */ }
  }

  function initTheme() {
    var stored = null;
    try { stored = localStorage.getItem("hw-theme"); } catch (e) { /* ignore */ }
    applyTheme(stored || "ink");
    $("theme-toggle").addEventListener("click", toggleTheme);
  }

  /* ------------------------------------------------------------------ *
   * global keys
   * ------------------------------------------------------------------ */

  document.addEventListener("keydown", function (e) {
    var typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);

    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      if (palette.hidden) openPalette(); else closePalette();
      return;
    }
    if (e.key === "/" && !typing && palette.hidden && detail.hidden) {
      e.preventDefault();
      openPalette();
      return;
    }
    if (e.key === "Escape") {
      if (!palette.hidden) closePalette();
      else if (!detail.hidden) closeDetail();
      return;
    }
    if (detail.hidden && palette.hidden && !typing && W.list.length && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
      var wr = pin.getBoundingClientRect();
      if (wr.top < window.innerHeight * 0.5 && wr.bottom > window.innerHeight * 0.5) {
        e.preventDefault();
        scrollToCard(mod(W.active + (e.key === "ArrowRight" ? 1 : -1)));
        return;
      }
    }
    if (!detail.hidden) {
      if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    }
  });

  /* ------------------------------------------------------------------ *
   * reveals
   * ------------------------------------------------------------------ */

  function setupReveals() {
    var nodes = document.querySelectorAll("[data-reveal], .hero-name .line");

    // The name is above the fold: show it immediately, never gate it on an observer.
    document.querySelectorAll(".hero-name .line").forEach(function (n) {
      n.classList.add("is-in");
    });

    var rest = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window) || reduce) {
      rest.forEach(function (n) { n.classList.add("is-in"); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    rest.forEach(function (n) { io.observe(n); });

    requestAnimationFrame(function () {
      rest.forEach(function (n) {
        if (n.classList.contains("is-in")) return;
        var r = n.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.96 && r.bottom > 0) {
          n.classList.add("is-in");
          io.unobserve(n);
        }
      });
    });
  }

  /* ------------------------------------------------------------------ *
   * flair: live clock, letters that shy away from the cursor,
   * scrambling row titles, strip that skews with its own velocity
   * ------------------------------------------------------------------ */

  var GLYPHS = "!<>-_/[]{}=+*^?#";

  function scramble(node, final) {
    if (reduce || node.dataset.busy) return;
    node.dataset.busy = "1";
    var n = 0, steps = 14;
    var timer = setInterval(function () {
      n++;
      node.textContent = final.split("").map(function (c, i) {
        return c === " " || i < (n / steps) * final.length ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      }).join("");
      if (n >= steps) {
        clearInterval(timer);
        delete node.dataset.busy;
        mark(node, final, state.q);
      }
    }, 28);
  }

  function setupFlair() {
    var clock = $("clock");
    function tick() {
      clock.textContent = new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit", minute: "2-digit", timeZone: "Asia/Singapore"
      }).format(new Date()) + " SGT";
    }
    tick();
    setInterval(tick, 15000);

    if (reduce) return;

    if (!finePointer) return;

    // split the name into letters; once the reveal is over, let them leave the mask
    var name = document.querySelector(".hero-name");
    name.setAttribute("aria-label", "Harbour Wang");
    var letters = [];
    name.querySelectorAll(".line > span").forEach(function (w) {
      var txt = w.textContent;
      w.textContent = "";
      txt.split("").forEach(function (c) {
        var l = el("span", "ltr", c);
        w.appendChild(l);
        letters.push(l);
      });
    });
    setTimeout(function () { name.classList.add("is-settled"); }, 1600);

    var pending = false, mx = -999, my = -999;
    window.addEventListener("pointermove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (pending) return;
      pending = true;
      requestAnimationFrame(function () {
        pending = false;
        letters.forEach(function (l) {
          var r = l.getBoundingClientRect();
          var dx = r.left + r.width / 2 - mx, dy = r.top + r.height / 2 - my;
          var dist = Math.hypot(dx, dy) || 1, R = 260;
          var f = dist < R ? Math.pow(1 - dist / R, 2) * 46 : 0;
          l.style.transform = f ? "translate(" + (dx / dist * f).toFixed(1) + "px," + (dy / dist * f).toFixed(1) + "px)" : "";
        });
      });
    }, { passive: true });
  }
  /* ------------------------------------------------------------------ *
   * boot
   * ------------------------------------------------------------------ */

  function boot() {
    buildMarquee();
    buildCats();
    buildRows();
    buildGallery();
    buildRail();
    initTheme();
    setupScroll();
    setupCursor();
    setupReveals();
    setupFlair();

    document.body.classList.remove("is-loading");
    requestAnimationFrame(function () {
      document.body.classList.add("is-ready");
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
