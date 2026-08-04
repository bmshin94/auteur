# STORYBOARD — HALE No. 6

## Film meta
- **Product:** the Hale No. 6 — a brass field microscope. One object. It is the only thing the company makes.
- **Audience:** people who buy one expensive thing and keep it for twenty years. They are not shopping for features; they are checking whether the maker will still be there in 2046, and whether the thing can be repaired.
- **The one feeling:** **held attention** — the specific quiet of leaning in. Not awe (awe is loud and passes), not luxury (luxury is about being seen owning it). The page should slow the reader's hand on the scroll wheel.
- **Peak scene:** Scene 3 — the instrument comes apart into its eight named components while the camera orbits, each part labelled on a drafting leader line, then closes back together. Intensity 9.
- **Assets available up front:** none. Everything on this page is either sourced CC0 (Poly Haven mesh / HDRI / PBR wood) or built in code. No AI image or video generation was used.
- **Assumptions made:**
  - No brief was available beyond "a maker of a single, physical, beautifully-engineered object". The **object was chosen from what Poly Haven actually has** (`source.mjs model` searched: camera, tool, lantern, instrument, kettle, brass, clock, compass, knife, scale, radio, watch), not invented first. `vintage_microscope` won because it is the only strong candidate at `condition=clean` — it renders as a product, not as an antique prop — **and because its glTF has 8 separately named nodes**, which is what made the peak scene possible at all. See "what recon changed" in BUILD-REPORT.md.
  - Brand, founding year (1974), place (Sheffield), price (£2,400), waiting list (~9 months), owner count (1,200), and all six revision entries are **invented for this showcase**. They are written to be concrete and checkable-sounding because that is the voice the audience responds to; none of it describes a real company.
  - Static hosting, no framework, no build step. So: hand-written HTML/CSS/JS, three.js vendored as one classic script, fonts self-hosted. No CDN.
  - Sound: skipped. The one feeling is quiet; an ambient bed would fight it. `MINIMAX_API_KEY` was not checked because the answer would not have changed the decision.
- **References taken:** (from `design/refs/REFERENCES.md`, all three looked at eyes-on)
  - **2xa.studio** — a persistent chrome band frames an inset live stage; the frame is the interface, not decoration. → Here it becomes an **instrument frame**: a hairline rectangle with drafting corner ticks around the 3D stage, carrying live readouts (part name, orbit angle in degrees) in the outer margin. Their frame is nav-and-footer; ours is an eyepiece reticle and it reports numbers that are actually true of the scene.
  - **madewithgsap.com** — tiny mono annotations parked in the far outer margin of an otherwise empty field (`#097`, `DRAG TO EXPLORE THE COLLECTION`). → Here the far margin carries **real drafting callouts** — part designations and dimensions that belong to the object in view, not UI hints.
  - **members-play.lacoste.com/ace-breaker-rg** — a two-line hero lockup where the lines are different faces and different colours, split by a hairline rule. → Here the rule under the lockup is a **dimension line with end ticks that measures the instrument's height and states the number (312 mm)**. Their rule separates; ours measures.
- **Moodboard read:** near-mono on a true near-black ground with exactly one warm metal hue and a single hard key with steep falloff (tiles 01/06/10/12/20) — and a **second, flat, bright ivory world** for printed matter (tiles 03/22/23) that never blends into the dark one. Composition move stolen: **tile 22, the mechanical-drafting line-type legend** — hairlines that carry meaning (solid = the object, dash-dot = an axis, long-dash-double-dot = a part that is elsewhere). To avoid from that sheet: the commercial "premium metal object on black seamless" still-life, which appeared six times and *is* the reflex for this exact brief.
- **Style gate verdict:** **approved with carried notes** — see the three carried notes in `design/COMMIT-SHEET.md` §Style gate. Resolved by GATE 2 unless marked otherwise.

## Arc

| # | Scene | Beat | Intensity (1–10) | layout family | motion family |
|---|-------|------|------------------|---------------|---------------|
| 1 | The instrument in the dark | hook | 6 | full-bleed-media | scroll-scrub |
| 2 | Six revisions, fifty-two years | rising | 4 | marginal-notes | entrance-reveal |
| 3 | **Take it apart** | **peak** | **9** | pinned-canvas | scroll-scrub |
| 4 | Specification | proof | 3 | editorial-columns | entrance-reveal |
| 5 | Who has one | proof | 5 | split-asymmetric | parallax-depth |
| 6 | One a week | door | 4 | centred-type | entrance-reveal |

