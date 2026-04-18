import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ChevronRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  Target,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Film,
  House,
  HeartPulse,
  BookOpen,
  PiggyBank,
} from "lucide-react";
import { toast } from "sonner";
import { getDashboardSummary } from "../lib/api/dashboard";
import { ApiCategory, ApiTransaction, getCategories } from "../lib/api/transactions";

type UiTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
};

type UiGoalPreview = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  progressPercent: number;
  icon: string;
  deadline: string;
  isCompleted: boolean;
};

type ExpenseCalendarDay = {
  date: string;
  expense: number;
  transactionCount: number;
};

function mapApiTransaction(item: ApiTransaction): UiTransaction {
  return {
    id: item.id,
    type: item.type,
    amount: item.amount_minor,
    category: item.category.name,
    description: item.description,
    date: item.transaction_date,
  };
}

export function Dashboard() {
  const navigate = useNavigate();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));

  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<ApiCategory[]>([]);

  const [summary, setSummary] = useState({
    balance: 0,
    income: 0,
    expense: 0,
  });

  const [budgetSummary, setBudgetSummary] = useState({
    totalLimit: 0,
    totalSpent: 0,
    usagePercent: 0,
    statusText: "",
  });

  const [goalsPreview, setGoalsPreview] = useState<UiGoalPreview[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<UiTransaction[]>([]);
  const [expenseCalendarDays, setExpenseCalendarDays] = useState<ExpenseCalendarDay[]>([]);
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<UiTransaction[]>([]);
  const [selectedDayExpense, setSelectedDayExpense] = useState(0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  const selectedDateLabel = useMemo(() => {
    return new Date(selectedDate).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }, [selectedDate]);

  const loadCategories = async () => {
    try {
      const [expenseRes, incomeRes] = await Promise.all([
        getCategories("expense"),
        getCategories("income"),
      ]);
      setCategories([...expenseRes.items, ...incomeRes.items]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh mục");
    }
  };

  const loadDashboard = async (month: string, date: string) => {
    try {
      setIsLoading(true);
      const response = await getDashboardSummary(month, date);

      setSummary({
        balance: response.summary.balance_minor,
        income: response.summary.income_minor,
        expense: response.summary.expense_minor,
      });

      setBudgetSummary({
        totalLimit: response.budget_summary.total_limit_minor,
        totalSpent: response.budget_summary.total_spent_minor,
        usagePercent: response.budget_summary.usage_percent,
        statusText: response.budget_summary.status_text,
      });

      setGoalsPreview(
        response.goals_preview.map((goal) => ({
          id: goal.id,
          name: goal.name,
          targetAmount: goal.target_minor,
          currentAmount: goal.current_minor,
          progressPercent: goal.progress_percent,
          icon: goal.icon_key,
          deadline: goal.deadline,
          isCompleted: goal.is_completed,
        })),
      );

      setRecentTransactions(response.recent_transactions.map(mapApiTransaction));

      setExpenseCalendarDays(
        response.expense_calendar.days.map((day) => ({
          date: day.date,
          expense: day.expense_minor,
          transactionCount: day.transaction_count,
        })),
      );

      setSelectedDayExpense(response.selected_day.total_expense_minor);
      setSelectedDayTransactions(response.selected_day.items.map(mapApiTransaction));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadDashboard(currentMonth, selectedDate);
  }, [currentMonth, selectedDate]);

  const getCategoryIcon = (categoryName: string) => {
    const iconName = categories.find((c) => c.name === categoryName)?.icon_key;

    switch (iconName) {
      case "utensils":
        return <UtensilsCrossed className="w-4 h-4 text-amber-300" />;
      case "shopping-bag":
        return <ShoppingBag className="w-4 h-4 text-violet-300" />;
      case "car":
        return <Car className="w-4 h-4 text-cyan-300" />;
      case "film":
        return <Film className="w-4 h-4 text-pink-300" />;
      case "home":
        return <House className="w-4 h-4 text-emerald-300" />;
      case "heart":
        return <HeartPulse className="w-4 h-4 text-rose-300" />;
      case "book":
        return <BookOpen className="w-4 h-4 text-indigo-300" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-300" />;
    }
  };

  const getGoalIcon = (iconKey: string) => {
    switch (iconKey) {
      case "piggy-bank":
        return <PiggyBank className="w-4 h-4 text-cyan-300" />;
      case "target":
        return <Target className="w-4 h-4 text-emerald-300" />;
      default:
        return <Target className="w-4 h-4 text-cyan-300" />;
    }
  };

  const calendarDays = useMemo(() => {
    return expenseCalendarDays.slice(0, 14);
  }, [expenseCalendarDays]);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-6">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-sm text-slate-300">Tổng quan</p>
            <h1 className="text-2xl font-semibold capitalize">{monthLabel}</h1>
          </div>

          <input
            type="month"
            value={currentMonth}
            onChange={(e) => {
              setCurrentMonth(e.target.value);
              setSelectedDate(`${e.target.value}-01`);
            }}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-slate-900/70 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-cyan-300" />
              <p className="text-xs text-slate-300">Số dư</p>
            </div>
            <p className="text-sm text-slate-100">
              {isLoading ? "..." : formatCurrency(summary.balance)}
            </p>
          </Card>

          <Card className="p-4 bg-slate-900/70 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <p className="text-xs text-slate-300">Thu</p>
            </div>
            <p className="text-sm text-emerald-300">
              {isLoading ? "..." : formatCurrency(summary.income)}
            </p>
          </Card>

          <Card className="p-4 bg-slate-900/70 border-slate-700">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-rose-300" />
              <p className="text-xs text-slate-300">Chi</p>
            </div>
            <p className="text-sm text-rose-300">
              {isLoading ? "..." : formatCurrency(summary.expense)}
            </p>
          </Card>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-base font-semibold text-slate-100">Ngân sách tháng</p>
              <p className="text-sm text-slate-400 mt-1">
                {budgetSummary.statusText || "Chưa có dữ liệu"}
              </p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigate("/budget")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-slate-300">{formatCurrency(budgetSummary.totalSpent)}</span>
              <span className="text-slate-400">{formatCurrency(budgetSummary.totalLimit)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-cyan-400 transition-all"
                style={{ width: `${Math.min(budgetSummary.usagePercent, 100)}%` }}
              />
            </div>
          </div>

          <p className="text-sm text-slate-300">
            Đã dùng {budgetSummary.usagePercent.toFixed(0)}%
          </p>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-semibold text-slate-100">Mục tiêu gần nhất</p>
            <Button variant="ghost" size="icon" onClick={() => navigate("/goals")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading && <p className="text-sm text-slate-400">Đang tải mục tiêu...</p>}

            {!isLoading && goalsPreview.length === 0 && (
              <p className="text-sm text-slate-400">Chưa có mục tiêu nào</p>
            )}

            {!isLoading &&
              goalsPreview.map((goal) => (
                <div key={goal.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {getGoalIcon(goal.icon)}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-slate-100">{goal.name}</p>
                      <p className="text-xs text-slate-400">
                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all ${goal.isCompleted ? "bg-emerald-500" : "bg-cyan-500"}`}
                      style={{ width: `${Math.min(goal.progressPercent, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-base font-semibold text-slate-100">Chi tiêu theo ngày</p>
              <p className="text-sm text-slate-400 mt-1 capitalize">{selectedDateLabel}</p>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-4">
            {calendarDays.map((day) => {
              const isSelected = day.date === selectedDate;
              const dayNumber = Number(day.date.slice(-2));

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setSelectedDate(day.date)}
                  className={`rounded-xl border p-2 text-center ${
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-400 text-cyan-100"
                      : "bg-slate-950 border-slate-800 text-slate-100"
                  }`}
                >
                  <p className="text-xs">{dayNumber}</p>
                  <p className="text-[10px] text-rose-300 mt-1">
                    {day.expense > 0 ? `${Math.round(day.expense / 1000)}k` : "•"}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 mb-4">
            <p className="text-xs text-slate-400 mb-1">Chi tiêu ngày đã chọn</p>
            <p className="text-sm text-rose-300">{formatCurrency(selectedDayExpense)}</p>
          </div>

          <div className="space-y-3">
            {isLoading && <p className="text-sm text-slate-400">Đang tải giao dịch...</p>}

            {!isLoading && selectedDayTransactions.length === 0 && (
              <p className="text-sm text-slate-400">Không có giao dịch trong ngày này</p>
            )}

            {!isLoading &&
              selectedDayTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        transaction.type === "income"
                          ? "bg-emerald-500/15 border-emerald-500/30"
                          : "bg-slate-800 border-slate-700"
                      }`}
                    >
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-100">{transaction.description}</p>
                      <p className="text-xs text-slate-400">{transaction.category}</p>
                    </div>
                  </div>

                  <p className={`text-sm ${transaction.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
          </div>
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-semibold text-slate-100">Giao dịch gần đây</p>
            <Button variant="ghost" size="icon" onClick={() => navigate("/transactions")}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {isLoading && <p className="text-sm text-slate-400">Đang tải giao dịch...</p>}

            {!isLoading && recentTransactions.length === 0 && (
              <p className="text-sm text-slate-400">Chưa có giao dịch nào</p>
            )}

            {!isLoading &&
              recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center border ${
                        transaction.type === "income"
                          ? "bg-emerald-500/15 border-emerald-500/30"
                          : "bg-slate-800 border-slate-700"
                      }`}
                    >
                      {getCategoryIcon(transaction.category)}
                    </div>
                    <div>
                      <p className="text-sm text-slate-100">{transaction.description}</p>
                      <p className="text-xs text-slate-400">{transaction.category}</p>
                    </div>
                  </div>

                  <p className={`text-sm ${transaction.type === "income" ? "text-emerald-300" : "text-rose-300"}`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}