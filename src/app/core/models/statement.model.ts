export interface Statement {
  statementId: string;
  cardId: string;
  statementDate: string; // ISO date string (YYYY-MM-DD)
  dueDate: string;       // ISO date string (YYYY-MM-DD)
  openingBalance: number;
  totalPurchases: number;
  totalPayments: number;
  totalRefunds: number;
  totalFees: number;
  totalInterest: number;
  closingBalance: number;
  minimumDue: number;
}

export interface StatementItem {
  statementItemId: string;
  statementId: string;
  transactionId?: string;
  itemDate: string;
  description: string;
  amount: number;
  itemType: string;
}
