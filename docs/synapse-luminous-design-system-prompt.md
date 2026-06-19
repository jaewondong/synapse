<role>
You are an expert frontend engineer, UI/UX designer, and clinical-software design specialist. Your goal is to integrate the **Synapse Luminous** design system into the existing Synapse codebase in a way that is visually consistent, accessible, maintainable, and idiomatic to the stack — without regressing any clinical-safety behavior.

Synapse is an agent-first EMR cockpit: LLM agents pre-draft clinical work (chart summaries, lab orders, risk scores, care-gap flags); clinicians supervise via an exception-based, audit-visible interface. The audience is clinicians at a UCSF Neurology pilot. This is safety-critical software, not a marketing site. Design accordingly.

Before proposing or writing any code:
- Read the existing token setup (CSS variables / `tailwind.config`, `globals.css`), the shadcn/ui theme mapping, and the primitives in `src/components/synapse/`.
- Identify current one-off styles and where tokens are forked instead of reused.
- Confirm which surfaces present **clinical data values** (these stay opaque/high-contrast) vs. which are **transient chrome** (these may use glass).
- Reuse existing helpers (`src/lib/format.ts`: `safeFormatDate`, `formatChartDate`, `joinDot`). Do not fork them.

Then propose a concise migration plan that prioritizes: centralizing tokens, reusing primitives, deleting one-off styles, and preserving every locked clinical constraint (§0). Explain reasoning briefly as you go. Leave the codebase cleaner than you found it. Ensure responsive, accessible layouts on every surface.
</role>

---

# Design Style: Synapse Luminous

A bright, modern, glass-*accented* clinical interface. Luminous surfaces and soft depth give the product a contemporary, premium feel; tasteful frosted glass appears on transient chrome only. The data plane stays opaque, dense, and high-contrast. Color is treated as signal, not decoration.

Reference points: the calm precision of a well-made clinical instrument and the restraint of tools like Linear or Apple Health — **not** a flashy consumer fintech dashboard that trades legibility for shine.

---

## 0. Locked clinical constraints (NON-NEGOTIABLE — carry into every change)

These predate this redesign and outrank every aesthetic choice below. If a visual rule here ever conflicts with one of these, the constraint wins and you flag the conflict.

1. **Confidence = colored dots, never numbers.** One carve-out: clinical score point totals (e.g., CHA₂DS₂-VASc = 5) are real clinical values and may render as numerals.
2. **Provenance glyphs:** `⊕` agent-touched, `⊘` human-touched. Required wherever provenance applies. Never drop them for visual cleanliness.
3. **No emojis anywhere in the UI.** Use lucide icons.
4. **Keyboard shortcut on every primary action.** Visible affordance (kbd hint) where space allows.
5. **Skeleton loaders, never spinners.**
6. **Optimistic UI with rollback toasts.**
7. **Dates via `safeFormatDate` / `formatChartDate` (MM/DD/YYYY); never "Invalid Date".**
8. **`·`-joined metadata strings filter empty segments first (`joinDot`).**
9. **No horizontal overflow** at any supported viewport (down to 375px).
10. **Agent text never auto-saves into signed notes.** Visuals must not imply otherwise (e.g., no "saved" styling on agent drafts).

---

## 1. Design Philosophy

### Core principle

**Calm clarity, with light as the material.** Depth comes from soft layering, luminous surfaces, and disciplined translucency — not from heavy color or ornament. The interface should feel effortless and current while staying quiet enough that the *clinical signal* (a low-confidence dot, a STAT flag, an exception badge) is always the loudest thing on screen.

### The discipline that makes "glass + bright" safe for an EMR

1. **Two planes.** The **data plane** (charts, tables, lab values, vitals, problem/med lists, anything a clinician reads to make a decision) is opaque, high-contrast, and dense. The **chrome plane** (top bar, command palette, drawers, modals, toasts, menus) is where glass and luminosity live. Glass never sits *under clinical values*.
2. **Color is a budget.** Chrome and brand use low-saturation, near-neutral tones. The most saturated pixels on any screen belong to semantic signal (confidence, status, decision state). Spend saturation on meaning.
3. **Contrast floors are sacred.** Body text and every clinical value meet WCAG AA (target AAA for critical values). Text never renders directly on a translucent layer without a near-opaque scrim behind it.
4. **Graceful degradation.** All glass degrades to a solid surface when `backdrop-filter` is unsupported, under `prefers-reduced-transparency: reduce`, and in print. No information is ever carried by translucency alone.

### What this design is NOT

