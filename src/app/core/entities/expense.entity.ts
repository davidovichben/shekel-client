export enum ExpenseStatus {
  Pending = 'pending',
  Paid = 'paid'
}

export enum ExpenseFrequency {
  Fixed = 'fixed',
  Recurring = 'recurring',
  OneTime = 'one_time'
}

export enum ExpenseType {
  Food = 'food',
  Maintenance = 'maintenance',
  Equipment = 'equipment',
  Insurance = 'insurance',
  Operations = 'operations',
  Suppliers = 'suppliers',
  Management = 'management'
}

export interface Expense {
  id: string;
  description?: string;
  type: ExpenseType | string;
  amount: string; // Formatted to 2 decimal places
  date: string; // YYYY-MM-DD format
  supplierId?: string | number | null;
  supplierName?: string | null;
  status: ExpenseStatus;
  frequency: ExpenseFrequency | string;
  receipt?: string | null; // File path
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseStats {
  monthlyTotal: {
    amount: string;
    month: string;
    currency: string;
  };
  categoryDistribution: Array<{
    type: string;
    label: string;
    amount: string;
    percentage: number;
  }>;
  trend: Array<{
    month: string;
    amount: string;
  }>;
  unpaidExpenses: {
    total: string;
    percentage: number;
    month: string;
  };
}

