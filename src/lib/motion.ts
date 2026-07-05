/**
 * Shared motion language — "settle." Nothing bounces, nothing springs,
 * except the one sanctioned exception on MomentCard reactions. Every
 * scroll-reveal in the app should import from here instead of hardcoding
 * its own easing curve, so a slow phone and a fast one see the same feel
 * everywhere, not fifteen slightly-different guesses at "smooth."
 *
 * Reduced motion is handled globally via <MotionConfig reducedMotion="user">
 * in the root layout — components using these exports don't need their own
 * prefers-reduced-motion checks.
 */
import type { Transition, Variants } from 'framer-motion'

/** easeOutQuint — the curve already used correctly in CourseHoleSection,
 *  generalized. Use for scroll reveals and page-load entrances. Never for
 *  interactive feedback (hover/press/tap) — those stay <=0.3s, see below.
 *  Kept snappy (0.4s) — a 0.6s reveal reads as sluggish on a phone. */
export const settle: Transition = { duration: 0.4, ease: [0.22, 1, 0.36, 1] }

/** Scroll-reveal viewport config — fires the moment the element's edge
 *  enters, not 40px in, so reveals feel responsive rather than lagging
 *  behind the scroll. Spread into a `viewport={...}` prop. */
export const revealViewport = { once: true, margin: '0px 0px -8% 0px' } as const

/** Fade up from 10px below, paired with `settle`. Use with
 *  `initial="hidden" whileInView="visible" viewport={revealViewport}`. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: settle },
}

/** Parent wrapper for a staggered reveal — pair with fadeUp on children.
 *  Cap staggered children at ~6-8 per viewport; don't stagger long grids. */
export const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

/** Interactive feedback ceiling — hover/press/tap transitions must never
 *  exceed this. Settle's 0.6s is reserved for scroll reveals only. */
export const quick: Transition = { duration: 0.3, ease: [0.22, 1, 0.36, 1] }
