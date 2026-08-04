# BUILD-REPORT — `hale`

Built 2026-08-04 by the `auteur` skill, direct register, autonomous (no user present).
Every number here came out of a command on this machine. Nothing is remembered.

---

## 1. Slug, brand, object, and what was sourced

**Slug:** `hale` (no collision with drift / flux / static / swarm / atlas / abyss).

**Brand:** *Hale Instrument Co., Sheffield.* A company that has made one object since 1974 and
revised it six times. **The object: the Hale No. 6, a brass field microscope.** The one feeling is
**held attention** — the quiet of leaning in. It is a fictional company; the footer says so on the
page, in the same voice as the rest of the copy.

**The object was chosen from the mesh library, not invented first.** `source.mjs model --list` was
run against camera, tool, lantern, instrument, kettle, brass, clock, compass, knife, scale, radio and
watch before anything was written. The shortlist that came back was real: `vintage_binocular`,
`seadogs_compass`, `pocket_watch`, `Camera_01`, `Lantern_01`, `vintage_microscope`.
`vintage_microscope` won on two facts the listing gave me:

- it is the only strong candidate at `condition=clean` — the others are `worn`, `weathered` or
  `rusted`, which render as antiques rather than as a product you can buy this week;
- **its glTF has eight separately named nodes** (`eye_piece`, `revolver`, `adjustment`,
  `rack_mount_support`, `condenser`, `mirror_arm`, `mirror_base`, `base`).

That second fact is what the whole film is built on, and I only knew it after downloading and
inspecting the file. See §4.

### Sourced assets