Motion families page-wide: **scroll-scrub · entrance-reveal · parallax-depth** = 3. No two adjacent
scenes share either family. Peak sits at 48% scroll depth.

Deliberate de-escalation after the peak: scene 4 drops to intensity 3 and changes *world* (dark → flat
ivory paper), which is the strongest available contrast and stops the page trying to top itself.

---

### Scene 1 — The instrument in the dark   | beat: hook | intensity: 6
- **purpose:** feel: you have walked into a dark room where one object is lit / learn: this company makes one thing, and it is this.
- **subject:** the instrument itself, real geometry, standing on a worn bench.
- **layout_family / motion_family:** full-bleed-media / scroll-scrub
- **camera:** low-angle, slightly below the stage plate, 38mm-equivalent — the viewer looks *up* at it. Scroll dollies the camera back and lifts it ~8° over the scene's length.
- **lighting:** hard contrast. One narrow key from camera-left-high raking the brass tube; environment IBL at low intensity for the material response only. Background falls to near-black within 40cm of the object.
- **motion:** scroll-scrub — camera dolly + 12° orbit driven by the section's own scroll range. The object does not move; the camera does.
- **transition_in / out:** cut / depth-parallax (the dark ground stays, the content layer lifts away faster than the canvas)
- **scroll_len:** 160vh
- **copy:** H: "The only instrument we make." / sub: "The Hale No. 6 field microscope. Machined in Sheffield since 1974. Six revisions in fifty-two years, and no model years." / lockup: wordmark `HALE` + `No. 6`, dimension rule beneath reading `312 mm`.
- **media:**
  - type: 3D model + HDRI + tiling PBR material (live WebGL)
  - route: **SOURCE** — `source.mjs model "vintage microscope brass" --res 1k`, `source.mjs hdri "studio small" --res 1k`, `source.mjs texture "wood table worn" --res 1k`. All CC0, Poly Haven.
  - frame prompt: n/a — nothing is generated. The equivalent direction, given to the renderer instead of an image model: *brass field microscope on a worn wood bench, low-angle close shot, one hard narrow key from upper camera-left, deep falloff to near-black, warm brass the only chroma in frame, no fill.*
  - motion prompt: n/a — the camera path is code, scrubbed by scroll.
  - score: none
- **fallback:** `assets/poster/hero.webp` — a real render of this exact camera, shipped as an image. Headline and copy are in the HTML and visible with no JS at all; the poster is the `<img>` behind them.

