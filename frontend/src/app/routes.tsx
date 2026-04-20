import { createBrowserRouter } from "react-router";
import { Dashboard } from "./pages/Dashboard";
import { Transactions } from "./pages/Transactions";
import { Budget } from "./pages/Budget";
import { Goals } from "./pages/Goals";
import { Calendar } from "./pages/Calendar";
import { SmartInput } from "./pages/SmartInput";
import { AIAdvisor } from "./pages/AIAdvisor";
import { Reports } from "./pages/Reports";
import { Auth } from "./pages/Auth";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GuestOnlyRoute } from "./components/GuestOnlyRoute";

export const router = createBrowserRouter([
  {
    path: "/auth",
    Component: GuestOnlyRoute,
    children: [
      {
        index: true,
        Component: Auth,
      },
    ],
  },
  {
    path: "/",
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: "transactions", Component: Transactions },
          { path: "budget", Component: Budget },
          { path: "goals", Component: Goals },
          { path: "calendar", Component: Calendar },
          { path: "smart-input", Component: SmartInput },
          { path: "ai-advisor", Component: AIAdvisor },
          { path: "reports", Component: Reports },
        ],
      },
    ],
  },
]);