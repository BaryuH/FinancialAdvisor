import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ChevronLeft, TrendingUp, TrendingDown, DollarSign, Lightbulb } from "lucide-react";
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
  balance: number;
};

const BAR_COLORS = ["#22c55e", "#06b6d4", "#8b5cf6", "#f59e0b", "#ef4444", "#3b82f6"];

export function Reports() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [anchorDate, setAnchorDate] = useState(new Date().toISOString().slice(0, 10));
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
      const summaryNet = toSafeNumber(response.summary?.net_minor);
      const summarySavingsRate = toSafeNumber(response.summary?.savings_rate_percent);

      setTotalIncome(summaryIncome);
      setTotalExpense(summaryExpense);
      setBalance(summaryNet);
      setSavingsRatePercent(summarySavingsRate);

      const mappedExpenseByCategory = (response.expense_by_category ?? [])
        .map((item, index) => ({
          name: String(item.category_name ?? "").trim(),
          value: toSafeNumber(item.amount_minor),
          percent: toSafeNumber(item.percent),
          color: BAR_COLORS[index % BAR_COLORS.length],
        }))
        .filter((item) => item.name !== "" && item.value > 0);

      setExpenseByCategory(mappedExpenseByCategory);

      const mappedIncomeExpenseSeries = (response.income_expense_series ?? [])
        .map((item) => ({
          label: String(item.label ?? "").trim(),
          income: toSafeNumber(item.income_minor),
          expense: toSafeNumber(item.expense_minor),
        }))
        .filter((item) => item.label !== "" && (item.income !== 0 || item.expense !== 0));

      setIncomeExpenseSeries(mappedIncomeExpenseSeries);

      const mappedCashFlowSeries = (response.cash_flow_series ?? [])
        .map((item) => ({
          date: String(item.label ?? "").trim(),
          balance: toSafeNumber(item.net_minor),
        }))
        .filter((item) => item.date !== "" && item.balance !== 0);

      setCashFlowData(mappedCashFlowSeries);

      setInsights(Array.isArray(response.insights) ? response.insights.filter(Boolean) : []);
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
          <h1 className="text-2xl">Báo cáo & Thống kê</h1>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" />
              <p className="text-xs opacity-90">Thu nhập</p>
            </div>
            <p className="text-lg">{isLoading ? "..." : shortFormatCurrency(totalIncome)}</p>
          </Card>

          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4" />
              <p className="text-xs opacity-90">Chi tiêu</p>
            </div>
            <p className="text-lg">{isLoading ? "..." : shortFormatCurrency(totalExpense)}</p>
          </Card>

          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-4">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="w-4 h-4" />
              <p className="text-xs opacity-90">Còn lại</p>
            </div>
            <p className="text-lg">{isLoading ? "..." : shortFormatCurrency(balance)}</p>
          </Card>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 space-y-3">
          <div className="flex gap-2">
            <Button
              variant={period === "week" ? "default" : "outline"}
              onClick={() => setPeriod("week")}
              className={
                period === "week"
                  ? "h-11 min-w-20 text-sm"
                  : "h-11 min-w-20 text-sm border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
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
                  : "h-11 min-w-20 text-sm border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
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
                  : "h-11 min-w-20 text-sm border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800"
              }
            >
              Quý
            </Button>
          </div>

          <input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
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
                    <p className="text-sm text-slate-100">{item.date}</p>
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