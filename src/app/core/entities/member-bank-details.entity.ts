export enum PaymentType {
  Credit = 'credit',
  StandingOrder = 'standing_order'
}

export interface MemberBankDetails {
  id: string;
  memberId: string;
  autoMonthlyCharge: boolean;
  autoChargeDay: string;
  paymentType: PaymentType;
  bankNumber: string;
  branchNumber: string;
  accountNumber: string;
  idNumber: string;
  fullName: string;
  authorizationFile: string;
  authorizationExpiry: string;
  chargeLimit: number;
  createdAt: string;
  updatedAt: string;
}
