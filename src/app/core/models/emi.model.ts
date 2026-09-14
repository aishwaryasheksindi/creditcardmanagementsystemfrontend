export interface EmiPlan {
  emiPlanId: string;
  transactionId: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  processingFee: number;
  startDate: string;
  endDate: string;
  outstandingAmount: number;
  status: string;
  nextDueDate?: string;
  lateFeeAmount?: number;
  missedInstallments?: number;
}

export interface EmiPlanRequest {
  transactionId: string;
  principal: number;
  interestRate: number;
  tenureMonths: number;
  emiAmount: number;
  processingFee: number;
  startDate: string;
  endDate: string;
  outstandingAmount: number;
  status: string;
  nextDueDate?: string;
}

export interface EmiTenureOption {
  tenureMonths: number;
  monthlyEmi: number;
  totalInterest: number;
  totalPayable: number;
  processingFee?: number;
  interestRate?: number;
}

export interface AiEmiRecommendation {
  transactionId: string;
  transactionAmount: number;
  cardLast4: string;
  eligible: boolean;
  eligibilityReason: string;
  recommendedTenureMonths: number;
  recommendedEmiAmount: number;
  recommendedTotalInterest: number;
  recommendedTotalPayable: number;
  processingFee: number;
  annualInterestRate: number;
  recommendationReason: string;
  aiGenerated: boolean;
  availableOptions: EmiTenureOption[];
}
