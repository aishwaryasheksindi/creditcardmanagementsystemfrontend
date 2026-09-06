export interface Transaction {
  transactionId: string;
  cardId: string;
  merchantId: string;
  categoryId: string;
  amount: number;
  currency: string;
  transactionDate: string;
  transactionLocation: string;
  transactionStatus: string;
  transactionType: string;
}