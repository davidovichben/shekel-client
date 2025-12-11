export enum IncomeStatus {
  Pending = 'pending', // ממתין
  Paid = 'paid', // שולם
  Cancelled = 'cancelled', // בוטל
  Refunded = 'refunded' // הוחזר
}

export enum IncomeCategory {
  Vows = 'vows', // נדרים
  CommunityDonations = 'community_donations', // תרומות מהקהילה
  ExternalDonations = 'external_donations', // תרומות חיצוניות
  Ascensions = 'ascensions', // עליות
  OnlineDonations = 'online_donations', // תרומות אונליין
  MembershipFees = 'membership_fees', // דמי חברים
  Other = 'other' // אחר
}

export enum PaymentType {
  Credit = 'credit', // אשראי
  StandingOrder = 'standing_order' // ה. קבע
}

export interface Income {
  id: string;
  description?: string;
  category: IncomeCategory | string;
  amount: string; // Formatted to 2 decimal places
  date: string; // ISO format (YYYY-MM-DD or ISO string)
  payerId?: string | number | null;
  payerName?: string | null;
  number?: string | null; // Receipt/invoice number
  status: IncomeStatus;
  paymentType: PaymentType | string;
  receipt?: string | null; // File path
  hebrewDate?: string;
  gregorianDate?: string; // Formatted DD/MM/YYYY for display
  createdAt: string;
  updatedAt: string;
}

export interface IncomeStats {
  monthlyTotal: {
    amount: string;
    month?: string;
    currency?: string;
  };
  categoryDistribution: Array<{
    type: string;
    label: string;
    amount: string;
    percentage: number;
  }>;
  trend: Array<{
    month: string; // YYYY-MM
    amount: string;
  }>;
  uncollectedReceipts: {
    total: string;
    percentage: number;
    month?: string;
  };
}

