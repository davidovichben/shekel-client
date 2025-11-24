export enum ReceiptStatus {
  Pending = 'pending',
  Paid = 'paid',
  Cancelled = 'cancelled',
  Refunded = 'refunded'
}

export enum PaymentMethod {
  Cash = 'cash',
  CreditCard = 'creditCard',
  DebitCard = 'debitCard',
  Check = 'check',
  BankTransfer = 'bankTransfer',
  Other = 'other'
}

export interface Receipt {
  receipt_number: string;
  user_id: string;
  total_amount: number;
  tax_amount: number;
  subtotal: number;
  status: ReceiptStatus;
  payment_method: PaymentMethod;
  receipt_date: Date;
  notes: string;
}
