# Design System: Alumni OS — Penn Golf

## 1. Visual Theme & Atmosphere

A restrained, private-club interface. Dense enough to feel like a professional tool; airy enough to feel like a trusted colleague's desk. The atmosphere is quiet authority — like the reading room of a private golf club, lit warmly, with leather and wood and no noise.

**Density:** 5 — Balanced. Cards breathe. Tables are tight but not cramped.  
**Variance:** 6 — Offset asymmetric. Hero is split-screen, not centered. Sections alternate alignment.  
**Motion:** 7 — Fluid CSS with cinematic moments. Pipeline reveal is choreographed. Cards cascade in. Micro-loops on active states.

The product must feel trustworthy enough to show a Penn teammate — not a startup pitch deck, not a CRM, not a LinkedIn clone. It should feel like something built specifically for this team, by someone who cared about getting it right.

---

## 2. Color Palette & Roles

- **Deep Navy** (`#0a1628`) — Primary background surface for header, hero, sidebars, and pipeline
- **Navy Mid** (`#112240`) — Secondary navy for cards on navy backgrounds, table row hover
- **Navy Ink** (`#0d1f3c`) — Body text on light backgrounds, headings
- **Warm Canvas** (`#f8f5f0`) — Primary page background (light sections, content areas)
- **Warm White** (`#fffdf9`) — Card and container fill on canvas
- **Canvas Border** (`rgba(180, 168, 150, 0.35)`) — Card borders, 1px structural lines on canvas
- **Navy Border** (`rgba(255, 255, 255, 0.08)`) — Borders on navy backgrounds
- **Penn Red** (`#990000`) — Single accent: primary CTA buttons, key metric accents, active nav indicators, confidence-high badges
- **Penn Red Hover** (`#b30000`) — Hover state for Penn Red elements
- **Muted Parchment** (`#8a7f70`) — Secondary text, metadata, labels on canvas
- **Navy Ghost** (`rgba(248, 245, 240, 0.65)`) — Secondary text on navy backgrounds
- **Verified Green** (`#166534`) / (`#dcfce7`) bg — Verified status, high confidence, approved items
- **Review Amber** (`#92400e`) / (`#fef3c7`) bg — Needs review, medium confidence, warning states
- **Danger Rust** (`#991b1b`) / (`#fee2e2`) bg — Rejected, do not contact, error states
- **Penn Gold** (`#b8952a`) — Subtle accent for "team captain" markers, premium details only

**BANNED colors:**
- Pure black (`#000000`) — never
- Neon blues, AI purples, electric gradients — never
- Oversaturated greens or magentas — never

---

## 3. Typography Rules

- **Display / Headlines:** `Geist` — weight 600–700. Track tight (`letter-spacing: -0.03em` to `-0.04em`). Not screaming — hierarchy through weight differential and color contrast, not pure size escalation. Headlines in Deep Navy or Warm Canvas depending on background.
- **Body:** `Geist` — weight 400–500. Leading relaxed (`line-height: 1.65`). Max 68ch per line. Secondary text in Muted Parchment.
- **Mono / Metadata:** `Geist Mono` — for timestamps, source URLs, confidence scores, roster years, table IDs. Slightly smaller (`0.85em`). Muted color.
- **Hierarchy rule:** H1 → 2.5rem–4rem clamp. H2 → 1.5rem–2rem. H3 → 1.125rem–1.25rem. Body → 0.9375rem. Label → 0.75rem uppercase track-wider.
- **Label convention:** Small caps, `tracking-widest`, `text-xs`, `font-medium`. Used for section headers, table column labels, badge text. Example: `VERIFIED · CLASS OF 2014`

**BANNED:**
- `Inter` — generic, overused
- Generic serifs anywhere (`Times New Roman`, `Georgia`, `Garamond`)
- All-caps headlines (except label-scale text)
- Italic body text for decoration

---

## 4. Component Stylings

### Buttons
- **Primary:** Penn Red fill (`#990000`), white text, `font-semibold`, `rounded-md`, `px-5 py-2.5`. On hover: `#b30000`. Active: `-1px translateY` tactile press. No outer glow, no shadow.
- **Secondary:** Transparent with `border border-[#990000]` Penn red outline, Penn red text. Hover: light Penn red fill at 8% opacity.
- **Ghost (on navy):** White text, white border at 20% opacity. Hover: white fill at 10% opacity.
- **Destructive:** Danger Rust fill for reject/do-not-contact actions.
- No neon glows. No box-shadow color effects. No animated border gradients.

### Cards
- On canvas (`#f8f5f0`): white fill (`#fffdf9`), `border border-[rgba(180,168,150,0.35)]`, `rounded-lg`, subtle shadow (`0 1px 3px rgba(10,22,40,0.06), 0 4px 12px rgba(10,22,40,0.04)`).
- On navy (`#0a1628`): navy-mid fill (`#112240`), `border border-white/[0.08]`, `rounded-lg`, no shadow needed.
- Used ONLY where elevation communicates hierarchy — alumni cards, profile sections, pipeline stages, review items.
- For high-density tables: no card wrapper — use `border-t border-canvas-border` dividers instead.

