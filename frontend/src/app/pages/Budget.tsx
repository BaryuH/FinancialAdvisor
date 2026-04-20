import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
  CalendarDays,
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
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";
import { Progress } from "../components/ui/progress";
import {
  ApiBudget,
  createBudget,
  deleteBudget,
  getBudgets,
  updateBudget,
} from "../lib/api/budgets";
import { ApiCategory, getCategories } from "../lib/api/transactions";

type UiBudget = {
  id: string;
  category: string;
  categoryId: string;
  limit: number;
  spent: number;
  remaining: number;
  usagePercent: number;
  status: string;
  month: string;
};

function mapApiBudget(item: ApiBudget): UiBudget {
  return {
    id: item.id,
    category: item.category.name,
    categoryId: item.category.id,
    limit: item.limit_minor,
    spent: item.spent_minor,
    remaining: item.remaining_minor,
    usagePercent: item.usage_percent,
    status: item.status,
    month: item.month,
  };
}

export function Budget() {
  const [budgets, setBudgets] = useState<UiBudget[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<UiBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialMonth = new Date().toISOString().slice(0, 7);
  const currentYear = new Date().getFullYear();
  const monthOptions = [
    { value: "01", label: "Tháng 1" },
    { value: "02", label: "Tháng 2" },
    { value: "03", label: "Tháng 3" },
    { value: "04", label: "Tháng 4" },
    { value: "05", label: "Tháng 5" },
    { value: "06", label: "Tháng 6" },
    { value: "07", label: "Tháng 7" },
    { value: "08", label: "Tháng 8" },
    { value: "09", label: "Tháng 9" },
    { value: "10", label: "Tháng 10" },
    { value: "11", label: "Tháng 11" },
    { value: "12", label: "Tháng 12" },
  ] as const;
  const yearOptions = useMemo(
    () => Array.from({ length: 11 }, (_, index) => currentYear - 5 + index),
    [currentYear],
  );
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const shiftSelectedMonth = (offset: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month) return;
    const next = new Date(year, month - 1 + offset, 1);
    const nextValue = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(nextValue);
  };

  const resetToCurrentMonth = () => {
    setSelectedMonth(initialMonth);
  };

  const [formData, setFormData] = useState({
    categoryId: "",
    limit: "",
    month: initialMonth,
  });

  const parseMonthValue = (value: string) => {
    const [yearPart, monthPart] = value.split("-");
    const year = Number(yearPart);
    const month = Number(monthPart);
    return {
      year: Number.isFinite(year) && year > 0 ? year : currentYear,
      month: Number.isFinite(month) && month >= 1 && month <= 12 ? month : 1,
    };
  };

  const formatMonthValue = (year: number, month: number) =>
    `${year}-${String(month).padStart(2, "0")}`;

  const selectedMonthParts = useMemo(() => parseMonthValue(selectedMonth), [selectedMonth]);
  const formMonthParts = useMemo(() => parseMonthValue(formData.month), [formData.month]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const loadBudgets = async (month: string) => {
    try {
      setIsLoading(true);
      const response = await getBudgets(month);
      setBudgets(response.items.map(mapApiBudget));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được ngân sách");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories("expense");
      setCategories(response.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh mục");
    }
  };

  useEffect(() => {
    loadBudgets(selectedMonth);
    loadCategories();
  }, [selectedMonth]);

  const resetForm = () => {
    setFormData({
      categoryId: "",
      limit: "",
      month: selectedMonth,
    });
    setEditingBudget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.categoryId || !formData.limit || !formData.month) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        category_id: formData.categoryId,
        month: formData.month,
        limit_minor: Number(formData.limit),
      };

      if (editingBudget) {
        await updateBudget(editingBudget.id, payload);
        toast.success("Cập nhật ngân sách thành công");
      } else {
        await createBudget(payload);
        toast.success("Thêm ngân sách thành công");
      }

      setIsDialogOpen(false);
      resetForm();
      await loadBudgets(formData.month);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu ngân sách thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (budget: UiBudget) => {
    setEditingBudget(budget);
    setFormData({
      categoryId: budget.categoryId,
      limit: budget.limit.toString(),
      month: budget.month,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (budgetId: string) => {
    try {
      await deleteBudget(budgetId);
      toast.success("Xóa ngân sách thành công");
      await loadBudgets(selectedMonth);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa ngân sách thất bại");
    }
  };

  const totalBudget = useMemo(
    () => budgets.reduce((sum, b) => sum + b.limit, 0),
    [budgets],
  );

  const totalSpent = useMemo(
    () => budgets.reduce((sum, b) => sum + b.spent, 0),
    [budgets],
  );

  const totalRemaining = Math.max(totalBudget - totalSpent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  const overBudgetCount = useMemo(() => budgets.filter((b) => b.usagePercent > 100).length, [budgets]);
  const warningCount = useMemo(
    () => budgets.filter((b) => b.usagePercent > 80 && b.usagePercent <= 100).length,
    [budgets],
  );
  const monthLabel = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    if (!year || !month) return selectedMonth;
    return new Date(year, month - 1, 1).toLocaleDateString("vi-VN", {
      month: "long",
      year: "numeric",
    });
  }, [selectedMonth]);
  const sortedBudgets = useMemo(
    () => [...budgets].sort((a, b) => b.usagePercent - a.usagePercent),
    [budgets],
  );

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
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
      <div className="px-4 pt-3">
        <Card className="border-border/80 bg-card p-5 text-card-foreground">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-muted-foreground">Tổng ngân sách</p>
              <p className="text-xs text-muted-foreground capitalize">{monthLabel}</p>
            </div>
            <div className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-700 dark:text-emerald-300">
              {overallPercentage.toFixed(0)}% đã dùng
            </div>
          </div>

          <div className="mb-4 flex items-baseline gap-2">
            <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalSpent)}</p>
            <p className="text-sm text-muted-foreground">/ {formatCurrency(totalBudget)}</p>
          </div>

          <Progress value={Math.min(overallPercentage, 100)} className="h-2.5 bg-muted [&>div]:bg-primary" />

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg border border-border/70 bg-muted/45 px-2.5 py-2">
              <p className="text-[11px] text-muted-foreground">Còn lại</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{formatCurrency(totalRemaining)}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/45 px-2.5 py-2">
              <p className="text-[11px] text-muted-foreground">Cảnh báo</p>
              <p className="mt-0.5 text-sm font-medium text-amber-600 dark:text-amber-400">{warningCount}</p>
            </div>
            <div className="rounded-lg border border-border/70 bg-muted/45 px-2.5 py-2">
              <p className="text-[11px] text-muted-foreground">Vượt ngân sách</p>
              <p className="mt-0.5 text-sm font-medium text-rose-600 dark:text-rose-400">{overBudgetCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 px-4">
        <div className="sticky top-0 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => shiftSelectedMonth(-1)}
              aria-label="Tháng trước"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="relative flex-1">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <div className="grid grid-cols-2 gap-2 rounded-md border border-border/80 bg-card p-1 pl-9">
                <Select
                  value={String(selectedMonthParts.month).padStart(2, "0")}
                  onValueChange={(value) =>
                    setSelectedMonth(formatMonthValue(selectedMonthParts.year, Number(value)))
                  }
                >
                  <SelectTrigger className="h-8 border-none bg-transparent px-2 text-xs shadow-none focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(selectedMonthParts.year)}
                  onValueChange={(value) =>
                    setSelectedMonth(formatMonthValue(Number(value), selectedMonthParts.month))
                  }
                >
                  <SelectTrigger className="h-8 border-none bg-transparent px-2 text-xs shadow-none focus-visible:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={() => shiftSelectedMonth(1)}
              aria-label="Tháng sau"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="mt-2 flex items-center justify-between gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={resetToCurrentMonth}
              className="h-8 px-2 text-xs text-muted-foreground"
            >
              Về tháng hiện tại
            </Button>
            <Button
              variant="default"
              onClick={openCreateDialog}
              className="h-10 shrink-0 px-3 text-sm font-medium"
            >
              <Plus className="mr-1 h-4 w-4" />
              Thêm
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Danh mục ngân sách theo tháng đã chọn</p>
        </div>
      </div>

      <div className="px-4 mt-4 space-y-4">
        {isLoading && (
          <Card className="border-border/80 bg-card px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">Đang tải ngân sách...</p>
          </Card>
        )}

        {!isLoading &&
          sortedBudgets.map((budget) => {
            const percentage = budget.usagePercent;
            const isOverBudget = percentage > 100;
            const isWarning = percentage > 80 && !isOverBudget;
            const statusLabel = isOverBudget ? "Vượt hạn mức" : isWarning ? "Cần chú ý" : "Ổn định";
            const statusClass = isOverBudget
              ? "text-rose-700 bg-rose-500/10 border-rose-500/30 dark:text-rose-300"
              : isWarning
                ? "text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-amber-300"
                : "text-emerald-700 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-300";

            return (
              <Card key={budget.id} className="border-border/80 bg-card p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border/70 bg-muted/45">
                      {getCategoryIcon(budget.category)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{budget.category}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(budget)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={`h-2 bg-muted ${
                      isOverBudget
                        ? "[&>div]:bg-rose-500"
                        : isWarning
                          ? "[&>div]:bg-amber-500"
                          : "[&>div]:bg-emerald-500"
                    }`}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span className={isOverBudget ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground"}>
                      {percentage.toFixed(0)}% đã sử dụng
                    </span>
                    <span className="text-muted-foreground">
                      Còn lại: {formatCurrency(Math.max(budget.remaining, 0))}
                    </span>
                  </div>
                </div>

                {isOverBudget && (
                  <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 p-2">
                    <p className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="h-4 w-4 shrink-0" />
                      <span>Đã vượt ngân sách {formatCurrency(Math.abs(budget.remaining))}</span>
                    </p>
                  </div>
                )}
              </Card>
            );
          })}

        {!isLoading && budgets.length === 0 && (
          <Card className="border-border/80 bg-card px-4 py-8 text-center">
            <p className="text-foreground">Chưa có ngân sách nào</p>
            <p className="mt-2 text-sm text-muted-foreground">Thử nhấn "Thêm" để tạo ngân sách cho tháng này</p>
          </Card>
        )}
      </div>

      <div className="px-4 mt-6">
        <Card className="p-4 bg-card border border-border">
          <h3 className="text-base font-semibold mb-2 text-foreground flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-primary shrink-0" />
            Mẹo quản lý ngân sách
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Áp dụng quy tắc 50/30/20: 50% nhu cầu, 30% mong muốn, 20% tiết kiệm</li>
            <li>• Theo dõi chi tiêu hàng ngày để kiểm soát ngân sách</li>
            <li>• Đặt cảnh báo khi đạt 80% ngân sách</li>
          </ul>
        </Card>
      </div>

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBudget ? "Sửa ngân sách" : "Thêm ngân sách mới"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Danh mục</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="h-11 text-base">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="month">Tháng</Label>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <Select
                  value={String(formMonthParts.month).padStart(2, "0")}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      month: formatMonthValue(formMonthParts.year, Number(value)),
                    })
                  }
                >
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={String(formMonthParts.year)}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      month: formatMonthValue(Number(value), formMonthParts.month),
                    })
                  }
                >
                  <SelectTrigger className="h-11 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={String(year)}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="limit">Hạn mức (VNĐ)</Label>
              <Input
                id="limit"
                type="number"
                placeholder="0"
                className="h-11 text-base"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-11 text-sm"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1 h-11 text-sm" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : editingBudget ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}