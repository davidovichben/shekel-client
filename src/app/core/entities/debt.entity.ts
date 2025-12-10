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
  debtType?: string;
  lastReminder: string | null;
  lastReminderSentAt?: string | null;
  status: DebtStatus;
  createdAt: string;
  updatedAt: string;
}