### Scene 2 — Six revisions, fifty-two years   | beat: rising | intensity: 4
- **purpose:** feel: patience, and a company that is not in a hurry / learn: the object has changed six times in fifty-two years, and once the change was nothing.
- **subject:** typography and a ruled rail — no imagery. Deliberately the quietest scene on the page.
- **layout_family / motion_family:** marginal-notes / entrance-reveal
- **camera:** n/a (type-led). Composition equivalent: a hairline rail down the left at the 2/12 column, revision years hanging on it in the margin, prose set at 66ch to its right.
- **lighting:** paper-flat — this scene has no light source, it has ink.
- **motion:** entrance-reveal — each revision row rises 10px and unblurs on IntersectionObserver, staggered 60ms; the rail's rule draws its own height once, top to bottom.
- **transition_in / out:** cut / letterbox (the section's last 20vh clamps to a narrow band before the peak opens full-bleed)
- **scroll_len:** 220vh
- **copy:** H: "Six revisions. Fifty-two years."
  - `1974 · No. 1` — "First run, forty units. Cast base, drawn brass tube."
  - `1981 · No. 2` — "Rack-and-pinion coarse focus replaced the sliding tube."
  - `1989 · No. 3` — "Condenser added. The mirror stayed, because the mirror was right."
  - `1997 · No. 4` — "Objective revolver machined from one billet instead of three."
  - `2008 · No. 5` — "Fine-focus thread re-cut to 0.2 mm per turn."
  - `2019 · No. 6` — "Nothing. We re-cut the base casting and stopped."
- **media:** type: none (type-led) · route: n/a · frame prompt: n/a · score: none
- **fallback:** identical — the scene is HTML and CSS. Without JS the rows are simply already visible.

### Scene 3 — Take it apart   | beat: PEAK | intensity: 9
- **purpose:** feel: held attention — the thing opens itself and you cannot look away / learn: it is eight parts, every one of them named, every one of them replaceable.
- **subject:** the real mesh, exploded. Its eight glTF nodes: `eye_piece`, `revolver`, `rack_mount_support`, `adjustment`, `condenser`, `mirror_arm`, `mirror_base`, `base`.
- **layout_family / motion_family:** pinned-canvas / scroll-scrub
- **camera:** orbital, starting three-quarter front and travelling ~130° while dollying from 1.0 to 0.62 of the hero distance. Ends closer and lower than it started.
- **lighting:** hard contrast, the same key as scene 1 and **fixed in the room**. As the camera orbits, the specular travels across the brass instead of following the lens — that is how the viewer knows the room is real and the object is not on a turntable. *(Built with one addition the storyboard did not plan: a camera-mounted eye-light at roughly a tenth of the key. Past 90° of orbit the fixed key is behind the object and the near side goes to pure black — correct, and unwatchable.)*
- **motion:** scroll-scrub. One progress value 0→1 drives three things at different rates: orbit angle (linear), separation of the eight parts along their own axes (0→1 over 15–70%, then eased back to 0.18 by 100% — it re-closes but not all the way, so the page keeps a memory of the opening), and eight drafting callouts that fade in one at a time as their part clears the body.
- **transition_in / out:** letterbox in (the stage opens from a 30vh band to full bleed) / curtain out (the ivory sheet of scene 4 slides up over the still-pinned stage)
- **scroll_len:** 420vh, inner stage pinned via `position: sticky`
- **copy:** H: "Eight parts. Every one of them stocked." / sub: "The oldest instrument we have refitted was built in 1976. It needed a condenser and two screws." / live readouts in the frame margin: current part designation, orbit angle in degrees, separation as a percentage.
- **media:**
  - type: 3D model + HDRI (the same live WebGL scene as scene 1 — one context for the whole page)
  - route: **SOURCE**, as scene 1. The peak is a sourced mesh under real IBL, which is exactly the case where sourcing beats generation: no image model produces geometry you can take apart, and a generated "sky picture" is not an IBL.
  - frame prompt: n/a. Direction to the renderer: *orbital three-quarter travelling shot, hard key rotating with the camera, parts separating along their assembly axis, near-black ground, brass the only chroma.*
  - motion prompt: n/a — scroll is the timeline.
  - score: none
- **fallback:** `assets/poster/exploded.webp` — a real render of the exploded state at ~70% progress, with the eight callouts drawn as static HTML over it (they are HTML in the live scene too, so they cost nothing extra). The list of eight part names is in the DOM either way, so the *information* of the peak survives with no WebGL, no JS and no motion.

### Scene 4 — Specification   | beat: proof | intensity: 3
- **purpose:** feel: relief — someone finally wrote the numbers down / learn: exactly what it is, in units.
- **subject:** a printed specification sheet. The page changes world here: flat ivory, ink, hairlines. This is the moodboard's second world and the biggest structural surprise on the page.
- **layout_family / motion_family:** editorial-columns / entrance-reveal
- **camera:** n/a — this is print, not a scene. It is deliberately flat: no depth, no shadow, no light direction.
- **lighting:** paper-flat.
- **motion:** entrance-reveal only, and less of it than scene 2: the rules draw, the figures do not animate. Numbers that count up would be a lie about what numbers are for.
- **transition_in / out:** curtain (slides up over the dark stage) / cut
- **scroll_len:** 180vh
- **copy:** H: "Specification" · sub-line: "Hale No. 6 · serial 0001–present"
  Height 312 mm · Mass 4.1 kg · Tube length 160 mm · Objectives ×4 ×10 ×40 · Coarse focus rack and pinion · Fine focus 0.2 mm per turn · Stage 120 × 120 mm, cast · Base grey iron, 2.6 kg of the total · Finish hand-lacquered brass, unplated · Illumination plane mirror, both faces · Guarantee for as long as this company exists, then for as long as the parts do.
- **media:** type: element/texture (a paper grain) · route: **built in code** — one SVG `feTurbulence` rendered once as a static tile, per `ambient-backgrounds.md`. Sourcing a paper photo was considered and rejected: Poly Haven's texture library is 3D-surface material, it has no paper, and a CC-BY Openverse scan would put an attribution line on a page whose whole argument is that nothing here is borrowed uncredited.
  - frame prompt: n/a · score: none
- **fallback:** identical. It is a table of numbers on paper; it has nothing to lose.

### Scene 5 — Who has one   | beat: proof | intensity: 5
- **purpose:** feel: the object exists in other people's lives, and has for a long time / learn: who actually buys this and what they did with it.
- **subject:** three short accounts, each with a year, a place and a serial number. Prose, in the reading serif, over the dark ground — the page returns to the dark world.
- **layout_family / motion_family:** split-asymmetric (5/7) / parallax-depth
- **camera:** n/a. Composition: the serial/year rail sits in the narrow left column, the account in the wide right column, and the two columns scroll at slightly different rates.
- **lighting:** hard contrast, borrowed — the exploded frame sits behind at 14% and heavily blurred, so the room is still there without being looked at.
- **motion:** parallax-depth — the left rail travels at 0.88× the page rate, the right column at 1.0×; total offset is capped at 42px so it reads as depth, not as a broken layout.
- **transition_in / out:** cut / depth-parallax
- **scroll_len:** 200vh
- **copy:** H: "One thousand two hundred people own one."
  - `1979 · no. 0114 · Aberdeen` — "Bought by a school. Used by roughly nine thousand children. Returned to us in 2011 for a new mirror and nothing else."
  - `1994 · no. 0642 · Kyoto` — "Bought by a lichenologist who has photographed through it every week for thirty-one years. She has never sent it back."
  - `2021 · no. 1188 · Bergen` — "Bought for a fourteen-year-old. It is the newest one on this page and it will outlive everyone reading it."
- **media:** type: element/texture · route: **built in code from our own render** — `assets/poster/exploded.webp` at 14% opacity, blurred 14px, as the section background. *(Planned as the live canvas at low opacity; changed during assembly because keeping the WebGL loop running for an out-of-focus backdrop costs GPU for atmosphere alone, and a blurred still of the same frame is indistinguishable and works with no WebGL at all.)* · frame prompt: n/a · score: none
- **fallback:** the canvas layer is absent; the section is prose on the flat dark ground. Nothing is lost but atmosphere.

### Scene 6 — One a week   | beat: door | intensity: 4
- **purpose:** feel: the calm of a decision that does not need to be made today / learn: what it costs, how long the wait is, what happens next.
- **subject:** centred type, one rule, one button. Nothing else.
- **layout_family / motion_family:** centred-type / entrance-reveal
- **camera:** n/a.
- **lighting:** the dark ground, with the key light gone — the last frame of the film is the room after the lamp is switched off.
- **motion:** entrance-reveal, single, slow (520ms, ease-out): the price and the rule arrive together, the button 120ms behind them.
- **transition_in / out:** cut / —
- **scroll_len:** 120vh
- **copy:** H: "£2,400. One a week." / sub: "We finish one instrument every week and the list is about nine months long. When your serial number is cut you will be told which week it happened in." / button: "Join the list" / footer: credits, licences, and the line that this is a fictional company built to demonstrate a skill.
- **media:** type: none · route: n/a · frame prompt: n/a · score: none
- **fallback:** identical.

## Gate 0 checklist
- [x] exactly one scene with intensity ≥8 — scene 3 at 9; next highest is 6
- [x] no two adjacent scenes share layout family or motion family — checked against the Arc table
- [x] ≤3 distinct motion families across the whole page — scroll-scrub, entrance-reveal, parallax-depth
- [x] every scene has real copy and a fallback
- [x] every `media:` block is filled: type, route, and a literal direction. Four of six scenes carry no media by design — this film is shot with one object and a typeface, and the `frame prompt` lines say so explicitly rather than being left blank.
- [x] storyboard self-reviewed against the one feeling (autonomous run, no user present)


---

## What the build changed about this storyboard

Recorded rather than quietly edited, because a storyboard that gets retro-fitted to the build stops
being a record of a decision.

- **`scroll_len:` is literal only for scene 3** (420vh desktop / 300vh at ≤820px). Scenes 2, 4, 5 and
  6 were built at content height plus `vh` padding instead of a fixed height, because forcing them to
  the planned numbers would have meant inventing dead scroll. The page came out **8.7× viewport at
  1440** against a planned ~13×. The pacing is tighter than the plan and better for it; the numbers
  above are the intent, not the measurement.
- **Scene 3's light rig gained a second source** (see the scene sheet). One fixed key is the honest
  rig and it is unwatchable past 90° of orbit.
- **Scene 5's backdrop became a blurred still** instead of the live canvas (see the scene sheet).
- **Scene 3's peak copy fades out** between progress 0.04 and 0.13. Not planned; added after the
  screenshots showed the title card lying across the separating parts.
- Nothing else moved. The arc, the six scenes, the beats, the intensities, the layout and motion
  families and every line of copy are as written before any code existed.
