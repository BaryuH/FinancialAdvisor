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
    : { type: "spring", stiffness: 450, damping: 35, mass: 0.8 };

  return (
    <div
      className={`min-h-screen bg-transparent ${hideBottomNav ? "" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"}`}
    >
      {!hideAppHeader && <AppHeader />}
      <main className="relative overflow-hidden">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.12, ease: "linear" }}
          className="min-h-0"
        >
          <Outlet />
        </motion.div>
      </main>
      {!hideBottomNav && <BottomNav currentPath={location.pathname} />}
    </div>
  );
}
