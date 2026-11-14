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
  var mouse = { x: -200, y: -200, cx: -200, cy: -200 };

  function attachPreview(node, project) {
    if (!finePointer || !project.media) return;

    node.addEventListener("mouseenter", function () {
      var m = project.media;
      previewVideo.classList.remove("is-shown");
      previewImage.classList.remove("is-shown");
      previewVideo.pause();

      if (m.type === "video") {
        if (previewVideo.getAttribute("src") !== m.src) previewVideo.src = m.src;
        previewVideo.muted = true;
        previewVideo.play().catch(function () {});
        previewVideo.classList.add("is-shown");
      } else {
        previewImage.src = m.src;
        previewImage.alt = "";
        previewImage.classList.add("is-shown");
      }
      preview.classList.add("is-visible");
      document.body.classList.add("cursor-active");
    });

    node.addEventListener("mouseleave", function () {
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

    window.addEventListener("pointermove", function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    // keep the preview inside the viewport
    function tick() {
      mouse.cx += (mouse.x - mouse.cx) * 0.22;
      mouse.cy += (mouse.y - mouse.cy) * 0.22;

      var w = 260, pad = 24;
      var px = mouse.cx, py = mouse.cy;
      if (px + pad + w > window.innerWidth) px = mouse.cx - w - pad;
      if (py + pad + w * 0.62 > window.innerHeight) py = mouse.cy - pad - w * 0.62;

      cursor.style.transform = "translate3d(" + px.toFixed(1) + "px," + py.toFixed(1) + "px,0)";
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ------------------------------------------------------------------ *
   * gallery rail
   * ------------------------------------------------------------------ */

  function buildGallery() {
    var track = $("gallery-track");

    data.plates.forEach(function (plate, i) {
      var fig = el("figure", "plate");

      var frame = el("div", "plate-frame");
      var media;
      if (plate.type === "video") {
        media = document.createElement("video");
        media.src = plate.src;
        media.muted = true;
        media.loop = true;
        media.playsInline = true;
        media.setAttribute("playsinline", "");
        media.preload = "metadata";;
        frame.appendChild(media);
        frame.addEventListener("mouseenter", function () { media.play().catch(function () {}); });
        frame.addEventListener("mouseleave", function () { media.pause(); });
      } else {
        media = document.createElement("img");
        media.src = plate.src;
        media.alt = plate.label;
        media.loading = i < 2 ? "eager" : "lazy";
        media.decoding = "async";
        frame.appendChild(media);
      }
      frame.addEventListener("error", function () { fig.classList.add("is-fallback"); }, true);
      frame.dataset.label = plate.label;

      var cap = el("figcaption", "plate-cap");
      cap.appendChild(el("strong", null, plate.label));
      cap.appendChild(el("span", null, plate.note));

      fig.appendChild(frame);
      fig.appendChild(cap);
      track.appendChild(fig);
    });
    strip();
  }

  // Native horizontal scroll (vertical wheel passes through to the page); add drag, arrows, thumb.
  function strip() {
    var vp = $("gallery-viewport"), thumb = $("gallery-thumb");
    function sync() {
      var max = vp.scrollWidth - vp.clientWidth;
      var w = vp.clientWidth / vp.scrollWidth;
      thumb.style.width = (w * 100) + "%";
      thumb.style.left = (max > 0 ? (vp.scrollLeft / max) * (1 - w) * 100 : 0) + "%";
    }
    vp.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    window.addEventListener("load", sync);
    sync();

    function by(d) { vp.scrollBy({ left: d * vp.clientWidth * 0.7, behavior: reduce ? "auto" : "smooth" }); }
    $("gallery-prev").addEventListener("click", function () { by(-1); });
    $("gallery-next").addEventListener("click", function () { by(1); });

    // Wheel over the strip scrolls it sideways; at either end it hands off to the page.
    vp.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
      var max = vp.scrollWidth - vp.clientWidth;
      var next = vp.scrollLeft + e.deltaY;
      if (e.deltaY === 0 || next < 0 && vp.scrollLeft <= 0 || next > max && vp.scrollLeft >= max) return;
      e.preventDefault();
      vp.scrollLeft = next;
    }, { passive: false });

    var down = null;
    vp.addEventListener("pointerdown", function (e) {
      if (e.pointerType !== "mouse" || e.button) return;
      down = { x: e.clientX, left: vp.scrollLeft };
    });
    window.addEventListener("pointermove", function (e) {
      if (!down) return;
      vp.classList.add("is-drag");
      vp.scrollLeft = down.left - (e.clientX - down.x);
    });
    window.addEventListener("pointerup", function () { down = null; vp.classList.remove("is-drag"); });
    vp.addEventListener("dragstart", function (e) { e.preventDefault(); });
  }
  /* ------------------------------------------------------------------ *
   * scroll-driven behaviours: rail, progress, marquee, gallery
   * ------------------------------------------------------------------ */

  var railList = $("rail-list");
  var sections = [];

  function buildRail() {
    var defs = [
      { id: "hero", label: "Top" },
      { id: "index", label: "Index" },
      { id: "gallery", label: "Take a look" },
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
    var marqueeTrack = $("marquee-track");
    var lastScrollY = window.scrollY;
    var ticking = false;

    function update() {
      var y = window.scrollY;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";

      topbar.classList.toggle("is-solid", y > 40);

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
      { kind: "Go", title: "Index of works", run: function () { jump("#index"); } },
      { kind: "Go", title: "Take a look", run: function () { jump("#gallery"); } },
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
