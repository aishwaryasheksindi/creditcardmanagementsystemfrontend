export interface AnomalyFlag {
  type: string;
  description: string;
  relatedTransactionId?: string;
  severity: string;
  detectedAt: string;
}

export interface AnomalyDetectionResponse {
  customerId: string;
  generatedAt: string;
  flags: AnomalyFlag[];
  anomalies?: AnomalyFlag[];
}

export interface AiFraudRiskResponse {
  transactionId: string;
  riskScore: number;
  riskCategory: string;
  riskFactors: string[];
  recommendation: string;
  evaluatedAt: string;
}

export interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface ChatResponse {
  response: string;
  sessionId?: string;
}
