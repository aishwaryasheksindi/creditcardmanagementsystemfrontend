import { Component, OnInit, NgZone, ChangeDetectorRef } from '@angular/core';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AiService } from '../../core/services/ai.service';
import { CustomerService } from '../../core/services/customer.service';
import { TransactionService } from '../../core/services/transaction.service';
import { AnomalyDetectionResponse, AiFraudRiskResponse, ChatMessage } from '../../core/models/ai.model';
import { Customer } from '../../core/models/customer.model';
import { Transaction } from '../../core/models/transaction.model';

@Component({
  selector: 'app-ai',
  templateUrl: './ai.component.html',
  styleUrls: ['./ai.component.scss'],
  standalone: false
})
export class AiComponent implements OnInit {
  activeTab: 'anomalies' | 'fraudRisk' | 'assistant' = 'anomalies';

  customers: Customer[] = [];
  transactions: Transaction[] = [];

  // Tab 1: Anomaly Detection
  selectedCustomerId: string = '';
  anomalyResult: AnomalyDetectionResponse | null = null;
  isLoadingAnomalies: boolean = false;
  anomalyErrorMessage: string | null = null;

  // Tab 2: Fraud Risk Evaluator
  selectedTransactionId: string = '';
  fraudRiskResult: AiFraudRiskResponse | null = null;
  isLoadingFraudRisk: boolean = false;
  fraudRiskErrorMessage: string | null = null;

  // Tab 3: Chat Assistant
  chatMessages: ChatMessage[] = [
    {
      sender: 'assistant',
      text: 'Hello! I am the CardNest AI Operations Assistant. You can ask me about account risk, transactions, policy guidelines, or anomaly detection.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ];
  userChatMessage: string = '';
  isChatSending: boolean = false;
  chatSessionId: string = 'sess-' + Date.now();

  constructor(
    private aiService: AiService,
    private customerService: CustomerService,
    private transactionService: TransactionService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSelectorData();
  }

  loadSelectorData(): void {
    forkJoin({
      customers: this.customerService.getAllCustomers().pipe(catchError(() => of([]))),
      transactions: this.transactionService.getAllTransactions().pipe(catchError(() => of([])))
    }).subscribe({
      next: ({ customers, transactions }) => {
        this.ngZone.run(() => {
          this.customers = customers || [];
          this.transactions = transactions || [];

          if (this.customers.length > 0) {
            this.selectedCustomerId = this.customers[0].customerId;
            this.runAnomalyDetection();
          }

          if (this.transactions.length > 0) {
            this.selectedTransactionId = this.transactions[0].transactionId;
            this.runFraudRiskEvaluation();
          }
          this.cdr.markForCheck();
        });
      }
    });
  }

  runAnomalyDetection(): void {
    if (!this.selectedCustomerId) return;

    this.isLoadingAnomalies = true;
    this.anomalyErrorMessage = null;
    this.anomalyResult = null;

    this.aiService.getAnomalies(this.selectedCustomerId).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.anomalyResult = res;
          this.isLoadingAnomalies = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoadingAnomalies = false;
          this.anomalyErrorMessage = `Failed to generate anomaly detection for customer ${this.selectedCustomerId}.`;
          this.cdr.markForCheck();
        });
      }
    });
  }

  runFraudRiskEvaluation(): void {
    if (!this.selectedTransactionId) return;

    this.isLoadingFraudRisk = true;
    this.fraudRiskErrorMessage = null;
    this.fraudRiskResult = null;

    this.aiService.getFraudRisk(this.selectedTransactionId).subscribe({
      next: (res) => {
        this.ngZone.run(() => {
          this.fraudRiskResult = res;
          this.isLoadingFraudRisk = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.isLoadingFraudRisk = false;
          this.fraudRiskErrorMessage = `Failed to evaluate AI fraud risk for transaction ${this.selectedTransactionId}.`;
          this.cdr.markForCheck();
        });
      }
    });
  }

  sendChatMessage(): void {
    const text = this.userChatMessage.trim();
    if (!text || this.isChatSending) return;

    this.chatMessages.push({
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    });
    this.userChatMessage = '';
    this.isChatSending = true;

    this.aiService.chat(text, this.chatSessionId, this.selectedCustomerId || undefined).subscribe({
      next: (resp) => {
        this.ngZone.run(() => {
          this.chatMessages.push({
            sender: 'assistant',
            text: resp.response || 'Understood. Please let me know if you need more details.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          this.isChatSending = false;
          this.cdr.markForCheck();
        });
      },
      error: () => {
        this.ngZone.run(() => {
          this.chatMessages.push({
            sender: 'assistant',
            text: 'I apologize, but the AI Assistant pipeline is currently unavailable. Please try again shortly.',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
          this.isChatSending = false;
          this.cdr.markForCheck();
        });
      }
    });
  }

  getSeverityBadge(sev: string): string {
    switch (sev?.toUpperCase()) {
      case 'HIGH':
        return 'bg-danger text-white';
      case 'MEDIUM':
        return 'bg-warning text-dark';
      case 'LOW':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  }

  getRiskCategoryBadge(cat: string): string {
    switch (cat?.toUpperCase()) {
      case 'CRITICAL':
      case 'HIGH':
        return 'bg-danger text-white';
      case 'MODERATE':
      case 'MEDIUM':
        return 'bg-warning text-dark';
      case 'LOW':
        return 'bg-success text-white';
      default:
        return 'bg-secondary text-white';
    }
  }
}