| id | source | licence | author | role |
|---|---|---|---|---|
| `vintage_microscope` | [Poly Haven](https://polyhaven.com/a/vintage_microscope) | **CC0** | Luis José Fernández Rodríguez | the hero object, live in WebGL, 20 631 tris, 8 named nodes |
| `studio_small_09` | [Poly Haven](https://polyhaven.com/a/studio_small_09) | **CC0** | Sergej Majboroda | the IBL that lights it (`HDRLoader` → `PMREMGenerator`) |
| `wood_table_worn` | [Poly Haven](https://polyhaven.com/a/wood_table_worn) | **CC0** | Rob Tuytel, Sergej Majboroda | the bench it stands on — diff/nor/arm |
| `Martian Mono` | Google Fonts | **OFL** | Evil Martian | display, labels, all figures |
| `Newsreader` | Google Fonts | **OFL** | Production Type | prose |

Zero assets require attribution. The footer credits the three Poly Haven authors anyway; `DESIGN.md`
marks that credit as part of the design, not as a legal line to be tidied away. Full ledger:
`assets/sourced/ASSETS-SOURCED.md`, with a hand-written "what actually ships" table appended because
`source.mjs` records every search result, not just the chosen one.

**No AI image or video generation was used.** Everything on the page is either sourced CC0, a real
render of the sourced mesh, or built in code. `agy`, `codex` and `grok` were never invoked — nothing
on this page needed a frame that a real mesh under a real IBL could not give.

---

## 2. Every command, and what happened

Run from the repo root unless noted. `⚠` marks something that failed or surprised me.

**Recon (phase 0a.5)**
```
node scripts/source.mjs model "<12 different nouns>" --list --limit 8-12
node scripts/refscout.mjs --from awwwards --limit 7 --shots 3 --out docs/showcase/hale/design/refs
node scripts/moodboard.mjs "polished brass instrument macro, single hard light, black background" \
     "letterpress specimen sheet, technical drawing, thin hairline rules" \
     "dark still life photography, warm metal, deep shadow" --limit 24 --out .../design/moodboard
```
- refscout: 7 sites, 2 `NO CAPTURE` (Hearst Exhibit, Noomo Showcase — reported honestly and not
  quoted), 12 screenshots. ~3 minutes.
- moodboard: 24 tiles kept (bing 8 / pinterest 11 / arena 5), two contact sheets. ~90 seconds.
- ⚠ **Query axis 1 collapsed.** "polished brass **instrument** macro" returned trumpets, saxophones
  and tubas — "brass instrument" is a fixed English compound noun. This is exactly the failure mode
  `recon.md` documents ("search collapsed an abstract phrase to a common substring"), and my query
  broke its own rule #3 by pairing a treatment with a noun that is half of an idiom. I did not re-run
  it: I needed *light character* from that axis and 60% of the tiles delivered precisely that. The
  post-mortem is written into `MOODBOARD.md`.

**Sourcing (phase 1)**
```
node scripts/source.mjs model   "vintage microscope brass" --res 1k --limit 1 --out .../assets/sourced
node scripts/source.mjs hdri    "studio small 03"          --res 1k --limit 1 --out .../assets/sourced
node scripts/source.mjs texture "wood table worn"          --res 1k --limit 1 --out .../assets/sourced
node scripts/source.mjs font    "serif variable" | "mono variable" | "newsreader" | "serif text book variable"
```
- ⚠ **`--res 1k` was asked for and 2k was delivered on the first four calls**, because I omitted the
  flag while exploring with `--list`. Harmless (nothing was downloaded), but see §6.
- ⚠ **`hdri "studio small 03"` returned `studio_small_09`.** `source.mjs` drops query words of two
  characters or fewer (`words()` filters `w.length > 2`), so the query became "studio small" and the
  ranker picked the most-downloaded match. You cannot address a Poly Haven asset by its numeric
  suffix. I used 09 and it is good; had it mattered I would have had no way to ask for 03.
- Weights as downloaded: mesh 2.2MB, HDRI 1.5MB, texture 3.3MB = 7.0MB of masters for a 2.2MB page.

**Vendoring three.js** (no npm changes to the repo)
```
npm i three@0.180.0            # in a scratch dir outside the repo
npx esbuild@0.25.0 entry.js --bundle --format=iife --global-name=THREEX --minify
```
- ⚠ First attempt used `export * from 'three'` → **731KB**. Naming the ~20 symbols I actually use cut
  it to **560KB**.
- ⚠ `examples/jsm/loaders/RGBELoader.js` at r180 is a 268-byte deprecation shim; the real class is
  `HDRLoader`. Worth knowing before wiring it up.
- IIFE rather than ESM on purpose: ES modules are CORS-blocked over `file://`, classic scripts are
  not. See §5 for what that buys.

**Compression** (all `ffmpeg`)
```
ffmpeg -i studio_small_09_1k.hdr -vf scale=512:256 -c:v hdr -update 1 -frames:v 1 …   # 1.5MB → 368KB
ffmpeg -i vintage_microscope_{diff,arm}_1k.jpg -vf scale=1024:1024 -q:v 4 …           # 1.6MB → 321KB
ffmpeg -i wood_table_worn_{diff,nor,arm}_1k.jpg -vf scale=512:512 -q:v 4 …            # 3.3MB → 43KB
ffmpeg -i out/hero.png -vf scale=1280:-2 -quality 93 assets/poster/hero.webp          # 1.0MB → 21KB
```
- ffmpeg does encode Radiance `.hdr`; it needs `-update 1 -frames:v 1` or it demands a sequence
  pattern. A 512×256 IBL is indistinguishable here because PMREM blurs by roughness anyway.
- ⚠ `-pattern_type glob` is not compiled into this ffmpeg build. Numeric patterns only.

**Rendering the fallback stills** — `design/tools/posters.mjs` drives the *real* page at 2560×1600,
calls `window.__hale.peak(0.62)` then `render()` then `toDataURL()` in the same JS turn (the drawing
buffer is only cleared at the next composite). The two static images are therefore literal frames of
the shipped scene, not lookalikes. Re-run after any change to the 3D.

**Verification**
```
node scripts/slopscan.mjs docs/showcase/hale                                   # 0/0/0
node scripts/shoot.mjs http://127.0.0.1:8127/ --stops 9 --breakpoints 390,768,1440 --reduced-motion
node scripts/motionqa.mjs http://127.0.0.1:8127/ --throttle 4 --headed
node design/tools/qa.mjs  http://127.0.0.1:8127/ file:///…/index.html
node design/tools/lcp.mjs http://127.0.0.1:8127/
node design/tools/final.mjs http://127.0.0.1:8127/
```
- ⚠ **`motionqa` headless is meaningless for WebGL** — software rasteriser at 4× throttle gave
  `minFps 7`. The script says so itself; `--headed` gave 52. Worth reading the advisory rather than
  the number.
- ⚠ The 3D scene **cannot be QA'd over `file://`** — `fetch` to `file:` is blocked, so the glTF and
  HDRI never load. Everything involving the live stage needs a server;
  `design/tools/serve.mjs` is 40 lines and exists for that.
- The shoot ran five times. Each round found something (§5 of CINEMA-QA lists what).

---

## 3. Final weight, per asset, and the gate results

### Page weight — **2.19 MB** (2 295 037 bytes), 16 requests. Budget was 8MB.

| bytes | file | note |
|---:|---|---|
| 702 092 | `assets/model/vintage_microscope.bin` | mesh geometry, 20 631 tris. Not Draco-compressed (see §5) |
| 574 223 | `assets/vendor/three-bundle.js` | three r180, ~20 symbols + GLTFLoader + HDRLoader, IIFE, minified |
| 377 117 | `assets/env/studio_small_09_512.hdr` | the IBL, 1k → 512×256 |
| 183 017 | `assets/model/textures/…_arm_1k.jpg` | AO/rough/metal, 1024, q4 |
| 132 000 | `assets/fonts/Newsreader.woff2` | latin subset, variable, roman only |
| 119 035 | `assets/model/textures/…_diff_1k.jpg` | albedo, 1024, q4 |
| 38 492 | `assets/fonts/MartianMono.woff2` | latin subset, variable |
| 29 678 | `index.html` | markup + all CSS inline |
| 22 308 | `assets/tex/wood_diff.jpg` | bench albedo, 512 |
| 21 106 | `assets/poster/exploded.webp` | static cut of the peak |
| 21 007 | `assets/hale.js` | the whole page's behaviour |
| 20 948 | `assets/poster/hero.webp` | static cut of the hero |
| 18 696 | `assets/model/textures/…_nor_gl_1k.jpg` | normals, 512 |
| 15 000 | `assets/model/microscope.gltf` | |
| 12 367 | `assets/tex/wood_arm.jpg` | |
| 7 951 | `assets/tex/wood_nor.jpg` | |

Whole `docs/showcase/hale/` directory on disk: **4.3MB**, including all design artifacts.
Third-party origins at runtime: **zero**. No CDN, no analytics, no cookies.

### Gates, verbatim

**slopscan** — run after the last edit:
```
Summary: 0 fails, 0 warns, 0 suppressed
```
8 files scanned, including the vendored three.js bundle. No `auteur-allow` suppressions exist.

**shoot** — 33 frames, all looked at:
```
Files written: 33
  bp390:  scrollHeight=7658px  files=11
  bp768:  scrollHeight=7502px  files=11
  bp1440: scrollHeight=7850px  files=11
```
Reviewed as `design/sheet-{390,768,1440}.webp` plus individual frames for everything flagged, plus a
6-frame 390 peak arc and a 4-frame reduced-motion arc captured separately, plus a 20-frame slow pass
at 1440. Four real defects were found by eyes and fixed — listed in §5.

**motionqa** (headed, real GPU, 4× CPU throttle):
```
motionqa: minFps 52 @4x - max long-task 380ms - audio gesture-gated - console errors 0
FAIL long task 380ms > 50ms
```
The FPS passes. The long-task figure is a load-time artefact of `buffered: true` — measured directly,
there are **zero** long tasks during a 6-second full-page scroll and two at load (76ms, 74ms: bundle
parse and PMREM prefilter). CINEMA-QA row 20 carries the full explanation rather than a suppression.

**Rubric numbers:** LCP **1072ms** at Fast 3G + 4× CPU (element: the hero poster, 21KB) · CLS
**0.0027** · INP-proxy **22ms** · 15/15 contrast probes pass against the colour actually painted
behind each element, lowest 4.99:1 · scrub verified bit-identical scrolling up and down · 0 console
errors anywhere.

**CINEMA-QA:** 20 rows, all PASS, with one row (18, mobile assets) carrying a written caveat and one
non-passing metric explained in full at the bottom. `design/CINEMA-QA.md`.

**Degraded cuts** (all measured, `design/tools/qa.mjs`):

| cut | result |
|---|---|
| reduced motion | WebGL never boots · page 7845 → 5446px · both posters paint · eight part names render · 506 words |
| JavaScript off | 529 words · hero poster shown · eight part names shown |
| WebGL unavailable | `webgl` class absent, posters shown, names shown, **0 page errors** |
| `file://` | posters load, both fonts load, 529 words, **0 errors** — the 3D does not boot, by design |

---

## 4. What recon actually changed

**It changed the peak, the palette strategy and the entire graphic language. Concretely:**

**a) The mesh listing chose the product.** This is the biggest one and it is not really recon — it
is `source.mjs` used as a research tool before any writing. I had a brand in mind (a maker of one
beautiful object) and no product. The listing said: Poly Haven has four cameras, five instruments,
four lanterns, a pocket watch, a compass. `vintage_microscope` was the only one at `condition=clean`.
Everything downstream — Sheffield, 1974, the six revisions, "the only instrument we make" — was
written after that, to fit an object that already existed.

**b) The peak exists because the glTF has eight named nodes.** My storyboard before inspecting the
file said "orbital hero, camera moves, object doesn't". Reading the JSON changed it to *the object
comes apart and every piece names itself*, which is a materially better scene and is only possible
with real geometry. An image model cannot produce this at any budget. If this run proves one thing
about sourcing, it is that: the asset was not a substitute for a generated one, it was a **different
kind of thing** that made a different film possible.

**c) refscout dated the reflex instead of guessing it.** Five of seven sites ran
GSAP + ScrollTrigger + ScrollSmoother (+ Lenis); three had scroll-driven WebGL; display type measured
118–144px; every palette was near-black + white + **one high-chroma neon accent** (`rgb(237,56,51)`,
`rgb(252,215,87)`, `rgb(201,254,110)`); zero serifs, zero Inter. Two consequences:
- commit-sheet 6a stopped being an opinion and became a citation;
- **I dropped GSAP and Lenis specifically because everyone runs them.** Not as a pose — I checked
  what I actually needed, and `position: sticky` plus a bounding-rect read inside the renderer's own
  rAF loop does all of it. That saved ~120KB and left the visitor's own scroll wheel alone, which is
  the right call for an audience that buys one thing and keeps it twenty years.

