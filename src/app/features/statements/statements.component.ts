import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { CardService } from '../../core/services/card.service';
import { StatementService } from '../../core/services/statement.service';
import { Statement, StatementItem } from '../../core/models/statement.model';
import { Card } from '../../core/models/card.model';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-statements',
  templateUrl: './statements.component.html',
  styleUrls: ['./statements.component.scss'],
  standalone: false
})
export class StatementsComponent implements OnInit {
  statements: Statement[] = [];
  cards: Card[] = [];
  cardMap: Map<string, Card> = new Map();
  selectedCardId: string = '';
  currentCustomer: Customer | null = null;

  isLoadingCards: boolean = false;
  isLoadingStatements: boolean = false;
  isLoadingItems: boolean = false;
  errorMessage: string | null = null;

  // Selected statement for modal
  selectedStatement: Statement | null = null;
  statementItems: StatementItem[] = [];
  itemsErrorMessage: string | null = null;

  @ViewChild('statementDetailsModal') statementDetailsModalRef!: TemplateRef<unknown>;
  private activeModal: NgbModalRef | null = null;

  isCustomer: boolean = false;

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private cardService: CardService,
    private statementService: StatementService,
    private modalService: NgbModal,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadCardsAndStatements();
  }

  loadCardsAndStatements(): void {
    this.isLoadingCards = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile().pipe(
        switchMap(customer => {
          this.currentCustomer = customer;
          if (!customer?.customerId) {
            return of([] as Card[]);
          }
          return this.cardService.getCardsByCustomer(customer.customerId).pipe(
            catchError(() => of([] as Card[]))
          );
        }),
        catchError(() => {
          this.errorMessage = 'Failed to load cards for customer.';
          return of([] as Card[]);
        })
      ).subscribe({
        next: (cards) => {
          this.cards = cards;
          this.cardMap.clear();
          cards.forEach(c => this.cardMap.set(c.cardId, c));
          this.isLoadingCards = false;

          // Check route query param for pre-selection
          this.route.queryParams.subscribe(params => {
            const paramCardId = params['cardId'];
            if (paramCardId && this.cardMap.has(paramCardId)) {
              this.selectedCardId = paramCardId;
            } else if (cards.length > 0) {
              this.selectedCardId = cards[0].cardId;
            }
            if (this.selectedCardId) {
              this.loadStatementsForCard(this.selectedCardId);
            }
          });
        },
        error: () => {
          this.isLoadingCards = false;
          this.errorMessage = 'Failed to load card data.';
        }
      });
    } else {
      // Staff / Admin: load all statements
      this.isLoadingStatements = true;
      this.statementService.getAllStatements().pipe(
        catchError(() => of([] as Statement[]))
      ).subscribe({
        next: (allStatements) => {
          this.statements = allStatements.sort((a, b) => 
            new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime()
          );
          this.isLoadingStatements = false;
          this.isLoadingCards = false;
        },
        error: () => {
          this.isLoadingStatements = false;
          this.isLoadingCards = false;
          this.errorMessage = 'Failed to load statements.';
        }
      });
    }
  }

  onCardChange(): void {
    if (this.selectedCardId) {
      this.loadStatementsForCard(this.selectedCardId);
    }
  }

  loadStatementsForCard(cardId: string): void {
    this.isLoadingStatements = true;
    this.errorMessage = null;

    this.statementService.getStatementsByCardId(cardId).pipe(
      catchError(() => of([] as Statement[]))
    ).subscribe({
      next: (statements) => {
        this.statements = statements.sort((a, b) => 
          new Date(b.statementDate).getTime() - new Date(a.statementDate).getTime()
        );
        this.isLoadingStatements = false;
      },
      error: () => {
        this.isLoadingStatements = false;
        this.errorMessage = 'Failed to load statements for selected card.';
      }
    });
  }

  get selectedCard(): Card | undefined {
    return this.cardMap.get(this.selectedCardId);
  }

  getCardReference(cardId: string): string {
    const card = this.cardMap.get(cardId);
    return card ? card.cardReference : cardId;
  }

  // --- Statement Breakdown Modal ---
  openStatementDetails(statement: Statement): void {
    this.selectedStatement = statement;
    this.statementItems = [];
    this.itemsErrorMessage = null;
    this.isLoadingItems = true;

    this.activeModal = this.modalService.open(this.statementDetailsModalRef, {
      centered: true,
      backdrop: 'static',
      size: 'lg'
    });

    this.statementService.getStatementItems(statement.statementId).pipe(
      catchError(err => {
        this.itemsErrorMessage = 'No itemized transaction breakdown available for this statement.';
        return of([] as StatementItem[]);
      })
    ).subscribe({
      next: (items) => {
        this.statementItems = items;
        this.isLoadingItems = false;
      },
      error: () => {
        this.isLoadingItems = false;
      }
    });
  }

  downloadStatement(statement: Statement): void {
    this.statementService.downloadStatement(statement.statementId).subscribe({
      next: (data) => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", `Statement_${statement.statementId}_${statement.statementDate}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
      },
      error: () => {
        // Fallback: print view
        window.print();
      }
    });
  }

  payStatement(statement: Statement): void {
    this.dismissModal();
    this.router.navigate(['/app/payments'], { queryParams: { cardId: statement.cardId } });
  }

  dismissModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
      this.activeModal = null;
    }
  }

  isDueDatePassed(dueDate: string): boolean {
    return new Date(dueDate).getTime() < new Date().setHours(0, 0, 0, 0);
  }
}
