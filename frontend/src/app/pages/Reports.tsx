import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { TrendingUp, TrendingDown, DollarSign, Lightbulb, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";
import { Calendar } from "../components/ui/calendar";
import {
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { toast } from "sonner";
import { getReportsOverview, ReportPeriod } from "../lib/api/reports";

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
  date: string;
  label: string;
  balance: number;
};

const BAR_COLORS = ["#22c55e", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6"];

const PERIOD_LABEL: Record<ReportPeriod, string> = {
  week: "Tuần",
  month: "Tháng",
  quarter: "Quý",
};

export function Reports() {
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const today = new Date().toISOString().slice(0, 10);
  const [anchorDate, setAnchorDate] = useState(today);
  const [isLoading, setIsLoading] = useState(true);

  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [balance, setBalance] = useState(0);
  const [savingsRatePercent, setSavingsRatePercent] = useState(0);

  const [expenseByCategory, setExpenseByCategory] = useState<ExpenseCategoryChartItem[]>([]);
  const [incomeExpenseSeries, setIncomeExpenseSeries] = useState<IncomeExpenseChartItem[]>([]);
  const [cashFlowData, setCashFlowData] = useState<CashFlowChartItem[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const chartFontFamily =
    "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, Apple Color Emoji, Segoe UI Emoji";

  const axisTick = {
    fill: "#94a3b8",
    fontSize: 12,
    fontFamily: chartFontFamily,
  } as const;

  const tooltipStyle = {
    backgroundColor: "#0b1220",
    border: "1px solid rgba(148, 163, 184, 0.25)",
    borderRadius: 10,
    fontFamily: chartFontFamily,
    fontSize: 12,
  } as const;

  const legendStyle = {
    color: "#cbd5e1",
    fontFamily: chartFontFamily,
    fontSize: 12,
  } as const;

  const toSafeNumber = (value: unknown) => {
    const num = Number(value);
    return Number.isFinite(num) ? num : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(toSafeNumber(amount));
  };

  const formatShortDateLabel = (isoDate: string) => {
    const parsed = new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return isoDate;
    return parsed.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  const shortFormatCurrency = (amount: number) => {
    const safeAmount = toSafeNumber(amount);
    if (safeAmount >= 1000000) {
      return `${(safeAmount / 1000000).toFixed(1)}tr`;
    }
    return `${(safeAmount / 1000).toFixed(0)}k`;
  };

  const loadReports = async (selectedPeriod: ReportPeriod, selectedAnchorDate: string) => {
    try {
      setIsLoading(true);
      const response = await getReportsOverview(selectedPeriod, selectedAnchorDate);

      const summaryIncome = toSafeNumber(response.summary?.income_minor);
      const summaryExpense = toSafeNumber(response.summary?.expense_minor);
      const summaryBalance = toSafeNumber(response.summary?.balance_minor);
      const summarySavingsRate = toSafeNumber(response.summary?.savings_ratio_percent);

      setTotalIncome(summaryIncome);
      setTotalExpense(summaryExpense);
      setBalance(summaryBalance);
      setSavingsRatePercent(summarySavingsRate);

      const mappedExpenseByCategory = (response.expense_by_category ?? [])
        .map((item, index) => ({
          name: String(item.category_name ?? "").trim(),
          value: toSafeNumber(item.amount_minor),
          percent: toSafeNumber(item.percentage),
          color: typeof item.color_hex === "string" && item.color_hex.trim() !== "" ? item.color_hex : BAR_COLORS[index % BAR_COLORS.length],
        }))
        .filter((item) => item.name !== "" && item.value > 0);

      setExpenseByCategory(mappedExpenseByCategory);

      const mappedIncomeExpenseSeries = (response.income_expense_series ?? [])
        .map((item) => ({
          label: String(item.bucket_label ?? "").trim(),
          income: toSafeNumber(item.income_minor),
          expense: toSafeNumber(item.expense_minor),
        }))
        .filter((item) => item.label !== "" && (item.income !== 0 || item.expense !== 0));

      setIncomeExpenseSeries(mappedIncomeExpenseSeries);

      const mappedCashFlowSeries = (response.cash_flow_series ?? [])
        .map((item) => ({
          date: String(item.date ?? "").trim(),
          label: formatShortDateLabel(String(item.date ?? "").trim()),
          balance: toSafeNumber(item.balance_minor),
        }))
        .filter((item) => item.date !== "");

      const hasAnyNonZeroBalance = mappedCashFlowSeries.some((item) => item.balance !== 0);
      const filteredCashFlowSeries = hasAnyNonZeroBalance
        ? mappedCashFlowSeries.filter((item) => item.balance !== 0)
        : [];

      setCashFlowData(filteredCashFlowSeries);

      const nextInsights: string[] = [];
      if (response.insights?.top_expense_category && toSafeNumber(response.insights.top_expense_amount_minor) > 0) {
        nextInsights.push(
          `Danh mục chi tiêu lớn nhất: ${response.insights.top_expense_category} (${formatCurrency(
            toSafeNumber(response.insights.top_expense_amount_minor)
          )}).`
        );
      }
      if (toSafeNumber(response.insights?.average_daily_expense_minor) > 0) {
        nextInsights.push(
          `Chi tiêu trung bình mỗi ngày: ${formatCurrency(toSafeNumber(response.insights.average_daily_expense_minor))}.`
        );
      }
      setInsights(nextInsights);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports(period, anchorDate);
  }, [period, anchorDate]);

  const averageIncomePerPoint = useMemo(() => {
    if (incomeExpenseSeries.length === 0) return 0;
    return totalIncome / incomeExpenseSeries.length;
  }, [totalIncome, incomeExpenseSeries.length]);

  const averageExpensePerPoint = useMemo(() => {
    if (incomeExpenseSeries.length === 0) return 0;
    return totalExpense / incomeExpenseSeries.length;
  }, [totalExpense, incomeExpenseSeries.length]);

  const savingsRateText = `${toSafeNumber(savingsRatePercent).toFixed(1)}%`;
  const anchorDateLabel = useMemo(() => {
    const date = new Date(anchorDate);
    if (Number.isNaN(date.getTime())) return anchorDate;
    const base = date.toLocaleDateString("vi-VN", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return `${PERIOD_LABEL[period]} neo: ${base}`;
  }, [anchorDate, period]);
  const anchorDateDisplay = useMemo(() => {
    const date = new Date(anchorDate);
    if (Number.isNaN(date.getTime())) return anchorDate;
    return date.toLocaleDateString("vi-VN");
  }, [anchorDate]);
  const selectedAnchorDate = useMemo(() => {
    const date = new Date(anchorDate);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }, [anchorDate]);

  const shiftAnchorDate = (offset: number) => {
    const date = new Date(anchorDate);
    if (Number.isNaN(date.getTime())) return;
    const next = new Date(date);
    if (period === "week") {
      next.setDate(next.getDate() + offset * 7);
    } else if (period === "month") {
      next.setMonth(next.getMonth() + offset);
    } else {
      next.setMonth(next.getMonth() + offset * 3);
    }
    setAnchorDate(next.toISOString().slice(0, 10));
  };

  return (
    <div className="max-w-md mx-auto min-h-screen pb-6">
      <div className="px-4 pt-3 pb-4 text-foreground border-b border-border">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-card border border-border text-card-foreground">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Thu nhập</p>
            </div>
            <p className="text-lg font-medium">{isLoading ? "..." : shortFormatCurrency(totalIncome)}</p>
          </Card>

          <Card className="p-4 bg-card border border-border text-card-foreground">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-destructive" />
              <p className="text-xs text-muted-foreground">Chi tiêu</p>
            </div>
            <p className="text-lg font-medium">{isLoading ? "..." : shortFormatCurrency(totalExpense)}</p>
          </Card>

          <Card className="p-4 bg-card border border-border text-card-foreground">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground">Còn lại</p>
            </div>
            <p className="text-lg font-medium">{isLoading ? "..." : shortFormatCurrency(balance)}</p>
          </Card>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-background/90 backdrop-blur-md border-b border-border space-y-3">
          <div className="flex gap-2">
            <Button
              variant={period === "week" ? "default" : "outline"}
              onClick={() => setPeriod("week")}
              className={
                period === "week"
                  ? "h-11 min-w-20 text-sm"
                  : "h-11 min-w-20 text-sm border-border bg-card text-foreground hover:bg-muted"
              }
            >
              Tuần
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              onClick={() => setPeriod("month")}
              className={
                period === "month"
                  ? "h-11 min-w-20 text-sm"
                  : "h-11 min-w-20 text-sm border-border bg-card text-foreground hover:bg-muted"
              }
            >
              Tháng
            </Button>
            <Button
              variant={period === "quarter" ? "default" : "outline"}
              onClick={() => setPeriod("quarter")}
              className={
                period === "quarter"
                  ? "h-11 min-w-20 text-sm"
                  : "h-11 min-w-20 text-sm border-border bg-card text-foreground hover:bg-muted"
              }
            >
              Quý
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => shiftAnchorDate(-1)}
                aria-label="Lùi kỳ"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="relative flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 w-full justify-start gap-2 border-border bg-card px-3 text-left text-sm font-normal hover:bg-muted"
                    >
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">{anchorDateDisplay}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedAnchorDate}
                      onSelect={(date) => {
                        if (!date) return;
                        setAnchorDate(date.toISOString().slice(0, 10));
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-10 w-10 shrink-0"
                onClick={() => shiftAnchorDate(1)}
                aria-label="Tiến kỳ"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setAnchorDate(today)}
                className="h-8 px-2 text-xs text-muted-foreground"
              >
                Về hôm nay
              </Button>
              <span className="text-xs text-muted-foreground">{anchorDateLabel}</span>
            </div>
          </div>
        </div>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-base mb-4 text-slate-100">Cơ cấu chi tiêu theo danh mục</h3>

          {isLoading && <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>}

          {!isLoading && expenseByCategory.length === 0 && (
            <p className="text-sm text-slate-400">Không có dữ liệu danh mục</p>
          )}

          {!isLoading && expenseByCategory.length > 0 && (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={expenseByCategory.slice(0, 6)}
                  layout="vertical"
                  margin={{ top: 8, right: 12, bottom: 8, left: 12 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.15)" />
                  <XAxis
                    type="number"
                    tick={axisTick}
                    tickFormatter={(value) => shortFormatCurrency(Number(value))}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                    tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={axisTick}
                    axisLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                    tickLine={{ stroke: "rgba(148, 163, 184, 0.25)" }}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    itemStyle={{ color: "#e2e8f0" }}
                    labelStyle={{ color: "#cbd5e1" }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="value" name="Chi tiêu" radius={[8, 8, 8, 8]}>
                    {expenseByCategory.slice(0, 6).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <p className="mt-2 text-sm text-slate-400">
                Hiển thị {Math.min(expenseByCategory.length, 6)} danh mục chi tiêu cao nhất.
              </p>
            </>
          )}
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-base mb-4 text-slate-100">Chi tiết danh mục</h3>

          {isLoading && <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>}

          {!isLoading && expenseByCategory.length === 0 && (
            <p className="text-sm text-slate-400">Không có dữ liệu chi tiết danh mục</p>
          )}

          {!isLoading && expenseByCategory.length > 0 && (
            <div className="space-y-3">
              {expenseByCategory.map((item, index) => (
                <div key={`${item.name}-${index}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-slate-100">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-100">{formatCurrency(item.value)}</p>
                    <p className="text-sm text-slate-400">{toSafeNumber(item.percent).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-base mb-4 text-slate-100">Thu chi theo kỳ</h3>

          {isLoading && <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>}

          {!isLoading && incomeExpenseSeries.length === 0 && (
            <p className="text-sm text-slate-400">Không có dữ liệu thu chi</p>
          )}

          {!isLoading && incomeExpenseSeries.length > 0 && (
            <div className="space-y-4">
              {incomeExpenseSeries.map((item) => (
                <Card key={item.label} className="p-4 bg-slate-950 border-slate-800">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-slate-100">{item.label}</p>
                    <div className="text-right">
                      <p className="text-xs text-emerald-300">Thu: {formatCurrency(item.income)}</p>
                      <p className="text-xs text-rose-300">Chi: {formatCurrency(item.expense)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">Thu nhập</p>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-emerald-500"
                          style={{
                            width: `${
                              Math.max(...incomeExpenseSeries.map((x) => Math.max(x.income, x.expense)), 1) > 0
                                ? (item.income /
                                    Math.max(...incomeExpenseSeries.map((x) => Math.max(x.income, x.expense)), 1)) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-slate-400 mb-1">Chi tiêu</p>
                      <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-rose-500"
                          style={{
                            width: `${
                              Math.max(...incomeExpenseSeries.map((x) => Math.max(x.income, x.expense)), 1) > 0
                                ? (item.expense /
                                    Math.max(...incomeExpenseSeries.map((x) => Math.max(x.income, x.expense)), 1)) *
                                  100
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-base mb-4 text-slate-100">Dòng tiền ròng</h3>

          {isLoading && <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>}

          {!isLoading && cashFlowData.length === 0 && (
            <p className="text-sm text-slate-400">Không có dữ liệu dòng tiền</p>
          )}

          {!isLoading && cashFlowData.length > 0 && (
            <div className="space-y-3">
              {cashFlowData.map((item) => (
                <div key={item.date}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-slate-100">{item.label}</p>
                    <p className={`text-sm ${item.balance >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                      {formatCurrency(item.balance)}
                    </p>
                  </div>

                  <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full ${item.balance >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                      style={{
                        width: `${
                          Math.max(...cashFlowData.map((x) => Math.abs(x.balance)), 1) > 0
                            ? (Math.abs(item.balance) / Math.max(...cashFlowData.map((x) => Math.abs(x.balance)), 1)) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="px-0 mt-6">
          <h2 className="text-lg mb-3 text-slate-100 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-300" />
            Nhận xét
          </h2>

          <Card className="p-4 space-y-3 bg-slate-900 border-slate-800">
            {isLoading && <p className="text-sm text-slate-400">Đang tải nhận định...</p>}

            {!isLoading && insights.length === 0 && (
              <p className="text-sm text-slate-400">Chưa có nhận định nào</p>
            )}

            {!isLoading &&
              insights.map((insight, index) => (
                <div
                  key={`${index}-${insight}`}
                  className="p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg"
                >
                  <p className="text-sm text-slate-300">{insight}</p>
                </div>
              ))}

            {!isLoading && insights.length === 0 && (
              <>
                <div className="p-3 bg-emerald-900/20 border border-emerald-700/30 rounded-lg">
                  <p className="text-sm text-slate-300">
                    Tỷ lệ tiết kiệm hiện tại là {savingsRateText}.
                  </p>
                </div>

                <div className="p-3 bg-cyan-900/20 border border-cyan-700/30 rounded-lg">
                  <p className="text-sm text-slate-300">
                    Thu nhập bình quân mỗi kỳ: {formatCurrency(averageIncomePerPoint)}.
                  </p>
                </div>

                <div className="p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
                  <p className="text-sm text-slate-300">
                    Chi tiêu bình quân mỗi kỳ: {formatCurrency(averageExpensePerPoint)}.
                  </p>
                </div>
              </>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}