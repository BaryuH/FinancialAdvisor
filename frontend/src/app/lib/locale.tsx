import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type Locale = "en" | "vi";

const STORAGE_KEY = "fainance:locale";

const MESSAGES: Record<Locale, Record<string, string>> = {
  en: {
    "app.name": "FAinance",
    "nav.overview": "Overview",
    "nav.reports": "Reports",
    "nav.transactions": "Transactions",
    "nav.budget": "Budget",
    "nav.goals": "Goals",
    "nav.calendar": "Calendar",
    "nav.smartInput": "Smart input",
    "nav.aiAdvisor": "AI advisor",
    "nav.auth": "Auth",
    "page.dashboard": "Dashboard",
    "page.transactions": "Transactions",
    "page.budget": "Budget",
    "page.goals": "Goals",
    "page.calendar": "Calendar",
    "page.smartInput": "Smart input",
    "page.aiAdvisor": "AI advisor",
    "page.reports": "Reports",
    "page.auth": "Auth",
    "bottom.overview": "Overview",
    "bottom.budget": "Budget",
    "bottom.reports": "Reports",
    "bottom.ai": "AI",
    "smartInput.subtitle":
      "Add transactions quickly with voice or by scanning a receipt.",
    "locale.en": "EN",
    "locale.vi": "VI",
  },
  vi: {
    "app.name": "FAinance",
    "nav.overview": "Tổng quan",
    "nav.reports": "Báo cáo",
    "nav.transactions": "Giao dịch",
    "nav.budget": "Ngân sách",
    "nav.goals": "Mục tiêu",
    "nav.calendar": "Lịch chi tiêu",
    "nav.smartInput": "Nhập liệu thông minh",
    "nav.aiAdvisor": "Trợ lý AI",
    "nav.auth": "Tài khoản",
    "page.dashboard": "Tổng quan",
    "page.transactions": "Giao dịch",
    "page.budget": "Ngân sách",
    "page.goals": "Mục tiêu",
    "page.calendar": "Lịch chi tiêu",
    "page.smartInput": "Nhập liệu thông minh",
    "page.aiAdvisor": "Trợ lý AI",
    "page.reports": "Báo cáo",
    "page.auth": "Tài khoản",
    "bottom.overview": "Tổng quan",
    "bottom.budget": "Ngân sách",
    "bottom.reports": "Báo cáo",
    "bottom.ai": "AI",
    "smartInput.subtitle":
      "Nhập giao dịch nhanh chóng bằng giọng nói hoặc quét hóa đơn",
    "locale.en": "EN",
    "locale.vi": "VI",
  },
};

function readStoredLocale(): Locale {
  try {
    const s = window.localStorage.getItem(STORAGE_KEY);
    if (s === "en" || s === "vi") return s;
  } catch {
    /* ignore */
  }
  return "vi";
}

export function pageTitleKeyForPath(pathname: string): string {
  if (pathname === "/" || pathname === "") return "page.dashboard";
  const seg = pathname.replace(/^\//, "").split("/")[0] ?? "";
  const map: Record<string, string> = {
    transactions: "page.transactions",
    budget: "page.budget",
    goals: "page.goals",
    calendar: "page.calendar",
    "smart-input": "page.smartInput",
    "ai-advisor": "page.aiAdvisor",
    reports: "page.reports",
    auth: "page.auth",
  };
  return map[seg] ?? "page.dashboard";
}

type LocaleContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi");

  useEffect(() => {
    setLocaleState(readStoredLocale());
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
    document.documentElement.setAttribute("lang", locale === "vi" ? "vi" : "en");
  }, [locale]);

  const setLocale = useCallback((l: Locale) => setLocaleState(l), []);

  const toggleLocale = useCallback(() => {
    setLocaleState((x) => (x === "en" ? "vi" : "en"));
  }, []);

  const t = useCallback(
    (key: string) => MESSAGES[locale][key] ?? MESSAGES.en[key] ?? key,
    [locale],
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return ctx;
}
