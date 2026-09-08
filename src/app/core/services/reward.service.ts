import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Reward, RewardTransaction, RewardRecommendation } from '../models/reward.model';

@Injectable({
  providedIn: 'root'
})
export class RewardService {
  private readonly baseUrl = `${environment.apiBaseUrl}/rewards`;
  private readonly txnUrl = `${environment.apiBaseUrl}/reward-transactions`;
  private readonly recUrl = `${environment.apiBaseUrl}/reward-recommendations`;

  constructor(private http: HttpClient) {}

  public getRewardByCustomerId(customerId: string): Observable<Reward> {
    return this.http.get<Reward>(`${this.baseUrl}/customer/${customerId}`);
  }

  public getRewardById(rewardId: string): Observable<Reward> {
    return this.http.get<Reward>(`${this.baseUrl}/${rewardId}`);
  }

  public getAllRewards(): Observable<Reward[]> {
    return this.http.get<Reward[]>(this.baseUrl);
  }

  public getRewardTransactions(rewardId?: string): Observable<RewardTransaction[]> {
    let params = new HttpParams();
    if (rewardId) {
      params = params.set('rewardId', rewardId);
    }
    return this.http.get<RewardTransaction[]>(this.txnUrl, { params });
  }

  public getRewardRecommendations(customerId?: string): Observable<RewardRecommendation[]> {
    let params = new HttpParams();
    if (customerId) {
      params = params.set('customerId', customerId);
    }
    return this.http.get<RewardRecommendation[]>(this.recUrl, { params });
  }
}
