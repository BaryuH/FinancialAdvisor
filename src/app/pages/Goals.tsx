import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { mockGoals, Goal as GoalType } from "../lib/mockData";
import { ChevronLeft, Plus, Target, TrendingUp, Edit } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "../components/ui/progress";

export function Goals() {
  const navigate = useNavigate();
  const [goals, setGoals] = useState<GoalType[]>(mockGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.targetAmount || !formData.deadline) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    const newGoal: GoalType = {
      id: Date.now().toString(),
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: 0,
      deadline: formData.deadline,
      icon: "target",
    };
    
    setGoals([...goals, newGoal]);
    toast.success("Thêm mục tiêu thành công");
    setIsDialogOpen(false);
    resetForm();
  };

  const handleAddMoney = () => {
    if (!selectedGoal || !addAmount) {
      toast.error("Vui lòng nhập số tiền");
      return;
    }

    const amount = parseFloat(addAmount);
    setGoals(goals.map(g => 
      g.id === selectedGoal.id
        ? { ...g, currentAmount: Math.min(g.currentAmount + amount, g.targetAmount) }
        : g
    ));
    
    toast.success(`Đã thêm ${formatCurrency(amount)} vào mục tiêu`);
    setIsAddMoneyOpen(false);
    setSelectedGoal(null);
    setAddAmount("");
  };

  const resetForm = () => {
    setFormData({
      name: "",
      targetAmount: "",
      deadline: "",
    });
  };

  const getGoalIcon = (iconName: string) => {
    const iconMap: Record<string, string> = {
      "laptop": "💻",
      "plane": "✈️",
      "shield": "🛡️",
      "target": "🎯",
      "home": "🏠",
      "car": "🚗",
    };
    return iconMap[iconName] || "🎯";
  };

  const getDaysRemaining = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
          <h1 className="text-2xl">Mục tiêu</h1>
        </div>

        {/* Summary */}
        <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300 mb-1">Tổng mục tiêu</p>
              <p className="text-2xl">{goals.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-300 mb-1">Đang tiến hành</p>
              <p className="text-2xl">
                {goals.filter(g => g.currentAmount < g.targetAmount).length}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Goals List */}
      <div className="px-4 mt-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg text-slate-100">Mục tiêu của bạn</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Thêm
          </Button>
        </div>

        {goals.map((goal) => {
          const percentage = (goal.currentAmount / goal.targetAmount) * 100;
          const isCompleted = percentage >= 100;
          const daysRemaining = getDaysRemaining(goal.deadline);
          
          return (
            <Card key={goal.id} className={`p-5 bg-slate-900 border-slate-800 ${isCompleted ? "ring-1 ring-emerald-400/40" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                    isCompleted ? "bg-emerald-500/20 border border-emerald-500/30" : "bg-slate-800 border border-slate-700"
                  }`}>
                    {getGoalIcon(goal.icon)}
                  </div>
                  <div>
                    <h3 className="text-sm mb-1 text-slate-100">{goal.name}</h3>
                    <p className="text-xs text-slate-400">
                      Mục tiêu: {formatCurrency(goal.targetAmount)}
                    </p>
                  </div>
                </div>
                {isCompleted && (
                  <div className="bg-emerald-500 text-slate-950 text-xs px-2 py-1 rounded-full">
                    Hoàn thành
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-200">
                      {formatCurrency(goal.currentAmount)}
                    </span>
                    <span className="text-sm text-slate-400">
                      {percentage.toFixed(0)}%
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(percentage, 100)} 
                    className={`h-3 bg-slate-800 ${isCompleted ? "[&>div]:bg-emerald-500" : "[&>div]:bg-cyan-400"}`}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-400">
                    {daysRemaining > 0 ? (
                      <span>⏱️ Còn {daysRemaining} ngày</span>
                    ) : (
                      <span className="text-rose-400">⚠️ Đã hết hạn</span>
                    )}
                  </div>
                  {!isCompleted && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-slate-700 bg-slate-950 text-slate-100 hover:bg-slate-800"
                      onClick={() => {
                        setSelectedGoal(goal);
                        setIsAddMoneyOpen(true);
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Thêm tiền
                    </Button>
                  )}
                </div>

                {!isCompleted && (
                  <div className="pt-3 border-t border-slate-800">
                    <p className="text-xs text-slate-400 mb-1">Cần tiết kiệm mỗi tháng:</p>
                    <p className="text-sm text-cyan-300">
                      {formatCurrency(
                        (goal.targetAmount - goal.currentAmount) / 
                        Math.max(Math.ceil(daysRemaining / 30), 1)
                      )}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {goals.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <Target className="w-16 h-16 mx-auto mb-4 text-slate-600" />
            <p>Chưa có mục tiêu nào</p>
            <p className="text-sm mt-2">Hãy tạo mục tiêu tiết kiệm đầu tiên!</p>
          </div>
        )}
      </div>

      {/* Tips */}
      <div className="px-4 mt-6">
        <Card className="p-4 bg-slate-900 border-slate-800">
          <h3 className="text-sm mb-2 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-300" />
            Mẹo đạt mục tiêu
          </h3>
          <ul className="text-xs text-slate-300 space-y-1">
            <li>• Chia nhỏ mục tiêu lớn thành các mốc nhỏ hơn</li>
            <li>• Tự động chuyển tiền tiết kiệm vào đầu tháng</li>
            <li>• Theo dõi tiến độ thường xuyên để duy trì động lực</li>
            <li>• Hãy thực tế với thời hạn và số tiền cần tiết kiệm</li>
          </ul>
        </Card>
      </div>

      {/* Add Goal Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạo mục tiêu mới</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Tên mục tiêu</Label>
              <Input
                id="name"
                placeholder="Ví dụ: Mua laptop mới"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="targetAmount">Số tiền mục tiêu (VNĐ)</Label>
              <Input
                id="targetAmount"
                type="number"
                placeholder="0"
                value={formData.targetAmount}
                onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="deadline">Thời hạn</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
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
                Tạo mục tiêu
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Money Dialog */}
      <Dialog open={isAddMoneyOpen} onOpenChange={setIsAddMoneyOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm tiền vào mục tiêu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGoal && (
              <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
                <p className="text-sm text-slate-400 mb-1">Mục tiêu</p>
                <p className="text-lg mb-2 text-slate-100">{selectedGoal.name}</p>
                <p className="text-sm text-slate-400">
                  Hiện tại: {formatCurrency(selectedGoal.currentAmount)} / {formatCurrency(selectedGoal.targetAmount)}
                </p>
              </div>
            )}

            <div>
              <Label htmlFor="addAmount">Số tiền thêm vào (VNĐ)</Label>
              <Input
                id="addAmount"
                type="number"
                placeholder="0"
                value={addAmount}
                onChange={(e) => setAddAmount(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setIsAddMoneyOpen(false);
                  setSelectedGoal(null);
                  setAddAmount("");
                }}
              >
                Hủy
              </Button>
              <Button className="flex-1" onClick={handleAddMoney}>
                Thêm tiền
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
