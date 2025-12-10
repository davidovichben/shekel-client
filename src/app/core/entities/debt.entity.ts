export enum DebtStatus {
  Pending = 'pending',
  Paid = 'paid',
  Overdue = 'overdue',
  Cancelled = 'cancelled'
}

export interface Debt {
  id: string;
  memberId: string;
  fullName: string;
  autoPaymentApproved: boolean;
  amount: number;
  hebrewDate: string;
  gregorianDate: string;
  description: string;
  lastReminder: string | null;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}
