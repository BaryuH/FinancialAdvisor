import { RouterProvider } from "react-router";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { ThemeProvider } from "./lib/theme";
import { LocaleProvider } from "./lib/locale";
import { AuthProvider } from "./lib/auth-context";

export default function App() {
  return (
    <ThemeProvider>
      <LocaleProvider>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </LocaleProvider>
      <Toaster />
    </ThemeProvider>
  );
}