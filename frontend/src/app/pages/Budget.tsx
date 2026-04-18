import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  ChevronLeft,
  Plus,
  Edit,
  Trash2,
  AlertTriangle,
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
  const navigate = useNavigate();

  const [budgets, setBudgets] = useState<UiBudget[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<UiBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const [formData, setFormData] = useState({
    categoryId: "",
    limit: "",
    month: currentMonth,
  });

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
    loadBudgets(currentMonth);
    loadCategories();
  }, [currentMonth]);

  const resetForm = () => {
    setFormData({
      categoryId: "",
      limit: "",
      month: currentMonth,
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
      await loadBudgets(currentMonth);
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

  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

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
          <h1 className="text-2xl font-semibold">Ngân sách</h1>
        </div>

        <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-5">
          <p className="text-base text-slate-200 mb-1">Tổng ngân sách tháng này</p>
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-2xl text-cyan-300">{formatCurrency(totalSpent)}</p>
            <p className="text-base text-slate-300">/ {formatCurrency(totalBudget)}</p>
          </div>
          <Progress value={Math.min(overallPercentage, 100)} className="h-3 bg-slate-800 [&>div]:bg-cyan-400" />
          <p className="text-sm text-slate-300 mt-3">
            Còn lại: {formatCurrency(Math.max(totalBudget - totalSpent, 0))}
          </p>
        </Card>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">Danh mục ngân sách</h2>
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                setIsDialogOpen(true);
              }}
              className="h-11 px-4 text-sm border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
            >
              <Plus className="w-4 h-4 mr-1" />
              Thêm
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="text-center py-12 text-slate-400">
            <p>Đang tải ngân sách...</p>
          </div>
        )}

        {!isLoading &&
          budgets.map((budget) => {
            const percentage = budget.usagePercent;
            const isOverBudget = percentage > 100;
            const isWarning = percentage > 80 && !isOverBudget;

            return (
              <Card key={budget.id} className="p-5 bg-slate-900 border-slate-800">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                      {getCategoryIcon(budget.category)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-100">{budget.category}</p>
                      <p className="text-sm text-slate-300 mt-0.5">
                        {formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(isOverBudget || isWarning) && (
                      <AlertTriangle className={`w-5 h-5 ${isOverBudget ? "text-red-500" : "text-yellow-500"}`} />
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-slate-300 hover:text-slate-100"
                      onClick={() => handleEdit(budget)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 text-red-400 hover:text-red-300"
                      onClick={() => handleDelete(budget.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress
                    value={Math.min(percentage, 100)}
                    className={`h-2 ${
                      isOverBudget
                        ? "[&>div]:bg-red-500"
                        : isWarning
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-emerald-500"
                    }`}
                  />
                  <div className="flex items-center justify-between text-sm">
                    <span
                      className={
                        isOverBudget ? "text-rose-400" : isWarning ? "text-amber-400" : "text-slate-300"
                      }
                    >
                      {percentage.toFixed(0)}% đã sử dụng
                    </span>
                    <span className="text-slate-300">
                      Còn lại: {formatCurrency(Math.max(budget.remaining, 0))}
                    </span>
                  </div>
                </div>

                {isOverBudget && (
                  <div className="mt-3 p-2 bg-rose-900/20 border border-rose-700/30 rounded-lg">
                    <p className="text-sm text-rose-200">
                      ⚠️ Đã vượt ngân sách {formatCurrency(Math.abs(budget.remaining))}
                    </p>
                  </div>
                )}
              </Card>
            );
          })}

        {!isLoading && budgets.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>Chưa có ngân sách nào</p>
            <p className="text-sm mt-2">Nhấn "Thêm" để tạo ngân sách mới</p>
          </div>
        )}
      </div>

      <div className="px-4 mt-6">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-base font-semibold mb-2 text-cyan-300">💡 Mẹo quản lý ngân sách</h3>
          <ul className="text-sm text-slate-200 space-y-2">
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
              <Input
                id="month"
                type="month"
                className="h-11 text-base"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
              />
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