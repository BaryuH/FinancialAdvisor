import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
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
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { getCalendarDay, getCalendarMonth } from "../lib/api/calendar";
import { ApiTransaction, getCategories, ApiCategory } from "../lib/api/transactions";

type UiTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
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

export function Calendar() {
  const navigate = useNavigate();

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.toISOString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(today.toISOString().slice(0, 10));

  const [monthData, setMonthData] = useState<{
    summary: {
      income_minor: number;
      expense_minor: number;
      net_minor: number;
    };
    days: {
      date: string;
      income_minor: number;
      expense_minor: number;
      net_minor: number;
      transaction_count: number;
    }[];
  } | null>(null);

  const [dayTransactions, setDayTransactions] = useState<UiTransaction[]>([]);
  const [daySummary, setDaySummary] = useState<{
    income_minor: number;
    expense_minor: number;
    net_minor: number;
    transaction_count: number;
  } | null>(null);

  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isMonthLoading, setIsMonthLoading] = useState(true);
  const [isDayLoading, setIsDayLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const loadMonthData = async (month: string) => {
    try {
      setIsMonthLoading(true);
      const response = await getCalendarMonth(month);
      setMonthData({
        summary: response.summary,
        days: response.days,
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu tháng");
    } finally {
      setIsMonthLoading(false);
    }
  };

  const loadDayData = async (date: string) => {
    try {
      setIsDayLoading(true);
      const response = await getCalendarDay(date);
      setDaySummary(response.summary);
      setDayTransactions(response.items.map(mapApiTransaction));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được dữ liệu ngày");
    } finally {
      setIsDayLoading(false);
    }
  };

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

  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadDayData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    loadCategories();
  }, []);

  const daysInMonth = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number);
    return new Date(year, month, 0).getDate();
  }, [currentMonth]);

  const firstDayOfMonth = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number);
    const jsDay = new Date(year, month - 1, 1).getDay();
    return jsDay === 0 ? 6 : jsDay - 1;
  }, [currentMonth]);

  const monthDaysMap = useMemo(() => {
    const map = new Map<
      string,
      {
        date: string;
        income_minor: number;
        expense_minor: number;
        net_minor: number;
        transaction_count: number;
      }
    >();

    monthData?.days.forEach((day) => {
      map.set(day.date, day);
    });

    return map;
  }, [monthData]);

  const calendarDays = useMemo(() => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i += 1) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = `${currentMonth}-${String(day).padStart(2, "0")}`;
      days.push({
        day,
        date,
        data: monthDaysMap.get(date) ?? null,
      });
    }

    return days;
  }, [currentMonth, daysInMonth, firstDayOfMonth, monthDaysMap]);

  const selectedDayLabel = useMemo(() => {
    return new Date(selectedDate).toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [selectedDate]);

  const monthLabel = useMemo(() => {
    const [year, month] = currentMonth.split("-").map(Number);
    return new Date(year, month - 1, 1).toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [currentMonth]);

  const goToPreviousMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const previous = new Date(year, month - 2, 1);
    const nextMonth = previous.toISOString().slice(0, 7);
    setCurrentMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  };

  const goToNextMonth = () => {
    const [year, month] = currentMonth.split("-").map(Number);
    const next = new Date(year, month, 1);
    const nextMonth = next.toISOString().slice(0, 7);
    setCurrentMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  };

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
      case "wallet":
        return <Wallet className="w-4 h-4 text-emerald-300" />;
      case "trending-up":
        return <TrendingUp className="w-4 h-4 text-sky-300" />;
      default:
        return <Wallet className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-6">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="h-11 w-11 text-white hover:bg-white/20"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl font-semibold">Lịch chi tiêu</h1>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            size="icon"
            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <p className="text-lg font-semibold capitalize">{monthLabel}</p>
          <Button
            variant="outline"
            size="icon"
            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            onClick={goToNextMonth}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        <Card className="p-4 bg-slate-900 border-slate-800">
          {isMonthLoading || !monthData ? (
            <div className="text-center py-8 text-slate-400">Đang tải dữ liệu tháng...</div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-1">Thu nhập</p>
                  <p className="text-sm text-emerald-300">{formatCurrency(monthData.summary.income_minor)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-1">Chi tiêu</p>
                  <p className="text-sm text-rose-300">{formatCurrency(monthData.summary.expense_minor)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-1">Ròng</p>
                  <p className={`text-sm ${monthData.summary.net_minor >= 0 ? "text-cyan-300" : "text-amber-300"}`}>
                    {formatCurrency(monthData.summary.net_minor)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-2">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                  <div key={label} className="text-center text-xs text-slate-400 py-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((item, index) => {
                  if (!item) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }

                  const isSelected = item.date === selectedDate;
                  const expense = item.data?.expense_minor ?? 0;
                  const hasTransactions = (item.data?.transaction_count ?? 0) > 0;

                  return (
                    <button
                      key={item.date}
                      type="button"
                      onClick={() => setSelectedDate(item.date)}
                      className={`aspect-square rounded-xl border text-xs p-1 flex flex-col items-center justify-center transition ${
                        isSelected
                          ? "bg-cyan-500/20 border-cyan-400 text-cyan-100"
                          : "bg-slate-950 border-slate-800 text-slate-100 hover:bg-slate-900"
                      }`}
                    >
                      <span>{item.day}</span>
                      {hasTransactions && (
                        <span className="text-[10px] text-rose-300 mt-1">
                          {expense > 0 ? `${Math.round(expense / 1000)}k` : "•"}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        <div>
          <p className="text-sm text-slate-400 mb-3 capitalize">{selectedDayLabel}</p>

          <Card className="p-4 bg-slate-900 border-slate-800 mb-4">
            {isDayLoading || !daySummary ? (
              <div className="text-center py-6 text-slate-400">Đang tải dữ liệu ngày...</div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-1">Chi tiêu ngày</p>
                  <p className="text-sm text-rose-300">{formatCurrency(daySummary.expense_minor)}</p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-1">Số giao dịch</p>
                  <p className="text-sm text-slate-100">{daySummary.transaction_count}</p>
                </div>
              </div>
            )}
          </Card>

          {isDayLoading && (
            <div className="text-center py-10 text-slate-400">Đang tải giao dịch trong ngày...</div>
          )}

          {!isDayLoading && dayTransactions.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <p>Không có giao dịch trong ngày này</p>
            </div>
          )}

          {!isDayLoading && dayTransactions.length > 0 && (
            <Card className="divide-y divide-slate-800 bg-slate-900 border-slate-800">
              {dayTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
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
                  <p
                    className={`text-sm ${
                      transaction.type === "income" ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}