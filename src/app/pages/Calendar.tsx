import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { mockTransactions } from "../lib/mockData";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [transactions] = useState(mockTransactions);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    return { daysInMonth, startingDayOfWeek };
  };

  const getTransactionsForDate = (day: number) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    
    return transactions.filter(t => t.date === dateStr);
  };

  const getNetAmountForDate = (day: number) => {
    const dayTransactions = getTransactionsForDate(day);
    const income = dayTransactions.filter(t => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTransactions.filter(t => t.type === "expense").reduce((sum, t) => sum + t.amount, 0);
    return income - expense;
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day);
  }

  const isToday = (day: number | null) => {
    if (!day) return false;
    const today = new Date(2026, 2, 24); // March 24, 2026
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-6">
      {/* Header */}
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

        {/* Month Navigation */}
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

      {/* Calendar Grid */}
      <div className="px-4 mt-6">
        <Card className="p-4 bg-slate-900 border-slate-800">
          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["CN", "T2", "T3", "T4", "T5", "T6", "T7"].map((day) => (
              <div key={day} className="text-center text-xs text-slate-400 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayTransactions = getTransactionsForDate(day);
              const netAmount = getNetAmountForDate(day);
              const hasTransactions = dayTransactions.length > 0;

              return (
                <div
                  key={day}
                  className={`aspect-square relative flex flex-col items-center justify-center rounded-lg transition-colors ${
                    isToday(day)
                      ? "bg-cyan-600 text-white"
                      : hasTransactions
                      ? "bg-slate-800 hover:bg-slate-700"
                      : "hover:bg-slate-800/60"
                  }`}
                >
                  <span className={`text-sm ${isToday(day) ? "" : "text-slate-200"}`}>
                    {day}
                  </span>
                  {hasTransactions && (
                    <div className="flex gap-0.5 mt-1">
                      {dayTransactions.some(t => t.type === "income") && (
                        <div className={`w-1 h-1 rounded-full ${isToday(day) ? "bg-white" : "bg-green-500"}`} />
                      )}
                      {dayTransactions.some(t => t.type === "expense") && (
                        <div className={`w-1 h-1 rounded-full ${isToday(day) ? "bg-white" : "bg-red-500"}`} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span>Thu nhập</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span>Chi tiêu</span>
          </div>
        </div>
      </div>

      {/* Transactions for Selected Day (Today) */}
      <div className="px-4 mt-6">
        <h2 className="text-lg mb-3 text-slate-100">Giao dịch hôm nay</h2>
        {(() => {
          const todayTransactions = getTransactionsForDate(24);
          if (todayTransactions.length === 0) {
            return (
              <Card className="p-8 text-center text-slate-400 bg-slate-900 border-slate-800">
                <p>Không có giao dịch</p>
              </Card>
            );
          }

          return (
            <Card className="divide-y divide-slate-800 bg-slate-900 border-slate-800">
              {todayTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1 text-slate-100">{transaction.description}</p>
                    <p className="text-xs text-slate-400">{transaction.category}</p>
                  </div>
                  <p className={`text-sm ${
                    transaction.type === "income" ? "text-green-600" : "text-red-600"
                  }`}>
                    {transaction.type === "income" ? "+" : "-"}
                    {formatCurrency(transaction.amount)}
                  </p>
                </div>
              ))}
            </Card>
          );
        })()}
      </div>

      {/* Monthly Summary */}
      <div className="px-4 mt-6">
        <h2 className="text-lg mb-3 text-slate-100">Tổng kết tháng</h2>
        <Card className="p-4 bg-slate-900 border-slate-800">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-slate-400 mb-1">Tổng thu</p>
              <p className="text-sm text-green-600">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === "income" && t.date.startsWith("2026-03"))
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Tổng chi</p>
              <p className="text-sm text-red-600">
                {formatCurrency(
                  transactions
                    .filter(t => t.type === "expense" && t.date.startsWith("2026-03"))
                    .reduce((sum, t) => sum + t.amount, 0)
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Còn lại</p>
              <p className="text-sm text-slate-100">
                {formatCurrency(
                  transactions
                    .filter(t => t.date.startsWith("2026-03"))
                    .reduce((sum, t) => t.type === "income" ? sum + t.amount : sum - t.amount, 0)
                )}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
