import React, { useMemo, useState } from "react";
import { Link } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Calendar as CalendarIcon,
  Mic,
  Camera,
  ArrowRight,
  Plus,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  ShoppingBag,
  Car,
  Film,
  House,
  HeartPulse,
  BookOpen,
  Wallet,
} from "lucide-react";
import { mockTransactions, mockBudgets, mockGoals, categories } from "../lib/mockData";

export function Dashboard() {
  const [transactions] = useState(mockTransactions);
  const [budgets] = useState(mockBudgets);
  const [goals] = useState(mockGoals);
  const [calendarMonth, setCalendarMonth] = useState(new Date(2026, 2, 1));
  const [selectedDay, setSelectedDay] = useState(24);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;
  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const budgetPercentage = (totalSpent / totalBudget) * 100;
  const budgetStatusText =
    budgetPercentage > 90
      ? "Vượt ngưỡng cảnh báo"
      : budgetPercentage > 70
        ? "Tiệm cận hạn mức"
        : "Trong vùng an toàn";

  const monthLabel = calendarMonth.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });
  const currentYear = calendarMonth.getFullYear();
  const currentMonth = calendarMonth.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startWeekday = new Date(currentYear, currentMonth, 1).getDay();

  const expenseByDay = useMemo(() => {
    const map = new Map<number, number>();
    transactions.forEach((transaction) => {
      if (transaction.type !== "expense") return;
      const date = new Date(transaction.date);
      if (
        date.getFullYear() === currentYear &&
        date.getMonth() === currentMonth
      ) {
        const day = date.getDate();
        map.set(day, (map.get(day) ?? 0) + transaction.amount);
      }
    });
    return map;
  }, [transactions, currentMonth, currentYear]);

  const maxDailyExpense = Math.max(...Array.from(expenseByDay.values()), 1);
  const selectedDateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  const selectedDateTransactions = transactions.filter(
    (transaction) =>
      transaction.type === "expense" && transaction.date === selectedDateKey
  );
  const selectedDateExpense = selectedDateTransactions.reduce(
    (sum, item) => sum + item.amount,
    0
  );
  const monthlyExpense = Array.from(expenseByDay.values()).reduce(
    (sum, value) => sum + value,
    0
  );
  const activeExpenseDays = Array.from(expenseByDay.values()).filter(
    (value) => value > 0
  ).length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getDayIntensity = (day: number) => {
    const value = expenseByDay.get(day) ?? 0;
    const ratio = value / maxDailyExpense;
    if (ratio === 0) return "bg-slate-900 text-slate-500 border border-slate-800";
    if (ratio < 0.33) return "bg-cyan-900/40 text-cyan-200 border border-cyan-700/40";
    if (ratio < 0.66) return "bg-cyan-700/40 text-cyan-100 border border-cyan-500/40";
    return "bg-cyan-500/40 text-cyan-50 border border-cyan-300/40";
  };

  const toPreviousMonth = () => {
    const prevMonth = new Date(currentYear, currentMonth - 1, 1);
    setCalendarMonth(prevMonth);
    setSelectedDay(1);
  };

  const toNextMonth = () => {
    const nextMonth = new Date(currentYear, currentMonth + 1, 1);
    setCalendarMonth(nextMonth);
    setSelectedDay(1);
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconName = categories.find((c) => c.name === categoryName)?.icon;
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
      case "wallet":
        return <Wallet className="w-4 h-4 text-emerald-300" />;
      case "trending-up":
        return <TrendingUp className="w-4 h-4 text-sky-300" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 p-6 rounded-b-3xl border-b border-slate-800 shadow-2xl">
        <div className="mb-4">
          <p className="text-sm text-slate-300">Xin chào,</p>
          <h1 className="mt-2 font-signature text-4xl font-extrabold tracking-wide leading-none drop-shadow-[0_6px_18px_rgba(0,0,0,0.35)]">
            Flowlystic
          </h1>
          <p className="text-xs text-slate-400 mt-1">Theo doi dong tien thong minh moi ngay</p>
        </div>

        <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-5 shadow-lg">
          <p className="text-sm text-slate-300 mb-1">Tài sản ròng hiện tại</p>
          <p className="text-3xl mb-4 text-cyan-300">{formatCurrency(balance)}</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-300">Thu nhập</span>
              </div>
              <p className="text-lg text-emerald-300">{formatCurrency(totalIncome)}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-rose-400" />
                <span className="text-xs text-slate-300">Chi tiêu</span>
              </div>
              <p className="text-lg text-rose-300">{formatCurrency(totalExpense)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 -mt-6">
        <Card className="p-4 shadow-lg bg-slate-900 border-slate-800">
          <p className="text-sm text-slate-300 mb-3">Nhập liệu nhanh</p>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/smart-input?mode=voice">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-100">
                <Mic className="w-6 h-6 text-cyan-300" />
                <span className="text-xs">Giọng nói</span>
              </Button>
            </Link>
            <Link to="/smart-input?mode=scan">
              <Button variant="outline" className="w-full h-20 flex-col gap-2 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-100">
                <Camera className="w-6 h-6 text-violet-300" />
                <span className="text-xs">Quét hóa đơn</span>
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg text-slate-100">Lịch chi tiêu</h2>
          <Link to="/calendar" className="text-cyan-300 text-sm flex items-center gap-1">
            Mở lịch đầy đủ <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-100"
              onClick={toPreviousMonth}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <p className="text-sm text-slate-200 capitalize">{monthLabel}</p>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-100"
              onClick={toNextMonth}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-7 text-[10px] text-slate-500 mb-2">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
              <div key={day} className="text-center py-1">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: startWeekday }).map((_, idx) => (
              <div key={`blank-${idx}`} className="h-10" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const isSelected = day === selectedDay;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`h-10 rounded-md text-xs font-medium transition-all ${getDayIntensity(day)} ${isSelected ? "ring-2 ring-cyan-300 ring-offset-2 ring-offset-slate-900" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-[11px] text-slate-400">Tong chi thang</p>
              <p className="text-sm text-rose-300 mt-1">{formatCurrency(monthlyExpense)}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-[11px] text-slate-400">Ngay co giao dich</p>
              <p className="text-sm text-cyan-200 mt-1">{activeExpenseDays} ngay</p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-slate-400">Chi tiet ngay {selectedDay}</p>
              <p className="text-sm text-rose-300">{formatCurrency(selectedDateExpense)}</p>
            </div>
            {selectedDateTransactions.length > 0 ? (
              <div className="space-y-2">
                {selectedDateTransactions.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300">{item.description}</span>
                    <span className="text-rose-300">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">Khong co chi tieu trong ngay nay</p>
            )}
          </div>
        </Card>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg text-slate-100">Ngân sách tháng này</h2>
          <Link to="/budget" className="text-cyan-300 text-sm flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-300">Đã dùng</span>
            <span className="text-sm text-slate-200">{budgetPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-3 mb-3">
            <div
              className={`h-3 rounded-full transition-all ${
                budgetPercentage > 90 ? "bg-rose-500" : budgetPercentage > 70 ? "bg-amber-500" : "bg-emerald-500"
              }`}
              style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-slate-400 mb-3">{budgetStatusText}</p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-400">Đã chi</p>
              <p className="text-sm text-slate-100">{formatCurrency(totalSpent)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Tổng ngân sách</p>
              <p className="text-sm text-slate-100">{formatCurrency(totalBudget)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg text-slate-100">Mục tiêu tiết kiệm</h2>
          <Link to="/goals" className="text-cyan-300 text-sm flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {goals.slice(0, 2).map((goal) => {
            const progress = (goal.currentAmount / goal.targetAmount) * 100;
            return (
              <Card key={goal.id} className="p-4 bg-slate-900 border-slate-800">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm mb-1 text-slate-100">{goal.name}</h3>
                    <p className="text-xs text-slate-400">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                  <Target className="w-5 h-5 text-cyan-300" />
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2">
                  <div
                    className="bg-cyan-400 h-2 rounded-full transition-all"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="px-4 mt-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg text-slate-100">Giao dịch gần đây</h2>
          <Link to="/transactions" className="text-cyan-300 text-sm flex items-center gap-1">
            Xem tất cả <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Card className="divide-y divide-slate-800 bg-slate-900 border-slate-800">
          {transactions.slice(0, 5).map((transaction) => (
            <div key={transaction.id} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  transaction.type === "income" ? "bg-emerald-500/20" : "bg-rose-500/20"
                }`}>
                  {getCategoryIcon(transaction.category)}
                </div>
                <div>
                  <p className="text-sm text-slate-100">{transaction.description}</p>
                  <p className="text-xs text-slate-400">{transaction.category}</p>
                </div>
              </div>
              <p className={`text-sm ${
                transaction.type === "income" ? "text-emerald-300" : "text-rose-300"
              }`}>
                {transaction.type === "income" ? "+" : "-"}
                {formatCurrency(transaction.amount)}
              </p>
            </div>
          ))}
        </Card>
      </div>

      <div className="px-4 mb-8">
        <div className="grid grid-cols-2 gap-3">
          <Link to="/calendar">
            <Card className="p-4 hover:shadow-md transition-shadow bg-slate-900 border-slate-800 hover:bg-slate-800">
              <CalendarIcon className="w-6 h-6 text-violet-300 mb-2" />
              <p className="text-sm text-slate-100">Lịch tài chính</p>
            </Card>
          </Link>
          <Link to="/ai-advisor">
            <Card className="p-4 hover:shadow-md transition-shadow bg-slate-900 border-slate-800 hover:bg-slate-800">
              <TrendingUp className="w-6 h-6 text-emerald-300 mb-2" />
              <p className="text-sm text-slate-100">Tư vấn AI</p>
            </Card>
          </Link>
        </div>
      </div>

      <Link to="/transactions">
        <Button
          className="fixed bottom-20 right-6 w-14 h-14 rounded-full shadow-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </div>
  );
}
