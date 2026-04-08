import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { mockBudgets, categories, Budget as BudgetType } from "../lib/mockData";
import {
  ChevronLeft,
  Plus,
  Edit,
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

export function Budget() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState<BudgetType[]>(mockBudgets);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetType | null>(null);
  
  const [formData, setFormData] = useState({
    category: "",
    limit: "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.limit) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingBudget) {
      setBudgets(budgets.map(b => 
        b.id === editingBudget.id
          ? { ...b, category: formData.category, limit: parseFloat(formData.limit) }
          : b
      ));
      toast.success("Cập nhật ngân sách thành công");
    } else {
      const newBudget: BudgetType = {
        id: Date.now().toString(),
        category: formData.category,
        limit: parseFloat(formData.limit),
        spent: 0,
        month: new Date().toISOString().slice(0, 7),
      };
      setBudgets([...budgets, newBudget]);
      toast.success("Thêm ngân sách thành công");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (budget: BudgetType) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      limit: budget.limit.toString(),
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: "",
      limit: "",
    });
    setEditingBudget(null);
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const overallPercentage = (totalSpent / totalBudget) * 100;

  const getCategoryIcon = (categoryName: string) => {
    const iconName = categories.find((c) => c.name === categoryName)?.icon;
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
          <h1 className="text-2xl font-semibold">Ngân sách</h1>
        </div>

        {/* Overall Budget */}
        <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-5">
          <p className="text-base text-slate-200 mb-1">Tổng ngân sách tháng này</p>
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-2xl text-cyan-300">{formatCurrency(totalSpent)}</p>
            <p className="text-base text-slate-300">/ {formatCurrency(totalBudget)}</p>
          </div>
          <Progress value={overallPercentage} className="h-3 bg-slate-800 [&>div]:bg-cyan-400" />
          <p className="text-sm text-slate-300 mt-3">
            Còn lại: {formatCurrency(totalBudget - totalSpent)}
          </p>
        </Card>
      </div>

      {/* Budget Categories */}
      <div className="px-4 mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-100">Danh mục ngân sách</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800"
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm
          </Button>
        </div>

        {budgets.map((budget) => {
          const percentage = (budget.spent / budget.limit) * 100;
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
                    className="h-8 w-8 text-slate-300 hover:text-slate-100"
                    onClick={() => handleEdit(budget)}
                  >
                    <Edit className="w-4 h-4" />
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
                  <span className={
                    isOverBudget ? "text-rose-400" : isWarning ? "text-amber-400" : "text-slate-300"
                  }>
                    {percentage.toFixed(0)}% đã sử dụng
                  </span>
                  <span className="text-slate-300">
                    Còn lại: {formatCurrency(Math.max(budget.limit - budget.spent, 0))}
                  </span>
                </div>
              </div>

              {isOverBudget && (
                <div className="mt-3 p-2 bg-rose-900/20 border border-rose-700/30 rounded-lg">
                  <p className="text-sm text-rose-200">
                    ⚠️ Đã vượt ngân sách {formatCurrency(budget.spent - budget.limit)}
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        {budgets.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>Chưa có ngân sách nào</p>
            <p className="text-sm mt-2">Nhấn "Thêm" để tạo ngân sách mới</p>
          </div>
        )}
      </div>

      {/* Tips */}
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

      {/* Add/Edit Budget Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Sửa ngân sách" : "Thêm ngân sách mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="category">Danh mục</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => !["Tiền lương", "Đầu tư"].includes(c.name))
                    .map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="limit">Hạn mức (VNĐ)</Label>
              <Input
                id="limit"
                type="number"
                placeholder="0"
                value={formData.limit}
                onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1">
                {editingBudget ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