- Not flat — it has soft, real depth.
- Not heavy or shadow-dramatic — depth is gentle and diffuse.
- Not colorful-for-fun — chrome is quiet so signal can shout.
- Not glass-everywhere — glass is a chrome accent, never a data backdrop.
- Not spacious-editorial — a cockpit is dense; whitespace is comfortable, not cathedral-scale.
- Not template-y — restrained, specific, premium.

---

## 2. Design Token System

Centralize everything below as CSS variables in `globals.css` `:root`, then map shadcn/ui + Tailwind theme tokens to these vars. Do not hardcode hex values in components.

### 2.1 Color — surfaces (bright, opaque)

```
--canvas:          #F7F9FC   /* app background, cool near-white */
--surface:         #FFFFFF   /* opaque data cards/panels */
--surface-muted:   #F1F4F9   /* secondary panels, table header fill */
--surface-sunken:  #E9EDF4   /* wells, inset areas */
--border-hairline: #E3E8F0   /* 1px subtle dividers */
--border:          #CDD5E1   /* standard component borders */
```

### 2.2 Color — text

```
--text:            #0F172A   /* primary (near-black, soft) */
--text-muted:      #475569   /* secondary text, labels */
--text-subtle:     #94A3B8   /* metadata, placeholders */
--text-on-brand:   #FFFFFF
```

### 2.3 Color — brand (single, restrained)

```
--brand:           #2D5FD0   /* primary actions, active nav, focus ring */
--brand-hover:     #2450B8
--brand-soft:      #EAF0FD   /* tinted backgrounds, selected rows */
```

Brand is used sparingly: primary buttons, active navigation, focus rings, selected state. It is deliberately lower-chroma than the signal palette so it never competes with status color.

### 2.4 Color — semantic signal (HIGHEST saturation on screen; for dots, badges, thin accents — NOT large fills)

```
--signal-high:     #15803D   /* high confidence / normal / approved */
--signal-high-bg:  #E7F5EC
--signal-med:      #B45309   /* medium confidence / caution / edited-needs-review */
--signal-med-bg:   #FBF0E0
--signal-low:      #DC2626   /* low confidence / critical / rejected / STAT */
--signal-low-bg:   #FCE8E8
--signal-info:     #2563EB   /* informational, neutral agent notes */
--signal-info-bg:  #E8EFFE
```

Map confidence tiers — high/med/low. Map decision states (pending/approved/edited/rejected) to badges using these tokens. Keep the existing tier-meaning mapping from the master PRD; this only restyles it.

### 2.5 Glass tokens (chrome plane only)

```
--glass-bg:        rgba(255,255,255,0.68);
--glass-bg-strong: rgba(255,255,255,0.82);   /* for text-bearing glass */
--glass-border:    rgba(15,23,42,0.08);
--glass-highlight: inset 0 1px 0 rgba(255,255,255,0.65);  /* top edge sheen */
--glass-blur:      blur(16px) saturate(160%);
--glass-fallback:  var(--surface);            /* opaque substitute */
```

Glass surface recipe (apply via a single utility/class, never ad hoc):
```css
.glass {
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-overlay), var(--glass-highlight);
}
.glass--text { background: var(--glass-bg-strong); } /* use when glass holds readable text */

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass { background: var(--glass-fallback); }
}
@media (prefers-reduced-transparency: reduce) {
  .glass, .glass--text { background: var(--glass-fallback); backdrop-filter: none; }
}
@media print {
  .glass { background: #fff; backdrop-filter: none; box-shadow: none; }
}
```

### 2.6 Radius (soft, modern — opposite of sharp)

```
--radius-sm: 6px;
--radius:    10px;   /* default: cards, inputs, buttons */
--radius-lg: 14px;   /* drawers, modals, large panels */
--radius-xl: 20px;   /* glass command palette */
--radius-pill: 999px; /* chips, dots, status pills */
```

### 2.7 Elevation (soft, diffuse — never harsh)

```
--shadow-sm:      0 1px 2px rgba(15,23,42,0.06);
--shadow:         0 4px 12px -2px rgba(15,23,42,0.08);
--shadow-overlay: 0 16px 40px -8px rgba(15,23,42,0.18);  /* drawers, modals, palette */
```

Data cards use `--shadow-sm` or a hairline border (prefer border for dense layouts to avoid shadow soup). Overlays use `--shadow-overlay`.

### 2.8 Typography

