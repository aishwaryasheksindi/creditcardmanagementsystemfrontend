import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { EmiPlan, EmiPlanRequest, AiEmiRecommendation } from '../models/emi.model';

@Injectable({
  providedIn: 'root'
})
export class EmiService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  public getAllEmiPlans(transactionId?: string): Observable<EmiPlan[]> {
    if (transactionId) {
      return this.http.get<EmiPlan[]>(`${this.baseUrl}/emi-plans?transactionId=${transactionId}`);
    }
    return this.http.get<EmiPlan[]>(`${this.baseUrl}/emi-plans`);
  }

  public getEmiPlanById(emiPlanId: string): Observable<EmiPlan> {
    return this.http.get<EmiPlan>(`${this.baseUrl}/emi-plans/${emiPlanId}`);
  }

  public createEmiPlan(request: EmiPlanRequest): Observable<EmiPlan> {
    return this.http.post<EmiPlan>(`${this.baseUrl}/emi-plans`, request);
  }

  public getAiEmiRecommendation(transactionId: string): Observable<AiEmiRecommendation> {
    return this.http.get<AiEmiRecommendation>(`${this.baseUrl}/ai/emi-recommendation/${transactionId}`);
  }
}
