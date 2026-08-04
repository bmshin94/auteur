# DESIGN — HALE No. 6

> The style contract. Read it fully before touching `index.html` or `assets/hale.js`. New work that
> contradicts this file is wrong even if it looks good on its own. Update it deliberately when the
> system changes; never let it drift.

## Identity
- **The one feeling:** **held attention** — the specific quiet of leaning in. Not awe, not luxury.
  Every decision on this page is measured against "does this slow the reader's hand on the wheel".
- **Signature / peak:** scene 3. The real glTF instrument separates into its **eight named
  components** while the camera orbits 118°, each part naming itself on a drafting leader line, then
  closes back to 18% open. Nothing else on the page is allowed to compete with it — scene 4 exists
  partly to de-escalate, which is why it is flat printed paper with no motion at all.
- **Register:** direct.

## Tokens (verbatim from the shipped CSS)
```css
:root{
  --ink-0:#0c0a06;      /* oklch(.145 .010 78)  ground                          */
  --ink-1:#15120d;      /* oklch(.185 .011 78)  raised                          */
  --rule:#37322b;       /* oklch(.320 .014 78)  hairline, 1.56:1 — never text   */
  --text:#e1ddd8;       /* oklch(.900 .008 78)  14.7:1                          */
  --dim:#9d978f;        /* oklch(.680 .014 78)   6.9:1                          */
  --dim-2:#857f77;      /* oklch(.600 .014 78)   5.0:1                          */
  --brass:#cc9b49;      /* oklch(.720 .115 78)   7.9:1                          */
  --brass-lo:#8e6a2e;   /* oklch(.550 .090 78)   4.0:1 — large/decoration only  */

  --paper:#e6eaee;      /* oklch(.935 .007 248) cool bond, deliberately not cream */
  --paper-ink:#161b20;  /* 14.3:1 on paper                                      */
  --paper-dim:#50565c;  /*  6.1:1 on paper                                      */
  --paper-rule:#9a9fa4; /*  2.2:1 — hairline only                               */

  --mono:"Martian Mono","Courier New",monospace;
  --serif:"Newsreader",Georgia,"Times New Roman",serif;

  --rail-x:clamp(38px,12vw,224px);
  --gutter:clamp(18px,4vw,56px);
  --ease:cubic-bezier(.22,.61,.36,1);
}
```
There is no radius token, no shadow token and no spacing scale, because the page uses none: nothing
is rounded, nothing floats, and vertical rhythm is set per scene from `vh` so the pacing is a
function of the viewport rather than of a scale. **Do not add a radius or a box-shadow.** The z-scale
is explicit and small: canvas 0 · vignette 1 · sections 2 · rail and instrument frame 3 · marker and
callouts 4 · grain 5 · chrome and foot bar 6.

## Typography
- **Display / labels: `Martian Mono`** (variable, `wdth 75–112.5`, `wght 100–800`; self-hosted latin
  subset, 38KB). Used for: the wordmark (700, `clamp(40px,6.2vw,88px)`, `letter-spacing:-.04em`), all
  `h1`/`h2` (400, `clamp(21px,2.35vw,34px)`, `-.035em`), the price (700, `clamp(34px,5vw,64px)`,
  `-.045em`), every spec figure, every year, every serial, and the single `.lbl` class.
- **Text: `Newsreader`** (variable, `opsz 6–72`, `wght 200–800`; 129KB). Body 17px/1.55, measure
  capped at `62ch` (`.body`) and `56ch` (`.rev p`) / `52ch` (`.owner p`). **The italic face is
  deliberately not shipped** — it was 143KB for zero occurrences. If a future edit genuinely needs
  italic, download `Newsreader-Italic.woff2` and add the `@font-face`; do not let the browser
  synthesise an oblique.
