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
    "nav.smartInput": "Smart Input",
    "nav.aiAdvisor": "AI Advisor",
    "nav.auth": "Account",
    "nav.logout": "Logout",
    
    "page.dashboard": "Overview",
    "page.transactions": "Transactions",
    "page.budget": "Budget",
    "page.goals": "Goals",
    "page.calendar": "Calendar",
    "page.smartInput": "Smart Input",
    "page.aiAdvisor": "AI Advisor",
    "page.reports": "Reports",
    "page.auth": "Account",
    
    "bottom.overview": "Overview",
    "bottom.budget": "Budget",
    "bottom.reports": "Reports",
    "bottom.ai": "AI",
    
    "common.today": "Today",
    "common.balance": "Balance",
    "common.cashFlow": "Cash Flow",
    "common.income": "Income",
    "common.expense": "Expense",
    "common.total": "Total",
    "common.remaining": "Remaining",
    "common.spent": "Spent",
    "common.status": "Status",
    "common.safe": "Safe",
    "common.over": "Over",
    "common.loading": "Loading...",
    "common.noData": "No data available",
    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.delete": "Delete",
    "common.edit": "Edit",
    "common.add": "Add",
    "common.done": "Done",
    "common.back": "Back",
    "common.confirm": "Confirm",
    "common.week": "Week",
    "common.month": "Month",
    "common.quarter": "Quarter",
    "common.year": "Year",
    "common.category": "Category",
    "common.description": "Description",
    "common.amount": "Amount",
    "common.date": "Date",
    "common.recent": "Recent",
    "common.viewAll": "View all",
    "common.transactions": "Transactions",
    
    "dashboard.budget": "Monthly Budget",
    "dashboard.goals": "Recent Goals",
    "dashboard.calendar": "Transaction Calendar",
    "dashboard.selectedDay": "Spending for selected day",
    "dashboard.recent": "Recent Transactions",
    "dashboard.quickAdd": "Quick Add",
    "dashboard.transfer": "Transfer",
    
    "goals.totalProgress": "Total Savings Progress",
    "goals.list": "Savings Goals",
    "goals.missing": "Remaining",
    "goals.monthlyNeeded": "Monthly Target",
    "goals.completed": "Goal Achieved!",
    "goals.daysLeft": "days remaining",
    "goals.noLimit": "No specific deadline",
    "goals.topUp": "Add Savings",
    "goals.createTitle": "New Goal",
    "goals.editTitle": "Edit Goal",
    "goals.nameLabel": "Goal Name",
    "goals.iconLabel": "Icon",
    "goals.deadlineLabel": "Target Date",
    
    "budget.setup": "Budget Setup",
    "budget.details": "Category Details",
    "budget.tips": "Budgeting Tips",
    "budget.currentMonth": "Current Month",
    "budget.overLimit": "Over budget",
    
    "reports.stats": "Statistics",
    "reports.savingsRate": "Savings Rate",
    "reports.netBalance": "Net Balance",
    "reports.allocation": "Spending Allocation",
    "reports.trend": "Income vs Expense Trend",
    "reports.cashFlow": "Cash Flow Trend",
    "reports.insights": "AI Insights",
    "reports.waiting": "Waiting for data...",
    
    "smartInput.title": "Smart Input",
    "smartInput.subtitle": "Nhập giao dịch nhanh chóng bằng giọng nói hoặc quét hóa đơn",
    "smartInput.greeting": "Chào bạn!",
    "smartInput.voice": "Ghi âm",
    "smartInput.camera": "Chụp ảnh",
    "smartInput.manual": "Tự ghi chép",
    "smartInput.scan": "Quét biên lai",
    "smartInput.processing": "AI Đang Xử Lý...",
    "smartInput.complete": "Đã ghi chép xong!",
    "smartInput.reset": "Hủy bỏ & Làm lại",
    "smartInput.income": "THU NHẬP",
    "smartInput.expense": "CHI TIÊU",
    "smartInput.placeholder.desc": "Vừa chi gì thế?...",
    "smartInput.placeholder.amount": "0",
    
    "calendar.title": "Calendar",
    "calendar.sync": "Syncing...",
    "calendar.noTrans": "No transactions",
    
    "ai.exit": "Thoát khỏi Trợ lý AI",
    "ai.greeting": "Xin chào! Tôi có thể giúp gì cho tài chính của bạn hôm nay?",
    "ai.placeholder": "Nhập câu hỏi tài chính của bạn...",
    "ai.processing": "AI đang phân tích",
    "ai.error": "Gọi Trợ lý AI thất bại",
    "ai.user": "Bạn",
    "ai.advisor": "Trợ lý AI",
    "ai.mainReply": "Trả lời trọng tâm",
    "ai.investment": "Tư vấn đầu tư",
    "ai.technical": "Báo cáo kỹ thuật",
    "ai.fundamental": "Báo cáo cơ bản",
    
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
    
    "common.today": "Hôm nay",
    "common.balance": "Số dư",
    "common.cashFlow": "Dòng tiền",
    "common.income": "Thu nhập",
    "common.expense": "Chi tiêu",
    "common.total": "Tổng",
    "common.remaining": "Còn lại",
    "common.spent": "Đã dùng",
    "common.status": "Trạng thái",
    "common.safe": "An toàn",
    "common.over": "Vượt mức",
    "common.loading": "Đang tải...",
    "common.noData": "Chưa có dữ liệu",
    "common.save": "Lưu",
    "common.cancel": "Hủy",
    "common.delete": "Xóa",
    "common.edit": "Sửa",
    "common.add": "Thêm",
    "common.done": "Xong",
    "common.back": "Quay lại",
    "common.confirm": "Xác nhận",
    "common.week": "Tuần",
    "common.month": "Tháng",
    "common.quarter": "Quý",
    "common.year": "Năm",
    "common.category": "Danh mục",
    "common.description": "Ghi chú",
    "common.amount": "Số tiền",
    "common.date": "Ngày",
    "common.recent": "Gần đây",
    "common.viewAll": "Xem tất cả",
    "common.transactions": "Giao dịch",
    
    "dashboard.budget": "Ngân sách tháng",
    "dashboard.goals": "Mục tiêu gần nhất",
    "dashboard.calendar": "Lịch giao dịch",
    "dashboard.selectedDay": "Chi tiêu ngày đã chọn",
    "dashboard.recent": "Giao dịch gần đây",
    "dashboard.quickAdd": "Thêm nhanh",
    "dashboard.transfer": "Chuyển khoản",
    
    "goals.totalProgress": "Tổng tiến độ tiết kiệm",
    "goals.list": "Danh sách mục tiêu",
    "goals.missing": "Còn thiếu",
    "goals.monthlyNeeded": "Cần tiết kiệm/tháng",
    "goals.completed": "Đã hoàn thành mục tiêu",
    "goals.daysLeft": "ngày còn lại",
    "goals.noLimit": "Không có hạn cụ thể",
    "goals.topUp": "Nạp thêm",
    "goals.createTitle": "Mục tiêu mới",
    "goals.editTitle": "Sửa mục tiêu",
    "goals.nameLabel": "Tên mục tiêu",
    "goals.iconLabel": "Biểu tượng",
    "goals.deadlineLabel": "Hạn hoàn thành",
    
    "budget.setup": "Thiết lập chi tiêu",
    "budget.details": "Danh mục chi tiết",
    "budget.tips": "Mẹo quản lý",
    "budget.currentMonth": "Tháng hiện tại",
    "budget.overLimit": "Vượt hạn mức",
    
    "reports.stats": "Thống kê",
    "reports.savingsRate": "Tỷ lệ tiết kiệm",
    "reports.netBalance": "Dư ròng",
    "reports.allocation": "Phân bổ chi tiêu",
    "reports.trend": "Biến động Thu - Chi",
    "reports.cashFlow": "Dòng tiền thực tế",
    "reports.insights": "Cố vấn tài chính",
    "reports.waiting": "Đang đợi tín hiệu...",
    
    "smartInput.title": "Nhập liệu thông minh",
    "smartInput.subtitle": "Nhập giao dịch nhanh chóng bằng giọng nói hoặc quét hóa đơn",
    "smartInput.greeting": "Chào bạn!",
    "smartInput.voice": "Ghi âm",
    "smartInput.camera": "Chụp ảnh",
    "smartInput.manual": "Tự ghi chép",
    "smartInput.scan": "Quét biên lai",
    "smartInput.processing": "AI Đang Xử Lý...",
    "smartInput.complete": "Đã ghi chép xong!",
    "smartInput.reset": "Hủy bỏ & Làm lại",
    "smartInput.income": "THU NHẬP",
    "smartInput.expense": "CHI TIÊU",
    "smartInput.placeholder.desc": "Vừa chi gì thế?...",
    "smartInput.placeholder.amount": "0",
    
    "calendar.title": "Lịch chi tiêu",
    "calendar.sync": "Đang đồng bộ...",
    "calendar.noTrans": "Không có giao dịch",
    
    "ai.exit": "Thoát khỏi Trợ lý AI",
    "ai.greeting": "Xin chào! Tôi có thể giúp gì cho tài chính của bạn hôm nay?",
    "ai.placeholder": "Nhập câu hỏi tài chính của bạn...",
    "ai.processing": "AI đang phân tích",
    "ai.error": "Gọi Trợ lý AI thất bại",
    "ai.user": "Bạn",
    "ai.advisor": "Trợ lý AI",
    "ai.mainReply": "Trả lời trọng tâm",
    "ai.investment": "Tư vấn đầu tư",
    "ai.technical": "Báo cáo kỹ thuật",
    "ai.fundamental": "Báo cáo cơ bản",
    
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
