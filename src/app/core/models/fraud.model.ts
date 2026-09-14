export interface FraudAlert {
  fraudAlertId: string;
  transactionId: string;
  riskScoreId?: string;
  status: 'OPEN' | 'PENDING' | 'INVESTIGATING' | 'CONFIRMED' | 'FALSE_POSITIVE' | 'CLOSED' | 'RESOLVED' | 'DISMISSED';
  reason?: string;
  investigatorStaffId?: string;
  raisedAt?: string;
  closedAt?: string;
}

export interface RiskScore {
  riskScoreId: string;
  transactionId: string;
  score: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  modelVersion?: string;
  scoredAt?: string;
  riskFactors?: string;
}