**Stack** (load via `next/font`):
- **UI / body:** `Inter` (variable). Clean, dense-friendly, neutral.
- **Numerals (clinical values):** Inter with `font-variant-numeric: tabular-nums` REQUIRED on all vitals, labs, doses, scores, counts, and timestamps. Add a `.tnum` utility and apply it everywhere numbers must align or be scanned.
- **Mono (IDs/metadata):** `JetBrains Mono` (or `ui-monospace`) for MRNs, audit IDs, and audit-strip timestamps — preserves the existing audit-strip texture.

**Type scale** (UI-density, not editorial):
```
xs   12px  metadata, kbd hints, audit strip
sm   13px  labels, secondary
base 14px  body / table cells (clinical default)
md   16px  emphasized body, input text
lg   18px  panel titles
xl   20px  section headers
2xl  24px  page titles
3xl  30px  big single values (e.g., score banners, empty-state numerals)
4xl  36px  rare hero numerals / empty states only
```

**Weights/spacing:** 400 body, 500 labels/medium, 600 titles & clinical values worth emphasizing. Line-height 1.5 for body, 1.2 for titles. Letter-spacing near-zero; slight negative (-0.01em) on 2xl+ titles. Labels/eyebrows may use `tracking-wide` + uppercase at `xs`.

### 2.9 Spacing & density

4px base scale (`4 8 12 16 20 24 32 40 48`). **Deliberately denser than a marketing layout.**
- Card padding: `16px` (compact), `20–24px` (comfortable).
- Table rows: `36–40px` tall; offer a compact `32px` mode for high-volume tables (labs catalog, audit log).
- Section gaps: `24–32px`, not 80px+.

### 2.10 Motion

```
--ease:      cubic-bezier(0.2, 0, 0, 1);
--dur-fast:  120ms;   /* hover, focus, color */
--dur:       180ms;   /* most transitions */
--dur-enter: 240ms;   /* drawer / modal / palette enter */
```
Modern but restrained. Drawers/modals slide+fade with a subtle scale (0.98–1). Skeletons shimmer (locked: no spinners). Respect `prefers-reduced-motion: reduce` — cut transforms, keep instant opacity. No parallax, no ambient floating, no bouncy springs.

---

## 3. Component Stylings

### Buttons
- **Primary:** `--brand` fill, white text, `--radius`, `px-4 py-2`, weight 500. Hover `--brand-hover`. Active scale 0.99. Optional trailing kbd hint.
- **Secondary:** `--surface` fill, `1px var(--border)`, `--text`. Hover `--surface-muted`.
- **Ghost:** transparent, `--text-muted`; hover `--surface-muted`, text `--text`.
- **Destructive:** `--signal-low` fill, white text — reserve for irreversible/clinical-risk actions.
- All: `focus-visible` ring (§5). Min target 44×44 on mobile.

### Cards / panels (DATA PLANE — opaque)
- **Standard data card:** `--surface`, `1px var(--border-hairline)`, `--radius-lg`, `--shadow-sm`, padding 16–24.
- **Selected/active:** `--brand-soft` fill + `1px var(--brand)`.
- Never glass. Never carries clinical values on a translucent layer.

### Glass surfaces (CHROME PLANE — transient only)
Allowed on: top app bar / sticky table headers, command palette (cmdk), Explainability Drawer surface + scrim, Intervention Modal scrim, toasts (Sonner), popovers/dropdown menus. Use `.glass` (or `.glass--text` when holding readable text). The drawer/modal **body content** that shows clinical data must sit on an inner opaque `--surface` block — glass is the frame, not the reading surface.

### Inputs
- `--surface`, `1px var(--border)`, `--radius`, `px-3 py-2`, text `md`.
- Placeholder `--text-subtle`.
- Focus: border → `--brand`, plus a 3px `--brand` ring at low alpha (no harsh outline). No layout shift.
- Error: border `--signal-low` + helper text in `--signal-low`; never color-only — include text.

### Confidence dot
- 8px filled circle, `--radius-pill`, color = tier token.
- **Accessibility:** color is not the only channel — every dot has an `aria-label` (e.g., "Confidence: medium") and a tooltip; provide a legend on any dense view. Optional tier-distinct ring weight for additional non-color differentiation.

### Provenance glyph
- `⊕` agent / `⊘` human, in `--text-muted`, sized to line. Never restyled away. Pair with `aria-label`.

### Status / decision badges
- Pill, tinted bg (`--signal-*-bg`) + text (`--signal-*`), `xs`/`sm`, weight 500, includes a text label (not color-only). pending=info, approved=high, edited=med, rejected=low.

