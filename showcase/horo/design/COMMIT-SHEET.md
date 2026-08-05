# COMMIT-SHEET — HORO LIMITED

> Seven decisions before the first line of code. A generic answer ("modern, clean") means the decision hasn't been made — stop and make it. Filled example answers below each field: ✗ is what slop looks like, ✓ is the bar.

## 1. Peak / Signature
<!-- direct: the ONE wow moment. build: the one element a visitor describes to a friend. -->
The hero carries a full watch dial drawn entirely in CSS — case, minute track, hour markers, three hands — and it **keeps real time**: the second hand sweeps continuously (mechanical sweep, not quartz tick) via rAF, hour and minute hands track the visitor's clock. The product is present, working, on a page with zero image files. Everything else on the page is deliberately quieter than this object.
> ✗ "beautiful animations throughout"
> ✓ "peak = scene 4: the espresso machine disassembles into 9 floating parts as you scroll (canvas sequence, 300vh pinned)"

## 2. Color
<!-- primary as OKLCH + tier (restrained / committed / full-palette / drenched) + why it's not lavender, not cream, not the category reflex
     + the BACKGROUND LIGHTNESS as a number: target mean L, and one line on why the page lives at that level.
     "Dark because it's premium" is not a reason — it is the single most common place this skill drifts. -->
Primary: `oklch(0.34 0.065 158)` — racing-green dial enamel, the color of the watch's own face. Tier: **committed** (~35–40% of surface: the batch section and the footer are full-bleed green fields, the dial is green on a light ground). Not lavender, not purple-blue anything; not the warm-cream band (the body is `oklch(0.965 0.005 150)`, a cool off-white at chroma 0.005 *toward the green*, outside the banned beige band of hue 40–100); not the luxury reflex of black + gold. One secondary note only: heat-blued steel `oklch(0.52 0.09 255)` on the second hand and focus states, the horological bluing tradition, used at <2% of surface.
**Background lightness: target mean L ≈ 0.72** — a lit page. The scene: a watch being examined at a bench under daylight, loupe in hand, by someone who has read about it for a year. Drama comes from the two deep-green fields and real shadow, not from a dark room.
> ✗ "purple gradient, feels techy" · "dark theme, feels premium"
> ✓ "oklch(0.58 0.19 35) burnt terracotta, tier: committed (~40% of surface). Not the AI lavender; not wellness-beige — terracotta is pulled from the product's clay housing. Background L ≈ 0.55: the machine is photographed in a daylit workshop, and a black page would make the clay read as ceramic-shop-at-night"

## 3. Type
<!-- display + text pair on a contrast axis + why not Inter -->
Display: old-style serif system stack — `'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif`. Text: the neutral system sans — `system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. Axis: high-character serif × anonymous grotesque. The serif also sets the spec table, the serial numbers and the dial lettering, so data never switches voice. Inter rejected: it is the 2024–26 AI default (banned tell #8), and under the offline constraint the pairing must come from system stacks — the serif carries the voice, the sans agrees to disappear.
> ✗ "Inter for everything, it's readable"
> ✓ "display: Fraunces (soft wide serif, brand's warmth) / text: Söhne-class grotesque via 'Archivo'. Axis: high-contrast serif × neutral grotesque. Inter rejected as the 2024–26 default"

## 4. Grid break
<!-- the ONE concrete thing that breaks the symmetric grid -->
Two committed breaks: (a) the hero is a 5/7 asymmetric split, and the dial in the 7-column **overruns the hero's lower hairline rule by ~90px into the spec section** (negative margin, dial stacked above the rule with its own shadow); (b) section one runs a 5/7 split where the prose column carries a marginal note that hangs outside the container's left edge at wide viewports. No 6/6 splits anywhere on the page.
> ✗ "asymmetric layout"
> ✓ "product photo in S2 crosses into S3 over the section boundary (−120px overlap), text wraps around it via shape-outside"

## 5. Motion budget
<!-- ≤3 scroll-pattern families, named -->
(1) **Ambient, not scroll-triggered:** the dial hands — continuous second-hand sweep (rAF, transform only). (2) **Copy reveal:** section text rises 16px and fades in, ease-out-quart, once per element, IntersectionObserver. (3) **Rule draw:** hairlines scale X 0→1 with transform-origin left. The batch sequence staggers inside family 2 at 50ms per step. Nothing else scroll-triggered; no scroll listeners; no parallax. Hover is color-only at 140ms. UI transitions stay ≤160ms; the 600ms reveals are marketing-sequence pacing (allowed longer per motion.md, noted here in writing).
> ✓ "(1) scrub-pinned hero, (2) per-word text reveals on headings, (3) depth parallax in proof section. Nothing else scroll-triggered"

## 6. Reflex check
<!-- (a) what a generic AI does for this category; (b) what a generic AI avoiding (a) does; (c) our argued deviation from both.
     If recon ran, (a) is evidence, not a guess — cite what design/refs/REFERENCES.md showed repeatedly. -->
a) Luxury watch reflex: black + gold + hairline serif, macro photography dissolving into dark bokeh, "Swiss heritage since 18xx" copy, a hero-metric row of specs. (Recon skipped by constraint; taste.md's luxury row states the same.)
b) Second-order: the "quiet luxury" white void — ultra-minimal off-white page, tiny centered sans type, one faded product photo, beige warmth. Also saturated.
c) Our deviation: a **lit, cool page drenched twice in the product's own dial green**, where the product is not a photograph but a working instrument drawn in code and keeping the visitor's actual time; the batch story is told as a numbered procedure (order → assembly → regulation → delivery), and the spec is a real table set in the serif, like a watchmaker's timing sheet. The brand is a workshop with a register, not a boutique with a mood.
> ✓ "a) coffee = warm beige + serif + steam photo; b) 'specialty' = black + neon + brutalist menu; c) ours = terracotta drench + technical cutaway drawings of the machine (the brand is engineering-led, not café-cozy)"

## 7. House tells broken
<!-- The two (minimum) items from taste.md §2.5 you are deliberately NOT doing this time, and what replaces each.
     (a) and (b) above are reflexes of the CATEGORY; these are the reflexes of this SKILL, which recur across
     projects that have nothing to do with each other. Naming them is the only thing that stops them. -->
1. **Near-black by default (tell 1) →** the page is lit, mean L ≈ 0.72 with a cool off-white body; darkness appears only as the two committed green fields and real directional shadow on the dial.
2. **Mono service type (tell 2) →** no monospace anywhere; specs, calibres, serials and the 01–04 batch steps are all set in the old-style serif with tabular lining figures, so the "technical" voice stays in the display family.
3. **Scroll-instruction footer (tell 4) →** no "scroll" affordance and no 01/05 counter; the footer is a real place: sitemap, contact address, register note, legal line.
4. **Wordmark-as-hero (tell 6) →** the hero's subject is an object with meaning (the live dial), not the brand name set enormous; the headline is a sentence about the buyer, capped well under wordmark scale.
> ✓ "1. near-black background → daylit L 0.55 paper, the shadows do the drama instead; 2. mono service labels in the corners → no chrome at all, the only type on screen is the headline and one caption"
