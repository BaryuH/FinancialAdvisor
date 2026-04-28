import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Lightbulb, ChevronLeft, ChevronRight, CalendarDays, BarChart3, PieChart, Activity, Target, Zap } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import { format, addWeeks, addMonths, addQuarters, parseISO, isValid } from "date-fns";
import { vi } from "date-fns/locale";
import {
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import { toast } from "sonner";
import { getReportsOverview, ReportPeriod } from "../lib/api/reports";
import { getTodayString } from "../lib/dates";
import { useLocale } from "../lib/locale";

type ExpenseCategoryChartItem = {
  name: string;
  value: number;
  percent: number;
  color: string;
};

type IncomeExpenseChartItem = {
  label: string;
  income: number;
  expense: number;
};

type CashFlowChartItem = {
  label: string;
  balance: number;
};

const BAR_COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

export function Reports() {
  const { t, locale } = useLocale();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [anchorDate, setAnchorDate] = useState(getTodayString());
  const [isLoading, setIsLoading] = useState(true);

  const PERIOD_LABEL: Record<ReportPeriod, string> = {
    week: t("nav.week") || "Tuần",
    month: t("nav.month") || "Tháng",
    quarter: t("nav.quarter") || "Quý",
  };

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [savingsRatePercent, setSavingsRatePercent] = useState(0);

  const [expenseByCategory, setExpenseByCategory] = useState<ExpenseCategoryChartItem[]>([]);
  const [incomeExpenseSeries, setIncomeExpenseSeries] = useState<IncomeExpenseChartItem[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowChartItem[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const chartFontFamily = "Inter, ui-sans-serif, system-ui";

  const toSafeNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(toSafeNumber(amount)) + " đ";
  };

  const shortFormatCurrency = (amount: number) => {
    const val = toSafeNumber(amount);
    const absVal = Math.abs(val);
    const sign = val < 0 ? "-" : "";
    if (absVal >= 1000000) return `${sign}${(absVal / 1000000).toFixed(1)}tr`;
    if (absVal >= 1000) return `${sign}${(absVal / 1000).toFixed(0)}k`;
    return `${sign}${absVal}`;
  };

  const safeParseDate = (dateStr: string) => {
    if (!dateStr) return new Date();
    try {
      const d = parseISO(dateStr);
      return isValid(d) ? d : new Date();
    } catch {
      return new Date();
    }
  };

  const loadReports = async (selectedPeriod: ReportPeriod, selectedAnchorDate: string) => {
    try {
      setIsLoading(true);
      const response = await getReportsOverview(selectedPeriod, selectedAnchorDate);

      if (!response) return;

      const summary = response.summary || {};
      setTotalIncome(toSafeNumber(summary.income_minor));
      setTotalExpense(toSafeNumber(summary.expense_minor));
      setBalance(toSafeNumber(summary.balance_minor));
      setSavingsRatePercent(toSafeNumber(summary.savings_ratio_percent));
      setDateRange({ 
        start: response.start_date || selectedAnchorDate, 
        end: response.end_date || selectedAnchorDate 
      });

      setExpenseByCategory(
        (response.expense_by_category || []).map((item, i) => ({
          name: item.category_name || "Khác",
          value: toSafeNumber(item.amount_minor),
          percent: toSafeNumber(item.percentage),
          color: item.color_hex || BAR_COLORS[i % BAR_COLORS.length],
        }))
      );

      setIncomeExpenseSeries(
        (response.income_expense_series || []).map((item) => ({
          label: item.bucket_label || "",
          income: toSafeNumber(item.income_minor),
          expense: toSafeNumber(item.expense_minor),
        }))
      );

      setCashFlowData(
        (response.cash_flow_series || []).map((item) => ({
          label: item.date ? format(parseISO(item.date), "dd/MM") : "",
          balance: toSafeNumber(item.balance_minor),
        }))
      );

      const nextInsights: string[] = [];
      if (response.insights?.top_expense_category) {
        nextInsights.push(`Bạn chi nhiều nhất cho ${response.insights.top_expense_category} (${formatCurrency(response.insights.top_expense_amount_minor)})`);
      }
      if (toSafeNumber(response.insights?.average_daily_expense_minor) > 0) {
        nextInsights.push(`Trung bình mỗi ngày bạn tiêu ${formatCurrency(response.insights.average_daily_expense_minor)}`);
      }
      setInsights(nextInsights);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports(period, anchorDate);
  }, [period, anchorDate]);

  const shiftAnchorDate = (offset: number) => {
    const current = safeParseDate(anchorDate);
    let next: Date;
    if (period === "week") next = addWeeks(current, offset);
    else if (period === "month") next = addMonths(current, offset);
    else next = addQuarters(current, offset);
    setAnchorDate(format(next, "yyyy-MM-dd"));
  };

  const formattedRange = useMemo(() => {
    if (!dateRange.start || !dateRange.end) return "";
    const s = safeParseDate(dateRange.start);
    const e = safeParseDate(dateRange.end);
    return `${format(s, "dd/MM")} - ${format(e, "dd/MM/yyyy")}`;
  }, [dateRange]);

  const chartTheme = {
    font: "Inter, ui-sans-serif, system-ui",
    tick: "#94a3b8",
    grid: "#1e293b",
    tooltipBg: "#0f172a",
    tooltipBorder: "#1e293b"
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 text-slate-100 font-sans">
      <div className="px-6 pt-10 space-y-8">
        <header className="space-y-1 text-left">
          <div className="flex items-center justify-between">
            <h1 className="text-4xl font-black tracking-tighter text-white">{t("page.reports")}</h1>
            <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-emerald-500" />
            </div>
          </div>
          <p className="text-emerald-500/60 text-xs font-black uppercase tracking-[0.2em]">{formattedRange}</p>
        </header>

        {/* Hero Stats */}
        <div className="grid grid-cols-2 gap-4">
           <Card className="p-6 bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden group text-left">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-emerald-500/5 blur-3xl rounded-full" />
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("common.income")}</span>
              </div>
              <p className="text-xl font-black text-white leading-none tracking-tight">{isLoading ? "..." : formatCurrency(totalIncome)}</p>
           </Card>

           <Card className="p-6 bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden group text-left">
              <div className="absolute -right-4 -top-4 w-20 h-20 bg-rose-500/5 blur-3xl rounded-full" />
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-rose-500" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("common.expense")}</span>
              </div>
              <p className="text-xl font-black text-white leading-none tracking-tight">{isLoading ? "..." : formatCurrency(totalExpense)}</p>
           </Card>

           <Card className="p-6 bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("reports.savingsRate")}</span>
              </div>
              <p className="text-2xl font-black text-white tracking-tighter">{isLoading ? "..." : `${savingsRatePercent.toFixed(0)}%`}</p>
           </Card>

           <Card className="p-6 bg-slate-900 border-slate-800 rounded-[2.5rem] shadow-2xl relative overflow-hidden text-left border-white/5">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("reports.netBalance")}</span>
              </div>
              <p className={`text-xl font-black ${balance >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {balance > 0 ? "+" : ""}{isLoading ? "..." : shortFormatCurrency(balance)}
              </p>
           </Card>
        </div>

        {/* Period Navigation */}
        <div className="space-y-4">
           <div className="bg-slate-900/50 p-1.5 rounded-[1.5rem] border border-slate-800 flex gap-1 shadow-inner">
              {["week", "month", "quarter"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p as ReportPeriod)}
                  className={`flex-1 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    period === p ? "bg-emerald-500 text-slate-950 shadow-xl scale-100" : "text-slate-500 hover:text-slate-300 scale-95"
                  }`}
                >
                  {t(`common.${p}`)}
                </button>
              ))}
           </div>
           <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" className="rounded-2xl w-14 h-14 border-slate-800 bg-slate-900/50 transition-all active:scale-90" onClick={() => shiftAnchorDate(-1)}><ChevronLeft /></Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex-1 h-14 rounded-2xl border-slate-800 bg-slate-900/50 font-black text-xs uppercase tracking-widest">
                    <CalendarDays className="mr-3 w-5 h-5 text-emerald-500" />
                    {format(safeParseDate(anchorDate), "dd MMM yyyy", { locale: locale === "vi" ? vi : undefined })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-slate-950 border-slate-800 shadow-3xl">
                  <Calendar 
                    mode="single" 
                    selected={safeParseDate(anchorDate)} 
                    onSelect={(d) => d && setAnchorDate(format(d, "yyyy-MM-dd"))} 
                  />
                </PopoverContent>
              </Popover>
              <Button variant="outline" size="icon" className="rounded-2xl w-14 h-14 border-slate-800 bg-slate-900/50 transition-all active:scale-90" onClick={() => shiftAnchorDate(1)}><ChevronRight /></Button>
           </div>
        </div>

        {/* Charts */}
        <div className="space-y-8">
           <Card className="p-8 bg-slate-900/40 border-slate-800 rounded-[3rem] shadow-2xl">
              <div className="flex items-center justify-between mb-10">
                 <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl"><Zap className="w-5 h-5 text-emerald-400" /></div>
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{t("reports.trend")}</h3>
                 </div>
              </div>
              
              <div className="flex items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("common.income")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("common.expense")}</span>
                </div>
              </div>

              <div className="h-[400px] w-full">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center animate-pulse text-slate-700 font-black uppercase tracking-[0.3em] text-[10px]">{t("common.loading")}</div>
                ) : incomeExpenseSeries.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-800 gap-4 opacity-50">
                     <Target className="w-12 h-12" />
                     <p className="text-[10px] font-black uppercase tracking-widest">{t("common.noData")}</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={incomeExpenseSeries} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="8 8" stroke={chartTheme.grid} vertical={false} />
                      <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: chartTheme.tick, fontSize: 9, fontFamily: chartTheme.font }} 
                        interval={period === "month" ? 4 : period === "quarter" ? 1 : 0} 
                        angle={period === "quarter" ? -45 : 0}
                        textAnchor={period === "quarter" ? "end" : "middle"}
                        height={period === "quarter" ? 50 : 30}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 16, fontSize: 12 }} 
                        cursor={{ fill: 'rgba(255,255,255,0.03)', radius: 8 }}
                        formatter={(v: number) => formatCurrency(v)}
                      />
                      <Bar dataKey="income" fill="#10b981" radius={[8, 8, 0, 0]} name={t("common.income")} barSize={period === "week" ? 24 : 12} />
                      <Bar dataKey="expense" fill="#ef4444" radius={[8, 8, 0, 0]} name={t("common.expense")} barSize={period === "week" ? 24 : 12} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
           </Card>

           <Card className="p-8 bg-slate-900/40 border-slate-800 rounded-[3rem] shadow-2xl">
              <div className="flex items-center gap-3 mb-10 text-left">
                 <div className="p-2.5 bg-cyan-500/10 rounded-xl"><PieChart className="w-5 h-5 text-cyan-400" /></div>
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{t("reports.allocation")}</h3>
              </div>
              <div className="space-y-10">
                <div className="h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={expenseByCategory.slice(0, 5)} layout="vertical" margin={{ left: -20, right: 30 }}>
                         <XAxis type="number" hide />
                         <YAxis 
                            type="category" 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{ fill: chartTheme.tick, fontSize: 11, fontFamily: chartTheme.font }} 
                            width={90} 
                         />
                         <Tooltip 
                            contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 16 }} 
                            cursor={{ fill: 'transparent' }} 
                            formatter={(v: number) => formatCurrency(v)} 
                         />
                         <Bar dataKey="value" radius={[0, 15, 15, 0]} barSize={36}>
                            {expenseByCategory.slice(0, 5).map((entry, i) => <Cell key={i} fill={entry.color} />)}
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-1 gap-4">
                   {expenseByCategory.slice(0, 4).map((item, i) => (
                     <div key={i} className="flex items-center justify-between p-5 bg-slate-950/40 rounded-[2rem] border border-white/5 shadow-inner">
                        <div className="flex items-center gap-4">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 10px ${item.color}40` }} />
                           <span className="text-sm font-black text-slate-300">{item.name}</span>
                        </div>
                        <div className="text-right">
                           <p className="text-sm font-black text-white">{formatCurrency(item.value)}</p>
                           <p className="text-[10px] font-black text-slate-600 tracking-tighter">{item.percent.toFixed(1)}%</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
           </Card>

           <Card className="p-8 bg-slate-900/40 border-slate-800 rounded-[3rem] shadow-2xl">
              <div className="flex items-center gap-3 mb-10 text-left">
                 <div className="p-2.5 bg-blue-500/10 rounded-xl"><DollarSign className="w-5 h-5 text-blue-400" /></div>
                 <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">{t("reports.cashFlow")}</h3>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="4 4" stroke={chartTheme.grid} vertical={false} />
                    <XAxis 
                        dataKey="label" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: chartTheme.tick, fontSize: 10, fontFamily: chartTheme.font }} 
                    />
                    <YAxis hide />
                    <Tooltip 
                        contentStyle={{ backgroundColor: chartTheme.tooltipBg, border: `1px solid ${chartTheme.tooltipBorder}`, borderRadius: 16 }} 
                        formatter={(v: number) => formatCurrency(v)} 
                    />
                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={4} fillOpacity={1} fill="url(#colorBalance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
           </Card>
        </div>

        {/* AI Insights */}
        <div className="space-y-6 pb-12 text-left">
           <div className="flex items-center gap-3 text-amber-500 ml-4">
              <div className="p-2 bg-amber-500/10 rounded-xl"><Lightbulb className="w-5 h-5" /></div>
              <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">{t("reports.insights")}</h3>
           </div>
           <div className="space-y-4">
              {insights.map((insight, i) => (
                <div key={i} className="p-7 bg-slate-900 border border-slate-800 rounded-[2.5rem] flex gap-5 items-start shadow-2xl text-left">
                   <div className="mt-2 w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                   <p className="text-[14px] font-medium text-slate-300 leading-relaxed italic text-left">"{insight}"</p>
                </div>
              ))}
              {insights.length === 0 && !isLoading && (
                <div className="p-10 bg-slate-900/30 border border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center gap-4 opacity-30">
                   <Zap className="w-10 h-10 text-slate-800" />
                   <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.4em]">{t("reports.waiting")}</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
}