### Tables
- Header row: light background (`#f0ece5`), `text-xs uppercase tracking-wider`, Muted Parchment.
- Row hover: `#f5f2ed` on canvas.
- Alternating rows: NOT used — clean separation via border-b only.
- Confidence/status badges inline in cells — small, right-aligned.

### Badges / Pills
- `rounded-full`, `px-2.5 py-0.5`, `text-xs font-medium`.
- Color-coded: use semantic pairs (background light tint + dark text). Never solid neon fill.
- Example: Verified = `bg-green-100 text-green-800`. Needs Review = `bg-amber-100 text-amber-800`. High Confidence = `bg-emerald-100 text-emerald-800`.
- Penn Red used only for primary/CTA badges, not status badges.

### Inputs / Forms
- Label above input. Helper text optional. Error text below in Danger Rust.
- Input: white fill, `border border-[rgba(180,168,150,0.5)]`, `rounded-md`, focus ring in Deep Navy (2px).
- No floating labels. No fancy animated borders.
- Prefilled values displayed in Navy Ink weight 500.

### Loaders / Skeletons
- Skeletal shimmer (`animate-pulse`) matching exact layout dimensions of the content it replaces.
- No circular spinners. No percentage progress bars for content loading.
- Exception: Progress bar for the pipeline run is intentional and shows real stage progress.

### Empty States
- Composed minimal layout: centered icon (monoline SVG, not emoji), brief label in Muted Parchment, optional CTA button.
- Example: Empty review queue → golf flag icon + "All items reviewed. The alumni graph is clean."

---

## 5. Layout Principles

- **Max content width:** `1320px` centered with `px-6` (mobile) → `px-8` (tablet) → `px-12` (desktop).
- **Hero:** Split-screen, left-aligned. Never centered. Text left, visual right. Asymmetric vertical rhythm.
- **Grid:** CSS Grid first. No flexbox percentage math. No `calc()` hacks.
- **Section spacing:** `clamp(3.5rem, 7vw, 6rem)` vertical gap between major sections.
- **Card grids:** 2-column asymmetric preferred. 3-column equal grids BANNED. Use horizontal-scroll rows for alumni card groups.
- **Pipeline diagram:** Horizontal flex with connecting arrows (`→`). On mobile: vertical stack.
- **Sidebar layouts:** Fixed sidebar (240px) + fluid main content on desktop. Collapsed below 768px.
- **No absolute-positioned stacking.** Every element has its own clean spatial zone. No overlap.

---

## 6. Motion & Interaction

### Engine
- Framer Motion for all animated components.
- Spring physics default: `stiffness: 120, damping: 22, mass: 0.8` — premium, weighty feel.
- No linear easing anywhere. Use `easeOut` for entries, `easeInOut` for state changes.

### Entry Animations
- Page sections: `opacity: 0 → 1`, `y: 20 → 0`, duration `0.45s`, `easeOut`.
- Staggered card lists: each card delays by `0.06s` from the previous.
- Pipeline stages: waterfall reveal — each stage appears 400ms after the previous completes.
- Agent finding feed: each item slides in from the right with `x: 24 → 0`.

### Perpetual Micro-Loops
- Active pipeline stage: soft pulsing dot (`scale: 1 → 1.3 → 1`, 1.5s infinite).
- "Running" status indicator: spinning ring in Penn Red.
- Completed stage checkmark: bouncing in with spring on mount.
- Stat cards: count-up animation from 0 on first mount.

### Hover States
- Cards: subtle `y: -2px` lift, shadow deepens slightly. Duration `0.18s easeOut`.
- Buttons: `scale: 1.01` on hover, `0.97` on press.
- Table rows: background tint transition `0.12s`.
- Nav links: underline slides in from left.

### BANNED Motion
- No scroll-trigger animations (keep it simple, Phase 1).
- No parallax.
- No animating `top`, `left`, `width`, `height` — transforms only.
- No `animate-spin` on content (only loading states).

---

## 7. Anti-Patterns (Banned)

- No emojis in any UI element (icons only via SVG or Lucide)
- No `Inter` font — use Geist exclusively
- No pure black (`#000000`) — use Navy Ink or Deep Navy
- No neon gradients, AI purple glows, electric blue borders
- No centered hero sections — left-aligned or split-screen only
- No 3-equal-column card grids — use asymmetric or horizontal scroll
- No generic placeholder names ("John Doe", "Acme Corp")
- No fabricated statistics or fake metric cards
- No "SYSTEM // 2024" label formatting
- No AI copywriting clichés ("Elevate", "Seamless", "Unleash", "Next-Gen", "Supercharge")
- No filler text ("Scroll to explore", bouncing chevrons, scroll arrows)
- No broken image links — use Lucide icons or SVG avatars, not Unsplash
- No overlapping elements — clean spatial separation always
- No floating labels on inputs
- No circular spinners for content loading
- No generic "lorem ipsum" — all copy must be purpose-written
- No scraping/AI language in user-facing text ("we scraped", "AI found you", "our database")
