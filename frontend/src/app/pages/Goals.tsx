import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import {
  Plus,
  Edit,
  Trash2,
  PiggyBank,
  Laptop,
  Plane,
  Car,
  Home,
  GraduationCap,
  Briefcase,
  Gift,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import {
  ApiGoal,
  createGoal,
  deleteGoal,
  getGoals,
  topUpGoal,
  updateGoal,
} from "../lib/api/goals";
import { useLocale } from "../lib/locale";

type UiGoal = {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
  progressPercent: number;
  isCompleted: boolean;
  daysRemaining: number | null;
  requiredMonthlySaving: number | null;
};

type GoalIconOption = {
  value: string;
  label: string;
};

function mapApiGoal(item: ApiGoal): UiGoal {
  return {
    id: item.id,
    name: item.name,
    targetAmount: item.target_minor,
    currentAmount: item.current_minor,
    deadline: item.deadline,
    icon: item.icon_key,
    progressPercent: item.progress_percent,
    isCompleted: item.is_completed,
    daysRemaining: item.days_remaining,
    requiredMonthlySaving: item.required_monthly_saving_minor,
  };
}

function getGoalIcon(iconKey: string) {
  switch (iconKey) {
    case "piggy-bank": return <PiggyBank className="w-5 h-5 text-cyan-300" />;
    case "laptop": return <Laptop className="w-5 h-5 text-violet-300" />;
    case "plane": return <Plane className="w-5 h-5 text-sky-300" />;
    case "car": return <Car className="w-5 h-5 text-emerald-300" />;
    case "home": return <Home className="w-5 h-5 text-amber-300" />;
    case "graduation-cap": return <GraduationCap className="w-5 h-5 text-indigo-300" />;
    case "briefcase": return <Briefcase className="w-5 h-5 text-rose-300" />;
    case "gift": return <Gift className="w-5 h-5 text-pink-300" />;
    default: return <Wallet className="w-5 h-5 text-slate-300" />;
  }
}

export function Goals() {
  const { t, locale } = useLocale();
  const [goals, setGoals] = useState<UiGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);

  const [editingGoal, setEditingGoal] = useState<UiGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<UiGoal | null>(null);

  const GOAL_ICONS: GoalIconOption[] = [
    { value: "piggy-bank", label: t("common.savings") || "Tiết kiệm" },
    { value: "laptop", label: "Laptop" },
    { value: "plane", label: "Du lịch" },
    { value: "car", label: "Xe" },
    { value: "home", label: "Nhà" },
    { value: "graduation-cap", label: "Học tập" },
    { value: "briefcase", label: "Công việc" },
    { value: "gift", label: "Quà tặng" },
    { value: "wallet", label: "Khác" },
  ];

  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    icon: "piggy-bank",
  });

  const [topUpAmount, setTopUpAmount] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
  };

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await getGoals();
      setGoals(response.items.map(mapApiGoal));
    } catch (error) {
      toast.error(t("common.noData"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const resetGoalForm = () => {
    setGoalForm({ name: "", targetAmount: "", deadline: "", icon: "piggy-bank" });
    setEditingGoal(null);
  };

  const resetTopUpForm = () => {
    setTopUpAmount("");
    setSelectedGoal(null);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalForm.name || !goalForm.targetAmount || !goalForm.deadline) {
      toast.error("Vui lòng điền đủ thông tin");
      return;
    }
    try {
      setIsSubmitting(true);
      const payload = {
        name: goalForm.name.trim(),
        target_minor: Number(goalForm.targetAmount),
        deadline: goalForm.deadline,
        icon_key: goalForm.icon,
      };
      if (editingGoal) {
        await updateGoal(editingGoal.id, payload);
        toast.success(t("common.done"));
      } else {
        await createGoal(payload);
        toast.success(t("common.done"));
      }
      setIsGoalDialogOpen(false);
      resetGoalForm();
      await loadGoals();
    } catch (error) {
      toast.error("Thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoal || !topUpAmount) {
      toast.error("Vui lòng nhập số tiền");
      return;
    }
    try {
      setIsSubmitting(true);
      await topUpGoal(selectedGoal.id, { amount_minor: Number(topUpAmount) });
      toast.success(t("common.done"));
      setIsTopUpDialogOpen(false);
      resetTopUpForm();
      await loadGoals();
    } catch (error) {
      toast.error("Thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (goal: UiGoal) => {
    setEditingGoal(goal);
    setGoalForm({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      deadline: goal.deadline,
      icon: goal.icon,
    });
    setIsGoalDialogOpen(true);
  };

  const handleDelete = async (goalId: string) => {
    try {
      await deleteGoal(goalId);
      toast.success(t("common.done"));
      await loadGoals();
    } catch (error) {
      toast.error("Thất bại");
    }
  };

  const totalTarget = useMemo(() => goals.reduce((sum, goal) => sum + goal.targetAmount, 0), [goals]);
  const totalSaved = useMemo(() => goals.reduce((sum, goal) => sum + goal.currentAmount, 0), [goals]);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  return (
    <div className="max-w-md mx-auto min-h-screen pb-24 text-slate-100 font-sans">
      <div className="px-4 pt-6 pb-4 border-b border-white/5">
        <Card className="p-5 bg-slate-900 border-slate-800 text-left">
          <p className="text-base font-semibold text-slate-400 mb-1">{t("goals.totalProgress")}</p>
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-3xl font-black text-white tracking-tighter">{formatCurrency(totalSaved)}</p>
            <p className="text-sm font-bold text-slate-500">/ {formatCurrency(totalTarget)}</p>
          </div>
          <Progress value={Math.min(overallProgress, 100)} className="h-2.5 bg-slate-800 [&>div]:bg-cyan-500" />
          <p className="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest">
            {t("common.done")}: {overallProgress.toFixed(0)}%
          </p>
        </Card>
      </div>

      <div className="px-4 mt-6 space-y-4 text-left">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest">{t("goals.list")}</h2>
          <Button onClick={() => { resetGoalForm(); setIsGoalDialogOpen(true); }} size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-full h-8 px-4">
            <Plus className="w-4 h-4 mr-1" /> {t("common.add")}
          </Button>
        </div>

        {isLoading && <p className="text-center py-20 text-slate-500 text-sm animate-pulse">{t("common.loading")}</p>}

        {!isLoading &&
          goals.map((goal) => (
            <Card key={goal.id} className="p-5 bg-slate-900 border-slate-800">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {getGoalIcon(goal.icon)}
                  </div>
                  <div>
                    <p className="text-base font-black text-slate-100">{goal.name}</p>
                    <p className="text-xs font-bold text-slate-500 mt-0.5">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500" onClick={() => handleEdit(goal)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="icon" className="h-9 w-9 text-rose-500/60" onClick={() => handleDelete(goal.id)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={Math.min(goal.progressPercent, 100)} className={`h-1.5 ${goal.isCompleted ? "[&>div]:bg-emerald-500" : "[&>div]:bg-cyan-500"}`} />
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                  <span className={goal.isCompleted ? "text-emerald-400" : "text-slate-500"}>{goal.progressPercent.toFixed(0)}% {t("common.done")}</span>
                  <span className="text-slate-500">{t("common.date")}: {new Date(goal.deadline).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US")}</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{t("goals.missing")}</p>
                  <p className="text-sm font-black text-slate-200">{formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))}</p>
                </div>
                <div className="p-3 bg-slate-950/40 rounded-xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{t("goals.monthlyNeeded")}</p>
                  <p className="text-sm font-black text-slate-200">{formatCurrency(goal.requiredMonthlySaving ?? 0)}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-500 italic">
                  {goal.isCompleted ? t("goals.completed") : goal.daysRemaining !== null ? `${goal.daysRemaining} ${t("goals.daysLeft")}` : t("goals.noLimit")}
                </p>
                {!goal.isCompleted && <Button size="sm" onClick={() => handleOpenTopUp(goal)} className="bg-slate-800 hover:bg-slate-700 text-cyan-400 font-black text-[10px] uppercase tracking-widest h-8 px-4 rounded-lg">{t("goals.topUp")}</Button>}
              </div>
            </Card>
          ))}

        {!isLoading && goals.length === 0 && (
          <div className="py-20 flex flex-col items-center gap-4 opacity-30">
             <PiggyBank className="w-12 h-12" />
             <p className="text-[10px] font-black uppercase tracking-widest">{t("common.noData")}</p>
          </div>
        )}
      </div>

      {/* Goal Dialog */}
      <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-100 text-left">{editingGoal ? t("goals.editTitle") : t("goals.createTitle")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitGoal} className="space-y-4 pt-4 text-left">
            <div className="space-y-2">
              <Label className="text-slate-400">{t("goals.nameLabel")}</Label>
              <Input placeholder="Ví dụ: Mua laptop mới" value={goalForm.name} onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })} className="bg-slate-800 border-slate-700" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">{t("common.amount")} (VNĐ)</Label>
              <Input type="number" value={goalForm.targetAmount} onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })} className="bg-slate-800 border-slate-700 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">{t("goals.deadlineLabel")}</Label>
              <Input type="date" value={goalForm.deadline} onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })} className="bg-slate-800 border-slate-700 [color-scheme:dark]" />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-400">{t("goals.iconLabel")}</Label>
              <Select value={goalForm.icon} onValueChange={(v) => setGoalForm({ ...goalForm, icon: v })}>
                <SelectTrigger className="bg-slate-800 border-slate-700"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-slate-100">{GOAL_ICONS.map((i) => (<SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsGoalDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500">{isSubmitting ? t("common.loading") : t("common.done")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* TopUp Dialog */}
      <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader><DialogTitle className="text-slate-100 text-left">{t("goals.topUp")}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmitTopUp} className="space-y-4 pt-4 text-left">
            <div className="space-y-2"><Label className="text-slate-400">{t("goals.nameLabel")}</Label><Input value={selectedGoal?.name ?? ""} disabled className="bg-slate-800/50 border-slate-800" /></div>
            <div className="space-y-2"><Label className="text-slate-400">{t("common.amount")} (VNĐ)</Label><Input type="number" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} className="bg-slate-800 border-slate-700 font-bold" /></div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => setIsTopUpDialogOpen(false)}>{t("common.cancel")}</Button>
              <Button type="submit" disabled={isSubmitting} className="flex-1 bg-emerald-600 hover:bg-emerald-500">{isSubmitting ? t("common.loading") : t("common.done")}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
