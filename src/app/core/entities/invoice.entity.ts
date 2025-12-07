export enum InvoiceStatus {
  Pending = 'pending',
  Paid = 'paid',
  Cancelled = 'cancelled'
}

export interface Invoice {
  id: string;
  memberId: string;
  fullName: string;
  amount: number;
  hebrewDate: string;
  gregorianDate: string;
  description: string;
  invoiceNumber: string;
  status: InvoiceStatus;
  createdAt: string;
  updatedAt: string;
}
