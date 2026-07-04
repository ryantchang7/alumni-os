'use client'

/**
 * Entrance-only route crossfade. Deliberately does NOT use AnimatePresence
 * or an `exit` animation — App Router route-level exit animations are
 * fragile (the old tree can unmount before the exit finishes, or double
 * mount during a fast nav), so this only animates the page coming IN.
 */
import { motion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {children}
    </motion.div>
  )
}
