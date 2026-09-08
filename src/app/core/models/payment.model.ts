export type PaymentStatus = 'INITIATED' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'REVERSED' | 'REFUNDED';

export type PaymentType = 'MINIMUM' | 'FULL' | 'PARTIAL' | 'CUSTOM';

export interface PaymentRequest {
  cardId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  referenceNumber?: string;
}

export interface Payment {
  paymentId: string;
  cardId: string;
  customerId: string;
  amount: number;
  paymentDate: string;
  paymentType: string;
  paymentStatus: PaymentStatus;
  paymentMethod: string;
  referenceNumber?: string;
}
