import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import {
  ChevronLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import {
  getReportsOverview,
  ReportPeriod,
  ReportsExpenseByCategoryItem,
  ReportsIncomeExpensePoint,
  ReportsCashFlowPoint,
} from "../lib/api/reports";

export function Reports() {
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);

  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [anchorDate, setAnchorDate] = useState(today);
  const [isLoading, setIsLoading] = useState(true);

  const [summary, setSummary] = useState({
    income: 0,
    expense: 0,
    net: 0,
    savingsRatePercent: 0,
  });

  const [expenseByCategory, setExpenseByCategory] = useState<ReportsExpenseByCategoryItem[]>([]);
  const [incomeExpenseSeries, setIncomeExpenseSeries] = useState<ReportsIncomeExpensePoint[]>([]);
  const [cashFlowSeries, setCashFlowSeries] = useState<ReportsCashFlowPoint[]>([]);
  const [insights, setInsights] = useState<string[]>([]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const loadReports = async (selectedPeriod: ReportPeriod, selectedAnchorDate: string) => {
    try {
      setIsLoading(true);
      const response = await getReportsOverview(selectedPeriod, selectedAnchorDate);

      setSummary({
        income: response.summary.income_minor,
        expense: response.summary.expense_minor,
        net: response.summary.net_minor,
        savingsRatePercent: response.summary.savings_rate_percent,
      });

      setExpenseByCategory(response.expense_by_category);
      setIncomeExpenseSeries(response.income_expense_series);
      setCashFlowSeries(response.cash_flow_series);
      setInsights(response.insights);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được báo cáo");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports(period, anchorDate);
  }, [period, anchorDate]);

  const maxCategoryAmount = useMemo(() => {
    if (expenseByCategory.length === 0) return 0;
    return Math.max(...expenseByCategory.map((item) => item.amount_minor));
  }, [expenseByCategory]);

  const maxIncomeExpenseValue = useMemo(() => {
    const values = incomeExpenseSeries.flatMap((item) => [item.income_minor, item.expense_minor]);
    if (values.length === 0) return 0;
    return Math.max(...values);
  }, [incomeExpenseSeries]);

  const maxCashFlowAbs = useMemo(() => {
    if (cashFlowSeries.length === 0) return 0;
    return Math.max(...cashFlowSeries.map((item) => Math.abs(item.net_minor)));
  }, [cashFlowSeries]);

  const periodLabel = useMemo(() => {
    switch (period) {
      case "week":
        return "Tuần";
      case "month":
        return "Tháng";
      case "quarter":
        return "Quý";
      default:
        return "";
    }
  }, [period]);

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
          <h1 className="text-2xl font-semibold">Báo cáo</h1>
        </div>

        <div className="flex gap-2 mb-4">
          <Button
            size="sm"
            variant={period === "week" ? "secondary" : "outline"}
            className={period === "week" ? "" : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"}
            onClick={() => setPeriod("week")}
          >
            Tuần
          </Button>
          <Button
            size="sm"
            variant={period === "month" ? "secondary" : "outline"}
            className={period === "month" ? "" : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"}
            onClick={() => setPeriod("month")}
          >
            Tháng
          </Button>
          <Button
            size="sm"
            variant={period === "quarter" ? "secondary" : "outline"}
            className={period === "quarter" ? "" : "border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"}
            onClick={() => setPeriod("quarter")}
          >
            Quý
          </Button>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-slate-300">Kỳ báo cáo</p>
            <p className="text-lg font-semibold">{periodLabel}</p>
          </div>

          <input
            type="date"
            value={anchorDate}
            onChange={(e) => setAnchorDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
          />
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-300" />
              <p className="text-xs text-slate-400">Tổng thu</p>
            </div>
            <p className="text-sm text-emerald-300">
              {isLoading ? "..." : formatCurrency(summary.income)}
            </p>
          </Card>

          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-rose-300" />
              <p className="text-xs text-slate-400">Tổng chi</p>
            </div>
            <p className="text-sm text-rose-300">
              {isLoading ? "..." : formatCurrency(summary.expense)}
            </p>
          </Card>

          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className={`w-4 h-4 ${summary.net >= 0 ? "text-cyan-300" : "text-amber-300"}`} />
              <p className="text-xs text-slate-400">Dòng tiền ròng</p>
            </div>
            <p className={`text-sm ${summary.net >= 0 ? "text-cyan-300" : "text-amber-300"}`}>
              {isLoading ? "..." : formatCurrency(summary.net)}
            </p>
          </Card>

          <Card className="p-4 bg-slate-900 border-slate-800">
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-4 h-4 text-violet-300" />
              <p className="text-xs text-slate-400">Tỷ lệ tiết kiệm</p>
            </div>
            <p className="text-sm text-violet-300">
              {isLoading ? "..." : `${summary.savingsRatePercent.toFixed(1)}%`}
            </p>
          </Card>
        </div>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4 text-cyan-300" />
            <h2 className="text-base font-semibold text-slate-100">Chi tiêu theo danh mục</h2>
          </div>

          {isLoading && <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>}

          {!isLoading && expenseByCategory.length === 0 && (
            <p className="text-sm text-slate-400">Không có dữ liệu danh mục</p>
          )}

          {!isLoading && expenseByCategory.length > 0 && (
            <div className="space-y-4">
              {expenseByCategory.map((item) => {
                const width = maxCategoryAmount > 0 ? (item.amount_minor / maxCategoryAmount) * 100 : 0;

                return (
                  <div key={item.category_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="text-sm text-slate-100">{item.category_name}</p>
                        <p className="text-xs text-slate-400">{item.percent.toFixed(1)}%</p>
                      </div>
                      <p className="text-sm text-slate-300">{formatCurrency(item.amount_minor)}</p>
                    </div>

                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-cyan-500 transition-all"
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-emerald-300" />
            <h2 className="text-base font-semibold text-slate-100">Thu nhập và chi tiêu</h2>
          </div>

          {isLoading && <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>}

          {!isLoading && incomeExpenseSeries.length === 0 && (
            <p className="text-sm text-slate-400">Không có dữ liệu chuỗi thời gian</p>
          )}

          {!isLoading && incomeExpenseSeries.length > 0 && (
            <div className="space-y-4">
              {incomeExpenseSeries.map((item) => {
                const incomeWidth =
                  maxIncomeExpenseValue > 0 ? (item.income_minor / maxIncomeExpenseValue) * 100 : 0;
                const expenseWidth =
                  maxIncomeExpenseValue > 0 ? (item.expense_minor / maxIncomeExpenseValue) * 100 : 0;

                return (
                  <div key={item.label} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm text-slate-100">{item.label}</p>
                      <div className="text-right">
                        <p className="text-xs text-emerald-300">Thu: {formatCurrency(item.income_minor)}</p>
                        <p className="text-xs text-rose-300">Chi: {formatCurrency(item.expense_minor)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Thu nhập</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${incomeWidth}%` }} />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                          <span>Chi tiêu</span>
                        </div>
                        <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="h-full bg-rose-500" style={{ width: `${expenseWidth}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-amber-300" />
            <h2 className="text-base font-semibold text-slate-100">Dòng tiền ròng</h2>
          </div>

          {isLoading && <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>}

          {!isLoading && cashFlowSeries.length === 0 && (
            <p className="text-sm text-slate-400">Không có dữ liệu dòng tiền</p>
          )}

          {!isLoading && cashFlowSeries.length > 0 && (
            <div className="space-y-3">
              {cashFlowSeries.map((item) => {
                const width = maxCashFlowAbs > 0 ? (Math.abs(item.net_minor) / maxCashFlowAbs) * 100 : 0;

                return (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-slate-100">{item.label}</p>
                      <p className={`text-sm ${item.net_minor >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                        {formatCurrency(item.net_minor)}
                      </p>
                    </div>

                    <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full ${item.net_minor >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                        style={{ width: `${width}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card className="p-5 bg-slate-900 border-slate-800">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-4 h-4 text-yellow-300" />
            <h2 className="text-base font-semibold text-slate-100">Nhận định</h2>
          </div>

          {isLoading && <p className="text-sm text-slate-400">Đang tải nhận định...</p>}

          {!isLoading && insights.length === 0 && (
            <p className="text-sm text-slate-400">Chưa có nhận định nào</p>
          )}

          {!isLoading && insights.length > 0 && (
            <ul className="space-y-3">
              {insights.map((insight, index) => (
                <li
                  key={`${index}-${insight}`}
                  className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-200"
                >
                  {insight}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}