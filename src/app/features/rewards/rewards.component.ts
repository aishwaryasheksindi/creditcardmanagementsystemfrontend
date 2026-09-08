import { Component, OnInit } from '@angular/core';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth.service';
import { CustomerService } from '../../core/services/customer.service';
import { RewardService } from '../../core/services/reward.service';
import { Reward, RewardTransaction, RewardRecommendation } from '../../core/models/reward.model';
import { Customer } from '../../core/models/customer.model';

@Component({
  selector: 'app-rewards',
  templateUrl: './rewards.component.html',
  styleUrls: ['./rewards.component.scss'],
  standalone: false
})
export class RewardsComponent implements OnInit {
  reward: Reward | null = null;
  transactions: RewardTransaction[] = [];
  filteredTransactions: RewardTransaction[] = [];
  recommendations: RewardRecommendation[] = [];
  currentCustomer: Customer | null = null;

  isLoading: boolean = false;
  errorMessage: string | null = null;
  isCustomer: boolean = false;

  selectedTypeFilter: string = 'ALL';

  constructor(
    private authService: AuthService,
    private customerService: CustomerService,
    private rewardService: RewardService
  ) {}

  ngOnInit(): void {
    this.isCustomer = this.authService.hasRole('CUSTOMER');
    this.loadRewardsData();
  }

  loadRewardsData(): void {
    this.isLoading = true;
    this.errorMessage = null;

    if (this.isCustomer) {
      this.customerService.getMyProfile().pipe(
        switchMap(customer => {
          this.currentCustomer = customer;
          if (!customer?.customerId) {
            return of(null);
          }
          // Load recommendations concurrently
          this.loadRecommendations(customer.customerId);
          return this.rewardService.getRewardByCustomerId(customer.customerId).pipe(
            catchError(() => of(null))
          );
        }),
        catchError(() => {
          this.errorMessage = 'Failed to load rewards profile.';
          return of(null);
        })
      ).subscribe({
        next: (reward) => {
          this.reward = reward;
          if (reward?.rewardId) {
            this.loadTransactions(reward.rewardId);
          } else {
            this.isLoading = false;
          }
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Failed to retrieve loyalty points.';
        }
      });
    } else {
      // Staff view: load all rewards
      this.rewardService.getAllRewards().pipe(
        catchError(() => of([] as Reward[]))
      ).subscribe({
        next: (rewards) => {
          if (rewards.length > 0) {
            this.reward = rewards[0];
            if (this.reward?.rewardId) {
              this.loadTransactions(this.reward.rewardId);
            }
          }
          this.isLoading = false;
        },
        error: () => {
          this.isLoading = false;
          this.errorMessage = 'Failed to retrieve rewards catalog.';
        }
      });
    }
  }

  loadTransactions(rewardId: string): void {
    this.rewardService.getRewardTransactions(rewardId).pipe(
      catchError(() => of([] as RewardTransaction[]))
    ).subscribe({
      next: (txns) => {
        this.transactions = txns.sort((a, b) => 
          new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
        this.applyFilters();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  loadRecommendations(customerId: string): void {
    this.rewardService.getRewardRecommendations(customerId).pipe(
      catchError(() => of([] as RewardRecommendation[]))
    ).subscribe({
      next: (recs) => {
        this.recommendations = recs;
      }
    });
  }

  applyFilters(): void {
    if (this.selectedTypeFilter === 'ALL') {
      this.filteredTransactions = [...this.transactions];
    } else {
      this.filteredTransactions = this.transactions.filter(t => 
        t.transactionType?.toUpperCase() === this.selectedTypeFilter.toUpperCase()
      );
    }
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  getTransactionTypeBadge(type: string): string {
    switch (type?.toUpperCase()) {
      case 'EARNED':
        return 'bg-success-subtle text-success border border-success-subtle';
      case 'REDEEMED':
        return 'bg-warning-subtle text-warning border border-warning-subtle';
      case 'BONUS':
        return 'bg-primary-subtle text-primary border border-primary-subtle';
      case 'EXPIRED':
        return 'bg-danger-subtle text-danger border border-danger-subtle';
      default:
        return 'bg-secondary-subtle text-secondary border';
    }
  }
}
