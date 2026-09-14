export type DisputeStatus = 'RAISED' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'CLOSED';

export type DisputeType = 
  | 'UNAUTHORIZED_TRANSACTION'
  | 'DUPLICATE_TRANSACTION'
  | 'WRONG_AMOUNT'
  | 'REFUND_NOT_RECEIVED'
  | 'MERCHANT_DISPUTE'
  | 'OTHER';

export interface Dispute {
  disputeId: string;
  customerId: string;
  transactionId: string;
  disputeType: DisputeType | string;
  status: DisputeStatus;
  description: string;
  evidenceReference?: string;
  raisedAt: string;
  resolvedAt?: string | null;
}

export interface DisputeRequest {
  customerId: string;
  transactionId: string;
  disputeType: string;
  description: string;
  evidenceReference?: string;
}

export interface DisputeClassificationRequest {
  customerId: string;
  transactionId: string;
  description: string;
}

export interface DisputeClassificationResponse {
  suggestedType: string;
  priority: string;
  confidenceScore: number;
  explanation: string;
  summary: string;
}
