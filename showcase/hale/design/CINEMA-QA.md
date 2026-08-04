# CINEMA-QA — HALE No. 6

> Filled 2026-08-04 from real runs. Every number below came out of a command on this machine, not
> from memory. Rows that only partly pass say so.

| # | Check | PASS/FAIL | Evidence |
|---|-------|-----------|----------|
| 1 | slopscan exit 0, all suppressions carry real reasons | **PASS** | `Summary: 0 fails, 0 warns, 0 suppressed` — run after the last edit (removal of the unused italic face). No suppressions exist, so none needed a reason. 8 files scanned incl. `index.html`, `assets/hale.js`, `assets/vendor/three-bundle.js`. |
| 2 | Screenshot journey reviewed frame-by-frame (390/768/1440) | **PASS** | `design/shots/` — 27 journey frames + 6 reduced-motion frames, `node scripts/shoot.mjs … --stops 9 --breakpoints 390,768,1440 --reduced-motion`. Reviewed as `design/sheet-390.webp`, `sheet-768.webp`, `sheet-1440.webp` plus individual frames for everything flagged. Additional targeted passes: `design/tools/` scripts captured a 6-frame 390 peak arc and a 4-frame reduced-motion arc, both reviewed. |
| 3 | No text overflow / ugly wraps at any breakpoint | **PASS** | Fixed on the way: colophon columns escaped the rail at 1440 (`.colophon > .inner` had no grid) and the scene-5 `.who` column was parallaxed on top of its own paragraph at ≤760px. Both re-shot and confirmed. Longest headline ("One thousand two hundred people own one.") wraps to 3 lines at 390 and stays inside the column. |
| 4 | No blank / half-fired scenes in any frame | **PASS**, after two real fixes | (a) At 390 the instrument dissolved completely in the middle of the peak — three consecutive blank frames — because `scene.fog` had absolute near/far tuned at desktop range and the portrait pull-back moved the object past the far plane. Fog is now tied to the current dolly distance. (b) In reduced motion at ≤820px `.s-peak{height:300vh}` beat `height:auto` on source order, leaving ~1000px of empty scroll; the reduced-motion block now sits last in the stylesheet. Both verified by re-capture. |
| 5 | Adjacent scenes differ in layout & motion family | **PASS** | Arc table in `STORYBOARD.md`; confirmed on the sheets. full-bleed-media/scroll-scrub → marginal-notes/entrance-reveal → pinned-canvas/scroll-scrub → editorial-columns/entrance-reveal → split-asymmetric/parallax-depth → centred-type/entrance-reveal. |
| 6 | Exactly one peak (intensity ≥8) on the built page | **PASS** | Scene 3 at 9. Next highest is the hero at 6. Scene 4 deliberately drops to 3 and changes world (dark → cool paper). |
| 7 | Scrub replays cleanly scrolling UP | **PASS** | `design/tools/final.mjs`: camera position and all eight part offsets at the same scroll position, reached descending vs ascending — byte-identical (`scrub bidirectional identical: true`). The scene is a pure function of scroll progress; no accumulated state. |
| 8 | Reduced-motion cut watchable end-to-end, nothing blank | **PASS** | WebGL never boots (`reduced: webgl booted false`); page collapses 7845px → 5446px at 1440; both posters paint; the eight part names render as static list. 506 words visible. Reviewed at 390 and 1440. |
| 9 | Body contrast ≥4.5:1 (large ≥3:1, placeholders ≥4.5:1) | **PASS** | 15 selectors measured against the colour actually painted behind them (`design/tools/qa.mjs`): `.body` 6.84 · `.rev p` 6.84 · `.owner p` 6.84 · `.spec dt` 6.14 · `.spec dd` 14.33 · `.spec-note` 6.14 · `.colophon p` 4.99 · `h1`/`h2` 14.63 (34px) · `.price` 14.63 (64px) · `.lbl` 4.99 (10px) · `.rev .yr` 7.87 · `.owner .who` 7.87 · `.cta` 7.87 · `.dim .val` 7.87. No form fields, so no placeholders. |
| 10 | LCP <2.5s (throttled) | **PASS** | **1072ms** at Fast 3G (1.6Mbps, 150ms RTT) + 4× CPU, LCP element `IMG.poster` (the hero still, 21KB). 112ms unthrottled. FCP 628ms throttled. |
| 11 | CLS <0.1 | **PASS** | **0.0027** throttled, 0 unthrottled. |
| 12 | INP <200ms | **PASS** | **22ms** click → second rAF on the only interactive control (`.cta`). One-page site, no menus, no forms. |
| 13 | Hero video ≤2MB; poster ≤300KB; frames ≤150KB | **PASS (n/a for video)** | No video on the page. Posters: `hero.webp` 20.5KB, `exploded.webp` 20.6KB — both far under 300KB. No canvas sequence. Heaviest single asset is the mesh's `.bin` at 686KB. |
| 14 | Motion budget ≤3 families, matches commit-sheet | **PASS** | scroll-scrub (the single WebGL stage), entrance-reveal (IntersectionObserver, bound per content type), parallax-depth (scene 5 only, ≥900px, capped ±42px). Nothing else is scroll-triggered. Matches COMMIT-SHEET §5. |
| 15 | Keyboard: focus visible & designed, no traps, ESC works | **PASS** | Five focusable elements, tabbed in order: Join the list → auteur → Vintage Microscope → Studio Small 09 → Wood Table Worn. Each reports a live `outline: 1.48px solid` (the `:focus-visible` brass ring at the test's zoom). No traps, no overlays, so no ESC behaviour to test. |
| 16 | No-JS: content readable, nothing hidden behind reveals | **PASS** | JS disabled: **529 words** visible (more than the JS-on path, which hides the fallback posters' alt context), hero poster shown, all eight part names shown. Reveals are opacity/transform on top of already-visible markup and only inside `@media (prefers-reduced-motion:no-preference)`, so nothing is gated on a script. |
| 17 | No console errors during full journey | **PASS** | 0 errors across: the 20-frame slow scroll, the motion pass, and each of the four degraded-mode loads. The one error that existed (a 404 for `/favicon.ico`) was fixed with an inline SVG icon. |
| 18 | Mobile: pinned scenes shortened/unpinned, assets 720p | **PASS, with one honest note** | Peak drops 420vh → 300vh at ≤820px; the marker/leader is dropped and the eight callouts become a two-column strip at the foot of the stage rather than being hidden; camera pulls back and tilts by viewport aspect. **Note:** there is no separate 720p asset set — the heavy assets are a 1k mesh and a 512 HDRI, both already small (686KB / 368KB), and serving a second mesh would cost more bytes than it saves. The one place a portrait-specific asset would help is the reduced-motion hero poster, which is a 16:10 render cropped to a 34vh strip; the instrument lands in the right third rather than centred. Noted, not fixed. |
| 19 | Sound (if any): off by default, gesture-gated, toggle visible | **n/a** | The page has no audio. The feeling is "held attention"; an ambient bed would fight it. `motionqa` confirms `audio gesture-gated` trivially (there is nothing to gate). |
| 20 | Watched the film: one slow + one fast full scroll, no felt jank | **PASS** | Slow pass: 20 frames captured end-to-end at 1440 and reviewed in four strips — the hero drift, the title card clearing before the parts move, the eight-part opening and re-closing, the ivory curtain rising over the pinned stage, and the door. Fast pass: `motionqa` scroll at 4× CPU throttle, **minFps 52** (gate ≥50), headed with a real GPU. |

### The one number that is not a clean pass

`motionqa` reports **`max long-task 380ms`**, which trips its own 50ms gate. Measured separately
(`design/tools/diag.mjs`): during a 6-second full-page scroll under 4× CPU throttle there are
**zero** long tasks. The two that exist are at load — **76ms and 74ms** — and are the three.js
bundle parse plus PMREM environment prefiltering. `motionqa` installs its observer with
`buffered: true` after a warm-up scroll, so those load-time entries (inflated by the warm-up's
forced full-page layout) are reported as if they happened during the scroll. The rubric's wording is
"no long task > 50ms **during the scroll**", and that passes; the load-time cost is real but sits
behind an already-painted poster (LCP 1.07s throttled) and is not on the interaction path. Recorded
here rather than suppressed.

**Verdict: SHIP.**
