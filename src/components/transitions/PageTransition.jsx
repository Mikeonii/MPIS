import { motion } from 'framer-motion';

/**
 * Page transition wrapper using framer-motion.
 *
 * Provides a smooth fade + subtle upward slide animation
 * when navigating between pages. Designed to complement
 * the glass morphism design of the application.
 *
 * Usage:
 *   <PageTransition>
 *     <YourPage />
 *   </PageTransition>
 */

const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.995,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -8,
    scale: 0.995,
  },
};

const pageTransition = {
  type: 'tween',
  ease: [0.25, 0.46, 0.45, 0.94],
  duration: 0.3,
};

export default function PageTransition({ children, className }) {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className={className}
    >
      {children}
    </motion.div>
  );
}