**d) The moodboard supplied the graphic system.** Tile 22 was a mechanical-drafting line-type legend
— visible / hidden / centre / phantom lines, each in a ruled cell with a small-caps label. That
became the drafting rail (commit-sheet field 4): a hairline that changes dash pattern per scene
because in a real drawing the dash pattern *means* something. Solid where the object is present,
long-dash-double-dot where the subject is elsewhere, gone on the paper sheet. Without that tile the
page would have had "a vertical line on the left".

**e) The moodboard also told me what to refuse.** Six of twenty tiles were the same commercial
still-life: premium metal object floating on a black seamless with a soft studio gradient. That is
the reflex for this exact brief, delivered to my desk. It is why the instrument stands on a lit
wooden bench with a cast shadow instead of floating, and why the light is one hard narrow spot with a
pool rather than a studio sweep.

**f) It also killed my first type idea.** Bodoni Moda was the plan — didone, the type of the
scientific-instrument era. Against the recon evidence, black + brass + thin high-contrast didone is
the luxury reflex almost exactly. It became Martian Mono, and the argument is written in
COMMIT-SHEET §3.

---

## 5. What is still weak or unfinished

Ordered by how much it would bother me.

1. **The mesh `.bin` is 686KB and un-compressed.** It is 31% of the page. `gltf-pipeline` with Draco
   would take it to roughly 150KB, but it needs the Draco decoder shipped alongside (~200KB WASM), so
   the win is ~330KB and it adds a decode step and a second vendored blob. I judged it not worth it
   at 2.19MB against an 8MB budget, but on a page with a real weight problem this is the first thing
   to do. GitHub Pages gzips it in transit; `file://` does not.

