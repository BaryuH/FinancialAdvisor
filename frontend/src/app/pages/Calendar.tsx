import React, { useEffect, useMemo, useState } from "react";
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
  CalendarDays,
} from "lucide-react";
import { toast } from "sonner";
import { getCalendarDay, getCalendarMonth } from "../lib/api/calendar";
import { ApiTransaction, getCategories, ApiCategory } from "../lib/api/transactions";
import { format, addMonths, subMonths, parseISO, startOfMonth, getDaysInMonth, getDay } from "date-fns";
import { vi } from "date-fns/locale";
import { getTodayString } from "../lib/dates";
import { useLocale } from "../lib/locale";

type UiTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
};

type CalendarDayCell =
  | null
  | {
      day: number;
      date: string;
      data: {
        date: string;
        income_minor: number;
        expense_minor: number;
        net_minor: number;
        transaction_count: number;
      } | null;
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
  const { t, locale } = useLocale();
  const [currentMonth, setCurrentMonth] = useState(getTodayString().slice(0, 7));
  const [selectedDate, setSelectedDate] = useState(getTodayString());

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
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const shortFormatCurrency = (amount: number) => {
    const val = Math.abs(amount);
    const sign = amount > 0 ? "+" : amount < 0 ? "-" : "";
    if (val >= 1000000) return `${sign}${(val / 1000000).toFixed(1)}tr`;
    if (val >= 1000) return `${sign}${(val / 1000).toFixed(0)}k`;
    return `${sign}${val}`;
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
      toast.error(t("common.noData"));
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
      toast.error(t("common.noData"));
    } finally {
      setIsDayLoading(false);
    }
  };

  useEffect(() => {
    loadMonthData(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    loadDayData(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    getCategories().then(res => setCategories(res.items)).catch(console.error);
  }, []);

  const calendarDays = useMemo((): CalendarDayCell[] => {
    const date = parseISO(`${currentMonth}-01`);
    const firstDay = getDay(date); 
    const leadingEmpty = firstDay === 0 ? 6 : firstDay - 1; 
    const daysCount = getDaysInMonth(date);

    const monthDaysMap = new Map();
    monthData?.days.forEach(d => monthDaysMap.set(d.date, d));

    const cells: CalendarDayCell[] = [];
    for (let i = 0; i < leadingEmpty; i++) cells.push(null);
    for (let day = 1; day <= daysCount; day++) {
      const iso = `${currentMonth}-${String(day).padStart(2, "0")}`;
      cells.push({ day, date: iso, data: monthDaysMap.get(iso) ?? null });
    }
    return cells;
  }, [currentMonth, monthData]);

  const monthLabel = useMemo(() => {
    const loc = locale === "vi" ? vi : undefined;
    return format(parseISO(`${currentMonth}-01`), "MMMM yyyy", { locale: loc });
  }, [currentMonth, locale]);

  const goToPreviousMonth = () => {
    const next = subMonths(parseISO(`${currentMonth}-01`), 1);
    setCurrentMonth(format(next, "yyyy-MM"));
  };

  const goToNextMonth = () => {
    const next = addMonths(parseISO(`${currentMonth}-01`), 1);
    setCurrentMonth(format(next, "yyyy-MM"));
  };

  const getCategoryIcon = (categoryName: string) => {
    const iconName = categories.find((c) => c.name === categoryName)?.icon_key;
    switch (iconName) {
      case "utensils": return <UtensilsCrossed className="w-4 h-4 text-amber-300" />;
      case "shopping-bag": return <ShoppingBag className="w-4 h-4 text-violet-300" />;
      case "car": return <Car className="w-4 h-4 text-cyan-300" />;
      case "film": return <Film className="w-4 h-4 text-pink-300" />;
      case "home": return <House className="w-4 h-4 text-emerald-300" />;
      case "heart": return <HeartPulse className="w-4 h-4 text-rose-300" />;
      case "book": return <BookOpen className="w-4 h-4 text-indigo-300" />;
      default: return <Wallet className="w-4 h-4 text-slate-300" />;
    }
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 text-slate-100 font-sans">
      <div className="px-6 pt-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
             <div className="p-2 bg-slate-900 rounded-2xl border border-slate-800"><CalendarDays className="w-6 h-6 text-emerald-500" /></div>
             {t("page.calendar")}
          </h1>
          <Button variant="ghost" onClick={() => { 
            const today = getTodayString(); 
            setCurrentMonth(today.slice(0,7)); 
            setSelectedDate(today); 
          }} className="text-xs font-black uppercase tracking-widest text-emerald-500">{t("common.today")}</Button>
        </div>

        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
          <Button variant="ghost" size="icon" onClick={goToPreviousMonth} className="hover:bg-slate-800 rounded-xl"><ChevronLeft /></Button>
          <p className="text-sm font-black uppercase tracking-[0.2em]">{monthLabel}</p>
          <Button variant="ghost" size="icon" onClick={goToNextMonth} className="hover:bg-slate-800 rounded-xl"><ChevronRight /></Button>
        </div>

        <Card className="p-4 bg-slate-900/40 border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden text-left">
          {isMonthLoading ? (
            <div className="h-64 flex items-center justify-center animate-pulse text-[10px] font-black uppercase tracking-[0.3em] text-slate-600">{t("calendar.sync")}</div>
          ) : (
            <>
              <div className="grid grid-cols-7 mb-4">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((label) => (
                  <div key={label} className="text-center text-[10px] font-black text-slate-600 py-2">
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {calendarDays.map((item, index) => {
                  if (!item) return <div key={`empty-${index}`} className="aspect-square" />;
                  const isSelected = item.date === selectedDate;
                  const isToday = item.date === getTodayString();
                  const net = item.data?.net_minor ?? 0;
                  const hasTrans = (item.data?.transaction_count ?? 0) > 0;

                  return (
                    <button
                      key={item.date}
                      onClick={() => setSelectedDate(item.date)}
                      className={`aspect-square rounded-2xl border flex flex-col items-center justify-center transition-all active:scale-95 ${
                        isSelected
                          ? "bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                          : isToday
                          ? "bg-slate-800/80 border-emerald-500/30 text-emerald-400"
                          : "bg-slate-950/40 border-white/5 text-slate-100 hover:border-slate-700"
                      }`}
                    >
                      <span className={`text-sm font-black ${isSelected ? "text-slate-950" : ""}`}>{item.day}</span>
                      {hasTrans && (
                        <span className={`text-[8px] font-black mt-0.5 leading-none ${
                          isSelected ? "text-slate-900" : net >= 0 ? "text-emerald-500" : "text-rose-500"
                        }`}>
                          {shortFormatCurrency(net)}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </Card>

        {/* Selected Day Details */}
        <div className="space-y-4">
          <header className="px-2 text-left">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
               {format(parseISO(selectedDate), "EEEE, dd MMMM", { locale: locale === "vi" ? vi : undefined })}
            </h3>
          </header>

          <Card className="p-6 bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-xl">
             <div className="grid grid-cols-2 gap-8 divide-x divide-slate-800 text-left">
                <div className="text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">{t("common.income")}</span>
                   <p className="text-lg font-black text-emerald-400">{formatCurrency(daySummary?.income_minor ?? 0)}</p>
                </div>
                <div className="text-center">
                   <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block mb-1">{t("common.expense")}</span>
                   <p className="text-lg font-black text-rose-400">{formatCurrency(daySummary?.expense_minor ?? 0)}</p>
                </div>
             </div>
          </Card>

          <div className="space-y-3 text-left">
             {dayTransactions.map((transaction) => (
               <div key={transaction.id} className="p-5 bg-slate-900/50 border border-slate-800 rounded-[2rem] flex items-center justify-between gap-4 shadow-sm hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                       transaction.type === "income" ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-800 border-white/5"
                     }`}>
                        {getCategoryIcon(transaction.category)}
                     </div>
                     <div>
                        <p className="text-sm font-black text-slate-200">{transaction.description}</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{transaction.category}</p>
                     </div>
                  </div>
                  <p className={`text-sm font-black ${transaction.type === "income" ? "text-emerald-400" : "text-rose-400"}`}>
                    {transaction.type === "income" ? "+" : "-"}{formatCurrency(transaction.amount)}
                  </p>
               </div>
             ))}
             {dayTransactions.length === 0 && !isDayLoading && (
               <div className="p-10 text-center opacity-30">
                  <Wallet className="w-10 h-10 mx-auto mb-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{t("calendar.noTrans")}</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
