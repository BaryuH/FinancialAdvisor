import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Progress } from "../components/ui/progress";
import {
  ChevronLeft,
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

const GOAL_ICONS: GoalIconOption[] = [
  { value: "piggy-bank", label: "Tiết kiệm" },
  { value: "laptop", label: "Laptop" },
  { value: "plane", label: "Du lịch" },
  { value: "car", label: "Xe" },
  { value: "home", label: "Nhà" },
  { value: "graduation-cap", label: "Học tập" },
  { value: "briefcase", label: "Công việc" },
  { value: "gift", label: "Quà tặng" },
  { value: "wallet", label: "Khác" },
];

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
    case "piggy-bank":
      return <PiggyBank className="w-5 h-5 text-cyan-300" />;
    case "laptop":
      return <Laptop className="w-5 h-5 text-violet-300" />;
    case "plane":
      return <Plane className="w-5 h-5 text-sky-300" />;
    case "car":
      return <Car className="w-5 h-5 text-emerald-300" />;
    case "home":
      return <Home className="w-5 h-5 text-amber-300" />;
    case "graduation-cap":
      return <GraduationCap className="w-5 h-5 text-indigo-300" />;
    case "briefcase":
      return <Briefcase className="w-5 h-5 text-rose-300" />;
    case "gift":
      return <Gift className="w-5 h-5 text-pink-300" />;
    default:
      return <Wallet className="w-5 h-5 text-slate-300" />;
  }
}