2. **The reduced-motion hero poster is a 16:10 render cropped into a 34vh strip on a phone.** The
   instrument lands in the right third with black to its left. It reads as a deliberately off-centre
   photograph rather than as a mistake, but it is not composed — it is cropped. The correct fix is a
   second portrait render (~20KB) behind a `<picture>` `source media`. I chose not to gold-plate a
   fallback that already tells the story; it remains the weakest frame on the page.

3. **The marker dot is at the part's bounding-box centre, which for two of the eight parts is not
   where your eye says the part is.** `mirror_base` in particular reads slightly low. Fixing it
   properly means per-part hand-tuned anchor offsets — eight more magic numbers on top of the eight
   explode vectors that are already hand-written. I stopped at "close enough that the leader clearly
   points into the right object".

4. **The eight explode directions are hand-authored constants.** Derived directions (centroid minus
   model centre) left three parts embedded inside the body because they sit almost on the model's own
   axis. The hand-written table works and is commented, but it is bound to this specific mesh — swap
   the model and the peak scene needs re-authoring, not re-parameterising.

5. **The instrument frame, the marker and the callouts are gated on a hand-written viewport test**
   (`pr.top <= vh*0.2 && pr.bottom >= vh*0.8`). It is correct at the three breakpoints I shot and at
   the aspect ratios in between, but it is a heuristic, and a very short viewport (a phone in
   landscape, say 390×640) is untested. I did not shoot landscape phone.

