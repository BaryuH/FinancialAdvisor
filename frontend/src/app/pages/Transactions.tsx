import React, { useEffect, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { mockTransactions, categories, Transaction } from "../lib/mockData";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ChevronLeft,
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
import { useNavigate, useSearchParams } from "react-router";

export function Transactions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  
  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    category: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category || !formData.description) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    if (editingTransaction) {
      setTransactions(transactions.map(t => 
        t.id === editingTransaction.id
          ? { ...t, ...formData, amount: parseFloat(formData.amount) }
          : t
      ));
      toast.success("Cập nhật giao dịch thành công");
    } else {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        ...formData,
        amount: parseFloat(formData.amount),
      };
      setTransactions([newTransaction, ...transactions]);
      toast.success("Thêm giao dịch thành công");
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      category: transaction.category,
      description: transaction.description,
      date: transaction.date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
    toast.success("Xóa giao dịch thành công");
  };

  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setEditingTransaction(null);
  };

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    setEditingTransaction(null);
    setFormData({
      type: "expense",
      amount: "",
      category: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setIsDialogOpen(true);
    navigate("/transactions", { replace: true });
  }, [searchParams, navigate]);

  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || t.type === filterType;
    return matchesSearch && matchesType;
  });

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

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

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
          <h1 className="text-2xl">Giao dịch</h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Tìm kiếm giao dịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-slate-900/70 border-slate-700 text-slate-100 placeholder:text-slate-400"
          />
        </div>

        {/* Filter */}
        <div className="flex gap-2 mt-4">
          <Button
            variant={filterType === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "" : "bg-slate-900/70 text-slate-100 border-slate-700 hover:bg-slate-800"}
          >
            Tất cả
          </Button>
          <Button
            variant={filterType === "income" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("income")}
            className={filterType === "income" ? "" : "bg-slate-900/70 text-slate-100 border-slate-700 hover:bg-slate-800"}
          >
            Thu nhập
          </Button>
          <Button
            variant={filterType === "expense" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("expense")}
            className={filterType === "expense" ? "" : "bg-slate-900/70 text-slate-100 border-slate-700 hover:bg-slate-800"}
          >
            Chi tiêu
          </Button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="px-4 mt-6 space-y-6">
        {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
          <div key={date}>
            <p className="text-sm text-slate-400 mb-3">
              {new Date(date).toLocaleDateString("vi-VN", { 
                weekday: "long", 
                year: "numeric", 
                month: "long", 
                day: "numeric" 
              })}
            </p>
            <Card className="divide-y divide-slate-800 bg-slate-900 border-slate-800">
              {dayTransactions.map((transaction) => (
                <div key={transaction.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        transaction.type === "income"
                          ? "bg-emerald-500/15 border-emerald-500/30"
                          : "bg-slate-800 border-slate-700"
                      }`}>
                        {getCategoryIcon(transaction.category)}
                      </div>
                      <div>
                        <p className="text-sm text-slate-100">{transaction.description}</p>
                        <p className="text-xs text-slate-400">{transaction.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm mb-1 ${
                        transaction.type === "income" ? "text-emerald-300" : "text-rose-300"
                      }`}>
                        {transaction.type === "income" ? "+" : "-"}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEdit(transaction)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-red-600"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        ))}

        {filteredTransactions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>Không có giao dịch nào</p>
          </div>
        )}
      </div>

      {/* Add Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-20 right-6 w-14 h-14 rounded-full shadow-lg"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="w-6 h-6" />
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "Sửa giao dịch" : "Thêm giao dịch mới"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Loại giao dịch</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  type="button"
                  variant={formData.type === "expense" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "expense" })}
                >
                  Chi tiêu
                </Button>
                <Button
                  type="button"
                  variant={formData.type === "income" ? "default" : "outline"}
                  onClick={() => setFormData({ ...formData, type: "income" })}
                >
                  Thu nhập
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="amount">Số tiền</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="category">Danh mục</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter(c => formData.type === "income" 
                      ? ["Tiền lương", "Đầu tư"].includes(c.name)
                      : !["Tiền lương", "Đầu tư"].includes(c.name)
                    )
                    .map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Mô tả</Label>
              <Input
                id="description"
                placeholder="Nhập mô tả"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="date">Ngày</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
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
                {editingTransaction ? "Cập nhật" : "Thêm"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