export function Goals() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState<UiGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);

  const [editingGoal, setEditingGoal] = useState<UiGoal | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<UiGoal | null>(null);

  const [goalForm, setGoalForm] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    icon: "piggy-bank",
  });

  const [topUpAmount, setTopUpAmount] = useState("");

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const response = await getGoals();
      setGoals(response.items.map(mapApiGoal));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách mục tiêu");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGoals();
  }, []);

  const resetGoalForm = () => {
    setGoalForm({
      name: "",
      targetAmount: "",
      deadline: "",
      icon: "piggy-bank",
    });
    setEditingGoal(null);
  };

  const resetTopUpForm = () => {
    setTopUpAmount("");
    setSelectedGoal(null);
  };

  const handleSubmitGoal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!goalForm.name || !goalForm.targetAmount || !goalForm.deadline || !goalForm.icon) {
      toast.error("Vui lòng điền đầy đủ thông tin");
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
        toast.success("Cập nhật mục tiêu thành công");
      } else {
        await createGoal(payload);
        toast.success("Tạo mục tiêu thành công");
      }

      setIsGoalDialogOpen(false);
      resetGoalForm();
      await loadGoals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu mục tiêu thất bại");
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
      await topUpGoal(selectedGoal.id, {
        amount_minor: Number(topUpAmount),
      });

      toast.success("Nạp thêm tiền thành công");
      setIsTopUpDialogOpen(false);
      resetTopUpForm();
      await loadGoals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nạp tiền thất bại");
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
      toast.success("Xóa mục tiêu thành công");
      await loadGoals();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa mục tiêu thất bại");
    }
  };

  const handleOpenTopUp = (goal: UiGoal) => {
    setSelectedGoal(goal);
    setTopUpAmount("");
    setIsTopUpDialogOpen(true);
  };

  const totalTarget = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
    [goals],
  );

  const totalSaved = useMemo(
    () => goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
    [goals],
  );

  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

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
          <h1 className="text-2xl font-semibold">Mục tiêu</h1>
        </div>

        <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-5">
          <p className="text-base text-slate-200 mb-1">Tổng tiến độ tiết kiệm</p>
          <div className="flex items-baseline gap-2 mb-4">
            <p className="text-2xl text-cyan-300">{formatCurrency(totalSaved)}</p>
            <p className="text-base text-slate-300">/ {formatCurrency(totalTarget)}</p>
          </div>
          <Progress value={Math.min(overallProgress, 100)} className="h-3 bg-slate-800 [&>div]:bg-cyan-400" />
          <p className="text-sm text-slate-300 mt-3">
            Hoàn thành: {overallProgress.toFixed(0)}%
          </p>
        </Card>
      </div>

      <div className="px-4 mt-6 space-y-4">
        <div className="sticky top-0 z-20 -mx-4 px-4 py-3 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-100">Danh sách mục tiêu</h2>
            <Button
              variant="outline"
              onClick={() => {
                resetGoalForm();
                setIsGoalDialogOpen(true);
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
            <p>Đang tải mục tiêu...</p>
          </div>
        )}

        {!isLoading &&
          goals.map((goal) => (
            <Card key={goal.id} className="p-5 bg-slate-900 border-slate-800">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
                    {getGoalIcon(goal.icon)}
                  </div>
                  <div>
                    <p className="text-base font-semibold text-slate-100">{goal.name}</p>
                    <p className="text-sm text-slate-300 mt-0.5">
                      {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-slate-300 hover:text-slate-100"
                    onClick={() => handleEdit(goal)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 text-red-400 hover:text-red-300"
                    onClick={() => handleDelete(goal.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Progress
                  value={Math.min(goal.progressPercent, 100)}
                  className={`h-2 ${goal.isCompleted ? "[&>div]:bg-emerald-500" : "[&>div]:bg-cyan-500"}`}
                />
                <div className="flex items-center justify-between text-sm">
                  <span className={goal.isCompleted ? "text-emerald-400" : "text-slate-300"}>
                    {goal.progressPercent.toFixed(0)}% hoàn thành
                  </span>
                  <span className="text-slate-300">
                    Hạn: {new Date(goal.deadline).toLocaleDateString("vi-VN")}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-1">Còn thiếu</p>
                  <p className="text-sm text-slate-100">
                    {formatCurrency(Math.max(goal.targetAmount - goal.currentAmount, 0))}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs text-slate-400 mb-1">Cần tiết kiệm/tháng</p>
                  <p className="text-sm text-slate-100">
                    {formatCurrency(goal.requiredMonthlySaving ?? 0)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-slate-300">
                  {goal.isCompleted
                    ? "Đã hoàn thành mục tiêu"
                    : goal.daysRemaining !== null
                    ? `Còn ${goal.daysRemaining} ngày`
                    : "Không có hạn cụ thể"}
                </p>
                {!goal.isCompleted && (
                  <Button size="sm" onClick={() => handleOpenTopUp(goal)}>
                    Nạp thêm
                  </Button>
                )}
              </div>
            </Card>
          ))}

        {!isLoading && goals.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>Chưa có mục tiêu nào</p>
            <p className="text-sm mt-2">Nhấn "Thêm" để tạo mục tiêu mới</p>
          </div>
        )}
      </div>

      <Dialog
        open={isGoalDialogOpen}
        onOpenChange={(open) => {
          setIsGoalDialogOpen(open);
          if (!open) resetGoalForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingGoal ? "Sửa mục tiêu" : "Thêm mục tiêu mới"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitGoal} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên mục tiêu</Label>
              <Input
                id="name"
                placeholder="Ví dụ: Mua laptop mới"
                value={goalForm.name}
                onChange={(e) => setGoalForm({ ...goalForm, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="targetAmount">Số tiền mục tiêu (VNĐ)</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="0"
                value={goalForm.targetAmount}
                onChange={(e) => setGoalForm({ ...goalForm, targetAmount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="deadline">Hạn hoàn thành</Label>
              <Input
                id="deadline"
                type="date"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="icon">Biểu tượng</Label>
              <Select
                value={goalForm.icon}
                onValueChange={(value) => setGoalForm({ ...goalForm, icon: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn biểu tượng" />
                </SelectTrigger>
                <SelectContent>
                  {GOAL_ICONS.map((icon) => (
                    <SelectItem key={icon.value} value={icon.value}>
                      {icon.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsGoalDialogOpen(false);
                  resetGoalForm();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Đang lưu..." : editingGoal ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isTopUpDialogOpen}
        onOpenChange={(open) => {
          setIsTopUpDialogOpen(open);
          if (!open) resetTopUpForm();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nạp thêm tiền</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmitTopUp} className="space-y-4">
            <div>
              <Label>Mục tiêu</Label>
              <Input value={selectedGoal?.name ?? ""} disabled />
            </div>

            <div>
              <Label htmlFor="topUpAmount">Số tiền (VNĐ)</Label>
              <Input
                id="topUpAmount"
                type="number"
                placeholder="0"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsTopUpDialogOpen(false);
                  resetTopUpForm();
                }}
              >
                Hủy
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting ? "Đang xử lý..." : "Nạp thêm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}