6. **Scene 2 and scene 5 are structurally the same object** — a ruled list of a mono key column and a
   serif prose column. They are far apart, they differ in motion family and column ratio, and the
   storyboard's adjacency rule is satisfied. But if a seventh scene were ever added, a third ruled
   list would tip the page into a pattern, and `DESIGN.md` does not currently forbid that.

7. **The `.s-owners` blurred background is a 14px CSS blur on a full-section background image.** It
   is cheap on a laptop and I measured no long task from it, but a large CSS blur is exactly the kind
   of thing that costs on a mid-range Android, which I have no way to test here.

8. **`design/tools/` has nine scripts and three of them are one-off probes** (`probe.mjs`,
   `diag.mjs`, `rmshot.mjs`, `weigh.mjs`). I kept them because CINEMA-QA cites their output and
   deleting them would make those numbers unreproducible, but they are debug scratch, not tooling.

9. **The scroll lengths in the storyboard do not match what was built.** The storyboard planned
   ~1300vh total; the page is 8.7× viewport, because four of the six scenes are content-height plus
   padding rather than a fixed `vh`. Content-driven height is the better call and I did not force
   dead space to match a number, but the storyboard's `scroll_len:` lines are now aspirational for
   scenes 2, 4, 5 and 6. Only scene 3 (420vh / 300vh mobile) is literal.

10. **`design/moodboard/contact-sheet-*.webp` were deleted before shipping**, because
    `docs/` is published to GitHub Pages and those sheets are composites of twenty-four images that
    belong to other people. `MOODBOARD.md` keeps the per-tile source table and the filled read. This
    is correct per `recon.md` but it does mean the moodboard evidence is now text, not image.

---

## 6. What was wrong, ambiguous or missing in the skill

Ordered by how much time each one cost.

### `source.mjs`

1. **`--list` prints nothing to stdout.** It reports `found: N` and a ledger path — the actual names
   go into `ASSETS-SOURCED.md`. Searching the library is a read-loop (`--list`, open file, `--list`
   again), and every exploratory search permanently appends to the ledger, so the ledger for a real
   project ends up 260 lines of search history around three used assets. Suggest: `--list` prints
   `id · title · licence · note` to stdout and does **not** write the ledger.

