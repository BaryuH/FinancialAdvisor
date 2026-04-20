import { useEffect, useLayoutEffect, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { BottomNav } from "./BottomNav";
import { AppHeader } from "./AppHeader";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
}

export function Layout() {
  const location = useLocation();
  const hideBottomNav = location.pathname === "/ai-advisor" || location.pathname === "/auth";
  const hideAppHeader = location.pathname === "/auth";
  const reducedMotion = usePrefersReducedMotion();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);

  const pageTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.14, ease: [0.22, 1, 0.36, 1] as const };

  return (
    <div
      className={`min-h-screen bg-transparent ${hideBottomNav ? "" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"}`}
    >
      {!hideAppHeader && <AppHeader />}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          key={location.pathname}
          initial={reducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -3 }}
          transition={pageTransition}
          className="min-h-0"
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
      {!hideBottomNav && <BottomNav currentPath={location.pathname} />}
    </div>
  );
}
