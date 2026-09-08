export interface Reward {
  rewardId: string;
  customerId: string;
  earnedPoints: number;
  redeemedPoints: number;
  expiredPoints: number;
  bonusPoints: number;
  balancePoints: number;
}

export interface RewardTransaction {
  rewardTransactionId: string;
  rewardId: string;
  points: number;
  transactionType: string;
  description: string;
  transactionDate: string;
}

export interface RewardRecommendation {
  recommendationId: string;
  customerId: string;
  offerName: string;
  reason: string;
}