2. **Queries drop words of ≤2 characters** (`words()` filters `w.length > 2`), so Poly Haven's
   numeric suffixes are unaddressable: `"studio small 03"` becomes `"studio small"` and you get 09.
   Since Poly Haven names most of its library `thing_01 … thing_09`, this means you can never ask for
   a specific one. Suggest: keep pure-digit tokens.

3. **The default `--out` is `assets/sourced` relative to CWD**, which for the documented invocation
   (run from the skill repo root) drops a ledger and a 2.6MB `.gf-metadata.json` cache at the repo
   root. I created `C:/…/auteur-repo/assets/sourced/` before noticing. The examples in `assets.md`
   §0.5 never show `--out`; they should, in every line.

4. **`font` never downloads anything** (`files: []`) and reports a `fonts.googleapis.com` CSS link.
   For a page that must have no third-party origin — which is most of what this skill builds — you
   still have to fetch the CSS with a browser UA, parse the `latin` subset block, and pull the woff2
   by hand. That is ~25 lines I wrote twice. It belongs in the tool.

5. The tool cannot say *why* an asset matched. `phScore` is opaque from outside, so when
   `"wood table worn"` returns exactly one hit you cannot tell whether the library has one match or
   twenty that scored zero. A `--verbose` showing score and matched tags would make search steerable.

### `assets.md` §0.5

6. **The routing table is right and the sentence I needed is missing.** §0.5 says a mesh must be
   sourced "because no image model produces geometry". True, and it undersells the finding: a sourced
   mesh can have *named parts*, and named parts are a scene an image model cannot express at all. The
   whole peak of this page came from `console.log(gltf.nodes.map(n => n.name))`. Suggest a line under
   the mesh row: *inspect the glTF's node names before writing the scene — a mesh that comes apart is
   a different film from a mesh that spins.*

7. **Nothing in §0.5 mentions weight.** A 1k Poly Haven mesh + HDRI + PBR set is 7MB of masters,
   which is most of a page budget. The compression recipes in §5 cover video and stills but say
   nothing about downscaling an HDRI (ffmpeg does it, `-c:v hdr -update 1 -frames:v 1`), re-encoding
   glTF textures in place, or dropping `disp`/`rough` when `arm` already carries roughness. Those
   three moves took 7MB to 730KB here.

8. **§0.5 has no guidance on getting three.js into a no-build page**, which is the unavoidable next
   step after "source a mesh". The reader has just been told to fetch geometry and an IBL and is left
   at a fork with three wrong answers (ESM + import map: dies on `file://`; CDN: banned by most
   briefs; old UMD build: wrong colour management). The right answer — bundle to IIFE once with
   esbuild and commit the output — is three lines of documentation that would have saved me twenty
   minutes.

### `recon.md`

9. **The moodboard's own example query breaks its own rule.** `recon.md` warns that image search
   collapses abstract phrases, then demonstrates with `"terracotta ceramic studio light"`. My
   `"polished brass instrument macro"` failed for exactly the documented reason, and I still wrote it,
   because the rule is stated ("anchor a treatment query with a concrete noun") without warning that
   *the noun itself can be half of an idiom*. Suggest adding: **check that your subject noun is not
   part of a fixed compound** — brass instrument, hard surface, light bulb, glass ceiling.

10. **"Ship them to no one and add them to `.gitignore` if the repo is public" does not survive a
    subdirectory.** This repo's root `.gitignore` has `design/refs/` and `design/moodboard/`, both
    anchored to the root, so `docs/showcase/<slug>/design/moodboard/` is *not* ignored and would have
    been published to GitHub Pages. Only `**/shots/` uses a `**/` prefix. Suggest the skill emit
    `**/design/moodboard/` and `**/design/refs/`, or have `moodboard.mjs` write its own `.gitignore`
    next to the sheets.

11. **`refscout` labelled 2 of 7 sites `NO CAPTURE`** — that is the documented rate and the tool
    handled it exactly as promised. No complaint; recording it as a confirmed data point.

