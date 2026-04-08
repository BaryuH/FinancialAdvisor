export interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  month: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  icon: string;
}

export const categories: Category[] = [
  { id: "1", name: "Ăn uống", icon: "utensils", color: "#FF6B6B" },
  { id: "2", name: "Mua sắm", icon: "shopping-bag", color: "#4ECDC4" },
  { id: "3", name: "Di chuyển", icon: "car", color: "#45B7D1" },
  { id: "4", name: "Giải trí", icon: "film", color: "#FFA07A" },
  { id: "5", name: "Nhà cửa", icon: "home", color: "#98D8C8" },
  { id: "6", name: "Y tế", icon: "heart", color: "#F7DC6F" },
  { id: "7", name: "Giáo dục", icon: "book", color: "#BB8FCE" },
  { id: "8", name: "Tiền lương", icon: "wallet", color: "#52C41A" },
  { id: "9", name: "Đầu tư", icon: "trending-up", color: "#1890FF" },
];

export const mockTransactions: Transaction[] = [
  {
    id: "1",
    type: "expense",
    amount: 35000,
    category: "Ăn uống",
    description: "Bún bò",
    date: "2026-03-24",
  },
  {
    id: "2",
    type: "expense",
    amount: 150000,
    category: "Mua sắm",
    description: "Quần áo",
    date: "2026-03-23",
  },
  {
    id: "3",
    type: "income",
    amount: 15000000,
    category: "Tiền lương",
    description: "Lương tháng 3",
    date: "2026-03-20",
  },
  {
    id: "4",
    type: "expense",
    amount: 50000,
    category: "Di chuyển",
    description: "Grab",
    date: "2026-03-22",
  },
  {
    id: "5",
    type: "expense",
    amount: 200000,
    category: "Giải trí",
    description: "Xem phim",
    date: "2026-03-21",
  },
  {
    id: "6",
    type: "expense",
    amount: 80000,
    category: "Ăn uống",
    description: "Cà phê",
    date: "2026-03-20",
  },
  {
    id: "7",
    type: "expense",
    amount: 2500000,
    category: "Nhà cửa",
    description: "Tiền điện nước",
    date: "2026-03-19",
  },
  {
    id: "8",
    type: "expense",
    amount: 120000,
    category: "Ăn uống",
    description: "Trà sữa",
    date: "2026-03-18",
  },
];

export const mockBudgets: Budget[] = [
  { id: "1", category: "Ăn uống", limit: 3000000, spent: 1250000, month: "2026-03" },
  { id: "2", category: "Mua sắm", limit: 2000000, spent: 850000, month: "2026-03" },
  { id: "3", category: "Di chuyển", limit: 1000000, spent: 450000, month: "2026-03" },
  { id: "4", category: "Giải trí", limit: 1500000, spent: 680000, month: "2026-03" },
  { id: "5", category: "Nhà cửa", limit: 5000000, spent: 2500000, month: "2026-03" },
];

export const mockGoals: Goal[] = [
  {
    id: "1",
    name: "Mua Laptop mới",
    targetAmount: 25000000,
    currentAmount: 8500000,
    deadline: "2026-08-01",
    icon: "laptop",
  },
  {
    id: "2",
    name: "Du lịch Đà Lạt",
    targetAmount: 10000000,
    currentAmount: 6200000,
    deadline: "2026-07-01",
    icon: "plane",
  },
  {
    id: "3",
    name: "Quỹ khẩn cấp",
    targetAmount: 50000000,
    currentAmount: 15000000,
    deadline: "2026-12-31",
    icon: "shield",
  },
];
