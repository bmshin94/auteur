/* HALE No. 6 — page behaviour and the single WebGL stage.
 *
 * Rules this file keeps:
 *  · exactly one requestAnimationFrame loop for the whole page
 *  · no scroll listener; scroll position is read from getBoundingClientRect() inside that loop
 *  · the page is complete before this file runs. Everything here is an enhancement on top of
 *    markup that already says the same thing, so no-JS, no-WebGL and prefers-reduced-motion all
 *    land on a watchable page rather than a broken one.
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ── small helpers ──────────────────────────────────────────────────────────
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  /** how far the viewport has travelled through an element: 0 as it enters, 1 as it leaves */
  function progressOf(el) {
    var r = el.getBoundingClientRect();
    var span = r.height - window.innerHeight;
    if (span <= 0) return clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
    return clamp(-r.top / span, 0, 1);
  }

  // ── entrance reveals, bound per content type ───────────────────────────────
  if ('IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        reveal.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

    // staggered by index inside their own list, not by a global counter
    ['.revs .rev', '.owners .owner', '.spec div'].forEach(function (sel) {
      var items = doc.querySelectorAll(sel);
      for (var i = 0; i < items.length; i++) {
        items[i].style.transitionDelay = Math.min(i * 60, 360) + 'ms';
        reveal.observe(items[i]);
      }
    });
    var door = doc.querySelector('.s-door');
    if (door) reveal.observe(door);
  } else {
    // no IntersectionObserver: show everything at once rather than nothing
    root.classList.add('no-io');
    Array.prototype.forEach.call(doc.querySelectorAll('.rev,.owner,.spec div,.s-door'), function (el) {
      el.classList.add('in');
    });
  }

  // ── scene bookkeeping: the rail's line type, the frame, the foot counter ───
  var rail = doc.getElementById('rail');
  var footScene = doc.getElementById('footScene');
  var footHint = doc.getElementById('footHint');
  var iframeBox = doc.getElementById('iframeBox');
  var callouts = doc.getElementById('callouts');
  var HINTS = {
    1: 'Scroll to open the instrument',
    2: 'Six changes in fifty-two years',
    3: 'Keep scrolling — it comes apart',
    4: 'Every figure is a measurement',
    5: 'Twelve hundred in circulation',
    6: 'One instrument a week'
  };
  var sections = Array.prototype.slice.call(doc.querySelectorAll('.scene[data-scene]'));
  var peakEl = doc.getElementById('s3');
  var heroEl = doc.getElementById('s1');
  var ownersEl = doc.getElementById('s5');
  var peakCopy = doc.querySelector('.peak-copy');

  if ('IntersectionObserver' in window) {
    var current = null;
    var sceneObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        if (el === current) return;
        current = el;
        var n = el.getAttribute('data-scene');
        if (footScene) footScene.textContent = ('0' + n).slice(-2);
        if (footHint) footHint.textContent = HINTS[n] || '';
        if (rail) {
          rail.className = 'rail' +
            (el.getAttribute('data-rail') === 'phantom' ? ' is-phantom' :
             el.getAttribute('data-rail') === 'gone' ? ' is-gone' : '');
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    sections.forEach(function (s) { sceneObs.observe(s); });
  }

  // ── the WebGL stage ────────────────────────────────────────────────────────
  // Eight named glTF nodes, each with the direction it leaves the assembly along.
  // Hand-written rather than derived from centroids: several parts sit almost on the
  // model's own centre, so a derived direction would leave them stuck inside the body.
  var PARTS = [
    ['vintage_microscope_eye_piece',          0.00,  0.95,  0.10],
    ['vintage_microscope_revolver',           0.30,  0.55,  0.12],
    ['vintage_microscope_adjustment',        -0.64,  0.20,  0.06],
    ['vintage_microscope_rack_mount_support', 0.12,  0.28, -0.52],
    ['vintage_microscope_condenser',          0.02, -0.10,  0.62],
    ['vintage_microscope_mirror_arm',        -0.30, -0.34,  0.44],
    ['vintage_microscope_mirror_base',        0.50, -0.44,  0.30],
    ['vintage_microscope_base',               0.00, -0.14, -0.12]
  ];

  var T = window.THREEX;
  var stage = null;
  var canvas = doc.getElementById('stage');

  function bootStage() {
    if (!T || !canvas || reduced) return;

    var renderer;
    try {
      renderer = new T.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (err) { return; }                       // no WebGL: the posters stay, and they are enough
    if (!renderer.getContext()) return;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    renderer.setClearColor(0x0c0a06, 1);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.28;
    renderer.shadowMap.enabled = true;

    var scene = new T.Scene();
    // the bench has to fall to black within about a metre of the object, or it becomes a big warm
    // field that outshouts the instrument. Fog does that; a bigger plane and a dimmer light do not.
    scene.fog = new T.Fog(0x0c0a06, 1.25, 4.0);

    var camera = new T.PerspectiveCamera(38, window.innerWidth / window.innerHeight, 0.05, 40);

    // one hard key, fixed in the room, narrow enough to leave a pool rather than daylight. As the
    // camera orbits, the specular travels across the brass — which is how the viewer knows the room
    // is real and the object is not on a turntable.
    var key = new T.SpotLight(0xfff2e0, 50, 0, 0.32, 0.92, 1.15);
    key.position.set(-1.75, 2.55, 1.35);
    key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024);
    key.shadow.camera.near = 0.6; key.shadow.camera.far = 7;
    key.shadow.bias = -0.0018;
    key.shadow.radius = 2;
    scene.add(key);
    scene.add(key.target);

    // An eye-light that rides with the camera at a tenth of the key. By 90° into the peak orbit the
    // fixed key is behind the object and the near side goes to pure black — technically correct and
    // unwatchable. This is the oldest cheat in the trade and it is the only light that moves.
    var fill = new T.SpotLight(0xd8e2ee, 17, 0, 0.62, 1, 1.1);
    fill.castShadow = false;
    scene.add(fill);
    scene.add(fill.target);

    var model = null, parts = [], ready = false;
    var pending = 2;
    function step() { if (--pending === 0 && model) { ready = true; root.classList.add('webgl'); onResize(); } }

    // environment: a real 16-bit HDRI through PMREM. A generated sky image is not an IBL.
    var pmrem = new T.PMREMGenerator(renderer);
    new T.HDRLoader().load('assets/env/studio_small_09_512.hdr', function (tex) {
      tex.mapping = T.EquirectangularReflectionMapping;
      scene.environment = pmrem.fromEquirectangular(tex).texture;
      scene.environmentIntensity = 0.50;             // material response, not a second light
      tex.dispose(); pmrem.dispose();
      step();
    }, undefined, function () { pending = 99; });    // no environment: don't half-light the scene

    // the bench, in a real tiling PBR material
    var texl = new T.TextureLoader();
    function benchMap(file, srgb) {
      var t = texl.load('assets/tex/' + file);
      t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(3, 3);
      if (srgb) t.colorSpace = T.SRGBColorSpace;
      return t;
    }
    var bench = new T.Mesh(
      new T.PlaneGeometry(7, 7),
      new T.MeshStandardMaterial({
        map: benchMap('wood_diff.jpg', true),
        normalMap: benchMap('wood_nor.jpg'),
        roughnessMap: benchMap('wood_arm.jpg'),
        aoMap: benchMap('wood_arm.jpg'),
        color: 0x130d09,                             // the map alone renders a bright orange field
        roughness: 1, metalness: 0
      })
    );
    bench.rotation.x = -Math.PI / 2;
    bench.receiveShadow = true;
    scene.add(bench);

    new T.GLTFLoader().load('assets/model/microscope.gltf', function (gltf) {
      model = new T.Group();
      model.add(gltf.scene);
      scene.add(model);

      // stand it on the bench and normalise its height to 1 unit, whatever the source scale is
      var box = new T.Box3().setFromObject(gltf.scene);
      var size = new T.Vector3(); box.getSize(size);
      var s = 1 / Math.max(size.y, 0.0001);
      gltf.scene.scale.setScalar(s);
      box.setFromObject(gltf.scene);
      var c = new T.Vector3(); box.getCenter(c);
      gltf.scene.position.set(-c.x, -box.min.y, -c.z);

      gltf.scene.traverse(function (o) {
        if (!o.isMesh) return;
        o.castShadow = true;
        o.receiveShadow = true;
        if (o.material) o.material.envMapIntensity = 1.15;
      });

      // resolve the eight named nodes and remember where each one started
      gltf.scene.updateMatrixWorld(true);
      for (var i = 0; i < PARTS.length; i++) {
        var node = gltf.scene.getObjectByName(PARTS[i][0]);
        if (!node) continue;
        // the marker has to point at the part, and a glTF node's origin is often nowhere near the
        // middle of the thing it draws. Cache the offset from origin to visual centre once.
        var pb = new T.Box3().setFromObject(node);
        var pc = new T.Vector3(); pb.getCenter(pc);
        parts.push({
          node: node,
          home: node.position.clone(),
          // 0.30 of the normalised height. Anything past ~0.35 throws the eyepiece out of frame
          // at the widest point of the orbit, which was the first version and it looked like debris.
          dir: new T.Vector3(PARTS[i][1], PARTS[i][2], PARTS[i][3]).multiplyScalar(0.30 / s),
          centre: pc.sub(node.getWorldPosition(new T.Vector3())),
          world: new T.Vector3()
        });
      }
      step();
    }, undefined, function () { pending = 99; });    // no mesh: the posters are the film

    // ── camera choreography ──────────────────────────────────────────────────
    var tmp = new T.Vector3();
    // `pan` turns the camera after it has aimed, which slides the object across the frame without
    // moving it in the world — the hero copy owns the left half at desktop widths, so the object
    // has to sit right of centre there and centred on a phone.
    function place(azDeg, elDeg, dist, targetY, pan) {
      var az = azDeg * Math.PI / 180, el = elDeg * Math.PI / 180;
      // a portrait viewport is narrow, not short: the vertical FOV alone would frame the object
      // fine and then crop its sides off. Back the camera off in proportion to how tall the
      // window is — without this the phone gets a close-up of the middle of the microscope.
      var aspect = window.innerWidth / window.innerHeight;
      var portrait = aspect < 1;
      // Measured, not derived: at 390×844 the exploded spread needs about 1.5× the desktop
      // distance to clear the sides, at 768×1024 it needs about 1.05×, and past 0.78 the vertical
      // field is already the binding constraint so nothing changes.
      if (portrait) dist *= Math.max(1, 1 + (0.78 - aspect) * 1.6);
      camera.position.set(
        Math.sin(az) * Math.cos(el) * dist,
        Math.sin(el) * dist + targetY,
        Math.cos(az) * Math.cos(el) * dist
      );
      tmp.set(0, targetY, 0);
      camera.lookAt(tmp);
      // portrait tilts the lens down instead, which lifts the object into the top of the frame and
      // leaves the bottom half of a phone screen for the copy
      if (portrait) camera.rotateX(-0.25 * (1 - aspect));   // scales with how portrait it is; a
                                                            // fixed tilt clipped the eyepiece on a
                                                            // tablet and undershot on a phone
      else if (pan) camera.rotateY(pan);
      // Fog rides the dolly. Absolute distances were tuned at the desktop hero range and then a
      // phone, which has to pull back to 4.2 units to fit the exploded spread, pushed the whole
      // instrument past the far plane — three blank frames in the middle of the peak, invisible
      // in every desktop check. Tying near/far to the current distance keeps the same falloff at
      // any viewport and any point in the dolly.
      scene.fog.near = Math.max(0.1, dist - 1.09);
      scene.fog.far = dist + 1.66;
      key.target.position.copy(tmp);
      fill.position.copy(camera.position);
      fill.position.y += 0.7;                         // just above the lens, never on-axis flat
      fill.target.position.copy(tmp);
      // the eye-light rides the camera, so pulling back on a phone would dim the object by a third
      // purely as a side effect of the viewport. Undo the falloff, keep the intent.
      fill.intensity = 17 * Math.pow(dist / 2.4, 1.1);
    }

    function setExplode(amount) {
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.node.position.copy(p.home).addScaledVector(p.dir, amount);
      }
    }

    function onResize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    window.addEventListener('resize', onResize, { passive: true });

    stage = {
      renderer: renderer, scene: scene, camera: camera, parts: parts,
      isReady: function () { return ready; },
      hero: function (p) {                            // scene 1: a slow lift and pull-back
        place(-26 + p * 10, 4 + p * 6, 2.06 + p * 0.30, 0.47 + p * 0.05, 0.155);
        setExplode(0);
      },
      peak: function (p) {                            // scene 3: orbit, come apart, close again
        var e;
        if (p < 0.14) e = 0;
        else if (p < 0.68) e = easeOut((p - 0.14) / 0.54);
        else e = 1 + (0.18 - 1) * easeInOut((p - 0.68) / 0.32);
        // the camera breathes out while the object opens and comes back in as it closes, so the
        // eight parts stay inside the frame at the widest point instead of leaving it
        place(-26 + easeInOut(p) * 118, 8 + easeInOut(p) * 15,
              2.34 + e * 0.62 - easeInOut(p) * 0.34, 0.47 + e * 0.13, -0.055);
        setExplode(e);
        return e;
      },
      render: function () { renderer.render(scene, camera); }
    };
    stage.hero(0);
    // diagnostic hook. It is also how design/tools/posters.mjs renders the fallback stills, so the
    // no-WebGL cut of the page is a real frame of this exact scene rather than a lookalike.
    window.__hale = stage;
  }
  bootStage();

  // ── the peak's marker and margin callouts ──────────────────────────────────
  var marker = doc.getElementById('marker');
  var markerDot = marker && marker.querySelector('.dot');
  var lead1 = marker && marker.querySelector('.l1');
  var lead2 = marker && marker.querySelector('.l2');
  var lead3 = marker && marker.querySelector('.l3');
  var calloutItems = callouts ? Array.prototype.slice.call(callouts.querySelectorAll('li')) : [];
  var lastActive = -1;

  function updateCallouts(explode, progress) {
    if (!stage || !calloutItems.length) return;
    var n = calloutItems.length;
    var idx = explode < 0.04 ? -1 : Math.min(n - 1, Math.floor(clamp((progress - 0.15) / 0.55, 0, 0.999) * n));
    if (idx !== lastActive) {
      for (var i = 0; i < n; i++) {
        calloutItems[i].classList.toggle('active', i === idx);
        calloutItems[i].classList.toggle('seen', i < idx);
      }
      lastActive = idx;
    }
    if (!marker) return;
    var part = stage.parts[idx];
    if (idx < 0 || !part || !callouts) { marker.classList.remove('is-on'); return; }

    part.node.getWorldPosition(part.world);
    part.world.add(part.centre);
    var v = part.world.clone().project(stage.camera);
    if (v.z > 1) { marker.classList.remove('is-on'); return; }
    var x = (v.x * 0.5 + 0.5) * window.innerWidth;
    var y = (-v.y * 0.5 + 0.5) * window.innerHeight;
    var panelLeft = callouts.getBoundingClientRect().left;
    if (x > panelLeft - 24) { marker.classList.remove('is-on'); return; }

    var rowY = calloutItems[idx].getBoundingClientRect().top + calloutItems[idx].offsetHeight / 2;
    var endX = panelLeft - 10;
    var elbow = x + (endX - x) * 0.45;
    markerDot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    lead1.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    lead1.style.width = Math.max(0, elbow - x) + 'px';
    lead2.style.transform = 'translate(' + elbow + 'px,' + Math.min(y, rowY) + 'px)';
    lead2.style.height = Math.abs(rowY - y) + 'px';
    lead3.style.transform = 'translate(' + elbow + 'px,' + rowY + 'px)';
    lead3.style.width = Math.max(0, endX - elbow) + 'px';
    marker.classList.add('is-on');
  }

  // ── the one rAF loop ───────────────────────────────────────────────────────
  var ownerWho = ownersEl ? Array.prototype.slice.call(ownersEl.querySelectorAll('.who')) : [];
  var lastShift = null, lastCopyOpacity = null, peakOn = false;

  function frame() {
    requestAnimationFrame(frame);

    // parallax-depth, scene 5 only, capped so it reads as depth and never as a broken layout.
    // Below 900px the two columns stack, and offsetting one of them stops being depth and starts
    // being one paragraph printed on top of another — so it simply does not run there.
    if (ownerWho.length && !reduced && window.innerWidth >= 900) {
      var r = ownersEl.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) {
        var shift = Math.round(clamp(((r.top + r.height / 2) / window.innerHeight - 0.5) * 84, -42, 42));
        if (shift !== lastShift) {
          lastShift = shift;
          for (var i = 0; i < ownerWho.length; i++) {
            ownerWho[i].style.transform = 'translate3d(0,' + shift + 'px,0)';
          }
        }
      }
    }

    if (!stage || !stage.isReady()) return;

    var vh = window.innerHeight;
    var hr = heroEl.getBoundingClientRect();
    var pr = peakEl.getBoundingClientRect();
    var heroVisible = hr.bottom > 0 && hr.top < vh;
    var peakVisible = pr.bottom > 0 && pr.top < vh;

    // The peak's furniture — the instrument frame, the eight callouts, the marker — belongs to the
    // peak and to nothing else. Gate it on the peak actually OWNING the viewport, not on merely
    // intersecting it: a section 420vh tall starts intersecting a whole screen too early, and the
    // first version left the frame and callouts drawn across the revisions and the paper sheet.
    var wantPeak = pr.top <= vh * 0.2 && pr.bottom >= vh * 0.8;
    if (wantPeak !== peakOn) {
      peakOn = wantPeak;
      if (iframeBox) iframeBox.classList.toggle('is-on', peakOn);
      if (callouts) callouts.classList.toggle('is-on', peakOn);
      if (!peakOn && marker) marker.classList.remove('is-on');
    }

    if (!heroVisible && !peakVisible) return;         // nothing on screen: don't spend a frame on it

    if (peakVisible) {
      var p = progressOf(peakEl);
      var e = stage.peak(p);
      // the title card clears before the object opens, so the copy never lies across the parts
      if (peakCopy) {
        var o = clamp(1 - (p - 0.04) / 0.09, 0, 1);
        if (o !== lastCopyOpacity) { lastCopyOpacity = o; peakCopy.style.opacity = o; }
      }
      if (peakOn) updateCallouts(e, p); else if (marker) marker.classList.remove('is-on');
    } else {
      stage.hero(progressOf(heroEl));
      if (marker) marker.classList.remove('is-on');
    }
    stage.render();
  }
  requestAnimationFrame(frame);
})();
