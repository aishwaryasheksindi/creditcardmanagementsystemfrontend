export type CardStatus = 'ACTIVE' | 'BLOCKED' | 'EXPIRED' | 'CLOSED' | 'LOST' | 'STOLEN';

export interface Card {
  cardId: string;
  cardReference: string;
  customerId: string;
  cardTypeId: string;
  cardStatus: CardStatus;
  creditLimit: number;
  availableLimit: number;
  billingCycle: number;
  interestRate: number;
  annualFee: number;
  expiryDate: string;
  issuanceDate: string;
}

export interface CardBlockRequest {
  targetStatus: 'BLOCKED';
  reason: string;
}