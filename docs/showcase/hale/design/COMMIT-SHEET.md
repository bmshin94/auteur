# COMMIT-SHEET — HALE No. 6

## 1. Peak / Signature
Scene 3, 420vh pinned: the real glTF mesh separates into its **eight named components** while the
camera orbits 130° and dollies in, each part naming itself on a drafting leader line as it clears the
body, then closing back to 18% open so the page keeps a memory of having been inside it. Live
three.js, sourced CC0 mesh, lit by a sourced CC0 HDRI. The wow is not that it moves — it is that
it comes apart and every piece has a name.

## 2. Color
**`oklch(0.72 0.115 78)` — lacquered brass.** Tier: **committed**, expressed as a single-hue drench
across the whole lightness scale rather than as a coloured surface: the ground is
`oklch(0.145 0.010 78)` (reads black, measures warm), the body ink is `oklch(0.90 0.008 78)`, and the
accent is the brass itself. One hue, hue 78, from `#0f0d0a` to the specular on the tube.

Why not lavender: hue 78 is 200° away from the 250–290 AI band and the page contains no gradient at
all. Why not cream: the only light surface on the page is `oklch(0.935 0.007 248)` — a **cool** bond
paper with a faint blue cast, deliberately outside the warm 40–100 hue band, because real paper under
daylight is cool and because warm paper next to warm brass would collapse the two worlds into one.
Why not the category reflex: recon measured the reflex and it is near-black + white + one *neon*
accent (`rgb(237,56,51)`, `rgb(252,215,87)`, `rgb(201,254,110)` across three of the seven scouted
sites). Ours is not an accent laid onto the design — it is the colour of the object, sampled from the
lit render, which is `taste.md`'s live escape for product pages: *colour pulled from the product
itself*. And it is not black-and-gold luxury: there is no ornament, no thin serif, and the brass only
ever appears as lit material or as ink, never as a metallic fill.

## 3. Type
**Display / labels: `Martian Mono`** (variable, wdth 75–112.5 · wght 100–800, run at wdth 112).
**Prose: `Newsreader`** (variable, opsz 6–72 · wght 200–800, with its real italic).
Axis: **monospace × transitional serif** — the two kinds of lettering that appear on a real
instrument, the engraved panel and the printed manual. The inversion is the argued part: mono is
usually the small label face and a serif the display; here the *headlines* are engraved panel
lettering and the *prose* is the manual. Headlines are kept to three to six words so the monospace
rhythm reads as machined rather than as an accident.

Why not Inter: recon is evidence, not opinion. The scouted top tier runs LayGrotesk, Thunder,
MonaSans, HelveticaProRoman, PPNeueMontrealMono — zero Inter, and zero serifs. The reflex is a
neutral grotesque; Inter is its free stand-in. Also rejected: Instrument Serif and Playfair (ban #18),
and Bodoni Moda, which was the first idea and was dropped because black + brass + a thin high-contrast
didone is the luxury reflex almost exactly.

Both faces are self-hosted (`assets/fonts/*.woff2`, latin subset, OFL) — no Google Fonts CDN, so the
page has no third-party origin at all.

## 4. Grid break
**The drafting rail.** A 1px hairline runs the full height of the page at the 2/12 column line — not
centred, never symmetric — and it changes dash pattern per scene the way a mechanical drawing changes
line type: solid where the object is present, long-dash-double-dot in scene 2 where the subject is
elsewhere, gone entirely on the paper sheet. Content crosses it instead of respecting it: in scene 1 a
dimension line runs perpendicular from it under the lockup and states 312 mm; in scene 3 it becomes
the left edge of the instrument frame around the stage; in scene 5 the serial numbers hang off it into
the margin while the prose sits in the wide column. One asymmetric axis, load-bearing in four scenes.

## 5. Motion budget
Three families, nothing else scroll-triggered:
1. **scroll-scrub** — the single WebGL stage: hero camera dolly (scene 1) and the peak orbit + explode
   (scene 3). Progress read from `getBoundingClientRect()` inside the renderer's own rAF loop; one
   loop owner, no scroll listener.
2. **entrance-reveal** — IntersectionObserver, bound per content type rather than one global fade:
   revision rows rise 10px and unblur, spec rules draw their own width, the door's price and rule
   arrive together with the button 120ms behind.
3. **parallax-depth** — scene 5 only, two columns at 0.88× and 1.0×, total offset capped at 42px.

## 6. Reflex check
**a) First-order (measured, not guessed — `design/refs/REFERENCES.md`, 2026-08-04):** near-black plus
white plus one high-chroma neon accent; a 118–144px neutral grotesque carrying the entire voice;
GSAP + ScrollTrigger + ScrollSmoother + Lenis (5 of 7 sites); a scroll-driven WebGL hero that rotates
the product (3 of 7); page 8.7–22.1× viewport tall. The moodboard supplied the other half of the
reflex for *this* brief specifically: the object floating on a black seamless with a soft studio
gradient behind it, six times out of twenty tiles.

**b) Second-order (an AI avoiding (a)):** cream editorial, a thin "quiet luxury" serif, enormous white
space, one slow fade — or the black-and-gold heritage lockup with a hairline border and a wax seal.
Both are saturated; the second is what "brass instrument, twenty-year object" pulls out of a model by
default.

**c) Ours:** stay dark, refuse the neon and refuse the gold. The single hue is the object's own
lacquered brass, sampled from the lit render. The voice is a **technical document**, not a fashion ad:
engraved monospace panel lettering, a reading serif for the prose, drafting hairlines whose dash
patterns mean something. The WebGL does not rotate the product to show it off — it **takes it apart
and names the eight pieces**, so the wow moment delivers information, which is the only kind of wow
this audience buys. And the page breaks its own world exactly once, from the dark room into flat cool
paper for the specification, which neither reflex does. No GSAP, no Lenis, no smooth-scroll hijack:
the audience for a twenty-year object should be able to use their own scroll wheel.

## Style gate — verdict and carried notes
**Approved with carried notes** (autonomous run, judged on the 1440 and 390 screenshots of
`design/mockup-hero.html` against this sheet).

1. **The mockup's hero has a placeholder block where the live render goes.** The type lockup, the
   dimension rule and the rail were judged on their own; the balance between the lockup and the actual
   lit object is unproven until scene 1 renders. → resolved at GATE 2 by shooting the real hero.
2. **`Martian Mono` at display size is a risk taken knowingly.** Monospace at 60px+ has visibly even
   sidebearings; it reads as machined when the line is short and as amateur when it is long. Mitigation
   in force: headlines capped at six words, `letter-spacing: -0.03em`, wdth axis at 112. → if a
   headline ever needs to run long, it moves to Newsreader rather than wrapping the mono.
3. **The brass hue must survive the tone mapper.** ACES filmic pulls saturated warm highlights toward
   white, so the brass in the render may not match `oklch(0.72 0.115 78)` in the CSS. → checked at
   GATE 2 by sampling the render; the CSS token is the authority and the light rig gets tuned to it,
   not the other way round.
