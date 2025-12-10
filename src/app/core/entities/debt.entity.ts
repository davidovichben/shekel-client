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
  autoPaymentApproved: boolean; // Deprecated - use shouldBill instead
  shouldBill?: boolean; // From member payment settings
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
