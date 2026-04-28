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
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";
import { useLocale } from "../lib/locale";
import { getTodayString } from "../lib/dates";

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
  const navigate = React.useCallback(() => {}, []); // dummy for logic
  const { t, locale } = useLocale();
  const [budgets, setBudgets] = useState<UiBudget[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<UiBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialMonth = getTodayString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

  const shiftSelectedMonth = (offset: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const next = new Date(year, month - 1 + offset, 1);
    setSelectedMonth(format(next, "yyyy-MM"));
  };

  const [formData, setFormData] = useState({
    categoryId: "",
    limit: "",
    month: initialMonth,
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const loadBudgets = async (month: string) => {
    try {
      setIsLoading(true);
      const response = await getBudgets(month);
      setBudgets(response.items.map(mapApiBudget));
    } catch (error) {
      toast.error(t("common.noData"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await getCategories("expense");
      setCategories(response.items);
    } catch (error) {
      toast.error(t("common.noData"));
    }
  };

  useEffect(() => {
    loadBudgets(selectedMonth);
    loadCategories();
  }, [selectedMonth]);

  const resetForm = () => {
    setFormData({ categoryId: "", limit: "", month: selectedMonth });
    setEditingBudget(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId || !formData.limit) {
      toast.error("Vui lòng điền đủ thông tin");
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
        toast.success(t("common.done"));
      } else {
        await createBudget(payload);
        toast.success(t("common.done"));
      }
      setIsDialogOpen(false);
      resetForm();
      await loadBudgets(selectedMonth);
    } catch (error) {
      toast.error("Lỗi");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      toast.success(t("common.done"));
      await loadBudgets(selectedMonth);
    } catch (error) {
      toast.error("Lỗi");
    }
  };

  const totalBudget = useMemo(() => budgets.reduce((sum, b) => sum + b.limit, 0), [budgets]);
  const totalSpent = useMemo(() => budgets.reduce((sum, b) => sum + b.spent, 0), [budgets]);
  const totalRemaining = Math.max(totalBudget - totalSpent, 0);
  const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  const monthLabel = useMemo(() => {
    const loc = locale === "en" ? undefined : vi;
    return format(parseISO(`${selectedMonth}-01`), "MMMM yyyy", { locale: loc });
  }, [selectedMonth, locale]);

  const sortedBudgets = useMemo(() => [...budgets].sort((a, b) => b.usagePercent - a.usagePercent), [budgets]);

  const getCategoryIcon = (name: string) => {
    const iconName = categories.find((c) => c.name === name)?.icon_key;
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
    <div className="max-w-md mx-auto min-h-screen pb-24 text-slate-100">
      <div className="px-4 pt-6 space-y-6">
        <header className="text-left">
          <p className="text-xs font-medium text-emerald-500 uppercase tracking-wider mb-1">{t("budget.setup")}</p>
          <h1 className="text-2xl font-bold text-slate-100 capitalize">{monthLabel}</h1>
        </header>

        {/* Tổng quan Ngân sách */}
        <Card className="p-5 bg-slate-900 border-slate-800 text-left">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-base font-semibold text-slate-100">{t("dashboard.budget")}</p>
              <p className="text-sm text-slate-400 mt-1">
                {t("common.spent")} {overallPercentage.toFixed(0)}%
              </p>
            </div>
            <div className={`p-2 rounded-xl ${overallPercentage > 100 ? "bg-rose-500/10 text-rose-400" : "bg-cyan-500/10 text-cyan-400"}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="font-bold text-white">{formatCurrency(totalSpent)}</span>
              <span className="text-slate-400">{formatCurrency(totalBudget)}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className={`h-full transition-all ${overallPercentage > 100 ? "bg-rose-500" : "bg-cyan-400"}`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800 mt-4">
             <span className="text-xs text-slate-400">{t("common.remaining")}:</span>
             <span className={`text-sm font-bold ${totalRemaining > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {formatCurrency(totalRemaining)}
             </span>
          </div>
        </Card>

        {/* Điều hướng tháng */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="icon" onClick={() => shiftSelectedMonth(-1)} className="hover:bg-slate-800"><ChevronLeft /></Button>
          <Button variant="outline" className="flex-1 border-slate-800 bg-slate-900 font-semibold text-sm h-11" onClick={() => setSelectedMonth(getTodayString().slice(0, 7))}>
            {t("budget.currentMonth")}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => shiftSelectedMonth(1)} className="hover:bg-slate-800"><ChevronRight /></Button>
        </div>

        {/* Danh sách ngân sách */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t("budget.details")}</h2>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full h-8 px-4">
              <Plus className="w-4 h-4 mr-1" /> {t("common.add")}
            </Button>
          </div>

          {isLoading ? (
            <p className="text-center py-10 text-slate-500 text-sm italic">{t("common.loading")}</p>
          ) : budgets.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed border-slate-800 rounded-3xl opacity-40">
               <Wallet className="w-10 h-10 mx-auto mb-2" />
               <p className="text-xs font-bold uppercase tracking-widest">{t("common.noData")}</p>
            </div>
          ) : (
            budgets.map((budget) => {
              const isOver = budget.usagePercent > 100;
              return (
                <Card key={budget.id} className="p-4 bg-slate-900 border-slate-800 text-left">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center border border-slate-700">
                        {getCategoryIcon(budget.category)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-100">{budget.category}</p>
                        <p className="text-xs text-slate-400">{formatCurrency(budget.spent)} / {formatCurrency(budget.limit)}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400" onClick={() => { setEditingBudget(budget); setFormData({ categoryId: budget.categoryId, limit: budget.limit.toString(), month: budget.month }); setIsDialogOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500/70" onClick={() => handleDelete(budget.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Progress value={Math.min(budget.usagePercent, 100)} className={`h-1.5 bg-slate-800 ${isOver ? "[&>div]:bg-rose-500" : "[&>div]:bg-cyan-400"}`} />
                  {isOver && (
                    <p className="mt-2 text-[10px] font-bold text-rose-400 flex items-center gap-1">
                       <AlertTriangle className="w-3 h-3" /> {t("budget.overLimit")} {formatCurrency(Math.abs(budget.remaining))}
                    </p>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Tips Section */}
        <Card className="p-4 bg-slate-900/50 border-slate-800 text-left">
          <h3 className="text-sm font-bold mb-3 text-slate-100 flex items-center gap-2 uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-emerald-400" /> {t("budget.tips")}
          </h3>
          <ul className="text-xs text-slate-400 space-y-2 leading-relaxed">
            <li>• Quy tắc 50/30/20: 50% nhu cầu, 30% mong muốn, 20% tiết kiệm.</li>
            <li>• Theo dõi chi tiêu hàng ngày để kiểm soát ngân sách tốt hơn.</li>
          </ul>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-100 text-left">{editingBudget ? t("common.edit") : t("common.add")} {t("nav.budget").toLowerCase()}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4 text-left">
            <div className="space-y-2">
              <Label className="text-slate-400">{t("common.category")}</Label>
              <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">
                  {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">{t("common.amount")} (VNĐ)</Label>
              <Input type="number" className="bg-slate-800 border-slate-700 text-white font-bold" value={formData.limit} onChange={(e) => setFormData({ ...formData, limit: e.target.value })} />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500">{isSubmitting ? t("common.loading") : t("common.done")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
