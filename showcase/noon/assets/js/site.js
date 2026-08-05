/* site.js — TRUE NOON.
   Every mark on this page is computed from solar.js. Nothing here is a picture of an idea.

   Architecture notes:
   - ONE requestAnimationFrame owner (`tick`). No scroll listeners, no second loop.
   - Scenes register a `draw(progress)`; the ticker only calls the ones on screen
     (IntersectionObserver decides), so an off-screen canvas costs nothing.
   - Content is in the markup first; canvases are an upgrade layered over static SVG.
   - prefers-reduced-motion renders every scene at its RESOLVED state and never starts the ticker.
*/
(function () {
  'use strict';

  var S = window.Solar, P = window.Places;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var root = document.documentElement;

  /* ---------------------------------------------------------------- palette
     Read from CSS so the tokens have exactly one home — and resolved to rgb() through the
     browser, because canvas support for oklch() is newer than canvas itself and a colour string
     it does not understand is silently ignored rather than thrown. */
  /* Resolve each token to actual sRGB bytes by painting one pixel and reading it back.
     getComputedStyle is NOT good enough here: Chromium returns an oklch() colour as the string
     "oklch(0.245 0.02 194)", so anything parsing three numbers out of it reads 0.245/0.02/194
     as R/G/B and paints the whole page blue. Painting a pixel is the only answer that cannot
     lie, and it doubles as the support check — an unparsed colour leaves the canvas untouched. */
  var swatch = document.createElement('canvas');
  swatch.width = swatch.height = 1;
  var sctx = swatch.getContext('2d', { willReadFrequently: true });
  function resolve(token, fallback) {
    var raw = getComputedStyle(root).getPropertyValue(token).trim() || fallback;
    for (var attempt = 0; attempt < 2; attempt++) {
      sctx.clearRect(0, 0, 1, 1);
      sctx.fillStyle = '#000';
      sctx.fillStyle = attempt === 0 ? raw : fallback;
      sctx.fillRect(0, 0, 1, 1);
      var d = sctx.getImageData(0, 0, 1, 1).data;
      if (d[3] > 0 && !(d[0] === 0 && d[1] === 0 && d[2] === 0 && attempt === 0)) {
        return [d[0], d[1], d[2]];
      }
    }
    return [0, 0, 0];
  }
  var C = {
    ground: resolve('--ground', '#0b1413'),
    lift: resolve('--ground-lift', '#1e2b29'),
    verdigris: resolve('--verdigris', '#6f9d93'),
    amber: resolve('--amber', '#f0a63c'),
    ink: resolve('--ink', '#eae7e1'),
    quiet: resolve('--ink-quiet', '#b0aca4')
  };
  function rgba(c, a) { return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  function rgb(c) { return 'rgb(' + c[0] + ',' + c[1] + ',' + c[2] + ')'; }

  /* The instant the page draws for. Normally now; `?at=HH:MM` pins it, which is how the
     daytime states get verified from a machine that happens to be running at midnight, and
     how a particular moment can be linked to. Documented in design/DESIGN.md. */
  var pinnedMinutes = (function () {
    var m = /[?&]at=(\d{1,2}):(\d{2})/.exec(window.location.search);
    return m ? (+m[1] * 60 + +m[2]) : null;
  })();
  function clockNow() {
    var d = new Date();
    if (pinnedMinutes === null) return d;
    d.setHours(Math.floor(pinnedMinutes / 60), pinnedMinutes % 60, 0, 0);
    return d;
  }

  /* ---------------------------------------------------------------- state */
  var now = new Date();
  var place = P.detect();
  var state = {
    place: place,
    lat: place.lat,
    lon: place.lon,
    tz: -now.getTimezoneOffset(),        // minutes EAST of UTC
    year: now.getFullYear(),
    clockMinutes: 12 * 60,
    analemma: null
  };

  function recompute() {
    state.analemma = S.analemma(state.year, state.lat, state.lon, state.tz, state.clockMinutes);
    var xs = [], ys = [];
    for (var i = 0; i < state.analemma.length; i++) {
      xs.push(state.analemma[i].offset);
      ys.push(state.analemma[i].altitude);
    }
    state.bbox = {
      x0: Math.min.apply(null, xs), x1: Math.max.apply(null, xs),
      y0: Math.min.apply(null, ys), y1: Math.max.apply(null, ys)
    };
  }
  recompute();

  /* ---------------------------------------------------------------- format */
  function pad(v) { return (v < 10 ? '0' : '') + Math.floor(v); }
  function hms(minutes) {
    var m = ((minutes % 1440) + 1440) % 1440;
    return pad(m / 60) + ':' + pad(m % 60) + ':' + pad((m * 60) % 60);
  }
  function hm(minutes) {
    var m = ((minutes % 1440) + 1440) % 1440;
    return pad(m / 60) + ':' + pad(m % 60);
  }
  function signed(v, digits, unit) {
    return (v >= 0 ? '+' : '−') + Math.abs(v).toFixed(digits || 1) + (unit || '');
  }
  function latLabel(lat) {
    return Math.abs(lat).toFixed(4) + '° ' + (lat >= 0 ? 'N' : 'S');
  }
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function set(sel, text) {
    var nodes = document.querySelectorAll(sel);
    for (var i = 0; i < nodes.length; i++) nodes[i].textContent = text;
  }

  /* ---------------------------------------------------------------- canvas plumbing */
  function fitCanvas(cv) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = cv.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
    if (cv.width !== w * dpr || cv.height !== h * dpr) {
      cv.width = w * dpr; cv.height = h * dpr;
    }
    var ctx = cv.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx: ctx, w: w, h: h };
  }

  /* One grain pass over a large colour field. taste.md §6: flat vector fields are the tell.
     Drawn once into an offscreen tile and stamped, because per-pixel noise every frame is a
     needless cost for something that must not shimmer anyway. */
  var grainTile = null;
  function grain(ctx, w, h) {
    if (!grainTile) {
      grainTile = document.createElement('canvas');
      grainTile.width = grainTile.height = 128;
      var g = grainTile.getContext('2d');
      var img = g.createImageData(128, 128);
      for (var i = 0; i < img.data.length; i += 4) {
        var v = (Math.random() * 255) | 0;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 9;
      }
      g.putImageData(img, 0, 0);
    }
    var pat = ctx.createPattern(grainTile, 'repeat');
    ctx.save();
    ctx.globalCompositeOperation = 'overlay';
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  /* ================================================================ SCENE 1 — the plate
     A horizontal dial. Screen-up is the meridian the noon shadow falls along: north in the
     northern hemisphere, south in the southern, which is how the two are actually engraved.
     The hour lines are the real hour lines for this latitude, atan(sin φ · tan H); the shadow
     is at today's real azimuth and today's real length; and when the sun is down there is no
     shadow, because there isn't one. */
  function drawPlate(cv, opts) {
    var f = fitCanvas(cv), ctx = f.ctx, w = f.w, h = f.h;
    var macro = opts && opts.macro;
    ctx.clearRect(0, 0, w, h);

    var p = S.position(clockNow(), state.lat, state.lon);
    var latR = Math.abs(state.lat) * Math.PI / 180;
    var up = state.lat >= 0 ? 0 : 180;          // which way the noon line points on screen
    var bear = (p.azimuth - up) * Math.PI / 180; // bearing to the sun, relative to that
    var shadowAng = bear + Math.PI;
    var lit = p.altitude > 0.5;

    // camera. The root sits inside the frame so that a low morning sun still puts its shadow
    // somewhere a viewer can see; the disc is far wider than the viewport and runs off both edges.
    var cx = macro ? w * 0.5 : w * 0.34;
    var cy = macro ? h * 0.5 : h * 0.80;
    // macro: the whole plate seen almost flat-on, sized so the rim is cropped on the short axis
    var R = macro ? Math.max(w, h) * 0.60 : Math.max(w * 1.25, h * 1.9);
    var squash = macro ? 0.88 : 0.44;

    // direction helpers in the squashed plate space
    function px(ang, r) { return Math.sin(ang) * r; }
    function py(ang, r) { return -Math.cos(ang) * r; }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, squash);

    /* ---- graduation. We are cropped deep INSIDE a dial far bigger than the viewport, so
       there is no rim to draw and the engraving is a field of texture rather than a diagram —
       the composition move taken from moodboard tiles 08/13. Ring radii are chosen to land
       inside the frame, not at a rim nobody can see. */
    var thin = 1 / squash * 0.30;
    var boost = macro ? 1.9 : 1;   // a small flat plate needs more ink than a huge cropped one
    ctx.strokeStyle = rgb(C.verdigris);
    var rings = macro ? [0.24, 0.44, 0.62, 0.78, 0.855, 0.93, 1.0]
                      : [0.14, 0.26, 0.40, 0.475, 0.56, 0.74, 0.94];
    for (var i = 0; i < rings.length; i++) {
      ctx.globalAlpha = (0.15 + 0.13 * (i / (rings.length - 1))) * boost;
      ctx.lineWidth = (i === 3 ? 2.0 : 1) * thin;
      ctx.beginPath(); ctx.arc(0, 0, R * rings[i], 0, Math.PI * 2); ctx.stroke();
    }

    // half-degree ticks on the graduated band — the spec table's "0.5° divisions", drawn
    ctx.lineWidth = thin;
    var tickIn = macro ? 0.855 : 0.475, tickOut = macro ? 0.93 : 0.56;
    for (var d = 0; d < 360; d += 0.5) {
      var a = d * Math.PI / 180;
      var major = Math.abs(d % 15) < 0.01;
      ctx.globalAlpha = (major ? 0.40 : 0.14) * boost;
      ctx.beginPath();
      ctx.moveTo(px(a, R * (major ? tickIn - 0.02 : tickIn)), py(a, R * (major ? tickIn - 0.02 : tickIn)));
      ctx.lineTo(px(a, R * tickOut), py(a, R * tickOut));
      ctx.stroke();
    }

    // ---- hour lines: the geometry that makes this plate wrong in Madrid
    var inner = macro ? 0.24 : 0.06;
    for (var hh = -6; hh <= 6; hh += 0.5) {
      var HA = hh * 15 * Math.PI / 180;
      var theta = Math.atan(Math.sin(latR) * Math.tan(HA));
      if (Math.abs(HA) > Math.PI / 2) theta += Math.PI;
      var whole = Math.abs(hh % 1) < 0.01;
      var len = whole ? (macro ? 0.855 : 0.94) : (macro ? 0.78 : 0.80);
      ctx.globalAlpha = (whole ? 0.44 : 0.17) * boost;
      ctx.strokeStyle = rgb(C.verdigris);
      ctx.lineWidth = (whole ? 1.6 : 0.8) * thin;
      ctx.beginPath();
      ctx.moveTo(px(theta, R * inner), py(theta, R * inner));
      ctx.lineTo(px(theta, R * len), py(theta, R * len));
      ctx.stroke();
    }

    /* ---- the analemma engraved on the noon line: the thing the spec table says is there.
       Scaled from the real figure, so a plate cut for a different latitude gets a different one. */
    if (macro) {
      var an = state.analemma, bb = state.bbox;
      var span = Math.max(bb.y1 - bb.y0, 2);
      var aScale = R * 0.30 / span;
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = rgb(C.verdigris);
      ctx.lineWidth = 1.6 * thin;
      ctx.beginPath();
      for (var ai = 0; ai < an.length; ai += 3) {
        var ax = (an[ai].offset - (bb.x0 + bb.x1) / 2) * aScale * 3;
        var ay = -R * 0.50 - (an[ai].altitude - (bb.y0 + bb.y1) / 2) * aScale;
        if (ai === 0) ctx.moveTo(ax, ay); else ctx.lineTo(ax, ay);
      }
      ctx.closePath(); ctx.stroke();
    }

    /* ---- the light catching the bevels: a short amber arc on the graduated band, on the side
       the sun is actually on. This is the whole amber budget for the scene. */
    if (lit) {
      ctx.strokeStyle = rgb(C.amber);
      var arcMid = bear - Math.PI / 2;   // canvas arc angles run from +x; bearings from −y
      ctx.globalAlpha = 0.75;
      ctx.lineWidth = 2.4 * thin;
      ctx.beginPath(); ctx.arc(0, 0, R * (macro ? 0.93 : 0.26), arcMid - 0.42, arcMid + 0.42); ctx.stroke();
      ctx.globalAlpha = 0.38;
      ctx.lineWidth = 1.8 * thin;
      ctx.beginPath(); ctx.arc(0, 0, R * (macro ? 0.62 : 0.40), arcMid - 0.30, arcMid + 0.30); ctx.stroke();
    }

    // ---- the cast shadow: the only hard edge in the frame
    var shadow = null;
    if (lit && !macro) {
      var gnomon = R * 0.30;                            // gnomon height in plate units
      var shLen = Math.min(R * 1.9, gnomon / Math.tan(p.altitude * Math.PI / 180));
      var halfW = R * 0.016;
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.78)';
      var perp = shadowAng + Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(px(perp, halfW), py(perp, halfW));
      ctx.lineTo(px(shadowAng, shLen) + px(perp, halfW * 0.4),
                 py(shadowAng, shLen) + py(perp, halfW * 0.4));
      ctx.lineTo(px(shadowAng, shLen) - px(perp, halfW * 0.4),
                 py(shadowAng, shLen) - py(perp, halfW * 0.4));
      ctx.lineTo(-px(perp, halfW), -py(perp, halfW));
      ctx.closePath(); ctx.fill();

      shadow = {
        x0: cx, y0: cy,
        x1: cx + px(shadowAng, shLen), y1: cy + py(shadowAng, shLen) * squash,
        halfW: halfW
      };
    }

    ctx.restore();
    ctx.globalAlpha = 1;

    /* ---- the raking light, applied in SCREEN space so its width is a fraction of the frame
       and not of a disc that is mostly off it. Style-gate note A was exactly this mistake:
       scaled to R, a "narrow" 12% slice is still half the viewport and reads as a wash. */
    if (lit) {
      var diag = Math.hypot(w, h);
      var ux = Math.sin(bear), uy = -Math.cos(bear) * squash;
      var ul = Math.hypot(ux, uy) || 1; ux /= ul; uy /= ul;
      var g = ctx.createLinearGradient(cx - ux * diag, cy - uy * diag, cx + ux * diag, cy + uy * diag);
      g.addColorStop(0.00, rgba(C.lift, 0));
      g.addColorStop(0.46, rgba(C.lift, 0));
      g.addColorStop(0.515, rgba(C.lift, 0.5));
      g.addColorStop(0.57, rgba(C.lift, 0));
      g.addColorStop(1.00, rgba(C.lift, 0));
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }

    grain(ctx, w, h);
    return { azimuth: p.azimuth, altitude: p.altitude, lit: lit, shadow: shadow };
  }

  /* ================================================================ SCENE 2 — the two terms */
  function drawCurve(cv, fn, progress, amp) {
    var f = fitCanvas(cv), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);
    var mid = h / 2, span = h / 2 - 12;

    ctx.strokeStyle = rgb(C.verdigris); ctx.globalAlpha = 0.28; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, mid); ctx.lineTo(w, mid); ctx.stroke();

    ctx.globalAlpha = 0.14;
    for (var m = 1; m < 12; m++) {
      var mx = w * m / 12;
      ctx.beginPath(); ctx.moveTo(mx, mid - 5); ctx.lineTo(mx, mid + 5); ctx.stroke();
    }

    var end = Math.max(2, Math.round(365 * clamp01(progress)));
    ctx.globalAlpha = 1; ctx.strokeStyle = rgb(C.amber); ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round'; ctx.beginPath();
    for (var d = 0; d <= end; d += 2) {
      var t = S.julianCentury(S.julianDay(new Date(Date.UTC(state.year, 0, 1 + d, 12))));
      var x = w * d / 365, y = mid - fn(t) / amp * span;
      if (d === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    return end / 365;
  }

  /* ================================================================ SCENE 3 — the peak */
  function skyView(w, h, zoomT) {
    /* act 1: 62° of altitude across most of the frame, horizon low — wide enough that a summer
       day-arc runs off both edges (that crop is the grid break) and tight enough that the arc
       is the subject rather than a thread across an empty chart.
       act 2: the analemma, fitted uniformly. Both axes take the same px/deg — the figure is
       never stretched to fill the frame, because then it would not be the figure. */
    var narrow = w < 760;
    var wideScale = (narrow ? 0.62 : 0.80) * h / 62, wideCy = narrow ? 20 : 26;
    var bb = state.bbox;
    var bh = Math.max(bb.y1 - bb.y0, 2), bw = Math.max(bb.x1 - bb.x0, 0.6);
    /* On a phone the figure has to leave room for the copy docked at the bottom and the HUD
       at the top, so it is drawn smaller and higher. Uniform scale either way — the shape is
       never squeezed to fit, it is just framed differently. */
    var tightScale = Math.min((narrow ? 0.40 : 0.74) * h / bh, (narrow ? 0.50 : 0.40) * w / bw);
    return {
      scale: lerp(wideScale, tightScale, zoomT),
      cx: lerp(0, (bb.x0 + bb.x1) / 2, zoomT),
      cy: lerp(wideCy, (bb.y0 + bb.y1) / 2, zoomT),
      // the frame pans as it closes in, so the copy has somewhere to arrive that is not on the line
      ox: lerp(0.5, narrow ? 0.60 : (w > 900 ? 0.36 : 0.5), zoomT),
      oy: lerp(0.5, narrow ? 0.46 : 0.5, zoomT)
    };
  }

  function drawSky(cv, progress) {
    var f = fitCanvas(cv), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);

    var yearT = clamp01(progress / 0.88);
    var zoomT = smooth(clamp01((progress - 0.30) / 0.32));
    var v = skyView(w, h, zoomT);
    var X = function (o) { return w * v.ox + (o - v.cx) * v.scale; };
    var Y = function (a) { return h * v.oy - (a - v.cy) * v.scale; };

    var days = state.analemma.length;
    var idx = Math.min(days - 1, Math.floor(yearT * (days - 1)));
    var cur = state.analemma[idx];

    // ---- graticule. Step adapts to the zoom so it never turns into a solid block.
    var altStep = v.scale > 6 ? 5 : 10;
    if (v.scale > 14) altStep = 2;
    ctx.lineWidth = 1; ctx.strokeStyle = rgb(C.verdigris);
    ctx.font = '500 10px "Martian Mono", ui-monospace, monospace';
    ctx.fillStyle = rgb(C.quiet);
    for (var a = -10; a <= 90; a += altStep) {
      var y = Y(a);
      if (y < -20 || y > h + 20) continue;
      ctx.globalAlpha = a === 0 ? 0.42 : 0.11;
      ctx.lineWidth = a === 0 ? 1.2 : 1;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      ctx.globalAlpha = 0.5;
      ctx.fillText(a + '°', 14, y - 5);
    }
    var azStep = v.scale > 14 ? 1 : v.scale > 6 ? 5 : 15;
    ctx.lineWidth = 1;
    for (var o = -180; o <= 180; o += azStep) {
      var x = X(o);
      if (x < -20 || x > w + 20) continue;
      ctx.globalAlpha = o === 0 ? 0.34 : 0.07;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    // ---- ground below the horizon
    var hy = Y(0);
    if (hy < h) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fillRect(0, hy, w, h - hy);
    }

    // ---- cardinal marks along the horizon, only while the wide view can hold them
    if (zoomT < 0.85) {
      ctx.globalAlpha = (1 - zoomT / 0.85) * 0.75;
      ctx.fillStyle = rgb(C.quiet);
      ctx.font = '600 11px "Martian Mono", ui-monospace, monospace';
      ctx.textAlign = 'center';
      var north = state.lat >= 0 ? 180 : 0;
      var marks = [[-90, 'E'], [-45, ''], [0, state.lat >= 0 ? 'S' : 'N'], [45, ''], [90, 'W']];
      if (state.lat < 0) { marks[0][1] = 'E'; marks[4][1] = 'W'; }
      for (var mi = 0; mi < marks.length; mi++) {
        if (!marks[mi][1]) continue;
        var mx = X(marks[mi][0]);
        if (mx < 10 || mx > w - 10) continue;
        ctx.fillText(marks[mi][1], mx, Math.min(h - 10, hy + 22));
      }
      ctx.textAlign = 'left';
      void north;
    }

    // ---- the sun's whole path on the current date; the season's breathing
    if (zoomT < 0.92) {
      var arc = S.dayArc(state.year, cur.date.getUTCMonth(), cur.date.getUTCDate(),
                         state.lat, state.lon, state.tz, 96);
      ctx.globalAlpha = (1 - zoomT / 0.92) * 0.5;
      ctx.strokeStyle = rgb(C.verdigris); ctx.lineWidth = 1.4;
      ctx.beginPath();
      var started = false, prevX = null;
      for (var i = 0; i < arc.length; i++) {
        if (arc[i].altitude < -1) { started = false; continue; }
        var ax = X(S.meridianOffset(arc[i].azimuth, state.lat)), ay = Y(arc[i].altitude);
        // the azimuth can run right round at high latitudes: break rather than draw a chord
        if (started && prevX !== null && Math.abs(ax - prevX) > w * 0.5) started = false;
        if (!started) { ctx.moveTo(ax, ay); started = true; } else ctx.lineTo(ax, ay);
        prevX = ax;
      }
      ctx.stroke();
    }

    // ---- the analemma trail, drawn as far as the year has run
    ctx.globalAlpha = 1;
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = rgb(C.amber);
    ctx.lineWidth = lerp(1.1, 1.7, zoomT);
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    for (var t2 = 0; t2 <= idx; t2++) {
      var pt = state.analemma[t2];
      var tx = X(pt.offset), ty = Y(pt.altitude);
      if (t2 === 0) ctx.moveTo(tx, ty); else ctx.lineTo(tx, ty);
    }
    ctx.stroke();

    // the freshest 24 days brighter — the line has a leading edge, like a burin cut
    if (idx > 1) {
      ctx.globalAlpha = 1;
      ctx.lineWidth = lerp(1.4, 2.1, zoomT);
      ctx.beginPath();
      for (var t3 = Math.max(0, idx - 24); t3 <= idx; t3++) {
        var pf = state.analemma[t3];
        var fx = X(pf.offset), fy = Y(pf.altitude);
        if (t3 === Math.max(0, idx - 24)) ctx.moveTo(fx, fy); else ctx.lineTo(fx, fy);
      }
      ctx.stroke();
    }

    // ---- month ticks, appearing as they are passed.
    // The label sits along the curve's NORMAL, not always to the side: near the equator the
    // analemma is a wide flat figure and consecutive months are horizontally adjacent, so a
    // fixed sideways offset stacks JUL on AUG on SEP. Anything that would still collide with
    // an already-placed label is dropped rather than drawn illegibly.
    if (zoomT > 0.25) {
      var placed = [];
      ctx.globalAlpha = smooth((zoomT - 0.25) / 0.4);
      ctx.font = '500 10px "Martian Mono", ui-monospace, monospace';
      for (var m2 = 0; m2 < 12; m2++) {
        var mIdx = -1;
        for (var k = 0; k < state.analemma.length; k++) {
          var dd = state.analemma[k].date;
          if (dd.getUTCMonth() === m2 && dd.getUTCDate() === 1) { mIdx = k; break; }
        }
        if (mIdx < 0 || mIdx > idx) continue;
        var mp = state.analemma[mIdx];
        var mq = state.analemma[(mIdx + 4) % state.analemma.length];
        var mx2 = X(mp.offset), my2 = Y(mp.altitude);
        var tx = X(mq.offset) - mx2, ty = Y(mq.altitude) - my2;
        var tl = Math.hypot(tx, ty) || 1;
        // outward normal: whichever of the two normals points away from the figure's centre
        var nx = -ty / tl, ny = tx / tl;
        if ((mx2 - w * v.ox) * nx + (my2 - h * v.oy) * ny < 0) { nx = -nx; ny = -ny; }
        var lx = mx2 + nx * 17, ly = my2 + ny * 17;

        var clash = false;
        for (var pi = 0; pi < placed.length; pi++) {
          if (Math.hypot(lx - placed[pi][0], ly - placed[pi][1]) < 26) { clash = true; break; }
        }
        if (clash) continue;
        placed.push([lx, ly]);

        ctx.strokeStyle = rgb(C.amber);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(mx2 + nx * 4, my2 + ny * 4);
        ctx.lineTo(mx2 + nx * 11, my2 + ny * 11);
        ctx.stroke();
        ctx.fillStyle = rgb(C.quiet);
        ctx.textAlign = nx > 0.35 ? 'left' : nx < -0.35 ? 'right' : 'center';
        ctx.textBaseline = ny > 0.35 ? 'top' : ny < -0.35 ? 'bottom' : 'middle';
        ctx.fillText(MONTHS[m2].toUpperCase(), lx, ly);
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
      }
    }

    // ---- the sun itself
    ctx.globalAlpha = 1;
    var sx = X(cur.offset), sy = Y(cur.altitude);
    var rad = lerp(4, 6.5, zoomT);
    var glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, rad * 6);
    glow.addColorStop(0, 'rgba(255,190,90,0.55)');
    glow.addColorStop(1, 'rgba(255,190,90,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(sx, sy, rad * 6, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgb(C.amber);
    ctx.beginPath(); ctx.arc(sx, sy, rad, 0, Math.PI * 2); ctx.fill();

    grain(ctx, w, h);
    return { cur: cur, yearT: yearT, zoomT: zoomT, idx: idx };
  }

  /* ================================================================ SCENE 4 — the shadow sweep */
  function drawSweep(cv, progress) {
    var f = fitCanvas(cv), ctx = f.ctx, w = f.w, h = f.h;
    ctx.clearRect(0, 0, w, h);

    var latR = state.lat * Math.PI / 180;
    var cx = w / 2, cy = h * 0.60, R = Math.min(w, h) * 0.46;
    var today = new Date();
    var ev = S.sunEvents(today, state.lat, state.lon, state.tz);
    var rise = ev.rise === null ? 0 : ev.rise, sett = ev.set === null ? 1440 : ev.set;
    var minutes = lerp(rise + 6, sett - 6, clamp01(progress));

    var base = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    var p = S.position(new Date(base + (minutes - state.tz) * 60000), state.lat, state.lon);

    // the dial face
    ctx.strokeStyle = rgb(C.verdigris);
    for (var i = 0; i < 4; i++) {
      ctx.globalAlpha = 0.10 + i * 0.04; ctx.lineWidth = i === 3 ? 1.4 : 0.8;
      ctx.beginPath(); ctx.arc(cx, cy, R * [0.40, 0.64, 0.85, 1][i], 0, Math.PI * 2); ctx.stroke();
    }
    ctx.font = '500 10px "Martian Mono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    for (var hh = -6; hh <= 6; hh++) {
      var HA = hh * 15 * Math.PI / 180;
      var th = Math.atan(Math.sin(latR) * Math.tan(HA));
      if (Math.abs(HA) > Math.PI / 2) th += Math.PI;
      var ex = cx + Math.sin(th) * R, ey = cy - Math.cos(th) * R;
      ctx.globalAlpha = 0.30; ctx.lineWidth = 1; ctx.strokeStyle = rgb(C.verdigris);
      ctx.beginPath();
      ctx.moveTo(cx + Math.sin(th) * R * 0.40, cy - Math.cos(th) * R * 0.40);
      ctx.lineTo(ex, ey); ctx.stroke();
      ctx.globalAlpha = 0.55; ctx.fillStyle = rgb(C.quiet);
      ctx.fillText(String(12 + hh), cx + Math.sin(th) * R * 1.09, cy - Math.cos(th) * R * 1.09 + 3.5);
    }
    ctx.textAlign = 'left';

    // the day's declination line: the curve the shadow TIP traces from dawn to dusk
    ctx.globalAlpha = 0.30; ctx.strokeStyle = rgb(C.verdigris); ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath();
    var open = false;
    for (var mm = rise; mm <= sett; mm += 6) {
      var q = S.position(new Date(base + (mm - state.tz) * 60000), state.lat, state.lon);
      if (q.altitude < 1.2) { open = false; continue; }
      var L = Math.min(R * 1.5, R * 0.30 / Math.tan(q.altitude * Math.PI / 180));
      var ang = (q.azimuth - (state.lat >= 0 ? 180 : 0) + 180) * Math.PI / 180;
      var qx = cx + Math.sin(ang) * L, qy = cy - Math.cos(ang) * L;
      if (!open) { ctx.moveTo(qx, qy); open = true; } else ctx.lineTo(qx, qy);
    }
    ctx.stroke(); ctx.setLineDash([]);

    // the shadow
    var alt = Math.max(p.altitude, 1.2);
    var len = Math.min(R * 1.5, R * 0.30 / Math.tan(alt * Math.PI / 180));
    var sAng = (p.azimuth - (state.lat >= 0 ? 180 : 0) + 180) * Math.PI / 180;
    var tipX = cx + Math.sin(sAng) * len, tipY = cy - Math.cos(sAng) * len;
    ctx.globalAlpha = 1;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineWidth = Math.max(3, R * 0.035);
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(tipX, tipY); ctx.stroke();
    ctx.fillStyle = rgb(C.amber);
    ctx.beginPath(); ctx.arc(cx, cy, Math.max(3, R * 0.022), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.arc(tipX, tipY, 2.5, 0, Math.PI * 2); ctx.fill();

    grain(ctx, w, h);
    return { minutes: minutes, altitude: p.altitude, azimuth: p.azimuth, polar: ev.polar };
  }

  /* ================================================================ wiring */
  var scenes = [];
  /* `resolved` is where a scene sits when nothing is scrubbing it: the reduced-motion cut and
     the state after a place change. It is NOT always 1 — the shadow sweep resolves at solar
     noon, because a dial frozen one minute before sunset is a worse still than a dial at noon. */
  function register(el, draw, opts) {
    if (!el) return;
    opts = opts || {};
    scenes.push({
      el: el, draw: draw, visible: false,
      pinned: opts.pinned,
      resolved: opts.resolved === undefined ? 1 : opts.resolved
    });
  }

  var canvases = {
    plate: document.getElementById('cv-plate'),
    macro: document.getElementById('cv-macro'),
    sky: document.getElementById('cv-sky'),
    sweep: document.getElementById('cv-sweep'),
    tilt: document.getElementById('cv-tilt'),
    ellipse: document.getElementById('cv-ellipse'),
    sum: document.getElementById('cv-sum')
  };

  /* The progress a scene should draw at right now. Reduced motion means "no scrubbing", not
     "frozen wherever the scroll happened to be", so it always draws its resolved state. */
  function progressFor(s) {
    if (reduced) return s.resolved;
    return s.pinned ? pinProgress(s.el) : flowProgress(s.el);
  }

  /* progress of a normal (unpinned) scene: 0 as it enters, 1 as it leaves */
  function flowProgress(el) {
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return clamp01((vh - r.top) / (vh + r.height));
  }
  /* progress of a sticky-pinned scene: how far through its tall track we are */
  function pinProgress(track) {
    var r = track.getBoundingClientRect();
    var vh = window.innerHeight;
    var total = r.height - vh;
    if (total <= 0) return clamp01(-r.top / Math.max(1, r.height));
    return clamp01(-r.top / total);
  }

  /* ---- scene 1 */
  var heroCast = document.querySelector('.hero__h1 .cast');
  var heroEl0 = document.getElementById('scene-hero');
  function paintPlate() {
    if (!canvases.plate) return;
    var r = drawPlate(canvases.plate);
    if (!heroCast || !heroEl0) return;

    /* Style-gate note B, resolved: the darkened copy of the headline is clipped to where the
       cast shadow ACTUALLY crosses the words. Same shadow, one source of truth — not a gradient
       at a plausible angle. When the shadow misses the headline (or the sun is down) the clip
       collapses and the words are simply lit, which is the honest answer. */
    if (!r.shadow) { heroCast.style.clipPath = 'polygon(0 0,0 0,0 0,0 0)'; return; }

    var hero = heroEl0.getBoundingClientRect();
    var box = heroCast.getBoundingClientRect();
    var top = box.top - hero.top, bot = box.bottom - hero.top;
    var s = r.shadow;
    var dy = s.y1 - s.y0;
    if (Math.abs(dy) < 1) { heroCast.style.clipPath = 'polygon(0 0,0 0,0 0,0 0)'; return; }

    // where the shadow's centre line sits at the headline's top and bottom edges
    var xAt = function (y) { return s.x0 + (s.x1 - s.x0) * (y - s.y0) / dy; };
    var band = Math.max(26, s.halfW * 1.9);         // the shadow's width in screen px
    var left = box.left - hero.left, width = Math.max(1, box.width);
    var pc = function (x) { return ((x - left) / width * 100).toFixed(2) + '%'; };

    heroCast.style.clipPath = 'polygon(' +
      pc(xAt(top) - band) + ' 0, ' + pc(xAt(top) + band) + ' 0, ' +
      pc(xAt(bot) + band) + ' 100%, ' + pc(xAt(bot) - band) + ' 100%)';
  }

  /* ---- live readouts. This is a clock, so it ticks on an interval, not on rAF. */
  function tickClock() {
    var d = clockNow();
    var p = S.position(d, state.lat, state.lon);
    var utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60;
    var localMin = ((utcMin + state.tz) % 1440 + 1440) % 1440;
    var solarMin = ((p.trueSolarTime % 1440) + 1440) % 1440;
    var noon = S.solarNoon(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())),
                           state.lon, state.tz);

    set('[data-tn=clock]', hms(localMin));
    set('[data-tn=sun]', hms(solarMin));
    set('[data-tn=place]', state.place.name);
    set('[data-tn=noon]', hms(noon));
    set('[data-tn=noon-hm]', hm(noon));
    set('[data-tn=gap]', Math.abs(Math.round(solarMin - localMin)) + ' min');
    set('[data-tn=gap-dir]', solarMin > localMin ? 'ahead of' : 'behind');
    set('[data-tn=lat]', latLabel(state.lat));
    set('[data-tn=dec]', signed(p.declination, 2, '°'));
    set('[data-tn=eot]', signed(p.equationOfTime, 2, ' min'));
    set('[data-tn=alt]', p.altitude.toFixed(1) + '°');
    set('[data-tn=year]', String(state.year));
    /* The plate is only lit when the sun is up. Saying so beats drawing a shadow that isn't
       there, and it is the difference between an instrument and a screensaver. */
    set('[data-tn=state]', p.altitude > 0.5
      ? 'sun ' + p.altitude.toFixed(1) + '° above the horizon'
      : 'sun below the horizon — the plate is dark');
  }

  /* ---- the single rAF owner */
  var running = false, queued = false;
  function tick() {
    queued = false;
    for (var i = 0; i < scenes.length; i++) {
      var s = scenes[i];
      if (!s.visible) continue;
      s.draw(progressFor(s));
    }
    if (running) { queued = true; requestAnimationFrame(tick); }
  }
  function wake() {
    if (reduced) return;
    running = scenes.some(function (s) { return s.visible; });
    if (running && !queued) { queued = true; requestAnimationFrame(tick); }
  }

  /* ---- readout panels that belong to a scene */
  var skyOut = {
    date: document.querySelector('[data-tn=sky-date]'),
    dec: document.querySelector('[data-tn=sky-dec]'),
    eot: document.querySelector('[data-tn=sky-eot]'),
    alt: document.querySelector('[data-tn=sky-alt]')
  };
  var sweepOut = {
    time: document.querySelector('[data-tn=sweep-time]'),
    alt: document.querySelector('[data-tn=sweep-alt]'),
    len: document.querySelector('[data-tn=sweep-len]')
  };

  function paintSky(progress) {
    var r = drawSky(canvases.sky, progress);
    if (skyOut.date) {
      skyOut.date.textContent = r.cur.date.getUTCDate() + ' ' + MONTHS[r.cur.date.getUTCMonth()];
      skyOut.dec.textContent = signed(r.cur.declination, 2, '°');
      skyOut.eot.textContent = signed(r.cur.equationOfTime, 2, ' min');
      skyOut.alt.textContent = r.cur.altitude.toFixed(2) + '°';
    }
    var peak = document.querySelector('.peak__land');
    if (peak) peak.classList.toggle('is-in', reduced || progress > 0.9);
  }

  function paintSweep(progress) {
    var r = drawSweep(canvases.sweep, progress);
    if (sweepOut.time) {
      sweepOut.time.textContent = hm(r.minutes);
      sweepOut.alt.textContent = r.altitude.toFixed(1) + '°';
      // a 60mm gnomon, the real product dimension from the spec table
      var mm = r.altitude > 0.5 ? Math.min(9999, 60 / Math.tan(r.altitude * Math.PI / 180)) : 9999;
      sweepOut.len.textContent = (mm >= 9999 ? '∞' : Math.round(mm)) + ' mm';
    }
  }

  /* ---- build the scene list */
  var heroEl = document.getElementById('scene-hero');
  var curvesEl = document.getElementById('scene-curves');
  var peakTrack = document.getElementById('peak-track');
  var sweepEl = document.getElementById('scene-sweep');
  var macroEl = document.getElementById('scene-plate');

  if (canvases.plate && heroEl) register(heroEl, function () { paintPlate(); });
  if (canvases.tilt && curvesEl) {
    register(curvesEl, function (p) {
      // the three curves draw in sequence across the section's own scroll
      var a = clamp01((p - 0.05) / 0.30), b = clamp01((p - 0.28) / 0.30), c = clamp01((p - 0.50) / 0.34);
      drawCurve(canvases.tilt, S.obliquityTerm, a, 17);
      drawCurve(canvases.ellipse, S.eccentricityTerm, b, 17);
      drawCurve(canvases.sum, S.equationOfTime, c, 17);
    });
  }
  if (canvases.sky && peakTrack) register(peakTrack, paintSky, { pinned: true, resolved: 1 });
  if (canvases.sweep && sweepEl) register(sweepEl, paintSweep, { resolved: 0.5 });
  if (canvases.macro && macroEl) register(macroEl, function () { drawPlate(canvases.macro, { macro: true }); });

  /* ---- only draw what is on screen */
  var hasObserver = false;
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        for (var j = 0; j < scenes.length; j++) {
          if (scenes[j].el === entries[i].target) {
            scenes[j].visible = entries[i].isIntersecting;
            if (entries[i].isIntersecting) scenes[j].draw(progressFor(scenes[j]));
          }
        }
      }
      wake();
    }, { rootMargin: '10% 0px' });
    for (var si = 0; si < scenes.length; si++) io.observe(scenes[si].el);
    hasObserver = true;
  } else {
    for (var sj = 0; sj < scenes.length; sj++) scenes[sj].visible = true;
    wake();
  }

  /* ---- the place / latitude control */
  function applyPlace(p) {
    state.place = p; state.lat = p.lat; state.lon = p.lon;
    // the clock must belong to the same place as the sun, or the two readouts are not comparable
    state.tz = P.offsetFor(p.tz, new Date());
    recompute();
    tickClock();
    redrawAll();
  }
  function redrawAll() {
    for (var i = 0, s; i < scenes.length; i++) {
      s = scenes[i];
      s.draw(progressFor(s));
    }
  }

  var picker = document.getElementById('place-picker');
  if (picker) {
    P.PICKS.forEach(function (p, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'pick'; b.textContent = p.name;
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () {
        var all = picker.querySelectorAll('.pick');
        for (var k = 0; k < all.length; k++) all[k].setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-pressed', 'true');
        var lat = document.getElementById('lat-input');
        if (lat) lat.value = p.lat.toFixed(2);
        applyPlace({ name: p.name, lat: p.lat, lon: p.lon, tz: p.tz, resolved: 'picked' });
      });
      picker.appendChild(b);
      void i;
    });
  }

  /* verify.md 2: an interaction that dead-ends is a FAIL. There is no server behind this page,
     so the honest answer is to say exactly what was understood and exactly what was not sent —
     not a fake "thank you, we'll be in touch". */
  var orderForm = document.querySelector('.control');
  var ack = document.getElementById('order-ack');
  if (orderForm && ack) {
    orderForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = parseFloat(document.getElementById('lat-input').value);
      if (isNaN(v) || v < -66 || v > 66) {
        ack.className = 'ack ack--error';
        ack.textContent = 'Give a latitude between 66° S and 66° N — past the polar circles a ' +
          'horizontal dial has days it cannot read.';
        return;
      }
      ack.className = 'ack';
      // the place name is only worth printing when it is a place, not a restated latitude
      var where = /^latitude /.test(state.place.name) ? '' : ' (' + state.place.name + ')';
      ack.textContent = 'Noted: one plate, hour lines cut for ' + latLabel(v) + where +
        ', gnomon angle ' + Math.abs(v).toFixed(2) + '°. ' +
        'Nothing was sent — this page has no server behind it.';
    });
  }

  var latInput = document.getElementById('lat-input');
  if (latInput) {
    latInput.value = state.lat.toFixed(2);
    latInput.addEventListener('input', function () {
      var v = parseFloat(latInput.value);
      if (isNaN(v)) return;
      v = Math.max(-66, Math.min(66, v));
      applyPlace({
        name: state.place.resolved === 'picked' || state.place.resolved === 'custom'
          ? 'latitude ' + latLabel(v) : state.place.name + ', re-cut',
        lat: v, lon: state.lon, tz: state.place.tz, resolved: 'custom'
      });
    });
  }

  /* ---- resize: canvases are sized in CSS pixels, so they must be repainted */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { grainTile = null; redrawAll(); }, 120);
  });

  /* ---- go */
  root.classList.add('js');
  if (reduced) root.classList.add('reduced');
  tickClock();
  setInterval(tickClock, 1000);
  requestAnimationFrame(function () {
    /* Do NOT draw every canvas here. Four of the five are below the fold and the observer will
       draw them the moment they matter; painting them on load only lengthens the load long-task
       (measured: 58ms before this change) and delays interactivity for no visible benefit. */
    if (!hasObserver) redrawAll();
    wake();
  });
})();
