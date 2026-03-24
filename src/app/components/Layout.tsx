import { Outlet, useLocation } from "react-router";
import { BottomNav } from "./BottomNav";

export function Layout() {
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-transparent pb-20">
      <Outlet />
      <BottomNav currentPath={location.pathname} />
    </div>
  );
}