### `STORYBOARD.md` template

12. **`media:` is mandatory in the Gate-0 checklist and four of my six scenes legitimately have no
    media.** The template offers `type: none (type-led)` but the checklist row reads "every `media:`
    block is filled: type, route, and a literal frame prompt — a one-line 'generate something' is not
    a producible ask", which pushes toward writing a frame prompt for a scene that will never have a
    frame. I wrote `frame prompt: n/a — nothing is generated` and then, for the 3D scenes, a
    *direction to the renderer* in the same shape as a prompt (subject + camera + lighting + palette).
    That turned out to be genuinely useful — it is what I tuned the light rig against. Suggest the
    template name it: `frame prompt (or, for a sourced/live scene, the equivalent direction)`.

13. **The template has no field for the thing that decided this whole build.** There is `Assets
    available up front:` but nothing that asks *what does the sourced asset make possible that you
    did not plan for*. Sourcing is now a phase-1 route in `assets.md`; the storyboard header should
    have a line like `Sourced-asset findings:` so the discovery ("the mesh has 8 named nodes")
    survives into the build instead of living in one session's reasoning.

14. **`scroll_len:` has no relationship to what gets built** for content-height scenes. Four of my
    six numbers are now wrong in the shipped file. Either the field should say "peak and pinned
    scenes only", or Gate 2 should ask you to reconcile it.

### `verify.md` / `motionqa.mjs`

15. **`motionqa` counts load-time long tasks as scroll long tasks.** It installs the
    `PerformanceObserver` with `buffered: true` *after* a warm-up scroll, so everything since
    navigation is replayed into `window.__lt`. It reported 380–670ms across runs; direct measurement
    after load gives zero during the scroll and two ~75ms tasks at load. The rubric row says "no long
    task > 50ms **during the scroll**", so the tool is measuring something other than what the rubric
    asks. Suggest observing without `buffered` and starting after warm-up, and reporting load-time
    long tasks as a separate, separately-thresholded line.

16. **Nothing in `verify.md` tells you the 3D scene cannot be verified over `file://`.** Every
    example passes a URL, and `shoot.mjs` happily accepts a `file://` one — it will screenshot a
    perfectly fine-looking page in which the entire peak silently fell back to a poster, and you
    would not notice unless you knew what the peak was supposed to look like. This is the single most
    dangerous gap I hit: a false PASS is worse than a FAIL. Suggest a line in §2: *if the page fetches
    anything (glTF, HDRI, JSON), serve it over http — `file://` blocks `fetch` and the page will
    degrade to its fallback without telling you.*

17. **The rubric has no row for "the degraded cuts still contain the content".** Rows 8 and 16 ask
    whether reduced-motion and no-JS are *watchable*, but not whether they still carry the scene's
    information. My peak's payload is eight part names; at ≤900px the live callouts panel is
    repositioned and the static one was `display:none` — I very nearly shipped a mobile fallback with
    the names deleted. A row like *"the peak's payload survives every fallback"* would catch that
    class of bug, which screenshots at desktop width never show.

### `taste.md` / SKILL.md

18. **Ban #10's slopscan rule only inspects `:root`, `body` and `html`.** A cream *section* passes the
    linter cleanly. I went cool-paper by choice, not because anything stopped me. The prose ban is
    broader than the check, which is fine as long as the reader knows the check is not the ban.

19. **`EYEBROW_EVERYWHERE` fires at >3 CSS blocks, which quietly rewards one shared label class.**
    That is a good outcome and it is not documented anywhere as the intended remedy. Worth saying out
    loud in `taste.md` §1: *one `.label` class used everywhere is the fix, not four differently-named
    ones under the threshold.*

---

## Reproducing this page

```bash
cd docs/showcase/hale
node design/tools/serve.mjs 8127 .          # the 3D needs http; file:// gives the static cut
# then http://127.0.0.1:8127/
```
`design/tools/qa.mjs`, `lcp.mjs`, `final.mjs` and `posters.mjs` all take that URL and reproduce every
number in `design/CINEMA-QA.md`.
