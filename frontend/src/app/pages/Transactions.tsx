import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import {
  Plus,
  Edit,
  Trash2,
  Search,
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
import { motion } from "motion/react";
import {
  ApiCategory,
  ApiTransaction,
  createTransaction,
  deleteTransaction,
  getCategories,
  getTransactions,
  updateTransaction,
} from "../lib/api/transactions";

type UiTransaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  categoryId: string;
  description: string;
  date: string;
};

function mapApiTransaction(item: ApiTransaction): UiTransaction {
  return {
    id: item.id,
    type: item.type,
    amount: item.amount_minor,
    category: item.category.name,
    categoryId: item.category.id,
    description: item.description,
    date: item.transaction_date,
  };
}

export function Transactions() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [transactions, setTransactions] = useState<UiTransaction[]>([]);
  const [categories, setCategories] = useState<ApiCategory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<UiTransaction | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    amount: "",
    categoryId: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const loadTransactions = async () => {
    try {
      setIsLoading(true);
      const response = await getTransactions({
        type: filterType === "all" ? undefined : filterType,
        q: searchQuery.trim() || undefined,
        page: 1,
        page_size: 100,
      });
      setTransactions(response.items.map(mapApiTransaction));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh sách giao dịch");
    } finally {
      setIsLoading(false);
    }
  };

  const loadCategories = async (type: "income" | "expense") => {
    try {
      const response = await getCategories(type);
      setCategories(response.items);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không tải được danh mục");
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [searchQuery, filterType]);

  useEffect(() => {
    loadCategories(formData.type);
  }, [formData.type]);

  useEffect(() => {
    if (searchParams.get("add") !== "1") return;
    
    const typeParam = searchParams.get("type");
    const initialType: "income" | "expense" =
      typeParam === "income" ? "income" : "expense";
    
    setEditingTransaction(null);
    setFormData({
      type: initialType,
      amount: "",
      categoryId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });

    // Delay slightly to let page transition finish
    const timer = setTimeout(() => {
      setIsDialogOpen(true);
      // Clean up URL without triggering redundant effects immediately
      navigate("/transactions", { replace: true });
    }, 150);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  const resetForm = () => {
    setFormData({
      type: "expense",
      amount: "",
      categoryId: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
    });
    setEditingTransaction(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.categoryId || !formData.description) {
      toast.error("Vui lòng điền đầy đủ thông tin");
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        type: formData.type,
        category_id: formData.categoryId,
        amount_minor: Number(formData.amount),
        description: formData.description.trim(),
        transaction_date: formData.date,
        source: "manual" as const,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, payload);
        toast.success("Cập nhật giao dịch thành công");
      } else {
        await createTransaction(payload);
        toast.success("Thêm giao dịch thành công");
      }

      setIsDialogOpen(false);
      resetForm();
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Lưu giao dịch thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (transaction: UiTransaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      categoryId: transaction.categoryId,
      description: transaction.description,
      date: transaction.date,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTransaction(id);
      toast.success("Xóa giao dịch thành công");
      await loadTransactions();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Xóa giao dịch thất bại");
    }
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

  const groupedTransactions = useMemo(() => {
    return transactions.reduce((groups, transaction) => {
      const date = transaction.date;
      if (!groups[date]) groups[date] = [];
      groups[date].push(transaction);
      return groups;
    }, {} as Record<string, UiTransaction[]>);
  }, [transactions]);

  return (
    <div className="max-w-md mx-auto min-h-screen pb-6">
      <div className="px-4 pt-3 pb-4 text-foreground border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm giao dịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted border-border text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant={filterType === "all" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
            className={filterType === "all" ? "" : "border-border bg-card text-foreground hover:bg-muted"}
          >
            Tất cả
          </Button>
          <Button
            variant={filterType === "income" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("income")}
            className={filterType === "income" ? "" : "border-border bg-card text-foreground hover:bg-muted"}
          >
            Thu nhập
          </Button>
          <Button
            variant={filterType === "expense" ? "secondary" : "outline"}
            size="sm"
            onClick={() => setFilterType("expense")}
            className={filterType === "expense" ? "" : "border-border bg-card text-foreground hover:bg-muted"}
          >
            Chi tiêu
          </Button>
        </div>
      </div>

      <div className="px-4 mt-6 space-y-6">
        {isLoading && (
          <div className="text-center py-12 text-slate-400">
            <p>Đang tải giao dịch...</p>
          </div>
        )}

        {!isLoading &&
          Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
            <div key={date}>
              <p className="text-sm text-slate-400 mb-3">
                {new Date(date).toLocaleDateString("vi-VN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <Card className="divide-y divide-slate-800 bg-slate-900 border-slate-800">
                {dayTransactions.map((transaction) => (
                  <div key={transaction.id} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            transaction.type === "income"
                              ? "bg-emerald-500/15 border-emerald-500/30"
                              : "bg-slate-800 border-slate-700"
                          }`}
                        >
                          {getCategoryIcon(transaction.category)}
                        </div>
                        <div>
                          <p className="text-sm text-slate-100">{transaction.description}</p>
                          <p className="text-xs text-slate-400">{transaction.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-sm mb-1 ${
                            transaction.type === "income" ? "text-emerald-300" : "text-rose-300"
                          }`}
                        >
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

        {!isLoading && transactions.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <p>Không có giao dịch nào</p>
          </div>
        )}
      </div>
    </div>
  );
}