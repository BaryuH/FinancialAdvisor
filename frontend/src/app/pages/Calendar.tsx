import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { mockTransactions, Transaction } from "../lib/mockData";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1));
  const [transactions] = useState<Transaction[]>(mockTransactions);
  const [selectedDay, setSelectedDay] = useState(24);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startingDayOfWeek = new Date(year, month, 1).getDay();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const shortMoney = (amount: number) => {
    const n = Math.round(amount);
    if (n === 0) return "0";
    const sign = n < 0 ? "−" : "";
    const abs = Math.abs(n);
    if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}B`;
    if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}tr`;
    if (abs >= 1_000) return `${sign}${Math.round(abs / 1_000)}k`;
    return `${sign}${abs}`;
  };

  const getTransactionsForDate = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return transactions.filter((t) => t.date === dateStr);
  };

  const getDayTotals = (day: number) => {
    const list = getTransactionsForDate(day);
    const income = list.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = list.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense, list };
  };

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date(2026, 2, 24);
    return day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
  };

  const monthName = currentDate.toLocaleDateString("vi-VN", {
    month: "long",
    year: "numeric",
  });

  const monthStats = useMemo(() => {
    const inMonth = transactions.filter((t) => t.date.startsWith(monthKey));
    const income = inMonth.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = inMonth.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const net = income - expense;
    return { income, expense, net };
  }, [transactions, monthKey]);

  const selectedTotals = getDayTotals(selectedDay);
  const selectedList = selectedTotals.list;

  const leadingEmpty = startingDayOfWeek;
  const trailingCells = (7 - ((leadingEmpty + daysInMonth) % 7)) % 7;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-6">
      <div className="bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-slate-100 p-6 border-b border-slate-800">
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => navigate("/")}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-2xl">Lịch tài chính</h1>
        </div>

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={previousMonth}
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl capitalize">{monthName}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={nextMonth}
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6">
        <Card className="p-3 sm:p-4 bg-slate-900 border-slate-800">
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((d) => (
              <div key={d} className="text-center text-[10px] font-medium text-slate-500 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: leadingEmpty }).map((_, index) => (
              <div
                key={`lead-${index}`}
                className="min-h-[4.5rem] rounded-lg bg-slate-950/30 border border-transparent"
              />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const { expense, income, net } = getDayTotals(day);
              const hasActivity = expense > 0 || income > 0;
              const isSelected = selectedDay === day;
              const today = isToday(day);

              const dotClass =
                expense > 0
                  ? "bg-rose-500"
                  : income > 0
                    ? "bg-emerald-500"
                    : "bg-sky-400";

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`min-h-[4.5rem] rounded-lg border p-1 flex flex-col items-center justify-start gap-0.5 transition-all text-left ${
                    isSelected
                      ? "border-cyan-400 ring-1 ring-cyan-400/50 bg-slate-800"
                      : today
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-slate-700 bg-slate-800/50 hover:bg-slate-800"
                  }`}
                >
                  <span
                    className={`text-xs font-semibold ${
                      today ? "text-amber-200" : "text-slate-200"
                    }`}
                  >
                    {day}
                  </span>
                  <div className="flex items-center gap-0.5 w-full justify-center mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotClass}`} />
                    <span
                      className={`text-[10px] leading-tight font-medium tabular-nums ${
                        expense > 0 ? "text-rose-300" : "text-slate-500"
                      }`}
                    >
                      {expense > 0 ? `−${shortMoney(expense)}` : shortMoney(0)}
                    </span>
                  </div>
                  {hasActivity && net !== 0 && (
                    <span
                      className={`text-[9px] leading-none tabular-nums ${
                        net >= 0 ? "text-emerald-400/90" : "text-amber-400"
                      }`}
                    >
                      {net >= 0 ? "+" : ""}
                      {shortMoney(net)}
                    </span>
                  )}
                </button>
              );
            })}
            {Array.from({ length: trailingCells }).map((_, index) => (
              <div
                key={`trail-${index}`}
                className="min-h-[4.5rem] rounded-lg bg-slate-950/30 border border-transparent"
              />
            ))}
          </div>
        </Card>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 mt-3 text-[10px] text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            Không chi
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Có chi tiêu
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Có thu
          </span>
        </div>
      </div>

      <div className="px-4 mt-6">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h2 className="text-sm font-semibold text-slate-100 mb-3">Tổng kết tháng</h2>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Thu nhập</p>
              <p className="text-sm font-medium text-emerald-400">
                {formatCurrency(monthStats.income)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Chi tiêu</p>
              <p className="text-sm font-medium text-rose-400">
                {formatCurrency(monthStats.expense)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-400 mb-1">Chênh lệch</p>
              <p
                className={`text-sm font-medium ${monthStats.net >= 0 ? "text-emerald-400" : "text-amber-400"}`}
              >
                {monthStats.net >= 0 ? "+" : "−"}
                {formatCurrency(Math.abs(monthStats.net))}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-400">Số dư tháng (thu − chi)</span>
            <span
              className={`font-semibold tabular-nums ${monthStats.net >= 0 ? "text-emerald-400" : "text-amber-400"}`}
            >
              {monthStats.net >= 0 ? "+" : "−"}
              {formatCurrency(Math.abs(monthStats.net))}
            </span>
          </div>
        </Card>
      </div>

      <div className="px-4 mt-6">
        <h2 className="text-lg mb-2 text-slate-100">
          Giao dịch ngày {selectedDay}/{month + 1}/{year}
        </h2>
        {selectedList.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 bg-slate-900 border-slate-800">
            <p>Không có giao dịch trong ngày này</p>
            <Button
              variant="outline"
              className="mt-4 border-slate-600"
              onClick={() => navigate("/transactions?add=1")}
            >
              Thêm giao dịch
            </Button>
          </Card>
        ) : (
          <Card className="divide-y divide-slate-800 bg-slate-900 border-slate-800">
            {selectedList.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm mb-1 text-slate-100">{transaction.description}</p>
                  <p className="text-xs text-slate-400">{transaction.category}</p>
                </div>
                <p
                  className={`text-sm font-medium ${
                    transaction.type === "income" ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {transaction.type === "income" ? "+" : "−"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}
