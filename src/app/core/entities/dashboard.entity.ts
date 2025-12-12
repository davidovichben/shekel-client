export interface DonationsCard {
  amount: string; // "18450.00"
  changePercent: number; // -5
  changeLabel: string; // "מהחודש שעבר"
}

export interface ExpensesCard {
  amount: string; // "12104.00"
  changePercent: number; // 2
  changeLabel: string; // "מהחודש שעבר"
}

export interface OpenDebtsCard {
  amount: string; // "5450.00"
  count: number; // 18
  label: string; // "חובות פעילים"
}

export interface MonthlyBalanceCard {
  amount: string; // "234.00"
  label: string; // "הכנסות מחות הוצאות"
}

export interface SummaryCards {
  donations: DonationsCard;
  expenses: ExpensesCard;
  openDebts: OpenDebtsCard;
  monthlyBalance: MonthlyBalanceCard;
}

export interface LastMonthBalance {
  income: string; // "3118.00"
  expenses: string; // "1487.00"
  balance: string; // "1631.00"
  label: string; // "ביתרה"
  changePercent?: number; // 138
  changeLabel?: string; // "מהחודש שעבר"
}

export interface DebtCategory {
  type: string; // "neder_shabbat"
  label: string; // "נדר שבת"
  amount: string; // "850.00"
  percentage: number; // 33
}

export interface DebtDistribution {
  total: string; // "2549.00"
  categories: DebtCategory[];
}

export interface MonthlyTrend {
  month: string; // "2025-01"
  income: string; // "35874.00"
  expenses: string; // "35874.00"
}

export interface SemiAnnualTrend {
  months: MonthlyTrend[];
}

export interface DashboardStats {
  summaryCards: SummaryCards;
  lastMonthBalance: LastMonthBalance;
  debtDistribution: DebtDistribution;
  semiAnnualTrend: SemiAnnualTrend;
}