- **Numerals:** mono, `font-variant-numeric: tabular-nums` on the spec column and the callout indices.
- **Pairing axis: monospace × transitional serif** — the two kinds of lettering that appear on a real
  instrument, the engraved panel and the printed manual. The inversion is the point: headlines are
  the panel, prose is the manual.
- **Rule: headlines stay at or under six words.** Monospace at display size reads as machined when
  the line is short and as amateur when it is long. The one headline at seven ("One thousand two
  hundred people own one.") is at the limit and is the reason the limit is written down. A longer
  line moves to Newsreader; it does not wrap in mono.
- No third family. Ever.

## Color rules
- **Commitment tier: committed**, expressed as a single hue (78, lacquered brass) across the whole
  lightness scale rather than as a coloured surface. The ground is that hue at L 0.145 and reads
  black; the accent is that hue at L 0.72 and reads as lit metal. Brass covers well under 10% of the
  pixels and carries 100% of the chroma in the dark world.
- **Roles:** `--brass` = the object, and by extension anything that is a real measurement (312 mm,
  the years, the serials, the active callout, the CTA). It is never decoration and never a surface
  fill except on the one button. `--brass-lo` is rules and ticks only — it is 4.03:1 and must not
  carry body text. `--rule` at 1.56:1 is a hairline and must never be text.
- **The second world:** `--paper` is a *cool* off-white (hue 248). It appears in exactly one section
  and does not blend with the dark world — the boundary is a hard cut, no gradient, no fade. Do not
  introduce a third world.
- **Forbidden in this project:** any gradient other than the two that exist (the bottom vignette and
  the phantom-line rail pattern, both pure greys/neutrals of the ground colour); any warm light
  surface at all; metallic fills, foil effects or gold text treatments; a second accent hue; a border
  radius; a drop shadow on any DOM element. Shadows exist only in the 3D scene, cast by a real light.

## Motion vocabulary
Three families, and the budget is closed.

1. **scroll-scrub** — the single WebGL stage, and only there. Progress comes from
   `getBoundingClientRect()` read inside the renderer's own rAF loop. There is exactly one rAF loop
   on the page and there is no scroll listener. Scene 1: camera lifts 4°→10° and pulls 2.06→2.36
   over 160vh. Scene 3: azimuth −26°→+92° on `easeInOut`, explode 0→1 on `easeOut` between p 0.14 and
   0.68 then eased back to 0.18 by p 1.0, camera breathing out as the object opens so the parts stay
   framed.
2. **entrance-reveal** — IntersectionObserver, `rootMargin: '0px 0px -12% 0px'`, threshold 0.08,
   unobserved after firing. Bound per content type, never one global fade: revision rows and owner
   rows rise 10px and unblur 3px over 460ms `--ease` with a 60ms stagger capped at 360ms; spec rows
   fade only, 380ms; the door's price and rule arrive together over 520ms with the button 120ms
   behind. All of it lives inside `@media (prefers-reduced-motion: no-preference)`, so the default
   state in the markup is visible.
3. **parallax-depth** — scene 5 only, ≥900px only, `.who` column at ~0.88× page rate, total offset
   clamped to ±42px, written to `transform: translate3d()` only when the rounded value changes.
   Below 900px the two columns stack and the parallax is switched off entirely, because offsetting
   one stacked column just prints it on top of the other.

Hover/press: the CTA swaps `background-color` and `color` over 140ms `--ease` and nothing else.
Focus: `outline: 2px solid var(--brass); outline-offset: 3px` via `:focus-visible`, page-wide.
`transition: all` is banned; only `transform`, `opacity`, `filter`, `background-color`, `color` and
`outline` are ever animated.

**A new section reuses one of these three or consciously replaces one. Never add a fourth.**

## Layout patterns
- **Grid:** every scene is `grid-template-columns: var(--rail-x) minmax(0,1fr)` with the content in
  column 2 at `padding-left: clamp(16px,2.2vw,32px)`. The colophon shares the same rule. Column 1 is
  empty on purpose — it is the rail's margin.
- **The named grid-break: the drafting rail.** A 1px hairline at `--rail-x`, fixed, full height, that
  changes line type per scene the way a mechanical drawing does — solid where the object is present,
  long-dash-double-dot (`.is-phantom`) in scene 2 where the subject is elsewhere, gone entirely on
  the paper sheet. It is load-bearing in four scenes: the dimension line runs perpendicular from it
  under the hero lockup, the instrument frame uses it as its left edge, the serials hang off it, and
  the colophon columns start at it. Content crosses it; it never becomes a divider.
- **Section-opening patterns in play** (rotate among these, do not invent an eyebrow):
  1. wordmark lockup + dimension line + h1 (scene 1 only, once);
  2. bare h2 on the rail, no label (scenes 2, 5);
  3. h2 with a right-aligned `.lbl` on the same baseline (scene 4);
  4. centred display figure with no heading at all (scene 6).
- **Component patterns that exist — reuse before inventing:** the ruled row (`.rev`, `.owner` — a
  mono key column and a serif prose column separated by a hairline, no card, no background), the
  spec pair (`dt` serif / `dd` mono, right-aligned, hairline under), the dimension line (`.dim` —
  tick, bar, mono value, bar, tick), the `.lbl` micro-label, and the callout row. **There are no
  cards on this page and there must not be.** If something needs grouping, it gets a hairline.

## Copy voice
Plain, concrete, unhurried. Three adjectives: **specific, unhurried, slightly stubborn.** The voice
is a maker writing a manual, not a brand writing an ad. It states mechanisms and numbers, and it
admits when the answer is nothing.

Example headline that nails it: **"2019 · No. 6 — Nothing. We re-cut the base casting and stopped."**

Conventions: buttons say what happens ("Join the list", never "Learn more"). Numbers are written out
when they are meant to be felt ("One thousand two hundred people own one") and set in figures when
they are meant to be checked (the spec table). No adjective survives that the sentence works
without. The banned list in SKILL.md §16 stays banned, and this project adds: no exclamation marks,
no second person plural imperative ("discover", "explore"), and no sentence that could appear on a
different company's page.

## Project ban additions
- No `auteur-allow` suppressions are in force. slopscan is clean without any.
- Beyond SKILL.md's list, this project forbids: border-radius anywhere; `box-shadow` on any DOM
  element; a third typeface; a second accent hue; a warm light surface; any card component; counting
  or animating a number (the spec figures are measurements, and a measurement that counts up is a
  lie about what a measurement is); autoplaying audio of any kind.
- The eight part names are content, not decoration. Any layout that cannot fit them (as it happens,
  the ≤900px case) must relocate them, never drop them.

## Assets and licences
Everything on this page is either sourced CC0 or built in code. Nothing was AI-generated. The two
poster stills are real renders of the shipped three.js scene, produced by `design/tools/posters.mjs`
— regenerate them from the scene, never redraw them. The licence ledger is
`assets/sourced/ASSETS-SOURCED.md`; the raw Poly Haven masters were deleted after deriving the ship
assets and `source.mjs` re-fetches them in seconds if needed. Poly Haven requires no attribution, but
the footer credits the three authors anyway and that credit stays.

## Editing protocol
1. Read this file fully before touching anything.
2. New section → pick an existing section-opening pattern, an existing motion family, existing
   tokens, and an existing component pattern.
3. Anything touching the 3D scene: remember that fog near/far are derived from the camera distance
   inside `place()`. Hard-coding them is what caused three blank frames on a phone.
4. After any edit: `node scripts/slopscan.mjs docs/showcase/hale` from the repo root, then
   `node design/tools/serve.mjs 8127 .` and re-shoot the changed viewports. If the 3D scene changed
   at all, re-run `design/tools/posters.mjs` so the static cut still matches the live one.
5. If the edit genuinely needs a new pattern — update THIS file first. That is a design decision,
   not a patch.