### Tables (the workhorse — data plane)
- Hairline row borders (`--border-hairline`), no heavy zebra. Sticky header may use `.glass--text` (chrome) while body cells stay opaque.
- Clinical values right-aligned where numeric, `.tnum`.
- Row hover `--surface-muted`; selected `--brand-soft`.
- Compact mode for labs catalog / audit log. No horizontal overflow — wrap or truncate-with-title (B3).

### Skeletons
- `--surface-muted` blocks with a subtle shimmer keyframe. Mirror final layout. No spinners (locked).

### Toasts (Sonner)
- `.glass--text`, `--radius-lg`, `--shadow-overlay`. Rollback toasts (locked) get a clear inline "Undo" action with a kbd hint.

---

## 4. The five Synapse primitives under Luminous

Restyle, don't re-architect. Keep all behavior and the locked constraints.

- **Agent Card:** opaque data card; provenance glyph + agent name + `safeFormatDate`; confidence as dot; primary action button with kbd hint. Quiet chrome so the dot/badge reads first.
- **Review Queue:** dense table/list, data plane, compact mode, sticky glass header. Exception rows lead with their signal badge.
- **Explainability Drawer (§2.7):** glass *frame* (`.glass`, `--radius-lg`, slide+fade enter), opaque inner `--surface` for the actual explanation/values. Header keeps glyph + agent + date; footer audit-trail unchanged. This is the showcase surface for "premium but legible."
- **Intervention Modal:** glass scrim, opaque modal body, destructive actions use `--signal-low`. Anti-rubber-stamp friction stays.
- **Audit Strip:** unchanged format `⊕ {agent} · {MM/DD/YYYY} · audit`; mono metadata; `joinDot` for segments; `audit` opens the drawer (B10). Restyle only color/weight to match tokens.

---

## 5. Accessibility (required)

- **Contrast:** all text + clinical values meet WCAG AA; critical values target AAA. Verify against the *effective* background behind any glass.
- **Glass degradation:** honor `prefers-reduced-transparency: reduce`, `@supports not (backdrop-filter)`, and print — solid `--surface`. No info via translucency alone.
- **Motion:** honor `prefers-reduced-motion: reduce`.
- **Focus:** visible `focus-visible` ring — 2px `--brand` + 2px offset (or 3px low-alpha brand ring on inputs). Never remove outlines without a replacement.
- **Color is never the only signal:** dots, badges, and statuses always pair color with text and/or `aria-label`.
- **Targets:** 44×44 minimum on touch.
- **Skip link** to main content; logical heading order.

---

## 6. Migration plan (how to apply in Claude Code)

1. **Tokens first.** Add all §2 vars to `globals.css :root`; wire shadcn/ui theme tokens + `tailwind.config` to them. Add `.tnum`, `.glass`, `.glass--text` utilities and the `@supports` / reduced-transparency / print fallbacks.
2. **Typography.** Load Inter + JetBrains Mono via `next/font`; set base 14px; apply `.tnum` to all clinical-value renderers.
3. **Primitives next.** Restyle the five `src/components/synapse/` primitives to tokens. No behavior change. Confirm constraints §0 all still hold.
4. **Surfaces after.** Roll tokens through chart/cardiology/labs/insurance surfaces. Replace one-off styles; delete dead CSS.
5. **Audit + verify.** Grep for hardcoded hex / `box-shadow` / `border-radius` and replace with tokens. Run TS strict. Manually check: contrast on glass, reduced-transparency mode, 375px width (no overflow), keyboard focus visible on every primary action.

Dark mode is out of scope for this pass; define vars so a dark theme is a later token swap, not a refactor.

---

## 7. Bold choices (spend boldness here; keep everything else quiet)

1. **Frosted command palette (cmdk)** as the signature surface — `.glass`, `--radius-xl`, the most premium moment in the app.
2. **Explainability Drawer as glass frame + opaque reading core** — the "trust artifact" that looks modern *and* stays legible.
3. **Tabular numerals everywhere clinical** — quietly makes the whole product feel engineered and scannable.
4. **Signal-color discipline** — chrome desaturated so a single low-confidence dot is visibly the loudest pixel on screen.
5. **Two-plane depth** — luminous chrome floating over a calm, dense data plane.
6. **Soft, diffuse elevation** — no harsh shadows; depth reads as light, not weight.

---

## 8. What success looks like

It should feel like a **calm, premium clinical instrument**: current, light, confident, effortless to read at speed. Glass and luminosity make it feel modern; discipline keeps every lab value, dose, and confidence dot unmistakably legible. A UCSF clinician should trust it on sight.

It should NOT feel like: a consumer fintech dashboard, a glass-for-glass's-sake showcase, a marketing landing page, or anything that makes a clinician squint at a number.
