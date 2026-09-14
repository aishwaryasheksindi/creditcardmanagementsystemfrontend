import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Transaction } from '../models/transaction.model';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  public getTransactionsByCard(cardId: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.baseUrl}/transactions/card/${cardId}`);
  }

  public getTransactionById(transactionId: string): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.baseUrl}/transactions/${transactionId}`);
  }

  public getTransactionsForCards(cardIds: string[]): Observable<Transaction[]> {
    if (!cardIds || cardIds.length === 0) {
      return of([]);
    }

    const requests = cardIds.map(id =>
      this.getTransactionsByCard(id).pipe(
        catchError(() => of([] as Transaction[]))
      )
    );

    return forkJoin(requests).pipe(
      map(results => {
        const allTransactions = results.flat();
        return allTransactions.sort((a, b) =>
          new Date(b.transactionDate || (b as any).timestamp || 0).getTime() -
          new Date(a.transactionDate || (a as any).timestamp || 0).getTime()
        );
      })
    );
  }
}